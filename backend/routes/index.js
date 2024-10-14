const express = require('express');
const router = express.Router();
const multer = require("multer");
const authToken = require("../middleware/auth-middleware");
const checkRole = require("../middleware/roles-check-middleware");
const AdminController = require("../controllers/admin-controller");
const TeacherController = require("../controllers/teacher-controller");
const GeneralController = require("../controllers/general-controller");
const TestController = require("../controllers/test-controller");
const UserController = require("../controllers/user-controller");
const {ProfileController} = require("../controllers"); // Adjusted import

const uploadDestination = 'uploads';

const storage = multer.diskStorage({
  destination: uploadDestination,
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage: storage });

// General routes
router.post('/login', GeneralController.login);
router.post('/logout', authToken, GeneralController.logout);

// UserController routes
router.get("/tests", authToken, UserController.getTests);
router.post("/tests/:testId", authToken, UserController.submitTest);

// AdminController routes
router.post("/register", authToken, checkRole(['ADMIN']), AdminController.register);
router.put("/update/:id", authToken, checkRole(['ADMIN']), AdminController.updateUser);
router.delete("/delete/:id", authToken, checkRole(['ADMIN']), AdminController.deleteUser);

// TeacherController routes
router.get("/current", authToken, TeacherController.current);
router.get("/teachers", authToken, TeacherController.getAllTeachers);
router.get("/teachers/:teacherId/tests", authToken, TeacherController.getTestsByTeacherId);


// TestController routes
router.post("/test", authToken, checkRole(['TEACHER']), TestController.testCreate);
router.put("/test", authToken, checkRole(['TEACHER']), TestController.testUpdate);
router.delete("/test", authToken, checkRole(['TEACHER']), TestController.testDelete);
router.post ("/submit-test", authToken, TestController.submitTest);

//ProfileController

router.get("/profile/:userId", authToken, ProfileController.getUser);
router.put("/profile/:userId", authToken, ProfileController.updateUser);


module.exports = router;
