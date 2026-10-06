const Invoice = require('../../models/DieaCompany/Dieainvoice');
const Company = require('../../models/DieaCompany/DieaModal');
const { sendInvoiceEmail } = require('../../services/emailService');
const PDFDocument = require('pdfkit');

const mongoose = require('mongoose');

exports.createInvoice = async (req, res) => {
  // Use transaction to ensure atomicity
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const {
      companyId,
      companyName,
      companyAddress,
      particulars,
      month,
      amount,
      previousBalance,
      currentBalance,
      amountInWords,
        invoiceDate
    } = req.body;

    // Verify company exists
    const company = await Company.findById(companyId).session(session);
    if (!company) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    const normalizedMonth = String(month || '').trim();
    const existingInvoiceForMonth = await Invoice.findOne({
      companyId,
      month: normalizedMonth
    }).session(session);

    if (existingInvoiceForMonth) {
      await session.abortTransaction();
      session.endSession();
      return res.status(409).json({
        success: false,
        message: 'Invoice for this company and month has already been generated.'
      });
    }

    // Get next invoice number
    const nextInvoiceNo = await Invoice.getNextInvoiceNumber();
    
    // Double-check the number doesn't exist (race condition protection)
    const existingInvoice = await Invoice.findOne({ 
      invoiceNo: nextInvoiceNo 
    }).session(session);
    
    if (existingInvoice) {
      await session.abortTransaction();
      session.endSession();
      return res.status(409).json({
        success: false,
        message: 'Invoice number conflict. Please try again.'
      });
    }

    // Create invoice with the sequential number
    const invoice = new Invoice({
      invoiceNo: nextInvoiceNo,
      companyId,
      companyName,
      companyAddress,
      particulars,
      month,
      amount,
      previousBalance,
      currentBalance,
      amountInWords,
        invoiceDate
    });
    
    await invoice.save({ session });

    // Update company's current balance
    await Company.findByIdAndUpdate(
      companyId,
      {
        previousBalance: previousBalance,
        currentBalance: currentBalance
      },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      message: 'Invoice created successfully',
      data: invoice
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Invoice number already exists. Please try again.'
      });
    }
    
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get all invoices
exports.getAllInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find()
      .populate('companyId', 'companyName address')
      .sort({ companyName: 1 });
    
    res.status(200).json({
      success: true,
      count: invoices.length,
      data: invoices
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get invoice by ID
exports.getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('companyId', 'companyName address email phone');
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    res.status(200).json({
      success: true,
      data: invoice
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get invoice by invoice number
exports.getInvoiceByNumber = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ invoiceNo: req.params.invoiceNo })
      .populate('companyId', 'companyName address email phone');
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    res.status(200).json({
      success: true,
      data: invoice
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Check if invoice number exists
exports.checkInvoiceNumberExists = async (req, res) => {
  try {
    const exists = await Invoice.exists({ invoiceNo: req.params.invoiceNo });
    
    res.status(200).json({
      success: true,
      exists: !!exists
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get next available invoice number
exports.getNextInvoiceNumber = async (req, res) => {
  try {
    const nextNumber = await Invoice.getNextInvoiceNumber();
    
    res.status(200).json({
      success: true,
      nextInvoiceNumber: nextNumber
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get invoices by company
exports.getInvoicesByCompany = async (req, res) => {
  try {
    const invoices = await Invoice.find({ companyId: req.params.companyId })
      .sort({ invoiceNo: -1 });
    
    res.status(200).json({
      success: true,
      count: invoices.length,
      data: invoices
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update invoice (prevent invoice number change)
exports.updateInvoice = async (req, res) => {
  try {
    // Remove invoiceNo from update data to prevent changes
    const { invoiceNo, ...updateData } = req.body;
    
    const invoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Invoice updated successfully',
      data: invoice
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Delete invoice
exports.deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndDelete(req.params.id);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Invoice deleted successfully',
      data: { invoiceNo: invoice.invoiceNo }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.sendInvoiceEmailById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('companyId', 'companyName email address phone');

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found',
      });
    }

    const company = invoice.companyId || {};
    const recipientEmail = company.email || invoice.companyEmail;

    if (!recipientEmail) {
      return res.status(400).json({
        success: false,
        message: 'No email address found for this company.',
      });
    }

    let monthLabel = invoice.month;
    const monthMatch = String(invoice.month).match(/(\d{4})-(\d{2})/);
    if (monthMatch) {
      const [year, month] = monthMatch.slice(1);
      const monthDate = new Date(Number(year), Number(month) - 1, 1);
      monthLabel = monthDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    }

    const subject = `DEMAND NOTE - ${monthLabel.toUpperCase()}`;
    const body = `Hi Sir,\n\nGreetings from DIEA!\n\nWe hope this message finds you well.\n\nKindly check below attachment for the month of ${monthLabel.toUpperCase()} - Demand Note.\n\nAll the process is done by Excerpt Technologies Pvt Ltd, who are specialized in web design and development, creating user-friendly, visually stunning websites. They are a leading ERP, e-commerce solution provider, who enhance sales and streamline operations. They are expertise in data analytics and BI report generation turns complex data into actionable insights for informed decision-making.\n\nAny information regarding the Demand Note will be sent through diea.acc.24@gmail.com\n\nIf you have any questions or require further assistance, feel free to reach out to the same mail id mentioned above.\n\nPlease reply to us once you receive this mail, as you know this is a new initiative taken by DIEA your cooperation is paramount to serve you better.\n\nBest regards,\nDIEA\n+91 9901371386\ndiea201112@gmail.com`;

    const emailHtml = `
      <div style="font-family: Arial, Helvetica, sans-serif; color: #1f2937; background: #f5f5f5; padding: 24px;">
        <div style="max-width: 860px; margin: 0 auto; background: #ffffff; border: 1px solid #d9d9d9; padding: 0;">
          <div style="padding: 18px 20px; border-bottom: 1px solid #d9d9d9; font-size: 14px; font-weight: 700; color: #1f2937; text-transform: uppercase;">
            DEMAND NOTE - ${monthLabel.toUpperCase()}
          </div>

          <div style="padding: 24px 24px 12px 24px;">
            <p style="margin: 0 0 18px; font-size: 15px; color: #1f2937;">Hi Sir,</p>
            <div style="height: 8px;"></div>
            <p style="margin: 0 0 18px; font-size: 15px; color: #1f2937;">Greetings from DIEA!</p>
            <div style="height: 8px;"></div>
            <p style="margin: 0 0 18px; font-size: 15px; color: #1f2937;">We hope this message finds you well.</p>
            <div style="height: 8px;"></div>
            <p style="margin: 0 0 18px; font-size: 15px; color: #1f2937; line-height: 1.7;">
              Kindly check below attachment for the month of <strong>${monthLabel.toUpperCase()}</strong> - Demand Note.
            </p>
            <div style="height: 8px;"></div>
            <p style="margin: 0 0 18px; font-size: 15px; color: #1f2937; line-height: 1.7;">
              All the process is done by Excerpt Technologies Pvt Ltd, who are specialized in web design and development, creating user-friendly, visually stunning websites. They are a leading ERP, e-commerce solution provider, who enhance sales and streamline operations. They are expertise in data analytics and BI report generation turns complex data into actionable insights for informed decision-making.
            </p>
            <div style="height: 8px;"></div>
            <p style="margin: 0 0 18px; font-size: 15px; color: #1f2937; line-height: 1.7;">
              Any information regarding the Demand Note will be sent through <a href="mailto:diea.acc.24@gmail.com" style="color:#1a73e8; text-decoration:none;">diea.acc.24@gmail.com</a>
            </p>
            <div style="height: 8px;"></div>
            <p style="margin: 0 0 18px; font-size: 15px; color: #1f2937; line-height: 1.7;">
              If you have any questions or require further assistance, feel free to reach out to the same mail id mentioned above.
            </p>
            <div style="height: 8px;"></div>
            <p style="margin: 0 0 18px; font-size: 15px; color: #1f2937; line-height: 1.7;">
              Please reply to us once you receive this mail, as you know this is a new initiative taken by DIEA your cooperation is paramount to serve you better.
            </p>
            <div style="height: 18px;"></div>
            <p style="margin: 0 0 8px; font-size: 15px; color: #1f2937;">Best regards,</p>
            <p style="margin: 0; font-size: 15px; color: #1f2937; font-weight: 700;">DIEA</p>
            <p style="margin: 4px 0 0; font-size: 15px; color: #1f2937;">+91 9901371386</p>
            <p style="margin: 0; font-size: 15px; color: #1f2937;"><a href="mailto:diea201112@gmail.com" style="color:#1a73e8; text-decoration:none;">diea201112@gmail.com</a></p>
          </div>
        </div>
      </div>
    `;

    const { attachmentBase64, attachmentName } = req.body || {};
    let pdfBuffer = null;

    if (attachmentBase64) {
      pdfBuffer = Buffer.from(attachmentBase64, 'base64');
    } else {
      const pdfDoc = new PDFDocument({ margin: 50, size: 'A4' });
      const pdfChunks = [];

      pdfDoc.on('data', (chunk) => pdfChunks.push(chunk));

      await new Promise((resolve, reject) => {
        pdfDoc.on('end', () => {
          pdfBuffer = Buffer.concat(pdfChunks);
          resolve();
        });
        pdfDoc.on('error', reject);

        pdfDoc.fontSize(20).text('DIEA Demand Note', { align: 'center' });
        pdfDoc.moveDown();
        pdfDoc.fontSize(12).text(`Invoice No: ${invoice.invoiceNo}`);
        pdfDoc.text(`Company: ${invoice.companyName || company.companyName || 'N/A'}`);
        pdfDoc.text(`Month: ${invoice.month}`);
        pdfDoc.text(`Amount: ₹${invoice.amount}`);
        pdfDoc.text(`Current Balance: ₹${invoice.currentBalance}`);
        pdfDoc.text(`Invoice Date: ${invoice.invoiceDate || new Date().toISOString().split('T')[0]}`);
        pdfDoc.moveDown();
        pdfDoc.text('This is a computer generated invoice.');
        pdfDoc.end();
      });
    }

    const finalAttachmentName = attachmentName || `Demand_Note_${invoice.invoiceNo}.pdf`;

    const emailResult = await sendInvoiceEmail({
      to: recipientEmail,
      subject,
      text: body,
      html: emailHtml,
      attachments: [{
        filename: finalAttachmentName,
        content: pdfBuffer,
        contentType: 'application/pdf',
      }],
    });

    if (emailResult.success) {
      return res.status(200).json({
        success: true,
        message: 'Invoice email sent successfully with attachment.',
      });
    }

    if (emailResult.type === 'SMTP_NOT_CONFIGURED') {
      const mailtoUrl = `mailto:${encodeURIComponent(recipientEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      return res.status(200).json({
        success: false,
        message: 'SMTP is not configured. Open the email draft in your mail app to send it manually.',
        mailtoUrl,
        fallback: true,
      });
    }

    return res.status(500).json({
      success: false,
      message: emailResult.message || 'Failed to send invoice email.',
      type: emailResult.type || 'SMTP_SEND_FAILED',
    });
  } catch (error) {
    console.error('Error sending invoice email:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to send invoice email.',
    });
  }
};
