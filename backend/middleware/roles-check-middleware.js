const jwt = require('jsonwebtoken');

const checkRole = (requiredRoles) => {
    return (req, res, next) => {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Извлечение Bearer токена

        if (!token) {
            return res.status(401).json({ error: "Нет токена авторизации" });
        }

        try {
            // Проверка токена и декодирование информации о пользователе
            const decoded = jwt.verify(token, process.env.SECRET_KEY);
            const userRole = decoded.role;

            // Проверка, что роль пользователя включена в необходимые роли
            if (!requiredRoles.includes(userRole)) {
                return res.status(403).json({ error: "Доступ запрещен: недостаточно прав" });
            }

            req.user = decoded; // Прикрепление декодированных данных пользователя к объекту запроса
            next(); // Продолжение к следующему middleware или обработчику маршрута
        } catch (err) {
            return res.status(403).json({ error: "Недействительный токен" });
        }
    };
};

module.exports = checkRole;
