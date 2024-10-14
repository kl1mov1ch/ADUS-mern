const bcrypt = require("bcryptjs");
const { prisma } = require("../prisma/prisma-client");
const jdenticon = require("jdenticon");
const path = require("path");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const { json } = require("express");

const TestsController = {
    testCreate: async (req, res) => {
        const {title, description, questions, teacherId} = req.body;

        if (!teacherId) {
            return res.status(400).json({message: "Teacher ID is required."});
        }

        // Check if questions is defined and is an array
        if (!Array.isArray(questions) || questions.length === 0) {
            return res.status(400).json({message: "Questions must be a non-empty array."});
        }

        try {
            // Validate teacherId
            const teacher = await prisma.user.findUnique({
                where: {
                    id: teacherId,
                },
            });

            if (!teacher) {
                return res.status(404).json({message: "Teacher not found."});
            }

            const newTest = await prisma.test.create({
                data: {
                    title,
                    description,
                    questions: {
                        create: questions.map((question) => ({
                            text: question.text,
                            options: question.options,
                            correctAnswer: Array.isArray(question.correctAnswer) ? question.correctAnswer : [question.correctAnswer], // Ensure correctAnswer is always an array
                        })),
                    },
                    teacher: {connect: {id: teacherId}},
                },
                include: {questions: true},
            });

            return res.status(201).json(newTest);
        } catch (error) {
            console.error("Error creating test:", error);
            return res.status(500).json({message: "Error creating test"});
        }
    },

    testUpdate: async (req, res) => {
        const {testId} = req.params;
        const {title, description, teacherId, questions} = req.body;

        if (!teacherId) {
            return res.status(400).json({error: "Teacher ID is required."});
        }

        try {
            // Check if the test exists
            const test = await prisma.test.findUnique({
                where: {id: testId},
            });

            if (!test) {
                return res.status(404).json({error: "Test not found."});
            }

            // Ensure the user updating the test is the teacher who created it
            if (test.teacherId !== teacherId) {
                return res.status(403).json({error: "Only the creator teacher can update this test."});
            }

            // Update the test and associated questions
            const updatedTest = await prisma.test.update({
                where: {id: testId},
                data: {
                    title,
                    description,
                    questions: {
                        deleteMany: {}, // Delete existing questions
                        create: questions.map((q) => ({
                            text: q.text,
                            options: q.options,
                            correctAnswer: Array.isArray(q.correctAnswer) ? q.correctAnswer : [q.correctAnswer], // Ensure correctAnswer is always an array
                            answers: {
                                create: q.answers.map((answer) => ({
                                    content: answer.content,
                                    student: {connect: {id: answer.studentId}},
                                })),
                            },
                        })),
                    },
                },
                include: {questions: {include: {answers: true}}},
            });

            res.status(200).json(updatedTest);
        } catch (error) {
            console.error("Error updating test:", error);
            res.status(500).json({error: "Internal server error"});
        }
    },

    testDelete: async (req, res) => {
        const {testId} = req.params;
        const {teacherId} = req.body;

        if (!teacherId) {
            return res.status(400).json({error: "Teacher ID is required."});
        }

        try {
            const test = await prisma.test.findUnique({
                where: {id: testId},
            });

            if (!test) {
                return res.status(404).json({error: "Test not found."});
            }

            if (test.teacherId !== teacherId) {
                return res.status(403).json({error: "Only the creator teacher can delete this test."});
            }

            await prisma.test.delete({
                where: {id: testId},
            });

            res.status(200).json({message: "Test deleted successfully."});
        } catch (error) {
            console.error("Error deleting test:", error);
            res.status(500).json({error: "Internal server error"});
        }
    },
    submitTest: async (req, res) => {
        const { testId, studentId, answers } = req.body;

        if (!testId || !studentId || !answers) {
            return res.status(400).json({ message: "Test ID, student ID, and answers are required." });
        }

        try {
            // Получаем тест с вопросами и правильными ответами
            const test = await prisma.test.findUnique({
                where: { id: testId },
                include: { questions: true },
            });

            if (!test) {
                return res.status(404).json({ message: "Test not found." });
            }

            // Логируем полученные ответы от студента
            console.log("Ответы студента:", answers);

            // Подсчитываем правильные ответы
            let correctAnswersCount = 0;

            test.questions.forEach(question => {
                const studentAnswer = answers[question.id];
                const correctAnswer = question.correctAnswer;

                console.log(`Проверка вопроса: ${question.id}`);
                console.log(`Правильный ответ:`, correctAnswer);
                console.log(`Ответ студента:`, studentAnswer);

                if (Array.isArray(correctAnswer)) {
                    // Если правильный ответ - массив
                    const isCorrect = correctAnswer.every(answer => studentAnswer?.includes(answer));
                    console.log(`Правильность ответа (массив):`, isCorrect);

                    if (isCorrect) {
                        correctAnswersCount++;
                    }
                } else {
                    // Если правильный ответ - строка
                    const isCorrect = studentAnswer === correctAnswer;
                    console.log(`Правильность ответа (строка):`, isCorrect);

                    if (isCorrect) {
                        correctAnswersCount++;
                    }
                }
            });

            // Логируем количество правильных ответов
            console.log("Количество правильных ответов:", correctAnswersCount);

            // Вычисляем процент правильных ответов
            const totalQuestions = test.questions.length;
            const percentage = ((correctAnswersCount / totalQuestions) * 100).toFixed(2);

            // Вычисляем отметку по 10-бальной системе
            const mark = Math.round((correctAnswersCount / totalQuestions) * 10);

            // Логируем процент и отметку
            console.log("Процент правильных ответов:", percentage);
            console.log("Отметка:", mark);

            res.status(200).json({ correctAnswersCount, percentage, mark });
        } catch (error) {
            console.error("Ошибка при обработке теста:", error);
            res.status(500).json({ message: "Ошибка при отправке теста" });
        }
    }

}

module.exports = TestsController;
