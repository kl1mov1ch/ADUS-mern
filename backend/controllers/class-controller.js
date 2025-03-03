const { prisma } = require("../prisma/prisma-client");

const ClassController = {
  // Create a new class
  createClass: async (req, res) => {
    const { name } = req.body;

    try {
      const newClass = await prisma.class.create({
        data: { name },
      });

      res.status(201).json(newClass);
    } catch (err) {
      console.error("Error creating class", err);
      res.status(500).json({ error: "Server Error" });
    }
  },

  addUserToClass: async (req, res) => {
    const { userId, classId } = req.body;

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      const classItem = await prisma.class.findUnique({
        where: { id: classId },
      });

      if (!user || !classItem) {
        return res.status(404).json({ error: "User or Class not found" });
      }

      const existingUserClass = await prisma.userClass.findFirst({
        where: {
          userId,
          classId,
        },
      });

      if (existingUserClass) {
        return res.status(400).json({ error: "User is already in this class" });
      }

      const userClass = await prisma.userClass.create({
        data: {
          userId,
          classId,
        },
      });

      res.json({ message: "User added to class successfully", userClass });
    } catch (err) {
      console.error("Error adding user to class", err);
      res.status(500).json({ error: "Server Error" });
    }
  },

  updateClass: async (req, res) => {
    const { classId, name } = req.body;

    try {
      const updatedClass = await prisma.class.update({
        where: { id: classId },
        data: { name },
      });

      res.json(updatedClass);
    } catch (err) {
      console.error("Error updating class", err);
      res.status(500).json({ error: "Server Error" });
    }
  },

  getAllClasses: async (req, res) => {
    try {
      const classes = await prisma.class.findMany({
        include: {
          userClasses: {
            include: {
              user: true,
            },
          },
        },
      });

      res.json(classes);
    } catch (err) {
      console.error("Error fetching classes", err);
      res.status(500).json({ error: "Server Error" });
    }
  },

  deleteClass: async (req, res) => {
    const { classId } = req.params;

    try {
      await prisma.userClass.deleteMany({
        where: { classId },
      });

      await prisma.class.delete({
        where: { id: classId },
      });

      res.json({ message: "Class deleted successfully" });
    } catch (err) {
      console.error("Error deleting class", err);
      res.status(500).json({ error: "Server Error" });
    }
  },

  removeUserFromClass: async (req, res) => {
    const { userId, classId } = req.params;

    if (!userId || !classId) {
      return res.status(400).json({ error: "userId и classId обязательны." });
    }

    try {
      // Проверяем, существует ли связь между пользователем и классом
      const userClass = await prisma.userClass.findFirst({
        where: {
          userId,
          classId,
        },
      });

      if (!userClass) {
        return res.status(404).json({ error: "Пользователь не найден в классе." });
      }

      // Удаляем связь между пользователем и классом
      await prisma.userClass.delete({
        where: {
          id: userClass.id,
        },
      });

      res.status(200).json({ message: "Пользователь успешно удален из класса." });
    } catch (error) {
      console.error("Ошибка удаления пользователя из класса:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  },

  getClassById: async (req, res) => {
    const { classId } = req.params;

    try {
      const classItem = await prisma.class.findUnique({
        where: { id: classId },
        include: {
          userClasses: {
            include: {
              user: true, // Включаем информацию о пользователях
            },
          },
        },
      });

      if (!classItem) {
        return res.status(404).json({ error: "Class not found" });
      }

      res.json(classItem);
    } catch (err) {
      console.error("Error fetching class", err);
      res.status(500).json({ error: "Server Error" });
    }
  },

  getClassByUserId: async (req, res) => {
    const { userId } = req.params;

    try {
      const userClasses = await prisma.userClass.findMany({
        where: { userId },
        include: {
          class: true,
        },
      });

      const classes = userClasses.map((userClass) => userClass.class);
      console.log(classes);
      res.json(classes);
    } catch (err) {
      console.error("Error fetching classes for user", err);
      res.status(500).json({ error: "Server Error" });
    }
  },
};

module.exports = ClassController;
