const jwt = require('jsonwebtoken');

const checkRole = (requiredRoles) => {
    return (req, res, next) => {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Извлечение Bearer токена

        if (!token) {
            return res.status(401).json({ error: "Нет токена авторизации" });
        }

        try {
            const decoded = jwt.verify(token, process.env.SECRET_KEY);
            const userRole = decoded.role;

            if (!requiredRoles.includes(userRole)) {
                return res.status(403).json({ error: "Доступ запрещен: недостаточно прав" });
            }

            req.user = decoded;
            next();
        } catch (err) {
            return res.status(403).json({ error: "Недействительный токен" });
        }
    };
};

module.exports = checkRole;
