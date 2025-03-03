const { prisma } = require("../prisma/prisma-client");

const UserController = {
    getTests: async (req, res) => {
        try {
            const user = req.user;
            let filter = {};
            let classIds = []; // Define classIds here to ensure it's accessible in all scopes

            if (user.role === "STUDENT") {
                // Получаем классы, в которых состоит студент
                const userClasses = await prisma.userClass.findMany({
                    where: { userId: user.userId }, // Используем user.userId, так как user.id undefined
                    select: { classId: true },
                });

                classIds = userClasses.map((uc) => uc.classId); // Assign classIds here

                // Фильтр для студентов: только тесты, назначенные их классам и не скрытые
                filter = {
                    testAssignments: {
                        some: { classId: { in: classIds } },
                    },
                    isHidden: false,
                };
            } else if (user.role === "TEACHER") {
                // Фильтр для учителей: только их тесты или видимые тесты
                filter = {
                    teacherId: user.userId,
                    OR: [
                        { isHidden: false },
                        { isHidden: true, teacherId: user.userId },
                    ],
                };
            } else if (user.role === "ADMIN") {
                // Админы видят все тесты
                filter = {};
            }

            // Получаем тесты с учетом фильтра
            const tests = await prisma.test.findMany({
                where: filter,
                include: {
                    questions: {
                        select: {
                            id: true,
                            text: true,
                            options: true,
                            correctAnswer: true, // Убедитесь, что это массив, а не строка
                            imageUrl: true,
                        },
                    },
                    testAssignments: {
                        include: { class: true },
                        orderBy: { classId: 'asc' },
                    },
                },
            });

            // Убираем дублирующиеся назначения на классы
            const uniqueTests = tests.map(test => {
                const uniqueAssignments = Array.from(
                  new Set(test.testAssignments.map(assignment => assignment.classId))
                ).map(classId => test.testAssignments.find(assignment => assignment.classId === classId));

                return {
                    ...test,
                    testAssignments: uniqueAssignments,
                };
            });

            // Дополнительная фильтрация для студентов
            if (user.role === "STUDENT") {
                const filteredTests = uniqueTests.filter(test => {
                    if (test.isHidden) return false; // Скрытые тесты не показываем
                    return test.testAssignments.some(assignment => classIds.includes(assignment.classId));
                });

                return res.status(200).json(filteredTests);
            }

            // Дополнительная фильтрация для учителей
            if (user.role === "TEACHER") {
                const filteredTests = uniqueTests.filter(test => {
                    if (test.isHidden && test.teacherId !== user.userId) {
                        return false; // Скрытые тесты показываем только создателю
                    }
                    return true;
                });

                return res.status(200).json(filteredTests);
            }

            // Админы видят все тесты
            return res.status(200).json(uniqueTests);
        } catch (error) {
            console.error("Ошибка при получении тестов:", error);
            return res.status(500).json({ message: "Ошибка при получении тестов" });
        }
    },


    submitTest: async (req, res) => {
        const { testId } = req.params;
        const { studentId, answers } = req.body;

        if (!studentId) {
            return res.status(400).json({ message: "Требуется ID студента." });
        }

        try {
            // Получение теста
            const test = await prisma.test.findUnique({
                where: { id: testId },
                include: { questions: true },
            });

            // Проверка, существует ли тест
            if (!test) {
                return res.status(404).json({ message: "Тест не найден." });
            }

            // Подсчет баллов на основе ответов
            let totalScore = 0;

            // Проходим по вопросам теста и сохраняем ответы
            for (const question of test.questions) {
                const studentAnswer = answers[question.id]; // Получаем ответ студента на конкретный вопрос

                // Проверка правильности ответа
                const isCorrect = studentAnswer && JSON.stringify(studentAnswer) === JSON.stringify(question.correctAnswer);
                const score = isCorrect ? 1 : 0; // Начисляем 1 балл за правильный ответ

                totalScore += score;

                // Сохранение ответа студента на конкретный вопрос
                await prisma.answer.create({
                    data: {
                        student: { connect: { id: studentId } },      // Связывание с отправившим студентом
                        question: { connect: { id: question.id } },  // Связывание с конкретным вопросом
                        content: studentAnswer || '',                // Сохранение ответа
                    },
                });
            }

            // Возврат ответа с результатами
            return res.status(200).json({ score: totalScore, totalQuestions: test.questions.length });
        } catch (error) {
            console.error("Ошибка при отправке теста:", error.message);
            return res.status(500).json({ message: "Ошибка при отправке теста", error: error.message });
        }
    }
};

module.exports = UserController;
