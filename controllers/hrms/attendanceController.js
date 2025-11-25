// const Employee = require('../../models/hrms/employee');
// const Attendance = require('../../models/hrms/Attendance');
// const googleSheetsService = require('../../services/googleSheetsService');

// // 🔓 Whitelist of employee IDs who can bypass IP restriction
// const WHITELISTED_EMPLOYEE_IDS = [
//   '68be61485e666f27c9d4791e',  
//   '68be609a5e666f27c9d47918',  
// ];

// // 🔒 IP Restriction Middleware with User Whitelist
// const checkIPRestriction = async (req, res, next) => {
//   // Get employeeId from different possible locations
//   const employeeId = req.body.employeeId ||           // For markAttendance, autoAttendance
//                      req.body.employeeObjectId ||     // For updaterecord
//                      req.params.employeeObjectId;     // For deletebyid
//   // Check if employee is whitelisted
//   if (employeeId && WHITELISTED_EMPLOYEE_IDS.includes(employeeId)) {
//     return next();
//   }

//   // Get client IP address
//   const clientIP = req.ip || 
//                    req.connection.remoteAddress || 
//                    req.socket.remoteAddress ||
//                    req.headers['x-forwarded-for']?.split(',')[0];

//   // Clean up IPv6 prefix if present (::ffff:)
//   let cleanIP = clientIP.replace(/^::ffff:/, '');

//   // 🏠 Allow localhost IPs (for development/testing)
//   const localhostIPs = ['127.0.0.1', '::1', 'localhost'];
//   if (localhostIPs.includes(cleanIP)) {
//     console.log(`🏠 Localhost access allowed: ${cleanIP}`);
//     console.log('==========================================\n');
//     return next();
//   }

//   // Check if IP matches 49.207.X.X subnet
//   const allowedSubnet = /^49\.207\.\d{1,3}\.\d{1,3}$/;
  
//   if (!allowedSubnet.test(cleanIP)) {
//     console.log(`🚫 ACCESS DENIED for IP: ${cleanIP}${employeeId ? ` (Employee: ${employeeId})` : ''}`);
//     console.log('==========================================\n');
//     return res.status(403).json({
//       success: false,
//       error: "Access Denied",
//       message: "Attendance marking is restricted to authorized network only",
//       yourIP: cleanIP,
//       allowedNetwork: "49.207.X.X or whitelisted employees",
//       hint: "If you are a whitelisted employee, ensure your employee ID is included in the request"
//     });
//   }

//   console.log(`✅ IP authorized: ${cleanIP}`);
//   console.log('==========================================\n');
//   next();
// };

// const attendanceController = {

//   // Mark manual attendance (WITH IP RESTRICTION BUT WHITELISTED USERS BYPASS)
//   markAttendance: [checkIPRestriction, async (req, res) => {
//     const { employeeId } = req.body;

//     try {
//       if (!employeeId) {
//         return res.status(400).json({ error: "Employee ID is required" });
//       }

//       const employee = await Employee.findById(employeeId);
//       if (!employee) {
//         return res.status(404).json({ error: "Employee not found" });
//       }

//       const todaysAttendance = await Attendance.getTodaysAttendance();

//       const existingEmployee = todaysAttendance.employees.find(
//         emp => emp.employeeObjectId.toString() === employeeId
//       );

//       if (existingEmployee) {
//         return res.status(400).json({
//           error: "Attendance already marked for today",
//           attendance: existingEmployee
//         });
//       }

//       const employeeData = {
//         employeeObjectId: employee._id,
//         employeeId: employee.employeeId,
//         firstName: employee.firstName,
//         lastName: employee.lastName
//       };

//       todaysAttendance.updateEmployeeAttendance(employeeData, 'IN');
//       await todaysAttendance.save();

//       employee.inTime = new Date();
//       await employee.save();

//       // 🔄 Auto sync to Google Sheets
//       googleSheetsService.addAttendanceRecord({
//         date: todaysAttendance.date,
//         employeeObjectId: employee._id,
//         employeeId: employee.employeeId,
//         firstName: employee.firstName,
//         lastName: employee.lastName,
//         inTime: employee.inTime,
//         status: 'IN'
//       }).catch(err => console.error('Google Sheets sync error:', err.message));

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
//   }],

//   // Auto attendance (IN/OUT toggle) (WITH IP RESTRICTION BUT WHITELISTED USERS BYPASS)
//   autoAttendance: [checkIPRestriction, async (req, res) => {
//     const { employeeId } = req.body;

//     try {
//       if (!employeeId) {
//         return res.status(400).json({ error: "Employee ID is required" });
//       }

//       const employee = await Employee.findById(employeeId);
//       if (!employee) {
//         return res.status(404).json({ error: "Employee not found" });
//       }

//       const todaysAttendance = await Attendance.getTodaysAttendance();

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

//         employee.inTime = currentTime;
//         await employee.save();

