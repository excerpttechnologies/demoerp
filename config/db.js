const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(`mongodb+srv://excerpterp:excerpterp2025@cluster0.anwegvj.mongodb.net/ERP`);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
