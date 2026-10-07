const Company = require('../../models/DieaCompany/DieaModal');

const escapeRegExp = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Create a new company
exports.createCompany = async (req, res) => {
  try {
    const { companyName, contactPersonName, address, phone, email, currentBalance, previousBalance } = req.body;
    const normalizedName = (companyName || '').trim();
    const normalizedEmail = (email || '').trim().toLowerCase();

    const existingCompany = await Company.findOne({
      companyName: { $regex: `^${escapeRegExp(normalizedName)}$`, $options: 'i' },
      email: normalizedEmail
    });

    if (existingCompany) {
      return res.status(409).json({
        success: false,
        message: 'This company is already added today.'
      });
    }

    const company = await Company.create({
      companyName: normalizedName,
      contactPersonName: (contactPersonName || '').trim(),
      address: (address || '').trim(),
      phone: (phone || '').trim(),
      email: normalizedEmail,
      currentBalance: currentBalance || 0,
      previousBalance: previousBalance || 0
    });

    res.status(201).json({
      success: true,
      message: 'Company created successfully',
      data: company
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get all companies
exports.getAllCompanies = async (req, res) => {
  try {
    const companies = await Company.find().sort({ createdAt: -1 });
    console.log('Fetched companies:', companies);
    res.status(200).json({
      success: true,
      count: companies.length,
      data: companies
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get a single company by ID
exports.getCompanyById = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    res.status(200).json({
      success: true,
      data: company
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update a company
exports.updateCompany = async (req, res) => {
  try {
    const company = await Company.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Company updated successfully',
      data: company
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Delete a company
exports.deleteCompany = async (req, res) => {
  try {
    const company = await Company.findByIdAndDelete(req.params.id);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Company deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};