//         // 🔄 Auto sync to Google Sheets
//         googleSheetsService.addAttendanceRecord({
//           date: todaysAttendance.date,
//           employeeObjectId: employee._id,
//           employeeId: employee.employeeId,
//           firstName: employee.firstName,
//           lastName: employee.lastName,
//           inTime: currentTime,
//           status: 'IN'
//         }).catch(err => console.error('Google Sheets sync error:', err.message));

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
//         // Second capture - Mark OUT time
//         todaysAttendance.updateEmployeeAttendance(employeeData, 'OUT');
//         await todaysAttendance.save();

//         employee.outTime = currentTime;
//         employee.workingHours = existingEmployee.workingHours;
//         await employee.save();

//         // 🔄 Auto sync to Google Sheets
//         googleSheetsService.updateAttendanceRecord(
//           todaysAttendance.date,
//           employee._id,
//           {
//             outTime: currentTime,
//             workingHours: existingEmployee.workingHours,
//             status: 'OUT'
//           }
//         ).catch(err => console.error('Google Sheets sync error:', err.message));

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
//   }],

//   getAttendanceRecords: async (req, res) => {
//     try {
//       const { date, employeeId } = req.query;
//       let query = {};

//       if (date) {
//         query.date = date;
//       }

//       const records = await Attendance.find(query).sort({ dateObject: -1 }).lean();

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

//   getAllEmployeeRecords: async (req, res) => {
//     try {
//       const records = await Attendance.find({}).sort({ dateObject: -1 }).lean();
//       let allEmployeeRecords = [];

//       records.forEach(attendanceDoc => {
//         if (attendanceDoc.employees && Array.isArray(attendanceDoc.employees)) {
//           attendanceDoc.employees.forEach(empRecord => {
//             allEmployeeRecords.push({
//               ...empRecord,
//               date: attendanceDoc.date,
//               dateObject: attendanceDoc.dateObject,
//               attendanceDocId: attendanceDoc._id
//             });
//           });
//         }
//       });

//       console.log(`📊 Fetching ${allEmployeeRecords.length} employee attendance records`);
//       res.json(allEmployeeRecords);
//     } catch (err) {
//       console.error("Error fetching employee records:", err);
//       res.status(500).json({
//         error: "❌ Error fetching employee attendance records",
//         details: err.message
//       });
//     }
//   },

//   getTodayAttendance: async (req, res) => {
//     try {
//       const today = new Date();
//       const todayString = today.getFullYear() + '-' +
//         String(today.getMonth() + 1).padStart(2, '0') + '-' +
//         String(today.getDate()).padStart(2, '0');

//       const attendanceDoc = await Attendance.findOne({ date: todayString }).exec();

//       if (!attendanceDoc) {
//         return res.json({
//           date: todayString,
//           dateObject: new Date(),
//           totalEmployeesPresent: 0,
//           totalEmployeesCompleted: 0,
//           employees: [],
//           message: 'No attendance records for today yet'
//         });
//       }

//       res.json({
//         date: attendanceDoc.date,
//         dateObject: attendanceDoc.dateObject,
//         totalEmployeesPresent: attendanceDoc.totalEmployeesPresent || 0,
//         totalEmployeesCompleted: attendanceDoc.totalEmployeesCompleted || 0,
//         employees: attendanceDoc.employees || [],
//         createdAt: attendanceDoc.createdAt,
//         updatedAt: attendanceDoc.updatedAt,
//         _id: attendanceDoc._id
//       });
//     } catch (err) {
//       console.error('Error in getTodayAttendance:', err.message);
//       res.status(500).json({
//         error: 'Error fetching today\'s attendance',
//         details: err.message
//       });
//     }
//   },

//   getAttendanceByDate: async (req, res) => {
//     try {
//       const { date } = req.params;
//       const attendanceRecord = await Attendance.findOne({ date: date });

//       if (!attendanceRecord) {
//         return res.status(404).json({
//           error: "No attendance records found for this date",
//           date: date
//         });
//       }

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

//   getStats: async (req, res) => {
//     try {
//       const totalEmployees = await Employee.countDocuments();
//       const totalAttendanceDays = await Attendance.countDocuments();
//       const allEmployees = await Employee.find({}, 'firstName lastName descriptor').lean();
//       const validEmployees = allEmployees.filter(emp =>
//         emp.descriptor && Array.isArray(emp.descriptor) && emp.descriptor.length === 128
//       );
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
//   },

//   updaterecord: [checkIPRestriction, async (req, res) => {
//     try {
//       const { date } = req.params;
//       const { employeeObjectId, inTime, outTime, status, firstName, lastName } = req.body;

//       console.log('🔄 Update request:', { date, employeeObjectId, inTime, outTime, status });

//       const attendanceDoc = await Attendance.findOne({ date });
//       if (!attendanceDoc) {
//         return res.status(404).json({
//           success: false,
//           message: 'Attendance record not found for this date'
//         });
//       }

