const SalesOrder = require('../../models/sales/SalesOrder');
const SalesOrderCategory = require('../../models/categories/SalesOrderCategory');

// 1. ADD THIS NEW ROUTE (add this route in your routes file)
// Assumes you have these Mongoose models:
// - SOCategory (or whatever your sales order category model is called) with fields: prefix, rangeFrom, rangeTo
// - SalesOrder with field soNumber

async function generateSONumber(categoryId) {
  try {
    const category = await SalesOrderCategory.findById(categoryId);
    if (!category) throw new Error('SO Category not found');

    console.log('Category range:', category.rangeFrom, 'to', category.rangeTo);

    // Find all existing Sales Orders for this category
    const existingSOs = await SalesOrder.find({
      categoryId, soNumberType: 'internal'
    }).select('soNumber');

    let nextNumber = category.rangeFrom;

    if (existingSOs.length > 0) {
      console.log('Found existing SOs:', existingSOs.length);

      // FIX: Use so.soNumber, not so.soNumberType!
      const usedNumbers = existingSOs
        .map(so => parseInt(so.soNumber, 10))
        .filter(num => !isNaN(num));

      if (usedNumbers.length > 0) {
        const maxUsedNumber = Math.max(...usedNumbers);
        console.log('Highest used number:', maxUsedNumber);
        nextNumber = maxUsedNumber + 1;
      }
    }

    console.log('Next number to use:', nextNumber);

    if (nextNumber > category.rangeTo) {
      throw new Error(
        `SO number exceeded category range. Next: ${nextNumber}, Max: ${category.rangeTo}`
      );
    }

    const generatedSONumber = `${nextNumber
      .toString()
      .padStart(6, '0')}`;
    console.log('Generated SO Number:', generatedSONumber);

    // Double-check uniqueness
    const existingSO = await SalesOrder.findOne({ soNumber: generatedSONumber, categoryId });
    if (existingSO) {
      throw new Error(`SO number ${generatedSONumber} already exists`);
    }

    return generatedSONumber;
  } catch (error) {
    console.error('Error in generateSONumber:', error);
    throw error;
  }
}


// 2. UPDATE YOUR EXISTING createSalesOrder FUNCTION (replace the existing one)
exports.createSalesOrder = async (req, res) => {
  try {
    const { categoryId, soNumberType, customSONumber } = req.body;
    
    let soNumber;
    
    if (soNumberType === 'external' && customSONumber) {
      // Check if external SO number already exists
      const existingSO = await SalesOrder.findOne({ soNumber: customSONumber });
      if (existingSO) {
        return res.status(400).json({ error: 'SO number already exists' });
      }
      soNumber = customSONumber;
    } else {
      // Generate internal SO number
      soNumber = await generateSONumber(categoryId);
    }
    console.log('req for sales order:', req.body);
    const salesOrder = new SalesOrder({ 
      ...req.body, 
      soNumber,
      soNumberType: soNumberType || 'internal'
    });
    
    const saved = await salesOrder.save();
    res.status(201).json(saved);
  } catch (error) {
    console.error('Error creating sales order:', error);
    res.status(500).json({ error: 'Failed to create sales order' });
  }
};



// 4. ADD THIS ROUTE TO YOUR ROUTER (add this line in your routes file)
// router.post('/generate-so-number', generateSONumber);
  

exports.getAllSalesOrders = async (req, res) => {
  const { companyId } = req.query;
  if (!companyId) {
    return res.status(400).json({ error: 'companyId is required' });
  }
  try {
    const orders = await SalesOrder.find({ companyId}).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch sales orders' });
  }
};
