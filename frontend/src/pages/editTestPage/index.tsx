//@ts-nocheck
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    useGetTestsQuery,
    useUpdateTestMutation,
    useCurrentUser,
    useGetAllCategoriesQuery,
    useGetCategoriesAndSubcategoriesForTestQuery,
} from '../../app/services/userApi';
import {
    Spinner,
    Button,
    Card,
    CardHeader,
    CardBody,
    CardFooter,
    Input,
    Textarea,
    Checkbox,
    Select,
    SelectItem,
    Chip,
    Image,
    Divider,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Badge,
    Accordion,
    AccordionItem,
    Tooltip
} from '@nextui-org/react';
import { ErrorMessage } from '../../components/error-message';
import { GoBack } from '../../components/go-back';
import { MdDeleteForever, MdAddPhotoAlternate } from 'react-icons/md';
import { RiCloseFill } from 'react-icons/ri';
import { CgPlayListAdd } from 'react-icons/cg';
import { FiPlus, FiCheck } from 'react-icons/fi';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { BiCategory, BiBook } from 'react-icons/bi';
import { MdAssignment, MdCategory } from 'react-icons/md';
import { motion, AnimatePresence } from 'framer-motion';

const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3 } },
};

export const EditTestPage = () => {
    const { testId } = useParams<{ testId: string }>();
    const { data: tests, error: testsError, isLoading: testsLoading } = useGetTestsQuery();
    const { teacherId } = useCurrentUser();
    const [updateTest] = useUpdateTestMutation();
    const navigate = useNavigate();
    const { data: allCategories } = useGetAllCategoriesQuery();
    const { data: testCategories } = useGetCategoriesAndSubcategoriesForTestQuery(testId ? [testId] : [], {
        skip: !testId,
    });

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [questions, setQuestions] = useState([]);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [previewImages, setPreviewImages] = useState<{ [key: number]: string }>({});
    const [isHidden, setIsHidden] = useState(false);

    useEffect(() => {
        if (tests && testId) {
            const test = tests.find((test) => test.id === testId);
            if (test) {
                setTitle(test.title);
                setDescription(test.description);
                setIsHidden(test.isHidden);

                // Десериализация correctAnswer для каждого вопроса
                const formattedQuestions = test.questions.map((question) => {
                    let correctAnswer;
                    if (typeof question.correctAnswer === 'string') {
                        try {
                            correctAnswer = JSON.parse(question.correctAnswer);
                        } catch (e) {
                            // Если JSON невалиден, преобразуем строку в массив
                            correctAnswer = [question.correctAnswer];
                        }
                    } else if (Array.isArray(question.correctAnswer)) {
                        correctAnswer = question.correctAnswer;
                    } else {
                        correctAnswer = [];
                    }
                    return {
                        ...question,
                        correctAnswer,
                    };
                });

                setQuestions(formattedQuestions);

                const previews = {};
                test.questions.forEach((question, index) => {
                    if (question.imageUrl) {
                        previews[index] = question.imageUrl;
                    }
                });
                setPreviewImages(previews);
            }
        }
    }, [tests, testId]);

    useEffect(() => {
        if (testCategories && testCategories.length > 0) {
            const testCategoryData = testCategories[0]; // Получаем данные для текущего теста
            setSelectedCategories(testCategoryData.categories?.map((cat) => cat.id) || []);
            setSelectedSubcategories(testCategoryData.subcategories?.map((sub) => sub.id) || []);
        }
    }, [testCategories]);

    if (testsLoading) return (
      <div className="flex justify-center items-center h-screen">
          <Spinner size="lg" aria-label="Загружаем тест..." />
      </div>
    );
    if (testsError) return <ErrorMessage error="Ошибка при загрузке теста." />;

    const handleQuestionChange = (index: number, field: string, value: any) => {
        setQuestions((prevQuestions) =>
          prevQuestions.map((q, i) => (i === index ? { ...q, [field]: value } : q))
        );
    };

    const handleOptionChange = (qIndex: number, oIndex: number, value: string) => {
        setQuestions((prevQuestions) =>
          prevQuestions.map((q, i) =>
            i === qIndex
              ? {
                  ...q,
                  options: q.options.map((opt, j) => (j === oIndex ? value : opt)),
              }
              : q
          )
        );
    };

    const handleAddQuestion = () => {
        setQuestions((prev) => [
            ...prev,
            { id: String(Date.now()), text: '', options: ['', ''], correctAnswer: [], image: null },
        ]);
    };

    const handleAddOption = (index: number) => {
        if (questions[index].options.length >= 10) {
            toast.warning("Максимум 10 вариантов ответа", {
                position: "top-right",
            });
            return;
        }
        setQuestions((prevQuestions) =>
          prevQuestions.map((q, i) =>
            i === index ? { ...q, options: [...q.options, ''] } : q
          )
        );
    };

    const handleImageChange = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) {
            toast.error("Файл не выбран", {
                position: "top-right",
            });
            return;
        }

        if (!file.type.startsWith('image/')) {
            toast.error("Загружайте только изображения", {
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

        const previewUrl = URL.createObjectURL(file);
        setPreviewImages((prev) => ({ ...prev, [index]: previewUrl }));

        // Обновляем questions с новым файлом изображения
        setQuestions((prevQuestions) =>
          prevQuestions.map((q, i) =>
            i === index ? { ...q, image: file } : q
          )
        );
    };

    const handleSave = async () => {
        setIsSaving(true);
        setError(null);

        try {
            if (!teacherId) {
                throw new Error('Не удалось получить идентификатор учителя.');
            }

            // Валидация перед сохранением
            if (!title.trim()) {
                throw new Error('Название теста обязательно');
            }

            if (questions.length === 0) {
                throw new Error('Добавьте хотя бы один вопрос');
            }

            for (const question of questions) {
                if (!question.text.trim()) {
                    throw new Error(`Вопрос ${questions.indexOf(question) + 1}: текст вопроса обязателен`);
                }

                if (question.options.length < 2) {
                    throw new Error(`Вопрос ${questions.indexOf(question) + 1}: должно быть минимум 2 варианта ответа`);
                }

                for (const option of question.options) {
                    if (!option.trim()) {
                        throw new Error(`Вопрос ${questions.indexOf(question) + 1}: вариант ответа не может быть пустым`);
                    }
                }

                if (question.correctAnswer.length === 0) {
                    throw new Error(`Вопрос ${questions.indexOf(question) + 1}: выберите хотя бы один правильный ответ`);
                }
            }

            const formData = new FormData();
            formData.append('title', title);
            formData.append('description', description);
            formData.append('teacherId', teacherId);
            formData.append('categoryIds', JSON.stringify(selectedCategories));
            formData.append('subcategoryIds', JSON.stringify(selectedSubcategories));
            formData.append('isHidden', isHidden.toString());

            questions.forEach((question, index) => {
                formData.append(`questions[${index}][text]`, question.text);

                // Преобразуем correctAnswer в массив, если это строка
                const correctAnswer = Array.isArray(question.correctAnswer)
                  ? question.correctAnswer
                  : [question.correctAnswer];
                formData.append(`questions[${index}][correctAnswer]`, JSON.stringify(correctAnswer));

                if (question.image) {
                    formData.append(`questions[${index}][image]`, question.image);
                }

                question.options.forEach((option, oIndex) => {
                    formData.append(`questions[${index}][options][${oIndex}]`, option);
                });
            });

            await updateTest({
                testId: testId!,
                testData: formData,
            }).unwrap();

            toast.success("Тест успешно обновлен!", {
                position: "top-center",
                autoClose: 3000,
            });
            navigate(`/tests`);
        } catch (err) {
            const errorMessage = err.message || 'Не удалось сохранить изменения. Пожалуйста, попробуйте снова.';
            setError(errorMessage);
            toast.error(errorMessage, {
                position: "top-center",
                autoClose: 5000,
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteQuestion = (index: number) => {
        if (questions.length <= 1) {
            toast.warning("Должен остаться хотя бы один вопрос", {
                position: "top-right",
            });
            return;
        }
        setQuestions((prevQuestions) => prevQuestions.filter((_, i) => i !== index));
        setPreviewImages((prev) => {
            const newPreviews = { ...prev };
            delete newPreviews[index];
            return newPreviews;
        });
    };

    const handleDeleteOption = (qIndex: number, oIndex: number) => {
        if (questions[qIndex].options.length <= 2) {
            toast.warning("Должно быть минимум 2 варианта ответа", {
                position: "top-right",
            });
            return;
        }
        setQuestions((prevQuestions) =>
          prevQuestions.map((q, i) =>
            i === qIndex
              ? { ...q, options: q.options.filter((_, j) => j !== oIndex) }
              : q
          )
        );
    };

    const handleCategoryChange = (keys: Iterable<string>) => {
        const selectedKeysArray = Array.from(keys);
        setSelectedCategories(selectedKeysArray);
        setSelectedSubcategories([]); // Сброс подкатегорий при изменении категории
    };

    const handleSubcategoryChange = (subcategoryId: string) => {
        setSelectedSubcategories((prev) =>
          prev.includes(subcategoryId)
            ? prev.filter((id) => id !== subcategoryId) // Удаляем, если уже есть
            : [...prev, subcategoryId] // Добавляем, если нет
        );
    };

    const handleToggleVisibility = async () => {
        try {
            setIsHidden(!isHidden);
            toast.success(`Тест теперь ${!isHidden ? "скрыт" : "виден"}`, {
                position: "top-right",
                autoClose: 3000,
            });
        } catch (error) {
            console.error("Ошибка при изменении видимости теста:", error);
            toast.error("Ошибка при изменении видимости теста", {
                position: "top-right",
                autoClose: 3000,
            });
        }
    };

    const selectedCategoryData = allCategories?.filter((cat) => selectedCategories.includes(cat.id));

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
              <div className="flex items-center gap-4">
                  <GoBack />
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      Редактирование теста
                  </h1>
              </div>
              <div className="flex gap-3">
                  <Button
                    color="warning"
                    variant="flat"
                    onClick={handleToggleVisibility}
                    startContent={isHidden ? <FaEye /> : <FaEyeSlash />}
                  >
                      {isHidden ? "Показать" : "Скрыть"}
                  </Button>
                  <Button
                    color="primary"
                    onClick={handleSave}
                    isLoading={isSaving}
                    endContent={<FiCheck />}
                  >
                      {isSaving ? "Сохранение..." : "Сохранить"}
                  </Button>
              </div>
          </div>

          {error && (
            <div className="mb-6">
                <ErrorMessage error={error} />
            </div>
          )}

          <div className="space-y-8">
              {/* Основная информация о тесте */}
              <Card className="p-6 shadow-lg">
                  <CardHeader className="pb-4">
                      <h2 className="text-xl font-semibold">Основная информация</h2>
                  </CardHeader>
                  <Divider />
                  <CardBody className="space-y-6 pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <Input
                            label="Название теста"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            size="lg"
                            variant="bordered"
                            isRequired
                          />
                          <Textarea
                            label="Описание теста"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            size="lg"
                            variant="bordered"
                            minRows={3}
                          />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <Select
                            label="Предметы"
                            selectionMode="multiple"
                            selectedKeys={selectedCategories}
                            onSelectionChange={handleCategoryChange}
                            size="lg"
                            variant="bordered"
                            isRequired
                          >
                              {allCategories?.map((category) => (
                                <SelectItem key={category.id} value={category.id}>
                                    {category.name}
                                </SelectItem>
                              ))}
                          </Select>

                          {selectedCategoryData && selectedCategoryData.length > 0 && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Темы:</label>
                                <div className="flex flex-wrap gap-2">
                                    {selectedCategoryData.map((category) =>
                                      category.subcategories?.map((subcategory) => (
                                        <Chip
                                          key={subcategory.id}
                                          color={selectedSubcategories.includes(subcategory.id) ? "primary" : "default"}
                                          onClick={() => handleSubcategoryChange(subcategory.id)}
                                          className="cursor-pointer hover:opacity-80 transition-opacity"
                                        >
                                            {subcategory.name}
                                        </Chip>
                                      ))
                                    )}
                                </div>
                            </div>
                          )}
                      </div>
                  </CardBody>
              </Card>

              {/* Вопросы теста */}
              <Card className="p-6 shadow-lg">
                  <CardHeader className="pb-4 flex justify-between items-center">
                      <h2 className="text-xl font-semibold">Вопросы теста</h2>
                      <Button
                        color="primary"
                        variant="flat"
                        onClick={handleAddQuestion}
                        startContent={<CgPlayListAdd />}
                      >
                          Добавить вопрос
                      </Button>
                  </CardHeader>
                  <Divider />
                  <CardBody className="space-y-6 pt-4">
                      <AnimatePresence>
                          {questions.map((question, qIndex) => (
                            <motion.div
                              key={question.id || qIndex}
                              variants={cardVariants}
                              initial="hidden"
                              animate="visible"
                              exit="exit"
                              layout
                            >
                                <Card className="p-5 border-1 border-gray-200 dark:border-gray-700">
                                    <div className="flex justify-between items-center mb-4">
                                        <div className="flex items-center gap-2">
                                            <Chip color="primary" variant="dot">
                                                Вопрос {qIndex + 1}
                                            </Chip>
                                            {isHidden && (
                                              <Badge color="warning" content="Скрыт" />
                                            )}
                                        </div>
                                        <Button
                                          isIconOnly
                                          variant="light"
                                          color="danger"
                                          onClick={() => handleDeleteQuestion(qIndex)}
                                          size="sm"
                                        >
                                            <RiCloseFill className="w-5 h-5" />
                                        </Button>
                                    </div>

                                    <div className="space-y-4">
                                        <Input
                                          label="Текст вопроса"
                                          value={question.text}
                                          onChange={(e) =>
                                            handleQuestionChange(qIndex, 'text', e.target.value)
                                          }
                                          size="lg"
                                          variant="bordered"
                                          isRequired
                                        />

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Изображение (не обязательно)</label>
                                            <div className="flex items-center gap-3">
                                                <label
                                                  htmlFor={`image-upload-${qIndex}`}
                                                  className="flex items-center gap-2 cursor-pointer p-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary transition-colors"
                                                >
                                                    <MdAddPhotoAlternate className="text-xl text-gray-500" />
                                                    <span className="text-sm">Загрузить изображение</span>
                                                </label>
                                                <input
                                                  id={`image-upload-${qIndex}`}
                                                  type="file"
                                                  accept="image/*"
                                                  onChange={(e) => handleImageChange(qIndex, e)}
                                                  className="hidden"
                                                />
                                                {previewImages[qIndex] && (
                                                  <div className="relative">
                                                      <Image
                                                        src={previewImages[qIndex]}
                                                        alt="Preview"
                                                        className="w-40 h-40 object-contain rounded-md border"
                                                      />
                                                  </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center">
                                                <label className="text-sm font-medium">Варианты ответов:</label>
                                                <Tooltip content="Добавить вариант">
                                                    <Button
                                                      isIconOnly
                                                      variant="light"
                                                      color="primary"
                                                      onClick={() => handleAddOption(qIndex)}
                                                      size="sm"
                                                    >
                                                        <FiPlus />
                                                    </Button>
                                                </Tooltip>
                                            </div>

                                            <div className="space-y-3">
                                                {question.options.map((option, oIndex) => (
                                                  <motion.div
                                                    key={oIndex}
                                                    className="flex items-center gap-3"
                                                    variants={cardVariants}
                                                  >
                                                      <Input
                                                        value={option}
                                                        onChange={(e) =>
                                                          handleOptionChange(qIndex, oIndex, e.target.value)
                                                        }
                                                        size="lg"
                                                        variant="bordered"
                                                        isRequired
                                                        className="flex-1"
                                                      />
                                                      <Checkbox
                                                        isSelected={question.correctAnswer.includes(option)}
                                                        onChange={() => {
                                                            const updatedCorrectAnswers = question.correctAnswer.includes(
                                                              option
                                                            )
                                                              ? question.correctAnswer.filter((ans) => ans !== option)
                                                              : [...question.correctAnswer, option];
                                                            handleQuestionChange(qIndex, 'correctAnswer', updatedCorrectAnswers);
                                                        }}
                                                        color="success"
                                                        size="lg"
                                                      >
                                                          Верный
                                                      </Checkbox>
                                                      <Tooltip content="Удалить вариант">
                                                          <Button
                                                            isIconOnly
                                                            variant="light"
                                                            color="danger"
                                                            size="sm"
                                                            onClick={() => handleDeleteOption(qIndex, oIndex)}
                                                          >
                                                              <MdDeleteForever className="w-5 h-5" />
                                                          </Button>
                                                      </Tooltip>
                                                  </motion.div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                          ))}
                      </AnimatePresence>
                  </CardBody>
              </Card>
          </div>
      </div>
    );
};