//       const employeeIndex = attendanceDoc.employees.findIndex(
//         emp => emp.employeeObjectId.toString() === employeeObjectId.toString()
//       );

//       if (employeeIndex === -1) {
//         return res.status(404).json({
//           success: false,
//           message: 'Employee attendance record not found'
//         });
//       }

//       const employeeRecord = attendanceDoc.employees[employeeIndex];

//       if (firstName) employeeRecord.firstName = firstName;
//       if (lastName) employeeRecord.lastName = lastName;
//       if (inTime !== undefined) employeeRecord.inTime = inTime ? new Date(inTime) : null;
//       if (outTime !== undefined) employeeRecord.outTime = outTime ? new Date(outTime) : null;
//       if (status) employeeRecord.status = status;

//       if (employeeRecord.inTime && employeeRecord.outTime) {
//         const workingMilliseconds = employeeRecord.outTime - employeeRecord.inTime;
//         employeeRecord.workingHours = Math.round((workingMilliseconds / (1000 * 60 * 60)) * 100) / 100;
//       } else {
//         employeeRecord.workingHours = 0;
//       }

//       attendanceDoc.totalEmployeesPresent = attendanceDoc.employees.filter(emp => emp.inTime).length;
//       attendanceDoc.totalEmployeesCompleted = attendanceDoc.employees.filter(emp => emp.outTime).length;

//       await attendanceDoc.save();

//       googleSheetsService.updateAttendanceRecord(date, employeeObjectId, {
//         firstName: employeeRecord.firstName,
//         lastName: employeeRecord.lastName,
//         inTime: employeeRecord.inTime,
//         outTime: employeeRecord.outTime,
//         workingHours: employeeRecord.workingHours,
//         status: employeeRecord.status
//       }).catch(err => console.error('Google Sheets sync error:', err.message));

//       res.json({
//         success: true,
//         message: 'Attendance record updated successfully',
//         data: employeeRecord
//       });
//     } catch (error) {
//       console.error('Error updating attendance record:', error);
//       res.status(500).json({
//         success: false,
//         message: 'Error updating attendance record',
//         error: error.message
//       });
//     }
//   }],

//   deletebyid: [checkIPRestriction, async (req, res) => {
//     try {
//       const { date, employeeObjectId } = req.params;
      
//       console.log('🗑️ Delete request:', { date, employeeObjectId });
      
//       const attendanceDoc = await Attendance.findOne({ date });

//       if (!attendanceDoc) {
//         return res.status(404).json({
//           success: false,
//           message: 'Attendance record not found for this date'
//         });
//       }

//       const employeeIndex = attendanceDoc.employees.findIndex(
//         emp => emp.employeeObjectId.toString() === employeeObjectId.toString()
//       );

//       if (employeeIndex === -1) {
//         return res.status(404).json({
//           success: false,
//           message: 'Employee attendance record not found'
//         });
//       }

//       const deletedEmployee = attendanceDoc.employees.splice(employeeIndex, 1)[0];
//       attendanceDoc.totalEmployeesPresent = attendanceDoc.employees.filter(emp => emp.inTime).length;
//       attendanceDoc.totalEmployeesCompleted = attendanceDoc.employees.filter(emp => emp.outTime).length;

//       googleSheetsService.deleteAttendanceRecord(date, employeeObjectId)
//         .catch(err => console.error('Google Sheets sync error:', err.message));

//       if (attendanceDoc.employees.length === 0) {
//         await Attendance.findByIdAndDelete(attendanceDoc._id);
//         return res.json({
//           success: true,
//           message: 'Attendance record deleted successfully (entire date record removed)',
//           data: deletedEmployee
//         });
//       } else {
//         await attendanceDoc.save();
//       }

//       res.json({
//         success: true,
//         message: 'Employee attendance record deleted successfully',
//         data: deletedEmployee
//       });
//     } catch (error) {
//       console.error('Error deleting attendance record:', error);
//       res.status(500).json({
//         success: false,
//         message: 'Error deleting attendance record',
//         error: error.message
//       });
//     }
//   }],

//   deleteall: [checkIPRestriction, async (req, res) => {
//     try {
//       const { recordsToDelete } = req.body;

//       if (!Array.isArray(recordsToDelete) || recordsToDelete.length === 0) {
//         return res.status(400).json({
//           success: false,
//           message: 'Invalid request: recordsToDelete must be a non-empty array'
//         });
//       }

//       const deletedRecords = [];
//       const errors = [];

//       for (const record of recordsToDelete) {
//         try {
//           const { date, employeeObjectId } = record;
//           const attendanceDoc = await Attendance.findOne({ date });
          
//           if (!attendanceDoc) {
//             errors.push(`No attendance document found for date: ${date}`);
//             continue;
//           }

