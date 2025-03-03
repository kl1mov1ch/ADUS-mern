const bcrypt = require("bcryptjs");
const { prisma } = require("../prisma/prisma-client");
const jwt = require("jsonwebtoken");

const GeneralController = {
    login: async (req, res) => {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Все поля обязательны" });
        }

        try {
            // Находим пользователя
            const user = await prisma.user.findUnique({ where: { email } });

            if (!user) {
                return res.status(400).json({ error: "Неверный логин или пароль" });
            }

            // Проверяем пароль
            const valid = await bcrypt.compare(password, user.password);

            if (!valid) {
                return res.status(400).json({ error: "Неверный логин или пароль" });
            }

            const token = jwt.sign({ userId: user.id, role: user.role }, process.env.SECRET_KEY);

            res.json({ token });
        } catch (error) {
            console.error("Error in login:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    },


    logout: async (req, res) => {
        res.json({ message: "Успешный выход" });
    }
};

module.exports = GeneralController;
