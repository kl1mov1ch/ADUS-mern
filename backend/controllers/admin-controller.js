const bcrypt = require("bcryptjs");
const { prisma } = require("../prisma/prisma-client");
const jdenticon = require("jdenticon");
const path = require("path");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const { json } = require("express");

const AdminController = {
    register: async (req, res) => {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: "Все поля обязательны" });
        }

        try {
            const existingUser = await prisma.user.findUnique({ where: { email } });
            if (existingUser) {
                return res.status(400).json({ error: "Пользователь с таким email уже существует" });
            }

            const hashedPassword = await bcrypt.hash(password, 12);
            const png = jdenticon.toPng(name, 200);
            const avatarName = `${name}_${Date.now()}.png`;
            const avatarPath = path.join(__dirname, '/../uploads', avatarName);
            fs.writeFileSync(avatarPath, png);

            const user = await prisma.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    name,
                    avatarUrl: `${process.env.AWATAR_URL_HOST}/uploads/${avatarName}`,
                    role: role || 'STUDENT'
                }
            });
            res.status(201).json({ message: "Пользователь успешно зарегистрирован!" });
            console.log(user);
        } catch (err) {
            console.error("Error creating user", err);
            res.status(500).json({ error: "Server Error" });
        }
    },

    updateUser: async (req, res) => {
        const { id } = req.params;
        const { email, dateOfBirth, bio, location, name } = req.body;

        let filePath;
        if (req.file && req.file.path) {
            filePath = req.file.path;
        }

        try {
            if (email) {
                const existingUser = await prisma.user.findFirst({ where: { email } });

                if (existingUser && existingUser.id !== id) {
                    return res.status(403).json({ error: "Email already exists" });
                }
            }

            const user = await prisma.user.update({
                where: { id },
                data: {
                    email: email || undefined,
                    name: name || undefined,
                    avatarUrl: filePath ? `/${filePath}` : undefined,
                    dateOfBirth: dateOfBirth || undefined,
                    bio: bio || undefined,
                    location: location || undefined,
                    role: role || undefined
                }
            });

            res.json({ user });
        } catch (error) {
            console.error("Update user error", error);
            res.status(500).json({ error: "Server Error" });
        }
    },

    deleteUser: async (req, res) => {
        const { id } = req.params;
        try {
            await prisma.user.delete({ where: { id: id } });
            res.json({ message: "User deleted" });
        } catch (error) {
            console.error("Delete user error", error);
            res.status(500).json({ error: "Server Error" });
        }
    }


}

module.exports = AdminController;