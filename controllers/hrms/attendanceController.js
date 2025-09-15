

// //CONTROLLER

// const Employee = require('../../models/hrms/employee');
// const Attendance = require('../../models/hrms/Attendance');

// const attendanceController = {

//   // Mark manual attendance
//   markAttendance: async (req, res) => {
//     const { employeeId } = req.body;
    
//     try {
//       if (!employeeId) {
//         return res.status(400).json({ error: "Employee ID is required" });
//       }

//       // Verify employee exists and get employee data
//       const employee = await Employee.findById(employeeId);
//       if (!employee) {
//         return res.status(404).json({ error: "Employee not found" });
//       }

//       // Get or create today's attendance document
//       const todaysAttendance = await Attendance.getTodaysAttendance();

//       // Check if employee already has attendance today
//       const existingEmployee = todaysAttendance.employees.find(
//         emp => emp.employeeObjectId.toString() === employeeId
//       );

//       if (existingEmployee) {
//         return res.status(400).json({ 
//           error: "Attendance already marked for today",
//           attendance: existingEmployee 
//         });
//       }

//       // Add employee attendance record
//       const employeeData = {
//         employeeObjectId: employee._id,
//         employeeId: employee.employeeId,
//         firstName: employee.firstName,
//         lastName: employee.lastName
//       };

//       todaysAttendance.updateEmployeeAttendance(employeeData, 'IN');
//       await todaysAttendance.save();

//       // Update employee schema with today's IN time
//       employee.inTime = new Date();
//       await employee.save();
      
//       const employeeName = `${employee.firstName} ${employee.lastName}`.trim();
//       console.log(`✅ Attendance marked for ${employeeName}`);
      
//       const employeeRecord = todaysAttendance.employees.find(
//         emp => emp.employeeObjectId.toString() === employeeId
//       );

//       res.json({ 
//         message: "✅ Attendance marked successfully", 
//         attendance: {
//           date: todaysAttendance.date,
//           employeeRecord: {
//             employeeObjectId: employeeRecord.employeeObjectId,
//             employeeId: employeeRecord.employeeId,
//             firstName: employeeRecord.firstName,
//             lastName: employeeRecord.lastName,
//             inTime: employeeRecord.inTime,
//             status: employeeRecord.status
//           }
//         }
//       });
//     } catch (error) {
//       console.error("Attendance error:", error);
//       res.status(500).json({ 
//         error: "❌ Error marking attendance",
//         details: error.message 
//       });
//     }
//   },

//   // Auto attendance (IN/OUT toggle)
//   autoAttendance: async (req, res) => {
//     const { employeeId } = req.body;
   
//     try {
//       if (!employeeId) {
//         return res.status(400).json({ error: "Employee ID is required" });
//       }

//       // Verify employee exists and get employee data
//       const employee = await Employee.findById(employeeId);
//       if (!employee) {
//         return res.status(404).json({ error: "Employee not found" });
//       }

//       // Get or create today's attendance document
//       const todaysAttendance = await Attendance.getTodaysAttendance();

//       // Find existing employee record for today
//       const existingEmployee = todaysAttendance.employees.find(
//         emp => emp.employeeObjectId.toString() === employeeId
//       );

//       const currentTime = new Date();
//       const employeeName = `${employee.firstName} ${employee.lastName}`.trim();

//       const employeeData = {
//         employeeObjectId: employee._id,
//         employeeId: employee.employeeId,
//         firstName: employee.firstName,
//         lastName: employee.lastName
//       };

//       if (!existingEmployee) {
//         // First capture of the day - Mark IN time
//         todaysAttendance.updateEmployeeAttendance(employeeData, 'IN');
//         await todaysAttendance.save();

//         // Save IN time to Employee schema
//         employee.inTime = currentTime;
//         await employee.save();

//         console.log(`🟢 IN TIME marked for ${employeeName} at ${currentTime.toLocaleTimeString()}`);

