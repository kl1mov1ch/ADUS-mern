const { prisma } = require("../prisma/prisma-client");

const ProfileController = {
    // Получение данных о пользователе по ID
    getUser: async (req, res) => {
        const { userId } = req.params; // Извлечение userId из параметров запроса

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

    updateUserAvatar: async (req, res) => {
        console.log("req.file:", req.file);
        const { userId } = req.params;

        // Проверка, что файл был передан
        if (!req.file) {
            return res.status(400).json({ message: "Необходимо предоставить изображение для обновления." });
        }

        try {
            // Предполагается, что middleware для обработки загрузки файла уже настроено
            const avatarUrl = `${avatarUrlHost}/uploads/${req.file.filename}`; // Путь к сохраненному файлу

            const updatedUser = await prisma.user.update({
                where: { id: userId },
                data: {
                    avatarUrl,
                },
            });

            return res.status(200).json(updatedUser);
        } catch (error) {
            console.error("Ошибка при обновлении аватара:", error.message);
            return res.status(500).json({ message: "Ошибка при обновлении аватара", error: error.message });
        }
    }
};

module.exports = ProfileController;
