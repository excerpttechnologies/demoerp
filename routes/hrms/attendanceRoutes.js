// const express = require('express');
// const router = express.Router();
// const attendanceController = require('../../controllers/hrms/attendanceController');
// router.get('/', attendanceController.getAttendanceRecords);

// router.get('/today', attendanceController.getTodayAttendance);
// // Mark manual attendance
// router.post('/', attendanceController.markAttendance);

// // Auto attendance (IN/OUT toggle)
// router.post('/auto', attendanceController.autoAttendance);

// // Get attendance records with optional filters (date, employeeId)

// // Get today's attendance


// // Get database statistics
// router.get('/stats', attendanceController.getStats);

// module.exports = router;



//ROUTES

const express = require('express');
const router = express.Router();
const attendanceController = require('../../controllers/hrms/attendanceController');

// IMPORTANT: Specific routes MUST come before parameterized routes

// Get today's attendance (specific route)
router.get('/today', attendanceController.getTodayAttendance);
router.get('/records', attendanceController.getAllEmployeeRecords);
// Get database statistics (specific route)
router.get('/stats', attendanceController.getStats);

// Get all employee records (specific route)


// Get attendance by specific date (parameterized route)
router.get('/date/:date', attendanceController.getAttendanceByDate);

// Get attendance records with optional filters (general route)
router.get('/', attendanceController.getAttendanceRecords);

// Mark manual attendance
router.post('/', attendanceController.markAttendance);

// Auto attendance (IN/OUT toggle)
router.post('/auto', attendanceController.autoAttendance);

module.exports = router;