//         const employeeRecord = todaysAttendance.employees.find(
//           emp => emp.employeeObjectId.toString() === employeeId
//         );

//         res.json({
//           message: `🟢 Welcome ${employeeName}! IN time recorded`,
//           attendance: {
//             date: todaysAttendance.date,
//             employeeRecord: employeeRecord
//           },
//           type: 'IN'
//         });

//       } else if (existingEmployee.status === 'IN' && !existingEmployee.outTime) {
//         // Second capture - Mark OUT time and calculate working hours
//         todaysAttendance.updateEmployeeAttendance(employeeData, 'OUT');
//         await todaysAttendance.save();

//         // Save OUT time and working hours to Employee schema
//         employee.outTime = currentTime;
//         employee.workingHours = existingEmployee.workingHours;
//         await employee.save();

//         const hours = Math.floor(existingEmployee.workingHours);
//         const minutes = Math.floor((existingEmployee.workingHours % 1) * 60);

//         console.log(`🔴 OUT TIME marked for ${employeeName} at ${currentTime.toLocaleTimeString()}`);
//         console.log(`⏰ Total working hours: ${hours}h ${minutes}m`);

//         res.json({
//           message: `🔴 Goodbye ${employeeName}! OUT time recorded`,
//           attendance: {
//             date: todaysAttendance.date,
//             employeeRecord: existingEmployee
//           },
//           workingSummary: `Total working time: ${hours} hours ${minutes} minutes`,
//           type: 'OUT'
//         });

//       } else {
//         // Already completed for the day
//         const hours = Math.floor(existingEmployee.workingHours);
//         const minutes = Math.floor((existingEmployee.workingHours % 1) * 60);

//         res.json({
//           message: `👋 Hello ${employeeName}! Your attendance is already complete for today`,
//           attendance: {
//             date: todaysAttendance.date,
//             employeeRecord: existingEmployee
//           },
//           workingSummary: existingEmployee.workingHours > 0 ? 
//             `You worked ${hours} hours ${minutes} minutes today` : 
//             "Attendance complete",
//           type: 'COMPLETED'
//         });
//       }

//     } catch (error) {
//       console.error("Auto attendance error:", error);
//       res.status(500).json({
//         error: "❌ Error processing attendance",
//         details: error.message
//       });
//     }
//   },

//   // Get attendance records with filters
//   getAttendanceRecords: async (req, res) => {
//     try {
//       const { date, employeeId } = req.query;
//       let query = {};

//       // Filter by date if provided
//       if (date) {
//         query.date = date; // Expecting YYYY-MM-DD format
//       }

//       const records = await Attendance.find(query).sort({ dateObject: -1 }).lean();
      
//       // If filtering by specific employee
//       if (employeeId) {
//         const filteredRecords = [];
        
//         records.forEach(attendanceDoc => {
//           const employeeRecord = attendanceDoc.employees.find(
//             emp => emp.employeeObjectId.toString() === employeeId || emp.employeeId === employeeId
//           );
          
//           if (employeeRecord) {
//             filteredRecords.push({
//               date: attendanceDoc.date,
//               dateObject: attendanceDoc.dateObject,
//               employeeRecord: employeeRecord,
//               createdAt: attendanceDoc.createdAt,
//               updatedAt: attendanceDoc.updatedAt
//             });
//           }
//         });
        
//         console.log(`📊 Fetching ${filteredRecords.length} attendance records for employee ${employeeId}`);
//         return res.json(filteredRecords);
//       }
      
//       // Return all records in the format expected by frontend
//       console.log(`📊 Fetching ${records.length} attendance documents`);
//       res.json(records);
//     } catch (err) {
//       console.error("Error fetching attendance:", err);
//       res.status(500).json({ 
//         error: "❌ Error fetching attendance",
//         details: err.message 
//       });
//     }
//   },

//   // Get all employee attendance records (flattened from all dates)
// getAllEmployeeRecords: async (req, res) => {
//   try {
//     // No employeeId filtering
//     const records = await Attendance.find({}).sort({ dateObject: -1 }).lean();

