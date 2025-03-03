const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require("multer");
const authToken = require("../middleware/auth-middleware");
const checkRole = require("../middleware/roles-check-middleware");
const AdminController = require("../controllers/admin-controller");
const TeacherController = require("../controllers/teacher-controller");
const GeneralController = require("../controllers/general-controller");
const TestController = require("../controllers/test-controller");
const UserController = require("../controllers/user-controller");
const ProfileController = require("../controllers/profile-controller");
const MarkController = require("../controllers/mark-controller");
const ChatController = require('../controllers/chat-controller')
const CategoryController = require("../controllers/category-controller");
const ClassController = require("../controllers/class-controller");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === "image/jpg") {
    cb(null, true);
  } else {
    cb(new Error('Недопустимый тип файла'), false);
  }
};

const upload = multer(
    {
    storage: storage,
    fileFilter: fileFilter
    });

// General routes
router.post('/login', GeneralController.login);
router.post('/logout', GeneralController.logout);

// UserController routes
router.get("/tests", authToken, UserController.getTests);
router.post("/tests/:testId", authToken, UserController.submitTest);

// AdminController routes
router.post("/register", authToken, checkRole(['ADMIN']), AdminController.register);
router.post("/create-admin", AdminController.createAdmin);
router.put("/update/:userId", checkRole(['ADMIN']), authToken, upload.single('avatar'), AdminController.updateUser);
router.delete("/users/:id", authToken, checkRole(['ADMIN']), AdminController.deleteUser);
router.get("/users", authToken, checkRole(['ADMIN']), AdminController.getAllUsers)

// TeacherController routes
router.get("/current", authToken, TeacherController.current);
router.get("/teachers", authToken, TeacherController.getAllTeachers);
router.get("/teachers/:teacherId/tests", authToken, TeacherController.getTestsByTeacherId);


// TestController routes
router.post("/test", authToken, checkRole(['TEACHER']),upload.any(), TestController.testCreate);
router.put("/test/:testId", authToken, checkRole(['TEACHER']),upload.any(), TestController.testUpdate);
router.delete("/test/:testId", authToken, checkRole(['TEACHER']), TestController.testDelete);
router.post ("/submit-test", authToken, TestController.submitTest);
router.post("/generate-test", authToken, checkRole(['TEACHER']), TestController.generateTest);
router.delete("/tests/:testId/remove-assignment/:classId", authToken, checkRole(["TEACHER"]), TestController.removeTestAssignment);
router.post("/tests/:testId/assign-to-class", authToken, checkRole(['TEACHER']), TestController.assignTestToClass);
router.put("/tests/:testId/toggle-visibility", authToken, checkRole(['TEACHER']), TestController.toggleTestVisibility);

//ProfileController
router.get("/profile/:userId", authToken, ProfileController.getUser);
router.put("/profile/:id", authToken, ProfileController.updateUserAvatar);

//MarlController
router.get("/test-results/:teacherId",authToken,  MarkController.getTeacherMarks);
router.get("/student-marks/:userId", authToken,  MarkController.getStudentMarks);
router.post("/test-result/:teacherId/:testId/report", authToken, MarkController.generateReport);
router.post("/chat", authToken, ChatController.chatWithGPT);

router.post("/categories", authToken, checkRole(['ADMIN']), CategoryController.createCategory);
router.get("/categories", authToken, CategoryController.getAllCategories);
router.get("/categories/:categoryId", authToken, CategoryController.getCategoryById);
router.put("/categories", authToken, checkRole(['ADMIN']), CategoryController.updateCategory);
router.delete("/categories/:categoryId", authToken, checkRole(['ADMIN']), CategoryController.deleteCategory);
router.get("/tests/:testId/categories-and-subcategories",authToken, CategoryController.getCategoriesAndSubcategoriesForTest);

router.post("/subcategories", authToken, checkRole(['ADMIN']), CategoryController.createSubcategory);
router.put("/subcategories", authToken, checkRole(['ADMIN']), CategoryController.updateSubcategory);
router.delete("/subcategories/:subcategoryId", authToken, checkRole(['ADMIN']), CategoryController.deleteSubcategory);

router.post("/classes", authToken, checkRole(["ADMIN"]), ClassController.createClass);
router.get("/classes", authToken, ClassController.getAllClasses);
router.put("/classes", authToken, checkRole(["ADMIN"]), ClassController.updateClass);
router.delete("/classes/:classId", authToken, checkRole(["ADMIN"]), ClassController.deleteClass);
router.get("/classes/:classId", authToken, ClassController.getClassById);
  router.get("/users/:userId/classes", authToken, ClassController.getClassByUserId);

// Роуты для добавления/удаления пользователей в класс
router.post("/classes/add-user", authToken, checkRole(["ADMIN"]), ClassController.addUserToClass);
router.delete("/classes/:classId/remove-user/:userId", authToken, checkRole(["ADMIN"]), ClassController.removeUserFromClass);



module.exports = router;
