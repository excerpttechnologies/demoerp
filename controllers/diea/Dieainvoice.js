const Invoice = require('../../models/DieaCompany/Dieainvoice');
const Company = require('../../models/DieaCompany/DieaModal');
const EmailLog = require('../../models/DieaCompany/EmailLog');
const {
  buildInvoiceEmail,
  buildInvoiceEmailSubject,
  normalizeEmail,
  sendInvoiceEmail,
} = require('../../services/emailService');
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
      invoiceDate,
      dueDate,
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
      invoiceDate,
      dueDate: dueDate || undefined,
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

const createInvoicePdf = async (invoice) => {
  const pdfDoc = new PDFDocument({ margin: 50, size: 'A4' });
  const chunks = [];
  pdfDoc.on('data', (chunk) => chunks.push(chunk));
  const completed = new Promise((resolve, reject) => {
    pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
    pdfDoc.on('error', reject);
  });
  pdfDoc.fontSize(20).text('Invoice', { align: 'center' });
  pdfDoc.moveDown();
  pdfDoc.fontSize(12).text(`Invoice No: ${invoice.invoiceNo}`);
  pdfDoc.text(`Company: ${invoice.companyName}`);
  pdfDoc.text(`Month: ${invoice.month}`);
  pdfDoc.text(`Amount: INR ${invoice.amount}`);
  pdfDoc.text(`Current balance: INR ${invoice.currentBalance}`);
  pdfDoc.text(`Invoice date: ${invoice.invoiceDate || new Date().toISOString().slice(0, 10)}`);
  if (invoice.dueDate) pdfDoc.text(`Due date: ${invoice.dueDate.toISOString().slice(0, 10)}`);
  pdfDoc.end();
  return completed;
};

const sendInvoiceMessage = async (req, res, isTest) => {
  const recipient = normalizeEmail(isTest ? req.body?.to : '');
  if (isTest && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
    return res.status(400).json({ success: false, message: 'Enter a valid test recipient email.' });
  }
  const allowedTestRecipients = String(process.env.MAIL_TEST_RECIPIENTS || '')
    .split(',').map(normalizeEmail).filter(Boolean);
  if (isTest && !allowedTestRecipients.includes(recipient)) {
    return res.status(403).json({
      success: false,
      message: 'This test recipient is not in the MAIL_TEST_RECIPIENTS allowlist.',
    });
  }
  if (isTest) {
    const recentTestCount = await EmailLog.countDocuments({
      to: recipient,
      isTest: true,
      createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) },
    });
    if (recentTestCount >= 3) {
      return res.status(429).json({
        success: false,
        message: 'This test recipient has reached the limit of three emails per hour.',
      });
    }
  }

  let emailLog;
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('companyId', 'companyName contactPersonName email address phone');
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found.' });
    }

    const company = invoice.companyId || {};
    const recipientEmail = recipient || normalizeEmail(company.email || invoice.companyEmail);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) {
      return res.status(400).json({
        success: false,
        message: 'The invoice company does not have a valid recipient email address.',
      });
    }

    let email;
    try {
      email = buildInvoiceEmail(invoice, company);
    } catch (error) {
      const subject = buildInvoiceEmailSubject(invoice);
      await EmailLog.create({
        invoiceId: invoice._id,
        invoiceNo: invoice.invoiceNo,
        to: recipientEmail,
        subject,
        status: 'failed',
        error: error.message,
        isTest,
      });
      throw error;
    }
    let pdfBuffer;
    if (req.body?.attachmentBase64) {
      const base64 = String(req.body.attachmentBase64).replace(/^data:application\/pdf;base64,/i, '');
      if (!/^[A-Za-z0-9+/]+={0,2}$/.test(base64)) {
        return res.status(400).json({ success: false, message: 'Invalid PDF attachment data.' });
      }
      pdfBuffer = Buffer.from(base64, 'base64');
    } else {
      pdfBuffer = await createInvoicePdf(invoice);
    }

    emailLog = await EmailLog.create({
      invoiceId: invoice._id,
      invoiceNo: invoice.invoiceNo,
      to: recipientEmail,
      subject: email.subject,
      status: 'pending',
      isTest,
    });

    try {
      const result = await sendInvoiceEmail({
        to: recipientEmail,
        subject: email.subject,
        text: email.text,
        html: email.html,
        config: email.config,
        attachments: [{ filename: email.filename, content: pdfBuffer }],
      });
      await EmailLog.updateOne({ _id: emailLog._id }, {
        status: 'sent',
        messageId: result.messageId,
        providerResponse: result.response,
        sentAt: new Date(),
      });
      return res.status(200).json({
        success: true,
        message: isTest ? 'Test invoice email sent.' : 'Invoice email sent.',
        messageId: result.messageId,
      });
    } catch (error) {
      await EmailLog.updateOne({ _id: emailLog._id }, {
        status: 'failed',
        error: error.message,
        providerResponse: error.response || '',
      });
      throw error;
    }
  } catch (error) {
    console.error('Invoice email failed:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to send invoice email.',
    });
  }
};

exports.sendInvoiceEmailById = (req, res) => sendInvoiceMessage(req, res, false);
exports.sendInvoiceTestEmailById = (req, res) => sendInvoiceMessage(req, res, true);
