const bcrypt = require("bcryptjs");
const { prisma } = require("../prisma/prisma-client");
const jdenticon = require("jdenticon");
const path = require("path");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const multer = require('multer');

// Настройка multer для загрузки аватаров
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Переменная для базового URL аватара
const avatarUrlHost = process.env.AVATAR_URL_HOST || 'http://localhost:3000';

const AdminController = {
    register: async (req, res) => {
        const {name, email, password, role} = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({error: "Все поля обязательны"});
        }

        try {
            const existingUser = await prisma.user.findUnique({where: {email}});
            if (existingUser) {
                return res.status(400).json({error: "Пользователь с таким email уже существует"});
            }

            const hashedPassword = await bcrypt.hash(password, 12);

            let avatarUrl;
            if (!req.file) {
                const png = jdenticon.toPng(name, 200);
                const avatarName = `${name}_${Date.now()}.png`;
                const avatarPath = path.join(__dirname, '/../uploads', avatarName);
                fs.writeFileSync(avatarPath, png);
                avatarUrl = `${avatarUrlHost}/uploads/${avatarName}`; // Используем avatarUrlHost
            } else {
                avatarUrl = `${avatarUrlHost}/uploads/${req.file.filename}`; // Обновление на основе загруженного файла
            }

            const user = await prisma.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    name,
                    avatarUrl: avatarUrl,
                    role: role || 'STUDENT'
                }
            });
            res.status(201).json({message: "Пользователь успешно зарегистрирован!", user});
        } catch (err) {
            console.error("Ошибка создания пользователя", err);
            res.status(500).json({error: "Ошибка сервера"});
        }
    },

    getAllUsers: async (req, res) => {
        try {
            const users = await prisma.user.findMany({
                include: {
                    userClasses: {
                        include: {
                            class: true,
                        },
                    },
                },
            });

            // Форматируем ответ, чтобы классы были вложены в пользователя
            const formattedUsers = users.map((user) => ({
                ...user,
                classes: user.userClasses.map((userClass) => userClass.class),
            }));
            res.json(formattedUsers);
        } catch (error) {
            console.error("Ошибка получения пользователей", error);
            res.status(500).json({ error: "Ошибка сервера" });
        }
    },

    updateUser: async (req, res) => {
        const { userId } = req.params;
        const { email, name, role, classId } = req.body;

        // Проверка обязательных полей
        if (!email || !name || !role) {
            return res.status(400).json({ message: "Email, name и role обязательны." });
        }

        try {
            const user = await prisma.user.findFirst({
                where: { id: userId }, // Используем userId в условии where
            });

            if (!user) {
                return res.status(404).json({ message: "Пользователь не найден." });
            }

            let avatarUrl;

            // Формирование URL для аватара
            if (!req.file) {
                // Если файл не загружен, используем старый аватар
                avatarUrl = user.avatarUrl; // Оставляем старый URL, если файла нет
            } else {
                // Если файл загружен, создаем новый аватар
                avatarUrl = `${avatarUrlHost}/uploads/${req.file.filename}`; // Используем avatarUrlHost
            }

            // Обновляем данные пользователя, включая класс, если classId передан
            const updatedUser = await prisma.user.update({
                where: { id: userId },
                data: {
                    email,
                    name,
                    role,
                    avatarUrl, // Устанавливаем новый или старый URL
                    classId: classId || user.classId, // Обновляем classId, если он передан, иначе оставляем старый
                },
            });

            res.status(200).json({ message: "Пользователь успешно обновлён.", user: updatedUser });
        } catch (error) {
            console.error("Ошибка обновления пользователя:", error);
            res.status(500).json({ message: "Ошибка при обновлении пользователя." });
        }
    },

    deleteUser: async (req, res) => {
        const {id} = req.params; // Исправлено: Получаем `id` из `req.params`
        try {
            await prisma.user.delete({
                where: {id}, // Удаляем пользователя по `id`
            });
            res.json({message: "Пользователь удален"});
        } catch (error) {
            console.error("Ошибка удаления пользователя", error);
            res.status(500).json({error: "Ошибка сервера"});
        }
    },

     createAdmin:  async (req, res) => {
        const name = "admin1233213";
        const email = "admin111232123@admin.com";
        const password = "admin";

        try {
            const existingAdmin = await prisma.user.findUnique({
                where: { email }
            });

            if (existingAdmin) {
                return res.status(400).json({ error: "Администратор с таким email уже существует" });
            }

            const hashedPassword = await bcrypt.hash(password, 12);

            let avatarUrl;
            if (!req.file) {
                const png = jdenticon.toPng(name, 200);
                const avatarName = `${name}_${Date.now()}.png`;
                const avatarPath = path.join(__dirname, '/../uploads', avatarName);
                fs.writeFileSync(avatarPath, png);
                avatarUrl = `${avatarUrlHost}/uploads/${avatarName}`;
            } else {
                avatarUrl = `${avatarUrlHost}/uploads/${req.file.filename}`;
            }

            const admin = await prisma.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    name,
                    avatarUrl,
                    role: 'ADMIN'
                }
            });

            res.status(201).json({ message: "Администратор успешно создан!", user: admin });
        } catch (err) {
            console.error("Ошибка создания администратора", err);
            res.status(500).json({ error: "Ошибка сервера" });
        }
    }
}

module.exports = AdminController;