//           const employeeIndex = attendanceDoc.employees.findIndex(
//             emp => emp.employeeObjectId.toString() === employeeObjectId.toString()
//           );

//           if (employeeIndex === -1) {
//             errors.push(`Employee not found in attendance for date: ${date}`);
//             continue;
//           }

//           const deletedEmployee = attendanceDoc.employees.splice(employeeIndex, 1)[0];
//           deletedRecords.push(deletedEmployee);

//           attendanceDoc.totalEmployeesPresent = attendanceDoc.employees.filter(emp => emp.inTime).length;
//           attendanceDoc.totalEmployeesCompleted = attendanceDoc.employees.filter(emp => emp.outTime).length;

//           if (attendanceDoc.employees.length === 0) {
//             await Attendance.findByIdAndDelete(attendanceDoc._id);
//           } else {
//             await attendanceDoc.save();
//           }
//         } catch (err) {
//           errors.push(`Error processing record: ${err.message}`);
//         }
//       }

//       googleSheetsService.bulkDeleteAttendanceRecords(recordsToDelete)
//         .catch(err => console.error('Google Sheets sync error:', err.message));

//       res.json({
//         success: true,
//         message: `Bulk delete completed. ${deletedRecords.length} records deleted.`,
//         data: {
//           deletedRecords,
//           errors: errors.length > 0 ? errors : null
//         }
//       });
//     } catch (error) {
//       console.error('Error in bulk delete:', error);
//       res.status(500).json({
//         success: false,
//         message: 'Error in bulk delete operation',
//         error: error.message
//       });
//     }
//   }],

//   syncToGoogleSheets: async (req, res) => {
//     try {
//       console.log('🔄 Starting one-time sync to Google Sheets...');
//       const records = await Attendance.find({}).sort({ dateObject: -1 }).lean();
//       const allEmployeeRecords = [];

//       records.forEach(attendanceDoc => {
//         if (attendanceDoc.employees && Array.isArray(attendanceDoc.employees)) {
//           attendanceDoc.employees.forEach(empRecord => {
//             allEmployeeRecords.push({
//               date: attendanceDoc.date,
//               employeeObjectId: empRecord.employeeObjectId,
//               employeeId: empRecord.employeeId,
//               firstName: empRecord.firstName,
//               lastName: empRecord.lastName,
//               inTime: empRecord.inTime,
//               outTime: empRecord.outTime,
//               workingHours: empRecord.workingHours,
//               status: empRecord.status
//             });
//           });
//         }
//       });

//       console.log(`📊 Found ${allEmployeeRecords.length} total records in MongoDB`);
//       const result = await googleSheetsService.syncAllRecords(allEmployeeRecords);

//       if (result.success) {
//         res.json({
//           success: true,
//           message: `✅ Successfully synced ${result.count} records to Google Sheets`,
//           totalRecords: allEmployeeRecords.length,
//           syncedRecords: result.count
//         });
//       } else {
//         res.status(500).json({
//           success: false,
//           message: '❌ Failed to sync records to Google Sheets',
//           error: result.error
//         });
//       }
//     } catch (error) {
//       console.error('Error syncing to Google Sheets:', error);
//       res.status(500).json({
//         success: false,
//         message: 'Error syncing to Google Sheets',
//         error: error.message
//       });
//     }
//   }
// };

// module.exports = attendanceController;

