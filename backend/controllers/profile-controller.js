const { prisma } = require("../prisma/prisma-client");

const ProfileController = {
    // Получение данных о пользователе по ID
    getUser: async (req, res) => {
        const { userId } = req.params; // Извлечение userId из параметров запроса

        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
            });

            // Проверка, существует ли пользователь
            if (!user) {
                return res.status(404).json({ message: "Пользователь не найден." });
            }

            return res.status(200).json(user);
        } catch (error) {
            console.error("Ошибка при получении пользователя:", error.message);
            return res.status(500).json({ message: "Ошибка при получении пользователя", error: error.message });
        }
    },

    // Обновление данных пользователя
    updateUser: async (req, res) => {
        console.log("req.body:", req.body);
        const { userId } = req.params;
        const { name, email } = req.body;

        // Проверка, что переданы необходимые данные
        if (!name && !email) {
            return res.status(400).json({ message: "Необходимы данные для обновления." });
        }

        try {
            // Обновление данных пользователя
            const updatedUser = await prisma.user.update({
                where: { id: userId },
                data: {
                    name, // Обновление имени
                    email, // Обновление электронной почты
                },
            });

            return res.status(200).json(updatedUser);
        } catch (error) {
            console.error("Ошибка при обновлении пользователя:", error.message);
            return res.status(500).json({ message: "Ошибка при обновлении пользователя", error: error.message });
        }
    }

};

module.exports = ProfileController;