//     let allEmployeeRecords = [];

//     records.forEach(attendanceDoc => {
//       if (attendanceDoc.employees && Array.isArray(attendanceDoc.employees)) {
//         attendanceDoc.employees.forEach(empRecord => {
//           allEmployeeRecords.push({
//             ...empRecord,
//             date: attendanceDoc.date,
//             dateObject: attendanceDoc.dateObject,
//             attendanceDocId: attendanceDoc._id
//           });
//         });
//       }
//     });

//     console.log(`📊 Fetching ${allEmployeeRecords.length} employee attendancddde records`);
//     res.json(allEmployeeRecords);
//     console.log("all", allEmployeeRecords);
//   } catch (err) {
//     console.error("Error fetching employee records:", err);
//     res.status(500).json({ 
//       error: "❌ Error fetching employee attendance records",
//       details: err.message 
//     });
//   }
// },


// // Get today's attendance - FIXED VERSION with direct date matching
// getTodayAttendance: async (req, res) => {
//   try {
//     console.log('=== getTodayAttendance called ===');
    
//     // Generate today's date string to match your existing data format
//     const today = new Date();
//     const todayString = today.getFullYear() + '-' + 
//                        String(today.getMonth() + 1).padStart(2, '0') + '-' + 
//                        String(today.getDate()).padStart(2, '0');
    
//     console.log('Searching for date:', todayString);
    
//     // Direct query to find today's attendance
//     const attendanceDoc = await Attendance.findOne({ 
//       date: todayString 
//     }).exec();
    
//     console.log('Query result:', attendanceDoc ? 'Found' : 'Not found');
    
//     if (!attendanceDoc) {
//       // Return empty structure if no record exists for today
//       return res.json({
//         date: todayString,
//         dateObject: new Date(),
//         totalEmployeesPresent: 0,
//         totalEmployeesCompleted: 0,
//         employees: [],
//         message: 'No attendance records for today yet'
//       });
//     }
    
//     // Return the found record
//     console.log(`Found today's attendance with ${attendanceDoc.employees.length} employees`);
    
//     res.json({
//       date: attendanceDoc.date,
//       dateObject: attendanceDoc.dateObject,
//       totalEmployeesPresent: attendanceDoc.totalEmployeesPresent || 0,
//       totalEmployeesCompleted: attendanceDoc.totalEmployeesCompleted || 0,
//       employees: attendanceDoc.employees || [],
//       createdAt: attendanceDoc.createdAt,
//       updatedAt: attendanceDoc.updatedAt,
//       _id: attendanceDoc._id
//     });
    
//   } catch (err) {
//     console.error('Error in getTodayAttendance:', err.message);
//     res.status(500).json({ 
//       error: 'Error fetching today\'s attendance',
//       details: err.message
//     });
//   }
// },

//   // Get attendance by specific date
//   getAttendanceByDate: async (req, res) => {
//     try {
//       const { date } = req.params; // Expecting YYYY-MM-DD format
      
//       const attendanceRecord = await Attendance.findOne({ date: date });
      
//       if (!attendanceRecord) {
//         return res.status(404).json({ 
//           error: "No attendance records found for this date",
//           date: date 
//         });
//       }
      
//       console.log(`📊 Attendance for ${date}: ${attendanceRecord.employees.length} employee records`);
      
//       res.json({
//         date: attendanceRecord.date,
//         dateObject: attendanceRecord.dateObject,
//         totalEmployeesPresent: attendanceRecord.totalEmployeesPresent,
//         totalEmployeesCompleted: attendanceRecord.totalEmployeesCompleted,
//         employees: attendanceRecord.employees,
//         createdAt: attendanceRecord.createdAt,
//         updatedAt: attendanceRecord.updatedAt
//       });
//     } catch (err) {
//       console.error("Error fetching attendance by date:", err);
//       res.status(500).json({ 
//         error: "❌ Error fetching attendance",
//         details: err.message 
//       });
//     }
//   },

