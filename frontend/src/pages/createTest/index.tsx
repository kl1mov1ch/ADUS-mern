//@ts-nocheck
import { Input, Textarea, Button, Checkbox, Card, Chip, Select, SelectItem, Drawer, Image } from "@nextui-org/react"
import { useForm, useFieldArray } from "react-hook-form";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCreateTestMutation, useCurrentUser, useGetAllCategoriesQuery, useGenerateTestMutation } from "../../app/services/userApi";
import { MdDeleteForever } from "react-icons/md";
import { RiCloseFill } from "react-icons/ri";
import { CgPlayListAdd } from "react-icons/cg";
import { InlineMath } from "react-katex";
import "katex/dist/katex.min.css";

type Question = {
    text: string;
    options: string[];
    correctAnswer: string[];
    image?: File | null;
};

type TestForm = {
    title: string;
    description: string;
    teacherId: string;
    categoryId: string[];
    subcategoryId: string[];
    questions: Question[];
    language: string;
    correctAnswersCount: number;
    optionsCount: number;
    numberOfQuestions: number;
    difficulty: string;
};

export const CreateTest = () => {
    const { control, handleSubmit, register, watch, setValue, formState: { errors } } = useForm<TestForm>({
        defaultValues: {
            title: "",
            description: "",
            teacherId: "",
            categoryId: "",
            subcategoryId: [],
            questions: [{ text: "", options: [""], correctAnswer: [] }],
            language: "russian",
            correctAnswersCount: 1,
            optionsCount: 4,
            numberOfQuestions: 5,
            difficulty: "medium",
        },
    });

    const { fields, append, remove, update } = useFieldArray({ control, name: "questions" });
    const { teacherId } = useCurrentUser();
    const { data: categories = [] } = useGetAllCategoriesQuery();
    const [createTest, { isLoading: isCreating }] = useCreateTestMutation();
    const [generateTest, { isLoading: isGenerating }] = useGenerateTestMutation();
    const [successMessage, setSuccessMessage] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string>("");
    const [showSuccessAlert, setShowSuccessAlert] = useState(false);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number | null>(null);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [previewImages, setPreviewImages] = useState<string[]>([]);
    const questions = watch("questions");
    const language = watch("language");
    const correctAnswersCount = watch("correctAnswersCount");
    const optionsCount = watch("optionsCount");
    const numberOfQuestions = watch("numberOfQuestions");
    const difficulty = watch("difficulty");

    useEffect(() => {
        const savedData = localStorage.getItem("testFormData");
        if (savedData) {
            const parsedData = JSON.parse(savedData);
            Object.keys(parsedData).forEach((key) => {
                setValue(key as keyof TestForm, parsedData[key]);
            });
        }
    }, [setValue]);

    useEffect(() => {
        const subscription = watch((value) => {
            if (value) {
                localStorage.setItem("testFormData", JSON.stringify(value));
            }
        });
        return () => subscription.unsubscribe();
    }, [watch]);

    const onSubmit = async (data: TestForm) => {
        if (!teacherId) {
            console.error("teacherId is undefined");
            return;
        }

        const formData = new FormData();

        formData.append("title", data.title);
        formData.append("description", data.description);
        formData.append("teacherId", teacherId);
        formData.append("categoryId", JSON.stringify(data.categoryId));
        formData.append("subcategoryId", JSON.stringify(data.subcategoryId));
        formData.append("language", data.language);
        formData.append("correctAnswersCount", data.correctAnswersCount.toString());
        formData.append("optionsCount", data.optionsCount.toString());
        formData.append("numberOfQuestions", data.numberOfQuestions.toString());
        formData.append("difficulty", data.difficulty);

        data.questions.forEach((question, index) => {
            formData.append(`questions[${index}][text]`, question.text);
            formData.append(`questions[${index}][options]`, JSON.stringify(question.options));
            formData.append(`questions[${index}][correctAnswer]`, JSON.stringify(
              Array.isArray(question.correctAnswer)
                ? question.correctAnswer
                : [question.correctAnswer] // Преобразуем в массив, если это не массив
            ));

            if (question.image) {
                if (question.image instanceof File || question.image instanceof Blob) {
                    formData.append(`questions[${index}][image]`, question.image, question.image.name);
                } else {
                    console.error(`Некорректный тип изображения для вопроса ${index + 1}:`, question.image);
                }
            } else {
                console.warn(`Изображение для вопроса ${index + 1} отсутствует.`);
            }
        });

        try {
            const result = await createTest(formData).unwrap();
            console.log(result);
            setSuccessMessage("Тест успешно создан!");
            setShowSuccessAlert(true);
            localStorage.removeItem("testFormData");

            setTimeout(() => {
                setShowSuccessAlert(false);
            }, 3000);
        } catch (error) {
            console.error("Ошибка при создании теста:", error);
        }
    };

    const handleGenerateTest = async () => {
        const topic = watch("title");
        const selectedLanguage = watch("language");

        if (!topic || !selectedLanguage) {
            alert("Пожалуйста, введите название теста и выберите язык.");
            return;
        }

        try {
            const result = await generateTest({
                topic,
                language: selectedLanguage,
                difficulty,
                numberOfQuestions,
                correctAnswersCount,
                optionsCount,
            }).unwrap();

            // Преобразуем correctAnswer в массив строк
            const formattedQuestions = result.test.map((question) => ({
                ...question,
                correctAnswer: Array.isArray(question.correctAnswer)
                  ? question.correctAnswer
                  : [question.correctAnswer], 
            }));

            setValue("questions", formattedQuestions);
        } catch (error) {
            console.error("Ошибка при генерации теста:", error);
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

    const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const categoryId = e.target.value;
        setSelectedCategory(categoryId);
        setValue("categoryId", categoryId);
        setValue("subcategoryId", []);
    };

    const handleSubcategoryChange = (subcategoryId: string) => {
        const currentSubcategories = watch("subcategoryId") || [];
        const updatedSubcategories = currentSubcategories.includes(subcategoryId)
          ? currentSubcategories.filter((id) => id !== subcategoryId)
          : [...currentSubcategories, subcategoryId];

        setValue("subcategoryId", updatedSubcategories);
    };

    const handleImageChange = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) {
            console.error("Файл не выбран.");
            return;
        }

        if (!file.type.startsWith('image/')) {
            console.error("Загруженный файл не является изображением.");
            return;
        }

        console.log(`Изображение для вопроса ${index + 1} успешно выбрано:`, file);

        const updatedQuestions = [...fields];
        updatedQuestions[index].image = file;
        update(index, { ...updatedQuestions[index] });

        const previewUrl = URL.createObjectURL(file);
        setPreviewImages(prev => {
            const newPreviews = [...prev];
            newPreviews[index] = previewUrl;
            return newPreviews;
        });
    };

    const handleAddOption = (index: number) => {
        const updatedQuestions = [...fields];
        updatedQuestions[index].options.push("");
        update(index, { ...updatedQuestions[index] });
    };

    const handleRemoveOption = (index: number, optionIndex: number) => {
        const updatedOptions = fields[index].options.filter((_, idx) => idx !== optionIndex);
        update(index, { ...fields[index], options: updatedOptions });
    };

    const handleCorrectAnswerChange = (index: number, optionIndex: number) => {
        const question = fields[index];
        const option = question.options[optionIndex];
        const updatedCorrectAnswers = question.correctAnswer.includes(option)
          ? question.correctAnswer.filter((ans) => ans !== option)
          : [...question.correctAnswer, option];

        update(index, {
            ...question,
            correctAnswer: updatedCorrectAnswers,
        });
    };

    return (
      <form className="flex flex-col gap-6 p-4" onSubmit={handleSubmit(onSubmit)}>
          <h1 className="text-xl font-bold mb-4">Создание теста</h1>
          <motion.div
            initial="hidden"
            animate="visible"
            exit="exit"
            className="flex flex-col items-start"
          >
              <Input
                label="Название теста"
                {...register("title", { required: "Это поле обязательно" })}
                placeholder="Введите название теста"
                width="100%"
              />
              {errors.title && <span className="text-red-600">{errors.title.message}</span>}
          </motion.div>
          <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex flex-col gap-6 w-full lg:w-1/2">
                  <motion.div
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="flex flex-col items-start"
                  >
                      <Textarea
                        label="Описание теста"
                        {...register("description")}
                        placeholder="Введите описание теста"
                        width="100%"
                      />
                  </motion.div>

                  <motion.div
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="flex flex-col items-start"
                  >
                      <label className="font-semibold">Категория</label>
                      <Select
                        label="Категории"
                        selectionMode="multiple"
                        selectedKeys={Array.isArray(watch("categoryId")) ? watch("categoryId") : []}
                        onSelectionChange={(keys) => {
                            const selectedKeysArray = Array.from(keys) as string[];
                            setValue("categoryId", selectedKeysArray);
                            setSelectedCategories(selectedKeysArray);
                            setValue("subcategoryId", []);
                        }}
                      >
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                                {category.name}
                            </SelectItem>
                          ))}
                      </Select>

                      {errors.categoryId && <span>{errors.categoryId.message}</span>}

                      {selectedCategories.length > 0 && (
                        <div className="mt-4">
                            <h3 className="font-semibold mb-2">Выберите подкатегории:</h3>
                            <div className="flex flex-wrap gap-2">
                                {selectedCategories.map((categoryId) => {
                                    const category = categories.find((cat) => cat.id === categoryId);
                                    return category?.subcategories?.map((subcategory) => (
                                      <Chip
                                        key={subcategory.id}
                                        color={watch("subcategoryId")?.includes(subcategory.id) ? "primary" : "default"}
                                        onClick={() => handleSubcategoryChange(subcategory.id)}
                                        className="cursor-pointer"
                                      >
                                          {subcategory.name}
                                      </Chip>
                                    ));
                                })}
                            </div>
                        </div>
                      )}
                      {errors.subcategoryId && <span className="text-red-600">{errors.subcategoryId.message}</span>}
                  </motion.div>
              </div>

              <div className="flex flex-col gap-6 w-full lg:w-1/2">
                  <motion.div
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="flex flex-col items-start"
                  >
                      <Select
                        label="Язык теста"
                        {...register("language", { required: "Выберите язык" })}
                        defaultSelectedKeys={["russian"]}
                      >
                          <SelectItem key="russian" value="russian">Русский</SelectItem>
                          <SelectItem key="english" value="english">Английский</SelectItem>
                          <SelectItem key="german" value="german">Немецкий</SelectItem>
                          <SelectItem key="belarusian" value="belarusian">Белорусский</SelectItem>
                      </Select>
                      {errors.language && <span className="text-red-600">{errors.language.message}</span>}
                  </motion.div>

                  <motion.div
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="flex flex-col items-start"
                  >
                      <Input
                        label="Количество вопросов"
                        type="number"
                        {...register("numberOfQuestions", { required: "Это поле обязательно", min: 1 })}
                        placeholder="Введите количество вопросов"
                        width="100%"
                      />
                      {errors.numberOfQuestions &&
                        <span className="text-red-600">{errors.numberOfQuestions.message}</span>}
                  </motion.div>

                  <motion.div
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="flex flex-col items-start"
                  >
                      <Input
                        label="Количество правильных ответов"
                        type="number"
                        {...register("correctAnswersCount", { required: "Это поле обязательно", min: 1 })}
                        placeholder="Введите количество правильных ответов"
                        width="100%"
                      />
                      {errors.correctAnswersCount &&
                        <span className="text-red-600">{errors.correctAnswersCount.message}</span>}
                  </motion.div>

                  <motion.div
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="flex flex-col items-start"
                  >
                      <Input
                        label="Количество вариантов ответов"
                        type="number"
                        {...register("optionsCount", { required: "Это поле обязательно", min: 2 })}
                        placeholder="Введите количество вариантов ответов"
                        width="100%"
                      />
                      {errors.optionsCount && <span className="text-red-600">{errors.optionsCount.message}</span>}
                  </motion.div>

                  <Button
                    color="danger"
                    onClick={handleGenerateTest}
                    disabled={isGenerating}
                  >
                      {isGenerating ? "Генерация теста..." : "Сгенерировать тест"}
                  </Button>
              </div>
          </div>

          <AnimatePresence>
              {fields.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="mb-4 w-full"
                >
                    <Card className="p-4">
                        <div className="flex justify-between items-center mb-2">
                            <span className="font-bold">Вопрос {index + 1}</span>
                            <RiCloseFill
                              onClick={() => remove(index)}
                              className="w-7 h-7 cursor-pointer transition-transform transform hover:scale-110"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <Input
                              label="Текст вопроса"
                              {...register(`questions.${index}.text`, { required: "Это поле обязательно" })}
                              placeholder="Введите текст вопроса"
                              width="100%"
                            />
                            {errors.questions?.[index]?.text && (
                              <span className="text-red-600">{errors.questions[index].text.message}</span>
                            )}
                            {/*/!* Отображение формулы в реальном времени *!/*/}
                            {/*<div className="mt-2">*/}
                            {/*    <InlineMath>{item.text}</InlineMath>*/}
                            {/*</div>*/}
                        </div>
                        <div className="flex flex-col gap-2 mt-2">
                            <div className="flex justify-between items-center">
                                <span className="font-bold">Загрузка изображения:</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <Button
                                  as="label"
                                  htmlFor={`image-upload-${index}`}
                                  color="primary"
                                  variant="bordered"
                                  className="cursor-pointer"
                                >
                                    Загрузить изображение
                                </Button>
                                <input
                                  id={`image-upload-${index}`}
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleImageChange(index, e)}
                                  className="hidden"
                                />
                                {previewImages[index] && (
                                  <Image
                                    src={previewImages[index]}
                                    alt="Preview"
                                    className='size-80 border-3'
                                  />
                                )}
                            </div>
                        </div>
                        <div className="flex flex-col gap-2 mt-2">
                            <div className="flex justify-between items-center">
                                <span className="font-bold">Варианты ответов:</span>
                                <CgPlayListAdd
                                  className="w-7 h-7 cursor-pointer transition-transform transform hover:scale-110"
                                  onClick={() => handleAddOption(index)}
                                />
                            </div>

                            <AnimatePresence>
                                {item.options.map((option, optionIndex) => (
                                  <motion.div
                                    key={optionIndex}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    className="flex items-center gap-2"
                                  >
                                      <Input
                                        {...register(`questions.${index}.options.${optionIndex}`, { required: "Это поле обязательно" })}
                                        placeholder={`Вариант ${optionIndex + 1}`}
                                        width="100%"
                                      />
                                      <MdDeleteForever
                                        className="w-7 h-7 cursor-pointer transition-transform transform hover:scale-110"
                                        onClick={() => handleRemoveOption(index, optionIndex)}
                                      />

                                      <Checkbox
                                        isSelected={item.correctAnswer.includes(item.options[optionIndex])}
                                        onChange={() => handleCorrectAnswerChange(index, optionIndex)}
                                      >
                                          <p>Ответ</p>
                                      </Checkbox>
                                  </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </Card>
                </motion.div>
              ))}
          </AnimatePresence>

          <div className="flex justify-between w-full">
              <Button
                color="primary"
                onClick={() => append({ text: "", options: [""], correctAnswer: [] })}
                className="flex items-center"
              >
                  Новый вопрос
                  <CgPlayListAdd className="w-5 h-5 ml-2" />
              </Button>

              <Button type="submit" color="success" disabled={isCreating}>
                  Создать тест
              </Button>
          </div>
          {isCreating && <p>Создание теста...</p>}
          {errors.root && <p className="text-red-600">{getErrorMessage(errors.root)}</p>}

          <AnimatePresence>
              {showSuccessAlert && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.3 }}
                  className="fixed bottom-4 right-4 bg-green-500 text-white p-4 rounded-lg shadow-lg"
                >
                    <p>Тест успешно создан!</p>
                </motion.div>
              )}
          </AnimatePresence>
      </form>
    );
};