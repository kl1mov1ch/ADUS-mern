const { prisma } = require("../prisma/prisma-client");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const { createObjectCsvWriter } = require("csv-writer");


const MarkController = {
    getTeacherMarks: async (req, res) => {
        const { teacherId } = req.params;

        try {
            const tests = await prisma.test.findMany({
                where: {
                    teacherId: String(teacherId),
                },
                select: {
                    id: true,
                    title: true,
                    testAssignments: {
                        where: {
                            student: {
                                role: "STUDENT",
                            },
                            grade: { isNot: null }, // Фильтруем только те записи, где есть отметка
                        },
                        select: {
                            student: {
                                select: {
                                    id: true,
                                    name: true,
                                    role: true,
                                    userClasses: {
                                        select: {
                                            class: {
                                                select: {
                                                    id: true,
                                                    name: true,
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                            grade: {
                                select: {
                                    value: true,
                                },
                            },
                            completedAt: true,
                        },
                    },
                },
            });

            const response = tests.map((test) => ({
                testId: test.id,
                title: test.title,
                students: test.testAssignments.map((assignment) => ({
                    studentId: assignment.student.id,
                    studentName: assignment.student.name || "N/A",
                    grade: assignment.grade?.value || "N/A",
                    completedAt: assignment.completedAt ? assignment.completedAt.toISOString() : "N/A",
                    classes: assignment.student.userClasses.map((userClass) => ({
                        classId: userClass.class.id,
                        className: userClass.class.name,
                    })),
                })),
            }));

            res.json(response);
        } catch (error) {
            console.error("Ошибка при получении отметок учителя:", error);
            res.status(500).json({ message: "Ошибка сервера" });
        }
    },

    getStudentMarks: async (req, res) => {
        const { userId } = req.params;
        try {
            const tests = await prisma.test.findMany({
                where: {
                    testAssignments: {
                        some: {
                            studentId: userId,
                        },
                    },
                },
                select: {
                    id: true,
                    title: true,
                    testAssignments: {
                        where: {
                            studentId: userId,
                        },
                        select: {
                            grade: {
                                select: {
                                    value: true,
                                },
                            },
                            completedAt: true,
                        },
                    },
                },
            });

            const response = tests.map((test) => ({
                testId: test.id,
                title: test.title,
                attempts: test.testAssignments.map((assignment) => ({
                    grade: assignment.grade?.value || "N/A",
                    completedAt: assignment.completedAt
                        ? new Date(assignment.completedAt).toISOString()
                        : "N/A",
                })),
            }));

            res.json(response);
        } catch (error) {
            console.error("Ошибка при получении отметок студента:", error);
            res.status(500).json({ message: "Ошибка сервера при получении отметок студента." });
        }
    },

    async generateReport(req, res) {
        const { teacherId, testId } = req.params;

        try {
            const test = await prisma.test.findUnique({
                where: { id: testId },
                select: {
                    id: true,
                    title: true,
                    testAssignments: {
                        select: {
                            student: { select: { name: true } },
                            grade: { select: { value: true } },
                            completedAt: true,
                        },
                    },
                },
            });

            if (!test) {
                return res.status(404).json({ message: "Тест не найден или недоступен для учителя." });
            }

            // Указываем директорию для сохранения отчетов
            const reportsDir = path.join(__dirname, '../../reports');
            if (!fs.existsSync(reportsDir)) {
                fs.mkdirSync(reportsDir, { recursive: true });
            }

            // Генерируем уникальное имя файла с использованием времени для версионности
            const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0]; // Получаем метку времени без символов - и :
            const filePath = path.join(reportsDir, `test_${testId}_report_${timestamp}.csv`);

            // Настройка записи CSV
            const csvWriter = createObjectCsvWriter({
                path: filePath,
                header: [
                    { id: 'studentName', title: 'Студент' },
                    { id: 'grade', title: 'Оценка' },
                    { id: 'completedAt', title: 'Дата завершения' },
                ],
            });

            // Формируем данные для CSV
            const records = test.testAssignments.map((assignment) => ({
                studentName: assignment.student?.name || "N/A",
                grade: assignment.grade?.value || "N/A",
                completedAt: assignment.completedAt
                    ? new Date(assignment.completedAt).toLocaleString('ru-RU')
                    : "N/A",
            }));

            // Создаем CSV файл
            await csvWriter.writeRecords(records);

            res.status(200).json({
                message: "Отчет создан успешно.",
                reportPath: `/reports/test_${testId}_report_${timestamp}.csv`, // Передаем ссылку на файл с уникальным именем
            });
        } catch (error) {
            console.error("Ошибка при создании отчета:", error);
            res.status(500).json({ message: "Ошибка сервера при создании отчета." });
        }
    }
};

module.exports = MarkController;