//   // Get database statistics
//   getStats: async (req, res) => {
//     try {
//       const totalEmployees = await Employee.countDocuments();
//       const totalAttendanceDays = await Attendance.countDocuments();
      
//       // Check for invalid employees
//       const allEmployees = await Employee.find({}, 'firstName lastName descriptor').lean();
//       const validEmployees = allEmployees.filter(emp => 
//         emp.descriptor && 
//         Array.isArray(emp.descriptor) && 
//         emp.descriptor.length === 128
//       );
      
//       // Get today's attendance
//       const todaysAttendance = await Attendance.getTodaysAttendance();
      
//       res.json({
//         employees: {
//           total: totalEmployees,
//           valid: validEmployees.length,
//           invalid: totalEmployees - validEmployees.length
//         },
//         attendance: {
//           totalDays: totalAttendanceDays,
//           todayPresent: todaysAttendance.totalEmployeesPresent,
//           todayCompleted: todaysAttendance.totalEmployeesCompleted
//         },
//         database: {
//           status: require('mongoose').connection.readyState === 1 ? "Connected" : "Disconnected",
//           name: require('mongoose').connection.name
//         }
//       });
//     } catch (error) {
//       console.error("Stats error:", error);
//       res.status(500).json({ error: "Error fetching statistics" });
//     }
//   }

// };

// module.exports = attendanceController;

// 2. CONTROLLER CHANGES (attendanceController.js) - COMPLETE METHODS
const Employee = require('../../models/hrms/employee');
const Attendance = require('../../models/hrms/Attendance');

