const { prisma } = require("../prisma/prisma-client");

const UserController = {
    getTests: async (req, res) => {
        try {
            const tests = await prisma.test.findMany({
                include: { questions: true },
            });
            return res.status(200).json(tests);
        } catch (error) {
            console.error("Ошибка при получении тестов:", error);
            return res.status(500).json({ message: "Ошибка при получении тестов" });
        }
    },

    submitTest: async (req, res) => {
        const { testId } = req.params; // Извлечение testId из параметров запроса
        const { studentId, answers } = req.body; // Извлечение studentId и ответов из тела запроса

        // Проверка, что studentId предоставлен
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