const Employee = require('../../models/hrms/employee');
const Attendance = require('../../models/hrms/Attendance');
const googleSheetsService = require('../../services/googleSheetsService');
require('dotenv').config();
//       }
//     } catch (error) {
//       console.error('Error syncing to Google Sheets:', error);
//       res.status(500).json({
//         success: false,
//         message: 'Error syncing to Google Sheets',
//         error: error.message
//       });
//     }
//   }
// };
const WHITELISTED_EMPLOYEE_IDS = [

];
//       }
//     } catch (error) {
//       console.error('Error syncing to Google Sheets:', error);
//       res.status(500).json({
//         success: false,
//         message: 'Error syncing to Google Sheets',
//         error: error.message
//       });
//     }
//   }
// };
// 🔒 IP Restriction Middleware with User Whitelist
const checkIPRestriction = async (req, res, next) => {
  const employeeId = req.body.employeeId ||           
                     req.body.employeeObjectId ||     
                     req.params.employeeObjectId;    

  // Check if employee is whitelisted
  if (employeeId && WHITELISTED_EMPLOYEE_IDS.includes(employeeId)) {
    return next();
  }

  // Get client IP address (handles both IPv4 and IPv6)
  let clientIP = req.ip || 
                 req.connection.remoteAddress || 
                 req.socket.remoteAddress ||
                 (req.headers['x-forwarded-for'] && req.headers['x-forwarded-for'].split(',')[0]);


  // Clean up IPv6 prefix if present (::ffff:IPv4)
  let cleanIP = clientIP.replace(/^::ffff:/, '');

  console.log(`🔍 Cleaned IP: ${cleanIP}`);

  // 🏠 Allow localhost IPs (both IPv4 and IPv6)
  const localhostIPs = ['127.0.0.1', '::1', 'localhost', '0:0:0:0:0:0:0:1'];
  if (localhostIPs.includes(cleanIP)) {
    return next();
  }

  // Check if it's an IPv4 address
  const isIPv4 = /^(\d{1,3}\.){3}\d{1,3}$/.test(cleanIP);
  
  if (isIPv4) {
    // IPv4: Check if IP matches 49.207.X.X subnet
    const allowedIPv4Subnet = /^49\.207\.\d{1,3}\.\d{1,3}$/;
    
    if (!allowedIPv4Subnet.test(cleanIP)) {
      return res.status(403).json({
        success: false,
        error: "Access Denied",
        message: "Attendance marking is restricted to authorized network only",
        yourIP: cleanIP,
        ipVersion: "IPv4",
        allowedNetwork: "49.207.X.X or whitelisted employees"
      });
    }

    return next();
  }

  // Check if it's an IPv6 address
  const isIPv6 = cleanIP.includes(':');
  
  if (isIPv6) { 
    return res.status(403).json({
      success: false,
      error: "Access Denied",
      message: "IPv6 access is not yet configured. Please use IPv4 network or contact administrator to whitelist your IPv6 range.",
      yourIP: cleanIP,
      ipVersion: "IPv6",
      allowedNetwork: "49.207.X.X (IPv4) or whitelisted employees",
      hint: "Ask admin to whitelist your IPv6 prefix or use whitelisted employee ID"
    });
  }
  return res.status(403).json({
    success: false,
    error: "Access Denied",
    message: "Could not determine IP address format",
    yourIP: cleanIP,
    allowedNetwork: "49.207.X.X or whitelisted employees"
  });
};

