import { Input, Textarea, Button, Checkbox } from "@nextui-org/react";
import { useForm, useFieldArray } from "react-hook-form";
import React, { useState, useEffect } from "react";
import { useCreateTestMutation, useCurrentUser } from "../../app/services/userApi";

type Question = {
    text: string;
    options: string[];
    correctAnswer: string[];
};

type TestForm = {
    title: string;
    description: string;
    teacherId: string;
    questions: Question[];
};

export const CreateTest = () => {
    const { control, handleSubmit, register, watch, setValue, formState: { errors } } = useForm<TestForm>({
        defaultValues: {
            title: "",
            description: "",
            teacherId: "",
            questions: [{ text: "", options: [""], correctAnswer: [] }], // Default to one question with one option
        },
    });

    const { fields, append, remove, update } = useFieldArray({ control, name: "questions" });
    const { teacherId } = useCurrentUser();
    const [createTest, { isLoading, error }] = useCreateTestMutation();
    const [successMessage, setSuccessMessage] = useState("");

    const questions = watch("questions");

    // Watch input values and ensure they persist after changes
    useEffect(() => {
        questions.forEach((question, index) => {
            setValue(`questions.${index}.text`, question.text);
            question.options.forEach((option, optionIndex) => {
                setValue(`questions.${index}.options.${optionIndex}`, option);
            });
        });
    }, [questions, setValue]);

    const onSubmit = async (data: TestForm) => {
        if (!teacherId) {
            console.error("teacherId is undefined");
            return;
        }

        const formattedQuestions = data.questions.map((question) => ({
            ...question,
            correctAnswer: Array.isArray(question.correctAnswer) ? question.correctAnswer : [],
        }));

        const testData = { ...data, teacherId, questions: formattedQuestions };

        console.log("Отправляемые данные на сервер:", JSON.stringify(testData, null, 2));

        try {
            await createTest(testData).unwrap();
            setSuccessMessage("Тест успешно создан!");
        } catch (err) {
            console.error("Ошибка при создании теста", err);
        }
    };

    const getErrorMessage = (error: any) => {
        if ("status" in error) {
            return `Ошибка: ${error.data ? JSON.stringify(error.data) : 'Неизвестная ошибка.'}`;
        }
        if ("message" in error) {
            return `Ошибка: ${error.message}`;
        }
        return "Неизвестная ошибка.";
    };

    return (
        <form className="flex flex-col gap-6 p-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="font-bold text-xl mb-4">Создание теста</div>

            {/* Поле для названия теста */}
            <div className="flex flex-col w-1/2 items-start">
                <Input
                    label="Название теста"
                    {...register("title", { required: "Это поле обязательно" })}
                    placeholder="Введите название теста"
                    size="sm"
                    width="100%"
                />
                {errors.title && <span className="text-red-600">{errors.title.message}</span>}
            </div>

            {/* Поле для описания теста */}
            <div className="flex flex-col w-1/2 items-start">
                <Textarea
                    label="Описание теста"
                    {...register("description")}
                    placeholder="Введите описание теста"
                    size="sm"
                    width="100%"
                />
            </div>

            {/* Список вопросов */}
            {fields.map((item, index) => (
                <div key={item.id} className="border p-4 mb-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                        <span className="font-bold">Вопрос {index + 1}</span>
                        <Button color="primary" onClick={() => remove(index)}>Удалить вопрос</Button>
                    </div>

                    <Input
                        label="Текст вопроса"
                        {...register(`questions.${index}.text`, { required: "Это поле обязательно" })}
                        placeholder="Введите текст вопроса"
                        size="sm"
                        width="100%"
                    />
                    {errors.questions?.[index]?.text && <span className="text-red-600">{errors.questions[index].text.message}</span>}

                    <div className="flex flex-col gap-2 mt-2">
                        <div className="flex justify-between items-center">
                            <span className="font-bold">Варианты ответов:</span>
                            <Button size="sm" onClick={() => {
                                const updatedQuestions = [...fields];
                                updatedQuestions[index].options.push(""); // Добавляем пустой вариант
                                update(index, { ...updatedQuestions[index] }); // Обновление вопросов
                            }}>
                                Добавить вариант
                            </Button>
                        </div>

                        {item.options.map((option, optionIndex) => (
                            <div key={optionIndex} className="flex items-center gap-2">
                                <Input
                                    {...register(`questions.${index}.options.${optionIndex}`, { required: "Это поле обязательно" })}
                                    placeholder={`Вариант ${optionIndex + 1}`}
                                    size="sm"
                                    width="100%"
                                />
                                <Button color="primary" onClick={() => {
                                    const updatedOptions = item.options.filter((_, idx) => idx !== optionIndex);
                                    update(index, { ...item, options: updatedOptions }); // Обновление вариантов
                                }}>Удалить</Button>

                                <Checkbox
                                    isSelected={item.correctAnswer.includes(item.options[optionIndex])}
                                    onChange={() => {
                                        const updatedCorrectAnswers = item.correctAnswer.includes(item.options[optionIndex])
                                            ? item.correctAnswer.filter(ans => ans !== item.options[optionIndex])
                                            : [...item.correctAnswer, item.options[optionIndex]];

                                        update(index, { ...item, correctAnswer: updatedCorrectAnswers, options: item.options }); // Обновление правильного ответа
                                    }}
                                >
                                    Правильный ответ
                                </Checkbox>
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            <Button
                size="sm"
                color="primary"
                onClick={() => append({ text: "", options: [""], correctAnswer: [] })} // Append a new question
            >
                Добавить новый вопрос
            </Button>

            <Button type="submit" color="primary" disabled={isLoading}>Создать тест</Button>
            {isLoading && <p>Создание теста...</p>}
            {successMessage && <p className="text-green-600">{successMessage}</p>}
            {error && <p className="text-red-600">{getErrorMessage(error)}</p>}
        </form>
    );
};
