const bcrypt = require("bcryptjs");
const { prisma } = require("../prisma/prisma-client");
const jdenticon = require("jdenticon");
const path = require("path");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const { json } = require("express");

const TeacherController = {
    getUserById: async (req, res) => {
        const { id } = req.params;

        try {
            const user = await prisma.user.findUnique({
                where: { id },
                include: {
                    tests: true,
                    grades: true
                }
            });

            if (!user) {
                return res.status(404).json({ error: "User not found" });
            }

            res.json(user);
        } catch (err) {
            console.error("Error fetching user by ID", err);
            res.status(500).json({ error: "Server Error" });
        }
    },

    current: async (req, res) => {
        try {
            const user = await prisma.user.findUnique({
                where: {
                    id: req.user.userId
                },
                include: {
                    tests: true,
                    grades: true
                }
            });

            if (!user) {
                return res.status(400).json({ error: "User not found" });
            }

            res.json(user);
        } catch (err) {
            console.error("Get current Error", err);
            res.status(500).json({ error: "Server Error" });
        }
    },

    getAllTeachers: async (req, res) => {
        try {
            const teachers = await prisma.user.findMany({
                where: {
                    role: 'TEACHER'
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    tests: true
                }
            });

            if (teachers.length === 0) {
                return res.status(404).json({ error: "No teachers found" });
            }

            res.json(teachers);
        } catch (err) {
            console.error("Error fetching teachers", err);
            res.status(500).json({ error: "Server Error" });
        }
    },

    getTestsByTeacherId: async (req, res) => {
        const { teacherId } = req.params;

        try {
            const tests = await prisma.test.findMany({
                where: {
                    teacherId: teacherId
                }
            });


            res.json(tests);
        } catch (err) {
            console.error("Error fetching tests for teacher", err);
            res.status(500).json({ error: "Server Error" });
        }
    }
};

module.exports = TeacherController;