const attendanceController = {

  // Mark manual attendance
  markAttendance: async (req, res) => {
    const { employeeId, companyId } = req.body;
    
    try {
      if (!employeeId) {
        return res.status(400).json({ error: "Employee ID is required" });
      }

      if (!companyId) {
        return res.status(400).json({ error: "Company ID is required" });
      }

      // Verify employee exists and get employee data
      const employee = await Employee.findById(employeeId);
      if (!employee) {
        return res.status(404).json({ error: "Employee not found" });
      }

      // Get or create today's attendance document for this company
      const todaysAttendance = await Attendance.getTodaysAttendance(companyId);

      // Check if employee already has attendance today
      const existingEmployee = todaysAttendance.employees.find(
        emp => emp.employeeObjectId.toString() === employeeId
      );

      if (existingEmployee) {
        return res.status(400).json({ 
          error: "Attendance already marked for today",
          attendance: existingEmployee 
        });
      }

      // Add employee attendance record
      const employeeData = {
        employeeObjectId: employee._id,
        employeeId: employee.employeeId,
        firstName: employee.firstName,
        lastName: employee.lastName
      };

      todaysAttendance.updateEmployeeAttendance(employeeData, 'IN');
      await todaysAttendance.save();

      // Update employee schema with today's IN time
      employee.inTime = new Date();
      await employee.save();
      
      const employeeName = `${employee.firstName} ${employee.lastName}`.trim();
      console.log(`✅ Attendance marked for ${employeeName} in company ${companyId}`);
      
      const employeeRecord = todaysAttendance.employees.find(
        emp => emp.employeeObjectId.toString() === employeeId
      );

      res.json({ 
        message: "✅ Attendance marked successfully", 
        attendance: {
          date: todaysAttendance.date,
          companyId: todaysAttendance.companyId,
          employeeRecord: {
            employeeObjectId: employeeRecord.employeeObjectId,
            employeeId: employeeRecord.employeeId,
            firstName: employeeRecord.firstName,
            lastName: employeeRecord.lastName,
            inTime: employeeRecord.inTime,
            status: employeeRecord.status
          }
        }
      });
    } catch (error) {
      console.error("Attendance error:", error);
      res.status(500).json({ 
        error: "❌ Error marking attendance",
        details: error.message 
      });
    }
  },

  // Auto attendance (IN/OUT toggle)
  autoAttendance: async (req, res) => {
    const { employeeId, companyId } = req.body;
   
    try {
      if (!employeeId) {
        return res.status(400).json({ error: "Employee ID is required" });
      }

      if (!companyId) {
        return res.status(400).json({ error: "Company ID is required" });
      }

      // Verify employee exists and get employee data
      const employee = await Employee.findById(employeeId);
      if (!employee) {
        return res.status(404).json({ error: "Employee not found" });
      }

      // Get or create today's attendance document for this company
      const todaysAttendance = await Attendance.getTodaysAttendance(companyId);

      // Find existing employee record for today
      const existingEmployee = todaysAttendance.employees.find(
        emp => emp.employeeObjectId.toString() === employeeId
      );

      const currentTime = new Date();
      const employeeName = `${employee.firstName} ${employee.lastName}`.trim();

      const employeeData = {
        employeeObjectId: employee._id,
        employeeId: employee.employeeId,
        firstName: employee.firstName,
        lastName: employee.lastName
      };

      if (!existingEmployee) {
        // First capture of the day - Mark IN time
        todaysAttendance.updateEmployeeAttendance(employeeData, 'IN');
        await todaysAttendance.save();

        // Save IN time to Employee schema
        employee.inTime = currentTime;
        await employee.save();

        console.log(`🟢 IN TIME marked for ${employeeName} at ${currentTime.toLocaleTimeString()} in company ${companyId}`);

        const employeeRecord = todaysAttendance.employees.find(
          emp => emp.employeeObjectId.toString() === employeeId
        );

        res.json({
          message: `🟢 Welcome ${employeeName}! IN time recorded`,
          attendance: {
            date: todaysAttendance.date,
            companyId: todaysAttendance.companyId,
            employeeRecord: employeeRecord
          },
          type: 'IN'
        });

      } else if (existingEmployee.status === 'IN' && !existingEmployee.outTime) {
        // Second capture - Mark OUT time and calculate working hours
        todaysAttendance.updateEmployeeAttendance(employeeData, 'OUT');
        await todaysAttendance.save();

        // Save OUT time and working hours to Employee schema
        employee.outTime = currentTime;
        employee.workingHours = existingEmployee.workingHours;
        await employee.save();

        const hours = Math.floor(existingEmployee.workingHours);
        const minutes = Math.floor((existingEmployee.workingHours % 1) * 60);

        console.log(`🔴 OUT TIME marked for ${employeeName} at ${currentTime.toLocaleTimeString()} in company ${companyId}`);
        console.log(`⏰ Total working hours: ${hours}h ${minutes}m`);

        res.json({
          message: `🔴 Goodbye ${employeeName}! OUT time recorded`,
          attendance: {
            date: todaysAttendance.date,
            companyId: todaysAttendance.companyId,
            employeeRecord: existingEmployee
          },
          workingSummary: `Total working time: ${hours} hours ${minutes} minutes`,
          type: 'OUT'
        });

      } else {
        // Already completed for the day
        const hours = Math.floor(existingEmployee.workingHours);
        const minutes = Math.floor((existingEmployee.workingHours % 1) * 60);

        res.json({
          message: `👋 Hello ${employeeName}! Your attendance is already complete for today`,
          attendance: {
            date: todaysAttendance.date,
            companyId: todaysAttendance.companyId,
            employeeRecord: existingEmployee
          },
          workingSummary: existingEmployee.workingHours > 0 ? 
            `You worked ${hours} hours ${minutes} minutes today` : 
            "Attendance complete",
          type: 'COMPLETED'
        });
      }

    } catch (error) {
      console.error("Auto attendance error:", error);
      res.status(500).json({
        error: "❌ Error processing attendance",
        details: error.message
      });
    }
  },

  // Get attendance records with filters (updated for company)
  getAttendanceRecords: async (req, res) => {
    try {
      const { date, employeeId, companyId } = req.query;
      let query = {};

      // Filter by company if provided
      if (companyId) {
        query.companyId = companyId;
      }

      // Filter by date if provided
      if (date) {
        query.date = date; // Expecting YYYY-MM-DD format
      }

      const records = await Attendance.find(query).sort({ dateObject: -1 }).lean();
      
      // If filtering by specific employee
      if (employeeId) {
        const filteredRecords = [];
        
        records.forEach(attendanceDoc => {
          const employeeRecord = attendanceDoc.employees.find(
            emp => emp.employeeObjectId.toString() === employeeId || emp.employeeId === employeeId
          );
          
          if (employeeRecord) {
            filteredRecords.push({
              date: attendanceDoc.date,
              companyId: attendanceDoc.companyId,
              dateObject: attendanceDoc.dateObject,
              employeeRecord: employeeRecord,
              createdAt: attendanceDoc.createdAt,
              updatedAt: attendanceDoc.updatedAt
            });
          }
        });
        
        console.log(`📊 Fetching ${filteredRecords.length} attendance records for employee ${employeeId} in company ${companyId}`);
        return res.json(filteredRecords);
      }
      
      // Return all records in the format expected by frontend
      console.log(`📊 Fetching ${records.length} attendance documents for company ${companyId}`);
      res.json(records);
    } catch (err) {
      console.error("Error fetching attendance:", err);
      res.status(500).json({ 
        error: "❌ Error fetching attendance",
        details: err.message 
      });
    }
  },

  // Get all employee attendance records (updated for company)
  getAllEmployeeRecords: async (req, res) => {
    try {
      const { companyId } = req.query;
      let query = {};
      
      // Filter by company if provided
      if (companyId) {
        query.companyId = companyId;
      }

      const records = await Attendance.find(query).sort({ dateObject: -1 }).lean();

      let allEmployeeRecords = [];

      records.forEach(attendanceDoc => {
        if (attendanceDoc.employees && Array.isArray(attendanceDoc.employees)) {
          attendanceDoc.employees.forEach(empRecord => {
            allEmployeeRecords.push({
              ...empRecord,
              date: attendanceDoc.date,
              companyId: attendanceDoc.companyId,
              dateObject: attendanceDoc.dateObject,
              attendanceDocId: attendanceDoc._id
            });
          });
        }
      });

      console.log(`📊 Fetching ${allEmployeeRecords.length} employee attendance records for company ${companyId}`);
      res.json(allEmployeeRecords);
    } catch (err) {
      console.error("Error fetching employee records:", err);
      res.status(500).json({ 
        error: "❌ Error fetching employee attendance records",
        details: err.message 
      });
    }
  },

  // Get today's attendance (updated for company)
  getTodayAttendance: async (req, res) => {
    try {
      const { companyId } = req.query;
      
      if (!companyId) {
        return res.status(400).json({ error: "Company ID is required" });
      }
      
      console.log('=== getTodayAttendance called for company ===', companyId);
      
      // Generate today's date string
      const today = new Date();
      const todayString = today.getFullYear() + '-' + 
                         String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                         String(today.getDate()).padStart(2, '0');
      
      console.log('Searching for date:', todayString, 'and company:', companyId);
      
      // Direct query to find today's attendance for this company
      const attendanceDoc = await Attendance.findOne({ 
        date: todayString,
        companyId: companyId 
      }).exec();
      
      console.log('Query result:', attendanceDoc ? 'Found' : 'Not found');
      
      if (!attendanceDoc) {
        // Return empty structure if no record exists for today
        return res.json({
          date: todayString,
          companyId: companyId,
          dateObject: new Date(),
          totalEmployeesPresent: 0,
          totalEmployeesCompleted: 0,
          employees: [],
          message: 'No attendance records for today yet'
        });
      }
      
      // Return the found record
      console.log(`Found today's attendance with ${attendanceDoc.employees.length} employees for company ${companyId}`);
      
      res.json({
        date: attendanceDoc.date,
        companyId: attendanceDoc.companyId,
        dateObject: attendanceDoc.dateObject,
        totalEmployeesPresent: attendanceDoc.totalEmployeesPresent || 0,
        totalEmployeesCompleted: attendanceDoc.totalEmployeesCompleted || 0,
        employees: attendanceDoc.employees || [],
        createdAt: attendanceDoc.createdAt,
        updatedAt: attendanceDoc.updatedAt,
        _id: attendanceDoc._id
      });
      
    } catch (err) {
      console.error('Error in getTodayAttendance:', err.message);
      res.status(500).json({ 
        error: 'Error fetching today\'s attendance',
        details: err.message
      });
    }
  },

  // Get attendance by specific date (updated for company)
  getAttendanceByDate: async (req, res) => {
    try {
      const { date } = req.params; // Expecting YYYY-MM-DD format
      const { companyId } = req.query;
      
      if (!companyId) {
        return res.status(400).json({ error: "Company ID is required" });
      }
      
      const attendanceRecord = await Attendance.findOne({ 
        date: date,
        companyId: companyId 
      });
      
      if (!attendanceRecord) {
        return res.status(404).json({ 
          error: "No attendance records found for this date and company",
          date: date,
          companyId: companyId 
        });
      }
      
      console.log(`📊 Attendance for ${date} in company ${companyId}: ${attendanceRecord.employees.length} employee records`);
      
      res.json({
        date: attendanceRecord.date,
        companyId: attendanceRecord.companyId,
        dateObject: attendanceRecord.dateObject,
        totalEmployeesPresent: attendanceRecord.totalEmployeesPresent,
        totalEmployeesCompleted: attendanceRecord.totalEmployeesCompleted,
        employees: attendanceRecord.employees,
        createdAt: attendanceRecord.createdAt,
        updatedAt: attendanceRecord.updatedAt
      });
    } catch (err) {
      console.error("Error fetching attendance by date:", err);
      res.status(500).json({ 
        error: "❌ Error fetching attendance",
        details: err.message 
      });
    }
  },


  // Get database statistics (updated for company)
  getStats: async (req, res) => {
    try {
      const { companyId } = req.query;
      let query = {};
      
      if (companyId) {
        query = { companyId: companyId };
      }
      
      const totalEmployees = await Employee.countDocuments(companyId ? { companyId } : {});
      const totalAttendanceDays = await Attendance.countDocuments(query);
      
      // Check for invalid employees
      const employeeQuery = companyId ? { companyId } : {};
      const allEmployees = await Employee.find(employeeQuery, 'firstName lastName descriptor').lean();
      const validEmployees = allEmployees.filter(emp => 
        emp.descriptor && 
        Array.isArray(emp.descriptor) && 
        emp.descriptor.length === 128
      );
      
      // Get today's attendance for this company
      let todaysAttendance = null;
      if (companyId) {
        try {
          todaysAttendance = await Attendance.getTodaysAttendance(companyId);
        } catch (error) {
          console.log('No today\'s attendance yet for company:', companyId);
        }
      }
      
      res.json({
        employees: {
          total: totalEmployees,
          valid: validEmployees.length,
          invalid: totalEmployees - validEmployees.length
        },
        attendance: {
          totalDays: totalAttendanceDays,
          todayPresent: todaysAttendance ? todaysAttendance.totalEmployeesPresent : 0,
          todayCompleted: todaysAttendance ? todaysAttendance.totalEmployeesCompleted : 0
        },
        database: {
          status: require('mongoose').connection.readyState === 1 ? "Connected" : "Disconnected",
          name: require('mongoose').connection.name
        },
        companyId: companyId || 'All Companies'
      });
    } catch (error) {
      console.error("Stats error:", error);
      res.status(500).json({ error: "Error fetching statistics" });
    }
  }

};

module.exports = attendanceController;