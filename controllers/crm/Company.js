// controllers/companyController.js
const Company = require('../../models/crm/Company');
const UserCompany = require('../../models/UserCompany');
const DieaCompany = require('../../models/DieaCompany/DieaModal');

const escapeRegExp = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const syncDieaCompany = async ({ companyName, address, phone, email }) => {
  if (!companyName || !address || !phone || !email) return null;

  const normalizedName = String(companyName).trim();
  const normalizedEmail = String(email).trim().toLowerCase();

  const existingDieaCompany = await DieaCompany.findOne({
    companyName: { $regex: `^${escapeRegExp(normalizedName)}$`, $options: 'i' },
    email: normalizedEmail
  });

  if (existingDieaCompany) {
    return { duplicate: true, company: existingDieaCompany, message: 'This company is already added today.' };
  }

  const created = await DieaCompany.create({
    companyName: normalizedName,
    address: String(address).trim(),
    phone: String(phone).trim(),
    email: normalizedEmail,
    currentBalance: 0,
    previousBalance: 0,
  });

  return { duplicate: false, company: created, message: 'Company synced to DIEA successfully.' };
};

exports.createCompany = async (req, res) => {
  try {
    const { name, address, pincode, country, phone, email } = req.body;
    const logoPath = req.file ? `/uploads/${req.file.filename}` : null;

    const company = new Company({
      name, address, pincode, country, phone, email,
      logo: logoPath
    });

    await company.save();
    const dieaSync = await syncDieaCompany({
      companyName: name,
      address,
      phone,
      email,
    });

    if (dieaSync?.duplicate) {
      return res.status(409).json({
        error: dieaSync.message,
        message: dieaSync.message,
      });
    }

    res.status(201).json(company);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Company creation failed' });
  }
};

exports.createCompanyForUser = async (req, res) => {
  try {
    const { name, address, pincode, country, phone, email, userId } = req.body;
    const logoPath = req.file ? `/uploads/${req.file.filename}` : null;

    // Create the company
    const company = new Company({
      name, address, pincode, country, phone, email,
      logo: logoPath
    });

    await company.save();

    const dieaSync = await syncDieaCompany({
      companyName: name,
      address,
      phone,
      email,
    });

    if (dieaSync?.duplicate) {
      return res.status(409).json({
        error: dieaSync.message,
        message: dieaSync.message,
      });
    }

    // Assign company to user
    if (userId) {
      const userCompany = new UserCompany({
        userId,
        companyId: company._id
      });
      await userCompany.save();
      console.log(`Company ${company._id} assigned to user ${userId}`);
    }

    res.status(201).json(company);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Company creation failed' });
  }
};

exports.getAllCompanies = async (req, res) => {
  const companies = await Company.find();
  res.json(companies);
};
exports.getCompanyById = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }
    res.json(company);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch company' });
  }
};