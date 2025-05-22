//@ts-nocheck
import { Input, Textarea, Button, Checkbox, Card, Chip, Select, SelectItem, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Image, Divider, Spacer, Progress, CardHeader,CardBody,CardFooter, Spinner  } from "@nextui-org/react";
import { useForm, useFieldArray } from "react-hook-form";
import React, { useState, useEffect } from "react";
import { useCreateTestMutation, useCurrentUser, useGetAllCategoriesQuery, useGenerateTestMutation, useGenerateTestFromFileMutation } from "../../app/services/userApi";
import { MdDeleteForever, MdAddPhotoAlternate } from "react-icons/md";
import { RiCloseFill } from "react-icons/ri";
import { CgPlayListAdd } from "react-icons/cg";
import { FiSettings, FiPlus, FiCheck, FiUpload  } from "react-icons/fi";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaCheckCircle, FaTimesCircle, FaInfoCircle } from 'react-icons/fa';

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
    generationTopic: string; // Добавляем новое поле
};

export const CreateTest = () => {
    const { control, handleSubmit, register, watch, setValue, formState: { errors }, trigger } = useForm<TestForm>({
        defaultValues: {
            title: "",
            description: "",
            teacherId: "",
            categoryId: [],
            subcategoryId: [],
            questions: [{ text: "", options: [""], correctAnswer: [] }],
            language: "russian",
            correctAnswersCount: 1,
            optionsCount: 4,
            numberOfQuestions: 5,
            difficulty: "medium",
            generationTopic: "",
        },
        mode: "onBlur",
    });

    const { fields, append, remove, update } = useFieldArray({
        control,
        name: "questions",
        rules: {
            minLength: {
                value: 1,
                message: "Должен быть хотя бы один вопрос"
            }
        }
    });

    const { teacherId } = useCurrentUser();
    const { data: categories = [] } = useGetAllCategoriesQuery();
    const [createTest, { isLoading: isCreating }] = useCreateTestMutation();
    const [generateTest, { isLoading: isGenerating }] = useGenerateTestMutation();
    const [successMessage, setSuccessMessage] = useState("");
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [previewImages, setPreviewImages] = useState<string[]>([]);
    const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
    const [isFileGeneratorOpen, setIsFileGeneratorOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [generateTestFromFile] = useGenerateTestFromFileMutation();

    // Watch values
    const { language, correctAnswersCount, optionsCount, numberOfQuestions, difficulty } = watch();

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
            localStorage.setItem("testFormData", JSON.stringify(value));
        });
        return () => subscription.unsubscribe();
    }, [watch]);

    const validateForm = async () => {
        const isValid = await trigger();

        if (!isValid) {
            // Показываем общее сообщение об ошибке
            toast.error("Пожалуйста, заполните все обязательные поля правильно", {
                position: "top-center",
                autoClose: 5000,
            });

            // Показываем конкретные ошибки
            if (errors.title) {
                toast.error(errors.title.message, { position: "top-right" });
            }
            if (errors.categoryId) {
                toast.error(errors.categoryId.message, { position: "top-right" });
            }
            if (errors.subcategoryId) {
                toast.error(errors.subcategoryId.message, { position: "top-right" });
            }
            if (errors.questions) {
                if (errors.questions.message) {
                    toast.error(errors.questions.message, { position: "top-right" });
                } else {
                    toast.error("Проверьте все вопросы на ошибки", { position: "top-right" });
                }
            }

            // Проверяем ошибки в вопросах
            fields.forEach((_, index) => {
                if (errors.questions?.[index]?.text) {
                    toast.error(`Вопрос ${index + 1}: ${errors.questions[index]?.text?.message}`, {
                        position: "top-right",
                    });
                }

                const optionErrors = errors.questions?.[index]?.options;
                if (optionErrors) {
                    Object.keys(optionErrors).forEach(optIndex => {
                        if (optionErrors[optIndex]) {
                            toast.error(
                              `Вопрос ${index + 1}, вариант ${+optIndex + 1}: ${optionErrors[optIndex]?.message}`,
                              { position: "top-right" }
                            );
                        }
                    });
                }

                if (errors.questions?.[index]?.correctAnswer) {
                    toast.error(
                      `Вопрос ${index + 1}: ${errors.questions[index]?.correctAnswer?.message}`,
                      { position: "top-right" }
                    );
                }
            });
        }

        return isValid;
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleGenerateFromFile = async () => {
        if (!selectedFile) {
            toast.error("Пожалуйста, выберите файл");
            return;
        }

        try {
            const result = await generateTestFromFile({
                file: selectedFile,
                language,
                difficulty,
                numberOfQuestions,
                correctAnswersCount,
                optionsCount,
            }).unwrap();

            setValue("questions", result.test);
            setValue("title", `Тест по файлу: ${selectedFile.name}`);
            setIsFileGeneratorOpen(false);
            toast.success("Тест успешно сгенерирован из файла!");
        } catch (error) {
            console.error("Error generating test from file:", error);
            toast.error("Ошибка при генерации теста из файла");
        }
    };

    const onSubmit = async (data: TestForm) => {
        if (!teacherId) {
            toast.error("Не удалось определить идентификатор преподавателя");
            return;
        }

        const isValid = await validateForm();
        if (!isValid) return;

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
              Array.isArray(question.correctAnswer) ? question.correctAnswer : [question.correctAnswer]
            ));

            if (question.image instanceof File || question.image instanceof Blob) {
                formData.append(`questions[${index}][image]`, question.image, question.image.name);
            }
        });

        try {
            await createTest(formData).unwrap();
            setSuccessMessage("Тест успешно создан!");
            toast.success("Тест успешно создан!", {
                position: "top-center",
                autoClose: 5000,
            });
            localStorage.removeItem("testFormData");
        } catch (error) {
            console.error("Error creating test:", error);
            toast.error("Ошибка при создании теста", {
                position: "top-center",
                autoClose: 5000,
            });
        }
    };

    const handleGenerateTest = async () => {
        const topic = watch("generationTopic");
        if (!topic) {
            toast.error("Введите тему для генерации теста", {
                position: "top-center",
            });
            return;
        }

        try {
            const result = await generateTest({
                topic,
                language,
                difficulty,
                numberOfQuestions,
                correctAnswersCount,
                optionsCount,
            }).unwrap();

            const formattedQuestions = result.test.map((question) => ({
                ...question,
                correctAnswer: Array.isArray(question.correctAnswer)
                  ? question.correctAnswer
                  : [question.correctAnswer],
            }));

            setValue("questions", formattedQuestions);
            setValue("title", `Тест по теме: ${topic}`);
            setIsGeneratorOpen(false);
            toast.success("Тест успешно сгенерирован!", {
                position: "top-center",
            });
        } catch (error) {
            console.error("Error generating test:", error);
            toast.error("Ошибка при генерации теста", {
                position: "top-center",
            });
        }
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
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error("Пожалуйста, загружайте только изображения", {
                position: "top-right",
            });
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error("Размер изображения не должен превышать 5MB", {
                position: "top-right",
            });
            return;
        }

        const updatedQuestions = [...fields];
        updatedQuestions[index].image = file;
        update(index, { ...updatedQuestions[index] });

        const previewUrl = URL.createObjectURL(file);
        setPreviewImages(prev => [...prev.slice(0, index), previewUrl, ...prev.slice(index + 1)]);
    };

    const handleAddOption = (index: number) => {
        const updatedQuestions = [...fields];
        updatedQuestions[index].options.push("");
        update(index, { ...updatedQuestions[index] });
    };

    const handleRemoveOption = (index: number, optionIndex: number) => {
        const question = fields[index];
        if (question.options.length <= 2) {
            toast.warning("Должно быть минимум 2 варианта ответа", {
                position: "top-right",
            });
            return;
        }

        const updatedOptions = question.options.filter((_, idx) => idx !== optionIndex);
        const updatedCorrectAnswers = question.correctAnswer.filter(
          ans => ans !== question.options[optionIndex]
        );

        update(index, {
            ...question,
            options: updatedOptions,
            correctAnswer: updatedCorrectAnswers
        });
    };

    const handleCorrectAnswerChange = (index: number, optionIndex: number) => {
        const question = fields[index];
        const option = question.options[optionIndex];

        // Проверяем, что вариант ответа не пустой
        if (!option.trim()) {
            toast.error("Сначала заполните вариант ответа", {
                position: "top-right",
            });
            return;
        }

        const updatedCorrectAnswers = question.correctAnswer.includes(option)
          ? question.correctAnswer.filter((ans) => ans !== option)
          : [...question.correctAnswer, option];

        update(index, { ...question, correctAnswer: updatedCorrectAnswers });
    };

    const validateCorrectAnswers = (index: number) => {
        const question = fields[index];
        if (question.correctAnswer.length === 0) {
            toast.error(`Вопрос ${index + 1}: должен быть хотя бы один правильный ответ`, {
                position: "top-right",
            });
            return false;
        }
        return true;
    };

    const validateQuestionOptions = (index: number) => {
        const question = fields[index];
        const options = question.options;

        // Проверяем, что есть хотя бы 2 варианта ответа
        if (options.length < 2) {
            toast.error(`Вопрос ${index + 1}: должно быть минимум 2 варианта ответа`, {
                position: "top-right",
            });
            return false;
        }

        // Проверяем, что все варианты заполнены
        for (let i = 0; i < options.length; i++) {
            if (!options[i].trim()) {
                toast.error(`Вопрос ${index + 1}, вариант ${i + 1}: не может быть пустым`, {
                    position: "top-right",
                });
                return false;
            }
        }

        // Проверяем на уникальность вариантов
        const uniqueOptions = new Set(options.map(opt => opt.trim().toLowerCase()));
        if (uniqueOptions.size !== options.length) {
            toast.error(`Вопрос ${index + 1}: варианты ответов должны быть уникальными`, {
                position: "top-right",
            });
            return false;
        }

        return true;
    };

    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
          <ToastContainer
            position="top-center"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="colored"
          />

          <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Создать тест
              </h1>
              <div className="flex justify-end">
                  <Button
                    color="primary"
                    onClick={() => setIsGeneratorOpen(true)}
                    startContent={<FiSettings className="text-lg" />}
                    size="lg"
                    className="bg-gradient-to-r mr-2 from-blue-500 to-purple-500 text-white"
                  >
                      Сгенерировать тест
                  </Button>
                  <Button
                    color="primary"
                    onClick={() => setIsFileGeneratorOpen(true)}
                    startContent={<FiUpload className="text-lg" />}
                    size="lg"
                    className="bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                  >
                      Сгенерировать из файла
                  </Button>
              </div>
          </div>

          <Modal isOpen={isFileGeneratorOpen} onClose={() => setIsFileGeneratorOpen(false)} size="xl">
              <ModalContent>
                  <ModalHeader className="bg-gradient-to-r from-blue-500 to-purple-500">
                      <h2 className="text-xl font-semibold text-white">Генерация теста из файла</h2>
                  </ModalHeader>
                  <Divider />
                  <ModalBody className="p-6 gap-4">
                      <div className="space-y-6">
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                              <input
                                type="file"
                                id="file-upload"
                                accept=".pdf,.docx"
                                onChange={handleFileChange}
                                className="hidden"
                              />
                              <label
                                htmlFor="file-upload"
                                className="cursor-pointer flex flex-col items-center justify-center gap-2"
                              >
                                  <FiUpload className="text-3xl text-blue-500" />
                                  <span className="font-medium">
                            {selectedFile ? selectedFile.name : "Выберите PDF или DOCX файл"}
                        </span>
                                  <span className="text-sm text-gray-500">
                            Максимальный размер: 10MB
                        </span>
                              </label>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                              <Select
                                label="Язык"
                                value={language}
                                onChange={(e) => setValue("language", e.target.value)}
                                defaultSelectedKeys={["russian"]}
                                size="sm"
                                variant="bordered"
                                radius="sm"
                              >
                                  <SelectItem key="russian" value="russian">Русский</SelectItem>
                                  <SelectItem key="english" value="english">Английский</SelectItem>
                              </Select>

                              <Select
                                label="Сложность"
                                value={difficulty}
                                onChange={(e) => setValue("difficulty", e.target.value)}
                                defaultSelectedKeys={["medium"]}
                                size="sm"
                                variant="bordered"
                                radius="sm"
                              >
                                  <SelectItem key="easy" value="easy">Легко</SelectItem>
                                  <SelectItem key="medium" value="medium">Средне</SelectItem>
                                  <SelectItem key="hard" value="hard">Сложно</SelectItem>
                              </Select>
                          </div>

                          <div className="grid grid-cols-3 gap-4">
                              <Input
                                label="Кол-во вопросов"
                                type="number"
                                value={numberOfQuestions}
                                onChange={(e) => setValue("numberOfQuestions", parseInt(e.target.value))}
                                size="sm"
                                variant="bordered"
                                radius="sm"
                                min={1}
                                max={50}
                              />
                              <Input
                                label="Кол-во правильных ответов"
                                type="number"
                                value={correctAnswersCount}
                                onChange={(e) => setValue("correctAnswersCount", parseInt(e.target.value))}
                                size="sm"
                                variant="bordered"
                                radius="sm"
                                min={1}
                              />
                              <Input
                                label="Кол-во вариантов ответов"
                                type="number"
                                value={optionsCount}
                                onChange={(e) => setValue("optionsCount", parseInt(e.target.value))}
                                size="sm"
                                variant="bordered"
                                radius="sm"
                                min={2}
                                max={10}
                              />
                          </div>
                      </div>
                  </ModalBody>
                  <ModalFooter className="border-t border-default-200 pt-4">
                      <Button
                        color="default"
                        variant="light"
                        onPress={() => setIsFileGeneratorOpen(false)}
                        size="lg"
                      >
                          Назад
                      </Button>
                      <Button
                        color="primary"
                        onPress={handleGenerateFromFile}
                        isLoading={isGenerating}
                        size="lg"
                        className="bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                        endContent={<FiPlus />}
                        isDisabled={!selectedFile}
                      >
                          Сгенерировать из файла
                      </Button>
                  </ModalFooter>
              </ModalContent>
          </Modal>

          {/* Generator Modal */}
          <Modal isOpen={isGeneratorOpen} onClose={() => setIsGeneratorOpen(false)} size="xl">
              <ModalContent>
                  <ModalHeader className="bg-gradient-to-r from-blue-500 to-purple-500">
                      <h2 className="text-xl font-semibold text-white">Генерация теста</h2>
                  </ModalHeader>
                  <Divider />
                  <ModalBody className="p-6 gap-4">
                      <div className="space-y-6">
                          <Input
                            label="Тема для генерации теста"
                            {...register("generationTopic")}
                            placeholder="Введите тему для генерации теста"
                            size="lg"
                            variant="bordered"
                            radius="sm"
                            isInvalid={!!errors.generationTopic}
                            errorMessage={errors.generationTopic?.message}
                            onBlur={() => trigger("generationTopic")}
                            classNames={{
                                inputWrapper: "border-1",
                                label: "text-gray-700 dark:text-gray-300"
                            }}
                          />

                          <div className="grid grid-cols-2 gap-4">
                              <Select
                                label="Язык"
                                {...register("language")}
                                defaultSelectedKeys={["russian"]}
                                size="sm"
                                variant="bordered"
                                radius="sm"
                                isInvalid={!!errors.language}
                                errorMessage={errors.language?.message}
                                classNames={{
                                    trigger: "border-1",
                                    label: "text-gray-700 dark:text-gray-300"
                                }}
                              >
                                  <SelectItem key="russian" value="russian">Русский</SelectItem>
                                  <SelectItem key="english" value="english">Английский</SelectItem>
                                  <SelectItem key="german" value="german">Немецкий</SelectItem>
                                  <SelectItem key="belarusian" value="belarusian">Беларусский</SelectItem>
                              </Select>

                              <Select
                                label="Сложность"
                                {...register("difficulty")}
                                defaultSelectedKeys={["medium"]}
                                size="sm"
                                variant="bordered"
                                radius="sm"
                                isInvalid={!!errors.difficulty}
                                errorMessage={errors.difficulty?.message}
                                classNames={{
                                    trigger: "border-1",
                                    label: "text-gray-700 dark:text-gray-300"
                                }}
                              >
                                  <SelectItem key="easy" value="easy">Легко</SelectItem>
                                  <SelectItem key="medium" value="medium">Средне</SelectItem>
                                  <SelectItem key="hard" value="hard">Сложно</SelectItem>
                              </Select>
                          </div>

                          <div className="grid grid-cols-3 gap-4">
                              <Input
                                label="Кол-во вопросов"
                                type="number"
                                {...register("numberOfQuestions")}
                                size="sm"
                                variant="bordered"
                                radius="sm"
                                min={1}
                                max={50}
                                isInvalid={!!errors.numberOfQuestions}
                                errorMessage={errors.numberOfQuestions?.message}
                                onBlur={() => trigger("numberOfQuestions")}
                                classNames={{
                                    inputWrapper: "border-1",
                                    label: "text-gray-700 dark:text-gray-300"
                                }}
                              />
                              <Input
                                label="Кол-во правильных ответов"
                                type="number"
                                {...register("correctAnswersCount")}
                                size="sm"
                                variant="bordered"
                                radius="sm"
                                min={1}
                                isInvalid={!!errors.correctAnswersCount}
                                errorMessage={errors.correctAnswersCount?.message}
                                onBlur={() => trigger("correctAnswersCount")}
                                classNames={{
                                    inputWrapper: "border-1",
                                    label: "text-gray-700 dark:text-gray-300"
                                }}
                              />
                              <Input
                                label="Кол-во вариантов ответов"
                                type="number"
                                {...register("optionsCount")}
                                size="sm"
                                variant="bordered"
                                radius="sm"
                                min={2}
                                max={10}
                                isInvalid={!!errors.optionsCount}
                                errorMessage={errors.optionsCount?.message}
                                onBlur={() => trigger("optionsCount")}
                                classNames={{
                                    inputWrapper: "border-1",
                                    label: "text-gray-700 dark:text-gray-300"
                                }}
                              />
                          </div>
                      </div>
                  </ModalBody>
                  <ModalFooter className="border-t border-default-200 pt-4">
                      <Button
                        color="default"
                        variant="light"
                        onPress={() => setIsGeneratorOpen(false)}
                        size="lg"
                      >
                          Назад
                      </Button>
                      <Button
                        color="primary"
                        onPress={handleGenerateTest}
                        isLoading={isGenerating}
                        size="lg"
                        className="bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                        endContent={<FiPlus />}
                      >
                          Сгенерировать тест
                      </Button>
                  </ModalFooter>
              </ModalContent>
          </Modal>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              {/* Test Info Section */}
              <Card className="shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-500">
                      <h2 className="text-xl font-semibold text-white">Данные теста</h2>
                  </CardHeader>
                  <Divider />
                  <CardBody className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                              <Input
                                label="Название теста"
                                {...register("title")}
                                placeholder="Введите название теста"
                                size="lg"
                                variant="bordered"
                                radius="sm"
                                isInvalid={!!errors.title}
                                errorMessage={errors.title?.message}
                                onBlur={() => trigger("title")}
                                classNames={{
                                    inputWrapper: "border-1",
                                    label: "text-gray-700 dark:text-gray-300"
                                }}
                              />

                              <Textarea
                                label="Описание"
                                {...register("description")}
                                placeholder="Введите описание теста"
                                size="lg"
                                variant="bordered"
                                radius="sm"
                                minRows={3}
                                isInvalid={!!errors.description}
                                errorMessage={errors.description?.message}
                                onBlur={() => trigger("description")}
                                classNames={{
                                    inputWrapper: "border-1",
                                    label: "text-gray-700 dark:text-gray-300"
                                }}
                              />
                          </div>

                          <div className="space-y-4">
                              <Select
                                label="Предметы"
                                selectionMode="multiple"
                                selectedKeys={Array.isArray(watch("categoryId")) ? watch("categoryId") : []}
                                onSelectionChange={(keys) => {
                                    const selectedKeysArray = Array.from(keys) as string[];
                                    setValue("categoryId", selectedKeysArray);
                                    setSelectedCategories(selectedKeysArray);
                                    setValue("subcategoryId", []);
                                }}
                                size="lg"
                                variant="bordered"
                                radius="sm"
                                isInvalid={!!errors.categoryId}
                                errorMessage={errors.categoryId?.message}
                                classNames={{
                                    trigger: "border-1",
                                    label: "text-gray-700 dark:text-gray-300"
                                }}
                              >
                                  {categories.map((category) => (
                                    <SelectItem key={category.id} value={category.id}>
                                        {category.name}
                                    </SelectItem>
                                  ))}
                              </Select>

                              {selectedCategories.length > 0 && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Темы:</label>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedCategories.flatMap(categoryId => {
                                            const category = categories.find(cat => cat.id === categoryId);
                                            return category?.subcategories?.map(subcategory => (
                                              <Chip
                                                key={subcategory.id}
                                                color={watch("subcategoryId")?.includes(subcategory.id) ? "primary" : "default"}
                                                onClick={() => handleSubcategoryChange(subcategory.id)}
                                                size="md"
                                                className="cursor-pointer transition-all"
                                              >
                                                  {subcategory.name}
                                              </Chip>
                                            ));
                                        })}
                                    </div>
                                    {errors.subcategoryId && (
                                      <p className="text-danger text-sm">{errors.subcategoryId.message}</p>
                                    )}
                                </div>
                              )}
                          </div>
                      </div>
                  </CardBody>
              </Card>

              {/* Questions Section */}
              <Card className="shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-500">
                      <div className="flex justify-between items-center w-full">
                          <h2 className="text-xl font-semibold text-white">Вопросы теста</h2>
                          <Button
                            color="primary"
                            variant="flat"
                            onClick={() => append({
                                text: "",
                                options: ["", ""],
                                correctAnswer: []
                            })}
                            startContent={<CgPlayListAdd className="text-lg" />}
                            size="lg"
                            className="text-white"
                          >
                              Добавить вопрос
                          </Button>
                      </div>
                  </CardHeader>
                  <Divider />
                  <CardBody className="p-6">
                      <div className="space-y-6">
                          {fields.map((item, index) => (
                            <Card
                              key={item.id}
                              className="p-5 border border-gray-200 dark:border-gray-700 hover:border-blue-500 transition-colors"
                              shadow="none"
                            >
                                <div className="flex justify-between items-center mb-4">
                                    <div className="flex items-center gap-2">
                                        <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 font-bold rounded-full w-8 h-8 flex items-center justify-center">
                                            {index + 1}
                                        </span>
                                        <span className="font-medium text-gray-600 dark:text-gray-300">Вопрос</span>
                                    </div>
                                    {fields.length > 1 && (
                                      <Button
                                        isIconOnly
                                        variant="light"
                                        color="danger"
                                        onClick={() => remove(index)}
                                        size="sm"
                                      >
                                          <RiCloseFill className="w-5 h-5" />
                                      </Button>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    <Input
                                      label="Текст вопроса"
                                      {...register(`questions.${index}.text`)}
                                      placeholder="Введите текст вопроса"
                                      size="lg"
                                      variant="bordered"
                                      radius="sm"
                                      isInvalid={!!errors.questions?.[index]?.text}
                                      errorMessage={errors.questions?.[index]?.text?.message}
                                      onBlur={() => {
                                          trigger(`questions.${index}.text`);
                                          validateCorrectAnswers(index);
                                      }}
                                      classNames={{
                                          inputWrapper: "border-1",
                                          label: "text-gray-700 dark:text-gray-300"
                                      }}
                                    />

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Изображение (не обязательно)</label>
                                        <div className="flex items-center gap-3">
                                            <label
                                              htmlFor={`image-upload-${index}`}
                                              className="flex items-center gap-2 cursor-pointer p-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary transition-colors"
                                            >
                                                <MdAddPhotoAlternate className="text-xl text-gray-500" />
                                                <span className="text-sm">Загрузить изображение</span>
                                            </label>
                                            <input
                                              id={`image-upload-${index}`}
                                              type="file"
                                              accept="image/*"
                                              onChange={(e) => handleImageChange(index, e)}
                                              className="hidden"
                                            />
                                            {previewImages[index] && (
                                              <div className="relative">
                                                  <Image
                                                    src={previewImages[index]}
                                                    alt="Preview"
                                                    className="w-20 h-20 object-cover rounded-md"
                                                  />
                                              </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Ответы:</label>
                                            <Button
                                              variant="light"
                                              color="primary"
                                              onClick={() => {
                                                  if (fields[index].options.length >= 10) {
                                                      toast.warning("Максимум 10 вариантов ответа", {
                                                          position: "top-right",
                                                      });
                                                      return;
                                                  }
                                                  handleAddOption(index);
                                              }}
                                              startContent={<FiPlus />}
                                              size="sm"
                                            >
                                                Добавить ответ
                                            </Button>
                                        </div>

                                        <div className="space-y-3">
                                            {item.options.map((option, optionIndex) => (
                                              <div key={optionIndex} className="flex items-center gap-3">
                                                  <Input
                                                    {...register(`questions.${index}.options.${optionIndex}`)}
                                                    placeholder={`Вариант ${optionIndex + 1}`}
                                                    size="lg"
                                                    variant="bordered"
                                                    radius="sm"
                                                    className="flex-1"
                                                    isInvalid={!!errors.questions?.[index]?.options?.[optionIndex]}
                                                    errorMessage={errors.questions?.[index]?.options?.[optionIndex]?.message}
                                                    onBlur={() => {
                                                        trigger(`questions.${index}.options.${optionIndex}`);
                                                        validateQuestionOptions(index);
                                                    }}
                                                    classNames={{
                                                        inputWrapper: "border-1",
                                                        label: "text-gray-700 dark:text-gray-300"
                                                    }}
                                                  />
                                                  <Checkbox
                                                    isSelected={item.correctAnswer.includes(item.options[optionIndex])}
                                                    onChange={() => {
                                                        handleCorrectAnswerChange(index, optionIndex);
                                                        trigger(`questions.${index}.correctAnswer`);
                                                    }}
                                                    color="success"
                                                    size="lg"
                                                  >
                                                      <span className="text-sm">Верный</span>
                                                  </Checkbox>
                                                  {item.options.length > 2 && (
                                                    <Button
                                                      isIconOnly
                                                      variant="light"
                                                      color="danger"
                                                      size="sm"
                                                      onClick={() => handleRemoveOption(index, optionIndex)}
                                                    >
                                                        <MdDeleteForever className="w-5 h-5" />
                                                    </Button>
                                                  )}
                                              </div>
                                            ))}
                                        </div>
                                        <input
                                          type="hidden"
                                          {...register(`questions.${index}.correctAnswer`)}
                                        />
                                    </div>
                                </div>
                            </Card>
                          ))}
                      </div>
                  </CardBody>
              </Card>

              {/* Submit Section */}
              <div className="flex justify-end gap-4">
                  <Button
                    type="submit"
                    color="primary"
                    size="lg"
                    isLoading={isCreating}
                    className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-6 text-lg font-bold"
                    endContent={!isCreating && <FaCheckCircle />}
                    onClick={async () => {
                        let isValid = true;
                        for (let i = 0; i < fields.length; i++) {
                            if (!validateCorrectAnswers(i)) isValid = false;
                            if (!validateQuestionOptions(i)) isValid = false;
                        }
                        if (isValid) {
                            await handleSubmit(onSubmit)();
                        }
                    }}
                  >
                      {isCreating ? (
                        <span className="flex items-center gap-2">
                            <Spinner size="sm" color="white" />
                            Создание...
                        </span>
                      ) : "Создать тест"}
                  </Button>
              </div>
          </form>
      </div>
    );
};