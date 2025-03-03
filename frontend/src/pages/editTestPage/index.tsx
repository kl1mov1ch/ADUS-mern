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
    Input,
    Textarea,
    Checkbox,
    Select,
    SelectItem,
    Chip,
    Image,
} from '@nextui-org/react';
import { motion, AnimatePresence } from 'framer-motion';
import { ErrorMessage } from '../../components/error-message';
import { GoBack } from '../../components/go-back';
import { MdDeleteForever } from 'react-icons/md';
import { RiCloseFill } from 'react-icons/ri';
import { CgPlayListAdd } from 'react-icons/cg';
import { InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';

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

    useEffect(() => {
        if (tests && testId) {
            const test = tests.find((test) => test.id === testId);
            if (test) {
                setTitle(test.title);
                setDescription(test.description);

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

    if (testsLoading) return <Spinner aria-label="Загружаем тест..." />;
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
            { id: String(Date.now()), text: '', options: [''], correctAnswer: [], image: null },
        ]);
    };

    const handleAddOption = (index: number) => {
        setQuestions((prevQuestions) =>
          prevQuestions.map((q, i) =>
            i === index ? { ...q, options: [...q.options, ''] } : q
          )
        );
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

            const formData = new FormData();
            formData.append('title', title);
            formData.append('description', description);
            formData.append('teacherId', teacherId);
            formData.append('categoryIds', JSON.stringify(selectedCategories));
            formData.append('subcategoryIds', JSON.stringify(selectedSubcategories));

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

            navigate(`/tests`);
        } catch (err) {
            setError('Не удалось сохранить изменения. Пожалуйста, попробуйте снова.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteQuestion = (index: number) => {
        setQuestions((prevQuestions) => prevQuestions.filter((_, i) => i !== index));
        setPreviewImages((prev) => {
            const newPreviews = { ...prev };
            delete newPreviews[index];
            return newPreviews;
        });
    };

    const handleDeleteOption = (qIndex: number, oIndex: number) => {
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

    const selectedCategoryData = allCategories?.filter((cat) => selectedCategories.includes(cat.id));

    return (
      <div className="flex flex-col gap-6 p-4">
          <GoBack />
          <h1 className="text-xl font-bold mb-4">Редактирование теста</h1>
          {error && <ErrorMessage error={error} />}

          <motion.div
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={cardVariants}
          >
              <Input
                label="Название теста"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mb-6"
              />
              <Textarea
                label="Описание теста"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mb-6"
              />

              {/* Выбор категорий */}
              <Select
                label="Выберите категории"
                selectionMode="multiple"
                selectedKeys={selectedCategories}
                onSelectionChange={handleCategoryChange}
                className="mb-4"
              >
                  {allCategories?.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                        {category.name}
                    </SelectItem>
                  ))}
              </Select>

              {/* Выбор подкатегорий */}
              {selectedCategoryData && selectedCategoryData.length > 0 && (
                <div className="mb-6">
                    <h3 className="font-semibold mb-2">Выберите подкатегории:</h3>
                    <div className="flex flex-wrap gap-2">
                        {selectedCategoryData.map((category) =>
                          category.subcategories?.map((subcategory) => (
                            <Chip
                              key={subcategory.id}
                              color={selectedSubcategories.includes(subcategory.id) ? "primary" : "default"}
                              onClick={() => handleSubcategoryChange(subcategory.id)}
                              className="cursor-pointer"
                            >
                                {subcategory.name}
                            </Chip>
                          ))
                        )}
                    </div>
                </div>
              )}

              {questions.map((question, qIndex) => (
                <motion.div
                  key={question.id}
                  className="mb-4"
                  variants={cardVariants}
                >
                    <Card className="p-4">
                        <div className="flex justify-between items-center mb-2">
                            <span className="font-bold">Вопрос {qIndex + 1}</span>
                            <RiCloseFill
                              onClick={() => handleDeleteQuestion(qIndex)}
                              className="w-7 h-7 cursor-pointer hover:scale-110"
                            />
                        </div>
                        <Input
                          label="Текст вопроса"
                          value={question.text}
                          onChange={(e) =>
                            handleQuestionChange(qIndex, 'text', e.target.value)
                          }
                        />
                        {/* Отображение формулы в реальном времени */}
                        {/*<div className="mt-2">*/}
                        {/*    <InlineMath>{question.text}</InlineMath>*/}
                        {/*</div>*/}
                        <div className="mt-4">
                            <div className="flex justify-between items-center">
                                <span className="font-bold">Загрузка изображения:</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <Button
                                  as="label"
                                  htmlFor={`image-upload-${qIndex}`}
                                  color="primary"
                                  variant="bordered"
                                  className="cursor-pointer"
                                >
                                    Загрузить изображение
                                </Button>
                                <input
                                  id={`image-upload-${qIndex}`}
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleImageChange(qIndex, e)}
                                  className="hidden"
                                />
                                {previewImages[qIndex] && (
                                  <Image
                                    src={previewImages[qIndex]}
                                    alt="Preview"
                                    className='size-80 border-3'
                                  />
                                )}
                            </div>
                        </div>
                        <div className="mt-4">
                            {question.options.map((option, oIndex) => (
                              <motion.div
                                key={oIndex}
                                className="flex items-center gap-2 mb-2"
                                variants={cardVariants}
                              >
                                  <Input
                                    value={option}
                                    onChange={(e) =>
                                      handleOptionChange(qIndex, oIndex, e.target.value)
                                    }
                                  />
                                  <MdDeleteForever
                                    onClick={() => handleDeleteOption(qIndex, oIndex)}
                                    className="w-7 h-7 cursor-pointer hover:scale-110"
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
                                  >
                                      Ответ
                                  </Checkbox>
                              </motion.div>
                            ))}
                            <Button
                              onClick={() => handleAddOption(qIndex)}
                              className="mt-2"
                              color="primary"
                            >
                                Добавить вариант ответа
                            </Button>
                        </div>
                    </Card>
                </motion.div>
              ))}
          </motion.div>

          <div className="flex justify-between w-full">
              <Button
                color="primary"
                onClick={handleAddQuestion}
                className="flex items-center"
              >
                  Новый вопрос
                  <CgPlayListAdd className="w-5 h-5 ml-2" />
              </Button>

              <Button onClick={handleSave} color="success" disabled={isSaving}>
                  {isSaving ? 'Сохранение...' : 'Сохранить изменения'}
              </Button>
          </div>
      </div>
    );
};