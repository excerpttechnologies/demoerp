

//MODELS




const mongoose = require('mongoose');

// Individual employee attendance record within a date
const employeeAttendanceSchema = new mongoose.Schema({
  employeeObjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
    required: true
  },
  
  employeeId: {
    type: String,
    required: true
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  inTime: {
    type: Date,
    default: null
  },
  outTime: {
    type: Date,
    default: null
  },
  workingHours: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['IN', 'OUT', 'COMPLETED'],
    default: 'IN'
  }
}, { _id: false }); // No separate _id for subdocuments

// Main attendance schema - one document per date
const attendanceSchema = new mongoose.Schema({
  date: {
    type: String, // Format: YYYY-MM-DD
    required: true,
   
  },
   companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  dateObject: {
    type: Date,
    required: true
  },
  employees: [employeeAttendanceSchema], // Array of employee attendance records
  totalEmployeesPresent: {
    type: Number,
    default: 0
  },
  totalEmployeesCompleted: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for better performance
attendanceSchema.index({ date: 1 });
attendanceSchema.index({ dateObject: 1 });
attendanceSchema.index({ 'employees.employeeObjectId': 1 });
attendanceSchema.index({ 'employees.employeeId': 1 });
attendanceSchema.index({ companyId: 1 });

// // Method to add or update employee attendance
// attendanceSchema.methods.updateEmployeeAttendance = function(employeeData, timeType) {
//   const existingEmployeeIndex = this.employees.findIndex(
//     emp => emp.employeeObjectId.toString() === employeeData.employeeObjectId.toString()
//   );

//   if (existingEmployeeIndex !== -1) {
//     // Update existing employee record
//     const existingEmployee = this.employees[existingEmployeeIndex];
    
//     if (timeType === 'IN') {
//       existingEmployee.inTime = new Date();
//       existingEmployee.status = 'IN';
//     } else if (timeType === 'OUT') {
//       existingEmployee.outTime = new Date();
//       existingEmployee.status = 'OUT';
      
//       // Calculate working hours
//       if (existingEmployee.inTime) {
//         const workingMilliseconds = existingEmployee.outTime - existingEmployee.inTime;
//         existingEmployee.workingHours = Math.round((workingMilliseconds / (1000 * 60 * 60)) * 100) / 100;
//       }
//     }
//   } else {
//     // Add new employee record
//     const newEmployeeAttendance = {
//       employeeObjectId: employeeData.employeeObjectId,
//       employeeId: employeeData.employeeId,
//       firstName: employeeData.firstName,
//       lastName: employeeData.lastName,
//       inTime: timeType === 'IN' ? new Date() : null,
//       outTime: timeType === 'OUT' ? new Date() : null,
//       status: timeType === 'IN' ? 'IN' : 'OUT'
//     };

//     if (timeType === 'OUT' && newEmployeeAttendance.inTime) {
//       const workingMilliseconds = newEmployeeAttendance.outTime - newEmployeeAttendance.inTime;
//       newEmployeeAttendance.workingHours = Math.round((workingMilliseconds / (1000 * 60 * 60)) * 100) / 100;
//     }

//     this.employees.push(newEmployeeAttendance);
//   }

//   // Update counters
//   this.totalEmployeesPresent = this.employees.filter(emp => emp.inTime).length;
//   this.totalEmployeesCompleted = this.employees.filter(emp => emp.outTime).length;
// };

// // Static method to get or create today's attendance document
// // Static method to get or create today's attendance document - IMPROVED
// attendanceSchema.statics.getTodaysAttendance = async function() {
//   try {
//     // Use consistent date formatting
//     const today = new Date();
//     const todayString = today.getFullYear() + '-' + 
//                        String(today.getMonth() + 1).padStart(2, '0') + '-' + 
//                        String(today.getDate()).padStart(2, '0');
    
//     console.log('Searching for attendance record with date:', todayString);
    
//     // First try to find existing record
//     let attendanceDoc = await this.findOne({ date: todayString });
    
//     if (!attendanceDoc) {
//       console.log('No existing record found, creating new attendance document...');
      
//       // Create new document with today's date
//       const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      
//       attendanceDoc = new this({
//         date: todayString,
//         dateObject: todayStart,
//         employees: [],
//         totalEmployeesPresent: 0,
//         totalEmployeesCompleted: 0
//       });
      
//       // Save and return the new document
//       await attendanceDoc.save();
//       console.log('New attendance document created successfully');
//     } else {
//       console.log('Found existing attendance document');
//     }
    
//     return attendanceDoc;
    
//   } catch (error) {
//     console.error('Error in getTodaysAttendance static method:', error);
//     throw new Error(`Failed to get today's attendance: ${error.message}`);
//   }
// };

attendanceSchema.methods.updateEmployeeAttendance = function(employeeData, timeType) {
  const existingEmployeeIndex = this.employees.findIndex(
    emp => emp.employeeObjectId.toString() === employeeData.employeeObjectId.toString()
  );

  if (existingEmployeeIndex !== -1) {
    // Update existing employee record
    const existingEmployee = this.employees[existingEmployeeIndex];
    
    if (timeType === 'IN') {
      existingEmployee.inTime = new Date();
      existingEmployee.status = 'IN';
    } else if (timeType === 'OUT') {
      existingEmployee.outTime = new Date();
      existingEmployee.status = 'OUT';
      
      // Calculate working hours
      if (existingEmployee.inTime) {
        const workingMilliseconds = existingEmployee.outTime - existingEmployee.inTime;
        existingEmployee.workingHours = Math.round((workingMilliseconds / (1000 * 60 * 60)) * 100) / 100;
      }
    }
  } else {
    // Add new employee record
    const newEmployeeAttendance = {
      employeeObjectId: employeeData.employeeObjectId,
      employeeId: employeeData.employeeId,
      firstName: employeeData.firstName,
      lastName: employeeData.lastName,
      inTime: timeType === 'IN' ? new Date() : null,
      outTime: timeType === 'OUT' ? new Date() : null,
      status: timeType === 'IN' ? 'IN' : 'OUT'
    };

    if (timeType === 'OUT' && newEmployeeAttendance.inTime) {
      const workingMilliseconds = newEmployeeAttendance.outTime - newEmployeeAttendance.inTime;
      newEmployeeAttendance.workingHours = Math.round((workingMilliseconds / (1000 * 60 * 60)) * 100) / 100;
    }

    this.employees.push(newEmployeeAttendance);
  }

  // Update counters
  this.totalEmployeesPresent = this.employees.filter(emp => emp.inTime).length;
  this.totalEmployeesCompleted = this.employees.filter(emp => emp.outTime).length;
};

// Static method to get or create today's attendance document for specific company
attendanceSchema.statics.getTodaysAttendance = async function(companyId) {
  try {
    if (!companyId) {
      throw new Error('Company ID is required');
    }

    // Use consistent date formatting
    const today = new Date();
    const todayString = today.getFullYear() + '-' + 
                       String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                       String(today.getDate()).padStart(2, '0');
    
    console.log('Searching for attendance record with date:', todayString, 'and companyId:', companyId);
    
    // First try to find existing record for this company and date
    let attendanceDoc = await this.findOne({ 
      date: todayString, 
      companyId: companyId 
    });
    
    if (!attendanceDoc) {
      console.log('No existing record found, creating new attendance document...');
      
      // Create new document with today's date for this company
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      
      attendanceDoc = new this({
        date: todayString,
        companyId: companyId,
        dateObject: todayStart,
        employees: [],
        totalEmployeesPresent: 0,
        totalEmployeesCompleted: 0
      });
      
      // Save and return the new document
      await attendanceDoc.save();
      console.log('New attendance document created successfully for company:', companyId);
    } else {
      console.log('Found existing attendance document for company:', companyId);
    }
    
    return attendanceDoc;
    
  } catch (error) {
    console.error('Error in getTodaysAttendance static method:', error);
    throw new Error(`Failed to get today's attendance: ${error.message}`);
  }
};

module.exports = mongoose.model("Attendance", attendanceSchema);