const attendanceController = {

  // Mark manual attendance (WITH IP RESTRICTION BUT WHITELISTED USERS BYPASS)
  markAttendance: [checkIPRestriction, async (req, res) => {
    const { employeeId } = req.body;

    try {
      if (!employeeId) {
        return res.status(400).json({ error: "Employee ID is required" });
      }

      const employee = await Employee.findById(employeeId);
      if (!employee) {
        return res.status(404).json({ error: "Employee not found" });
      }

      const todaysAttendance = await Attendance.getTodaysAttendance();

      const existingEmployee = todaysAttendance.employees.find(
        emp => emp.employeeObjectId.toString() === employeeId
      );

      if (existingEmployee) {
        return res.status(400).json({
          error: "Attendance already marked for today",
          attendance: existingEmployee
        });
      }

      const employeeData = {
        employeeObjectId: employee._id,
        employeeId: employee.employeeId,
        firstName: employee.firstName,
        lastName: employee.lastName
      };

      todaysAttendance.updateEmployeeAttendance(employeeData, 'IN');
      await todaysAttendance.save();

      employee.inTime = new Date();
      await employee.save();

      // 🔄 Auto sync to Google Sheets
      googleSheetsService.addAttendanceRecord({
        date: todaysAttendance.date,
        employeeObjectId: employee._id,
        employeeId: employee.employeeId,
        firstName: employee.firstName,
        lastName: employee.lastName,
        inTime: employee.inTime,
        status: 'IN'
      }).catch(err => console.error('Google Sheets sync error:', err.message));

      const employeeName = `${employee.firstName} ${employee.lastName}`.trim();
      console.log(`✅ Attendance marked for ${employeeName}`);

      const employeeRecord = todaysAttendance.employees.find(
        emp => emp.employeeObjectId.toString() === employeeId
      );

      res.json({
        message: "✅ Attendance marked successfully",
        attendance: {
          date: todaysAttendance.date,
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
  }],

  // Auto attendance (IN/OUT toggle) (WITH IP RESTRICTION BUT WHITELISTED USERS BYPASS)
  autoAttendance: [checkIPRestriction, async (req, res) => {
    const { employeeId } = req.body;

    try {
      if (!employeeId) {
        return res.status(400).json({ error: "Employee ID is required" });
      }

      const employee = await Employee.findById(employeeId);
      if (!employee) {
        return res.status(404).json({ error: "Employee not found" });
      }

      const todaysAttendance = await Attendance.getTodaysAttendance();

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
        todaysAttendance.updateEmployeeAttendance(employeeData, 'IN');
        await todaysAttendance.save();

        employee.inTime = currentTime;
        await employee.save();

        googleSheetsService.addAttendanceRecord({
          date: todaysAttendance.date,
          employeeObjectId: employee._id,
          employeeId: employee.employeeId,
          firstName: employee.firstName,
          lastName: employee.lastName,
          inTime: currentTime,
          status: 'IN'
        }).catch(err => console.error('Google Sheets sync error:', err.message));

        console.log(`🟢 IN TIME marked for ${employeeName} at ${currentTime.toLocaleTimeString()}`);

        const employeeRecord = todaysAttendance.employees.find(
          emp => emp.employeeObjectId.toString() === employeeId
        );

        res.json({
          message: `🟢 Welcome ${employeeName}! IN time recorded`,
          attendance: {
            date: todaysAttendance.date,
            employeeRecord: employeeRecord
          },
          type: 'IN'
        });

      } else if (existingEmployee.status === 'IN' && !existingEmployee.outTime) {
        todaysAttendance.updateEmployeeAttendance(employeeData, 'OUT');
        await todaysAttendance.save();

        employee.outTime = currentTime;
        employee.workingHours = existingEmployee.workingHours;
        await employee.save();

        googleSheetsService.updateAttendanceRecord(
          todaysAttendance.date,
          employee._id,
          {
            outTime: currentTime,
            workingHours: existingEmployee.workingHours,
            status: 'OUT'
          }
        ).catch(err => console.error('Google Sheets sync error:', err.message));

        const hours = Math.floor(existingEmployee.workingHours);
        const minutes = Math.floor((existingEmployee.workingHours % 1) * 60);

        console.log(`🔴 OUT TIME marked for ${employeeName} at ${currentTime.toLocaleTimeString()}`);
        console.log(`⏰ Total working hours: ${hours}h ${minutes}m`);

        res.json({
          message: `🔴 Goodbye ${employeeName}! OUT time recorded`,
          attendance: {
            date: todaysAttendance.date,
            employeeRecord: existingEmployee
          },
          workingSummary: `Total working time: ${hours} hours ${minutes} minutes`,
          type: 'OUT'
        });

      } else {
        const hours = Math.floor(existingEmployee.workingHours);
        const minutes = Math.floor((existingEmployee.workingHours % 1) * 60);

        res.json({
          message: `👋 Hello ${employeeName}! Your attendance is already complete for today`,
          attendance: {
            date: todaysAttendance.date,
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
  }],

  // ... (keep all other methods exactly as they were)
  // getAttendanceRecords, getAllEmployeeRecords, getTodayAttendance, getAttendanceByDate, getStats, updaterecord, deletebyid, deleteall, syncToGoogleSheets

  getAttendanceRecords: async (req, res) => {
    try {
      const { date, employeeId } = req.query;
      let query = {};
      if (date) query.date = date;
      const records = await Attendance.find(query).sort({ dateObject: -1 }).lean();
      if (employeeId) {
        const filteredRecords = [];
        records.forEach(attendanceDoc => {
          const employeeRecord = attendanceDoc.employees.find(
            emp => emp.employeeObjectId.toString() === employeeId || emp.employeeId === employeeId
          );
          if (employeeRecord) {
            filteredRecords.push({
              date: attendanceDoc.date,
              dateObject: attendanceDoc.dateObject,
              employeeRecord: employeeRecord,
              createdAt: attendanceDoc.createdAt,
              updatedAt: attendanceDoc.updatedAt
            });
          }
        });
        console.log(`📊 Fetching ${filteredRecords.length} attendance records for employee ${employeeId}`);
        return res.json(filteredRecords);
      }
      console.log(`📊 Fetching ${records.length} attendance documents`);
      res.json(records);
    } catch (err) {
      console.error("Error fetching attendance:", err);
      res.status(500).json({ error: "❌ Error fetching attendance", details: err.message });
    }
  },

  getAllEmployeeRecords: async (req, res) => {
    try {
      const records = await Attendance.find({}).sort({ dateObject: -1 }).lean();
      let allEmployeeRecords = [];
      records.forEach(attendanceDoc => {
        if (attendanceDoc.employees && Array.isArray(attendanceDoc.employees)) {
          attendanceDoc.employees.forEach(empRecord => {
            allEmployeeRecords.push({
              ...empRecord,
              date: attendanceDoc.date,
              dateObject: attendanceDoc.dateObject,
              attendanceDocId: attendanceDoc._id
            });
          });
        }
      });
      console.log(`📊 Fetching ${allEmployeeRecords.length} employee attendance records`);
      res.json(allEmployeeRecords);
    } catch (err) {
      console.error("Error fetching employee records:", err);
      res.status(500).json({ error: "❌ Error fetching employee attendance records", details: err.message });
    }
  },

  getTodayAttendance: async (req, res) => {
    try {
      const today = new Date();
      const todayString = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
      const attendanceDoc = await Attendance.findOne({ date: todayString }).exec();
      if (!attendanceDoc) {
        return res.json({
          date: todayString, dateObject: new Date(), totalEmployeesPresent: 0,
          totalEmployeesCompleted: 0, employees: [], message: 'No attendance records for today yet'
        });
      }
      res.json({
        date: attendanceDoc.date, dateObject: attendanceDoc.dateObject,
        totalEmployeesPresent: attendanceDoc.totalEmployeesPresent || 0,
        totalEmployeesCompleted: attendanceDoc.totalEmployeesCompleted || 0,
        employees: attendanceDoc.employees || [], createdAt: attendanceDoc.createdAt,
        updatedAt: attendanceDoc.updatedAt, _id: attendanceDoc._id
      });
    } catch (err) {
      console.error('Error in getTodayAttendance:', err.message);
      res.status(500).json({ error: 'Error fetching today\'s attendance', details: err.message });
    }
  },

  getAttendanceByDate: async (req, res) => {
    try {
      const { date } = req.params;
      const attendanceRecord = await Attendance.findOne({ date: date });
      if (!attendanceRecord) {
        return res.status(404).json({ error: "No attendance records found for this date", date: date });
      }
      res.json({
        date: attendanceRecord.date, dateObject: attendanceRecord.dateObject,
        totalEmployeesPresent: attendanceRecord.totalEmployeesPresent,
        totalEmployeesCompleted: attendanceRecord.totalEmployeesCompleted,
        employees: attendanceRecord.employees, createdAt: attendanceRecord.createdAt,
        updatedAt: attendanceRecord.updatedAt
      });
    } catch (err) {
      console.error("Error fetching attendance by date:", err);
      res.status(500).json({ error: "❌ Error fetching attendance", details: err.message });
    }
  },

  getStats: async (req, res) => {
    try {
      const totalEmployees = await Employee.countDocuments();
      const totalAttendanceDays = await Attendance.countDocuments();
      const allEmployees = await Employee.find({}, 'firstName lastName descriptor').lean();
      const validEmployees = allEmployees.filter(emp => emp.descriptor && Array.isArray(emp.descriptor) && emp.descriptor.length === 128);
      const todaysAttendance = await Attendance.getTodaysAttendance();
      res.json({
        employees: { total: totalEmployees, valid: validEmployees.length, invalid: totalEmployees - validEmployees.length },
        attendance: { totalDays: totalAttendanceDays, todayPresent: todaysAttendance.totalEmployeesPresent, todayCompleted: todaysAttendance.totalEmployeesCompleted },
        database: { status: require('mongoose').connection.readyState === 1 ? "Connected" : "Disconnected", name: require('mongoose').connection.name }
      });
    } catch (error) {
      console.error("Stats error:", error);
      res.status(500).json({ error: "Error fetching statistics" });
    }
  },

  updaterecord: [checkIPRestriction, async (req, res) => {
    try {
      const { date } = req.params;
      const { employeeObjectId, inTime, outTime, status, firstName, lastName } = req.body;
      const attendanceDoc = await Attendance.findOne({ date });
      if (!attendanceDoc) return res.status(404).json({ success: false, message: 'Attendance record not found for this date' });
      const employeeIndex = attendanceDoc.employees.findIndex(emp => emp.employeeObjectId.toString() === employeeObjectId.toString());
      if (employeeIndex === -1) return res.status(404).json({ success: false, message: 'Employee attendance record not found' });
      const employeeRecord = attendanceDoc.employees[employeeIndex];
      if (firstName) employeeRecord.firstName = firstName;
      if (lastName) employeeRecord.lastName = lastName;
      if (inTime !== undefined) employeeRecord.inTime = inTime ? new Date(inTime) : null;
      if (outTime !== undefined) employeeRecord.outTime = outTime ? new Date(outTime) : null;
      if (status) employeeRecord.status = status;
      if (employeeRecord.inTime && employeeRecord.outTime) {
        const workingMilliseconds = employeeRecord.outTime - employeeRecord.inTime;
        employeeRecord.workingHours = Math.round((workingMilliseconds / (1000 * 60 * 60)) * 100) / 100;
      } else {
        employeeRecord.workingHours = 0;
      }
      attendanceDoc.totalEmployeesPresent = attendanceDoc.employees.filter(emp => emp.inTime).length;
      attendanceDoc.totalEmployeesCompleted = attendanceDoc.employees.filter(emp => emp.outTime).length;
      await attendanceDoc.save();
      googleSheetsService.updateAttendanceRecord(date, employeeObjectId, {
        firstName: employeeRecord.firstName, lastName: employeeRecord.lastName, inTime: employeeRecord.inTime,
        outTime: employeeRecord.outTime, workingHours: employeeRecord.workingHours, status: employeeRecord.status
      }).catch(err => console.error('Google Sheets sync error:', err.message));
      res.json({ success: true, message: 'Attendance record updated successfully', data: employeeRecord });
    } catch (error) {
      console.error('Error updating attendance record:', error);
      res.status(500).json({ success: false, message: 'Error updating attendance record', error: error.message });
    }
  }],

  deletebyid: [checkIPRestriction, async (req, res) => {
    try {
      const { date, employeeObjectId } = req.params;
      const attendanceDoc = await Attendance.findOne({ date });
      if (!attendanceDoc) return res.status(404).json({ success: false, message: 'Attendance record not found for this date' });
      const employeeIndex = attendanceDoc.employees.findIndex(emp => emp.employeeObjectId.toString() === employeeObjectId.toString());
      if (employeeIndex === -1) return res.status(404).json({ success: false, message: 'Employee attendance record not found' });
      const deletedEmployee = attendanceDoc.employees.splice(employeeIndex, 1)[0];
      attendanceDoc.totalEmployeesPresent = attendanceDoc.employees.filter(emp => emp.inTime).length;
      attendanceDoc.totalEmployeesCompleted = attendanceDoc.employees.filter(emp => emp.outTime).length;
      googleSheetsService.deleteAttendanceRecord(date, employeeObjectId).catch(err => console.error('Google Sheets sync error:', err.message));
      if (attendanceDoc.employees.length === 0) {
        await Attendance.findByIdAndDelete(attendanceDoc._id);
        return res.json({ success: true, message: 'Attendance record deleted successfully (entire date record removed)', data: deletedEmployee });
      } else {
        await attendanceDoc.save();
      }
      res.json({ success: true, message: 'Employee attendance record deleted successfully', data: deletedEmployee });
    } catch (error) {
      console.error('Error deleting attendance record:', error);
      res.status(500).json({ success: false, message: 'Error deleting attendance record', error: error.message });
    }
  }],

  deleteall: [checkIPRestriction, async (req, res) => {
    try {
      const { recordsToDelete } = req.body;
      if (!Array.isArray(recordsToDelete) || recordsToDelete.length === 0) {
        return res.status(400).json({ success: false, message: 'Invalid request: recordsToDelete must be a non-empty array' });
      }
      const deletedRecords = []; const errors = [];
      for (const record of recordsToDelete) {
        try {
          const { date, employeeObjectId } = record;
          const attendanceDoc = await Attendance.findOne({ date });
          if (!attendanceDoc) { errors.push(`No attendance document found for date: ${date}`); continue; }
          const employeeIndex = attendanceDoc.employees.findIndex(emp => emp.employeeObjectId.toString() === employeeObjectId.toString());
          if (employeeIndex === -1) { errors.push(`Employee not found in attendance for date: ${date}`); continue; }
          const deletedEmployee = attendanceDoc.employees.splice(employeeIndex, 1)[0];
          deletedRecords.push(deletedEmployee);
          attendanceDoc.totalEmployeesPresent = attendanceDoc.employees.filter(emp => emp.inTime).length;
          attendanceDoc.totalEmployeesCompleted = attendanceDoc.employees.filter(emp => emp.outTime).length;
          if (attendanceDoc.employees.length === 0) {
            await Attendance.findByIdAndDelete(attendanceDoc._id);
          } else {
            await attendanceDoc.save();
          }
        } catch (err) { errors.push(`Error processing record: ${err.message}`); }
      }
      googleSheetsService.bulkDeleteAttendanceRecords(recordsToDelete).catch(err => console.error('Google Sheets sync error:', err.message));
      res.json({ success: true, message: `Bulk delete completed. ${deletedRecords.length} records deleted.`, data: { deletedRecords, errors: errors.length > 0 ? errors : null } });
    } catch (error) {
      console.error('Error in bulk delete:', error);
      res.status(500).json({ success: false, message: 'Error in bulk delete operation', error: error.message });
    }
  }],

  syncToGoogleSheets: async (req, res) => {
    try {
      console.log('🔄 Starting one-time sync to Google Sheets...');
      const records = await Attendance.find({}).sort({ dateObject: -1 }).lean();
      const allEmployeeRecords = [];
      records.forEach(attendanceDoc => {
        if (attendanceDoc.employees && Array.isArray(attendanceDoc.employees)) {
          attendanceDoc.employees.forEach(empRecord => {
            allEmployeeRecords.push({
              date: attendanceDoc.date, employeeObjectId: empRecord.employeeObjectId, employeeId: empRecord.employeeId,
              firstName: empRecord.firstName, lastName: empRecord.lastName, inTime: empRecord.inTime,
              outTime: empRecord.outTime, workingHours: empRecord.workingHours, status: empRecord.status
            });
          });
        }
      });
      console.log(`📊 Found ${allEmployeeRecords.length} total records in MongoDB`);
      const result = await googleSheetsService.syncAllRecords(allEmployeeRecords);
      if (result.success) {
        res.json({ success: true, message: `✅ Successfully synced ${result.count} records to Google Sheets`, totalRecords: allEmployeeRecords.length, syncedRecords: result.count });
      } else {
        res.status(500).json({ success: false, message: '❌ Failed to sync records to Google Sheets', error: result.error });
      }
    } catch (error) {
      console.error('Error syncing to Google Sheets:', error);
      res.status(500).json({ success: false, message: 'Error syncing to Google Sheets', error: error.message });
    }
  }
};

module.exports = attendanceController;