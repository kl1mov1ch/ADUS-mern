const { prisma } = require("../prisma/prisma-client");
const { OpenAI } = require("openai");

const openai = new OpenAI({
    apiKey: process.env.CHAT_SECRET_KEY,
});

const imgUrlHost = process.env.AVATAR_URL_HOST || 'http://localhost:3000';

const TestsController = {
    testCreate: async (req, res) => {
        const { title, description, teacherId, categoryId, subcategoryId, questions } = req.body;
        console.log("Files:", req.files);
        console.log("Body:", req.body);
        const categoryIds = Array.isArray(categoryId) ? categoryId : JSON.parse(categoryId || '[]');
        const subcategoryIds = Array.isArray(subcategoryId) ? subcategoryId : JSON.parse(subcategoryId || '[]');
        const questionsData = Array.isArray(questions) ? questions : JSON.parse(questions || '[]');

        if (!teacherId) {
            return res.status(400).json({ message: "Teacher ID is required." });
        }

        if (!Array.isArray(questionsData) || questionsData.length === 0) {
            return res.status(400).json({ message: "Questions must be a non-empty array." });
        }

        if (!Array.isArray(subcategoryIds) || subcategoryIds.length === 0) {
            return res.status(400).json({ message: "Subcategory IDs must be a non-empty array." });
        }

        if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
            return res.status(400).json({ message: "Category IDs must be a non-empty array." });
        }

        const existingCategories = await prisma.category.findMany({
            where: { id: { in: categoryIds } },
            select: { id: true }
        });
        const existingCategoryIds = existingCategories.map(c => c.id);

        const existingSubcategories = await prisma.subcategory.findMany({
            where: { id: { in: subcategoryIds } },
            select: { id: true }
        });
        const existingSubcategoryIds = existingSubcategories.map(s => s.id);

        if (existingCategoryIds.length !== categoryIds.length) {
            return res.status(400).json({ message: "One or more categories do not exist." });
        }

        if (existingSubcategoryIds.length !== subcategoryIds.length) {
            return res.status(400).json({ message: "One or more subcategories do not exist." });
        }

        try {
            const teacher = await prisma.user.findUnique({
                where: { id: teacherId },
            });

            if (!teacher) {
                return res.status(404).json({ message: "Teacher not found." });
            }

            const newTest = await prisma.test.create({
                data: {
                    title,
                    description,
                    teacher: { connect: { id: teacherId } },
                    categories: {
                        create: existingCategoryIds.map(id => ({
                            category: { connect: { id } },
                        })),
                    },
                    subcategories: {
                        create: existingSubcategoryIds.map(id => ({
                            subcategory: { connect: { id } },
                        })),
                    },
                },
                include: { categories: true, subcategories: true },
            });

            for (let index = 0; index < questionsData.length; index++) {
                const question = questionsData[index];
                let imageUrl = null;

                const uploadedFile = req.files.find(file => file.fieldname === `questions[${index}][image]`);

                if (uploadedFile) {
                    imageUrl = `${imgUrlHost}/uploads/${uploadedFile.filename}`;
                }

                // Преобразуем correctAnswer в массив, если это не массив
                const parsedCorrectAnswer = Array.isArray(question.correctAnswer)
                  ? question.correctAnswer
                  : JSON.parse(question.correctAnswer || '[]'); // Преобразуем строку в массив

                // Преобразуем options в массив, если это не массив
                const parsedOptions = Array.isArray(question.options)
                  ? question.options
                  : JSON.parse(question.options || '[]'); // Преобразуем строку в массив

                await prisma.question.create({
                    data: {
                        text: question.text,
                        options: parsedOptions, // Сохраняем как массив
                        correctAnswer: parsedCorrectAnswer, // Сохраняем как массив
                        imageUrl,
                        test: { connect: { id: newTest.id } },
                    },
                });
            }

            return res.status(201).json(newTest);
        } catch (error) {
            console.error("Error creating test:", error);
            return res.status(500).json({ message: "Error creating test", error: error.message });
        }
    },

    testUpdate: async (req, res) => {
        const { testId } = req.params;
        const { title, description, teacherId, questions } = req.body;

        // Преобразуем строки обратно в массивы
        const categoryIds = JSON.parse(req.body.categoryIds);
        const subcategoryIds = JSON.parse(req.body.subcategoryIds);

        if (!teacherId) {
            return res.status(400).json({ message: "Teacher ID is required." });
        }

        try {
            const test = await prisma.test.findUnique({
                where: { id: testId },
                include: { categories: true, subcategories: true, questions: { include: { answers: true } } },
            });

            if (!Array.isArray(categoryIds) || !Array.isArray(subcategoryIds)) {
                return res.status(400).json({ message: "Category IDs and Subcategory IDs must be arrays." });
            }

            if (!test) {
                return res.status(404).json({ message: "Test not found." });
            }

            if (test.teacherId !== teacherId) {
                return res.status(403).json({ message: "Only the creator teacher can update this test." });
            }

            const categories = await prisma.category.findMany({
                where: { id: { in: categoryIds } },
            });
            if (categories.length !== categoryIds.length) {
                const missingCategoryIds = categoryIds.filter(id => !categories.some(cat => cat.id === id));
                return res.status(404).json({ message: "One or more categories not found.", missingCategoryIds });
            }

            const subcategories = await prisma.subcategory.findMany({
                where: { id: { in: subcategoryIds } },
            });
            if (subcategories.length !== subcategoryIds.length) {
                const missingSubcategoryIds = subcategoryIds.filter(id => !subcategories.some(sub => sub.id === id));
                return res.status(404).json({ message: "One or more subcategories not found.", missingSubcategoryIds });
            }

            // Удаляем старые ответы и вопросы
            await prisma.answer.deleteMany({
                where: {
                    question: {
                        testId,
                    },
                },
            });

            await prisma.question.deleteMany({
                where: { testId },
            });

            await prisma.testCategory.deleteMany({
                where: { testId },
            });

            await prisma.testSubcategory.deleteMany({
                where: { testId },
            });

            // Обработка загруженных файлов
            const files = req.files; // Загруженные файлы
            const updatedQuestions = questions.map((q, index) => {
                const imageFile = files.find(file => file.fieldname === `questions[${index}][image]`);
                return {
                    ...q,
                    imageUrl: imageFile ? `http://localhost:3000/uploads/${imageFile.filename}` : null, // Сохраняем путь к файлу
                    correctAnswer: Array.isArray(q.correctAnswer)
                      ? q.correctAnswer
                      : JSON.parse(q.correctAnswer || '[]'), // Преобразуем в массив, если это не массив
                    options: Array.isArray(q.options)
                      ? q.options
                      : JSON.parse(q.options || '[]'), // Преобразуем в массив, если это не массив
                };
            });

            const updatedTest = await prisma.test.update({
                where: { id: testId },
                data: {
                    title: title || test.title,
                    description: description || test.description,
                    categories: {
                        create: categories.map((category) => ({
                            category: { connect: { id: category.id } },
                        })),
                    },
                    subcategories: {
                        create: subcategories.map((subcategory) => ({
                            subcategory: { connect: { id: subcategory.id } },
                        })),
                    },
                    questions: {
                        create: updatedQuestions.map((q) => ({
                            text: q.text,
                            options: q.options,
                            correctAnswer: q.correctAnswer, // Всегда массив
                            imageUrl: q.imageUrl, // Путь к изображению
                            answers: {
                                create: q.answers?.map((answer) => ({
                                    content: answer.content,
                                    isCorrect: answer.isCorrect,
                                })),
                            },
                        })),
                    },
                },
                include: { questions: { include: { answers: true } }, categories: true, subcategories: true },
            });

            return res.status(200).json(updatedTest);
        } catch (error) {
            console.error("Error updating test:", error);
            return res.status(500).json({ message: "Error updating test", error: error.message });
        }
    },

    testDelete: async (req, res) => {
        const { testId } = req.params;

        try {
            const test = await prisma.test.findUnique({
                where: { id: testId },
                include: { subcategories: true },
            });

            if (!test) {
                return res.status(404).json({ error: "Test not found." });
            }

            await prisma.testCategory.deleteMany({
                where: { testId },
            });

            await prisma.testSubcategory.deleteMany({
                where: { testId },
            });

            await prisma.answer.deleteMany({
                where: {
                    question: {
                        testId: testId,
                    },
                },
            });

            await prisma.question.deleteMany({
                where: { testId },
            });

            await prisma.grade.deleteMany({
                where: { testId },
            });

            await prisma.testAssignment.deleteMany({
                where: { testId },
            });

            await prisma.test.delete({
                where: { id: testId },
            });

            res.status(200).json({ message: "Test deleted successfully." });
        } catch (error) {
            console.error("Error deleting test:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    },

    submitTest: async (req, res) => {
        const { testId, studentId, answers } = req.body;

        if (!testId || !studentId || !answers) {
            return res.status(400).json({ message: "Test ID, student ID, and answers are required." });
        }

        try {
            const test = await prisma.test.findUnique({
                where: { id: testId },
                include: { questions: true },
            });

            if (!test) {
                return res.status(404).json({ message: "Test not found." });
            }

            // Получаем classId для студента
            const userClass = await prisma.userClass.findFirst({
                where: { userId: studentId },
                select: { classId: true },
            });

            const classId = userClass?.classId || null; // Если classId нет, используем null

            let correctAnswersCount = 0;
            const answerRecords = [];

            for (const question of test.questions) {
                const studentAnswer = answers[question.id];
                const correctAnswer = Array.isArray(question.correctAnswer)
                  ? question.correctAnswer
                  : JSON.parse(question.correctAnswer || '[]'); // Преобразуем строку в массив

                let isCorrect = false;

                // Обработка studentAnswer в зависимости от его типа
                if (Array.isArray(studentAnswer)) {
                    // Если studentAnswer - массив, сравниваем массивы
                    isCorrect = studentAnswer.every(answer => correctAnswer.includes(answer));
                } else if (typeof studentAnswer === 'string') {
                    // Если studentAnswer - строка, очищаем от лишних кавычек и сравниваем
                    const cleanedStudentAnswer = studentAnswer.replace(/"/g, '');
                    const cleanedCorrectAnswer = correctAnswer.map(answer => answer.replace(/"/g, ''));
                    isCorrect = cleanedCorrectAnswer.includes(cleanedStudentAnswer);
                }

                if (isCorrect) {
                    correctAnswersCount++;
                }

                const content = Array.isArray(studentAnswer) ? studentAnswer.join(", ") : studentAnswer;

                answerRecords.push({
                    questionId: question.id,
                    studentId: studentId,
                    content: content,
                });
            }

            await prisma.answer.createMany({
                data: answerRecords,
            });

            const totalQuestions = test.questions.length;
            const percentage = ((correctAnswersCount / totalQuestions) * 100).toFixed(2);
            const mark = Math.round((correctAnswersCount / totalQuestions) * 10);

            const gradeRecord = await prisma.grade.create({
                data: {
                    value: mark,
                    student: { connect: { id: studentId } },
                    test: { connect: { id: testId } },
                },
            });

            // Создаем запись в TestAssignment с classId, если он есть
            await prisma.testAssignment.create({
                data: {
                    studentId: studentId,
                    testId: testId,
                    gradeId: gradeRecord.id,
                    completedAt: new Date(),
                    classId: classId, // Добавляем classId, если он есть
                },
            });

            res.status(200).json({ correctAnswersCount, percentage, mark });
        } catch (error) {
            console.error("Ошибка при обработке теста:", error);
            res.status(500).json({ message: "Ошибка при отправке теста" });
        }
    },

    generateTest: async (req, res) => {
        const { topic, numberOfQuestions, language, correctAnswersCount, optionsCount } = req.body;

        if (!topic  || !numberOfQuestions || !language || !correctAnswersCount || !optionsCount) {
            return res.status(400).json({ error: "Topic, number of questions, language, correct answers count, and options count are required." });
        }

        try {
            const prompt = `
            Generate a test on the topic of ${topic} with ${numberOfQuestions} questions. 
            Each question should have ${optionsCount} options and ${correctAnswersCount} correct answers.
            Return the questions in the following JSON format:
            [
                {
                    "text": "Question text",
                    "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
                    "correctAnswer": ["Option 1", "Option 2"]
                }
            ]
            The test should be in ${language} language.
        `;

            const completion = await openai.chat.completions.create({
                model: 'gpt-3.5-turbo',
                messages: [
                    { role: 'system', content: 'You are a helpful assistant that generates educational tests.' },
                    { role: 'user', content: prompt },
                ],
                temperature: 0.7,
                max_tokens: 2048,
            });

            const generatedTest = completion.choices[0].message.content;
            const parsedTest = JSON.parse(generatedTest);

            res.status(200).json({ test: parsedTest });
        } catch (error) {
            console.error('Error generating test:', error);
            res.status(500).json({ error: 'Error generating test' });
        }
    },

    assignTestToClass: async (req, res) => {
        const { testId } = req.params;
        const { classIds } = req.body;

        try {
            // Проверяем, существует ли тест
            const test = await prisma.test.findUnique({
                where: { id: testId },
            });

            if (!test) {
                return res.status(404).json({ message: "Тест не найден." });
            }

            // Проверяем, существуют ли классы
            const classes = await prisma.class.findMany({
                where: { id: { in: classIds } },
            });

            if (classes.length !== classIds.length) {
                return res.status(404).json({ message: "Один или несколько классов не найдены." });
            }

            // Проверяем, не назначен ли тест уже для этих классов
            const existingAssignments = await prisma.testAssignment.findMany({
                where: {
                    testId,
                    classId: { in: classIds },
                },
            });

            if (existingAssignments.length > 0) {
                const duplicateClasses = existingAssignments.map((assignment) => assignment.classId);
                return res.status(400).json({
                    message: "Тест уже назначен для следующих классов:",
                    duplicateClasses,
                });
            }

            // Находим всех студентов в указанных классах
            const studentsInClasses = await prisma.userClass.findMany({
                where: { classId: { in: classIds } },
                include: { user: true },
            });

            // Создаем назначения теста для каждого студента
            const assignments = await Promise.all(
              studentsInClasses.map(async (userClass) => {
                  return prisma.testAssignment.create({
                      data: {
                          testId,
                          studentId: userClass.userId,
                          classId: userClass.classId,
                      },
                  });
              })
            );

            // Возвращаем созданные назначения
            return res.status(200).json(assignments);
        } catch (error) {
            console.error("Ошибка при назначении теста классам:", error);
            return res.status(500).json({ message: "Ошибка при назначении теста классам", error: error.message });
        }
    },

    removeTestAssignment: async (req, res) => {
        const { testId, classId } = req.params;

        try {
            // Удаляем все назначения теста для указанного класса
            await prisma.testAssignment.deleteMany({
                where: {
                    testId,
                    classId,
                },
            });

            return res.status(200).json({ message: "Назначение успешно удалено." });
        } catch (error) {
            console.error("Ошибка при удалении назначения:", error);
            return res.status(500).json({ message: "Ошибка при удалении назначения" });
        }
    },

    toggleTestVisibility: async (req, res) => {
        const { testId } = req.params;

        try {
            const test = await prisma.test.findUnique({
                where: { id: testId },
            });

            if (!test) {
                return res.status(404).json({ message: "Test not found." });
            }

            const updatedTest = await prisma.test.update({
                where: { id: testId },
                data: {
                    isHidden: !test.isHidden,
                },
            });

            return res.status(200).json(updatedTest);
        } catch (error) {
            console.error("Error toggling test visibility:", error);
            return res.status(500).json({ message: "Error toggling test visibility", error: error.message });
        }
    },

}

module.exports = TestsController;
