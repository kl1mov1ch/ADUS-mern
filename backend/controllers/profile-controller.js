const { prisma } = require("../prisma/prisma-client");
const fs = require('fs');
const path = require('path');

const ProfileController = {
    // Получение данных о пользователе по ID
    getUser: async (req, res) => {
        const { userId } = req.params;

        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
            });

            if (!user) {
                return res.status(404).json({ message: "Пользователь не найден." });
            }

            return res.status(200).json(user);
        } catch (error) {
            console.error("Ошибка при получении пользователя:", error.message);
            return res.status(500).json({ message: "Ошибка при получении пользователя", error: error.message });
        }
    },

    // Обновление только аватара пользователя
    updateUserAvatar: async (req, res) => {
        const { userId } = req.params;

        if (!req.file) {
            return res.status(400).json({ message: "Файл аватара не был загружен." });
        }

        try {
            // Удаляем старый аватар, если он существует
            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (user.avatarUrl) {
                const oldAvatarPath = path.join(__dirname, '..', 'uploads', path.basename(user.avatarUrl));
                if (fs.existsSync(oldAvatarPath)) {
                    fs.unlinkSync(oldAvatarPath);
                }
            }

            // Обновляем аватар в базе данных
            const avatarUrl = `/uploads/${req.file.filename}`;
            const updatedUser = await prisma.user.update({
                where: { id: userId },
                data: { avatarUrl },
            });

            return res.status(200).json(updatedUser);
        } catch (error) {
            console.error("Ошибка при обновлении аватара:", error.message);
            return res.status(500).json({
                message: "Ошибка при обновлении аватара",
                error: error.message
            });
        }
    }
};

module.exports = ProfileController;