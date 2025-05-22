//@ts-nocheck
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useGetTestsQuery, useSubmitTestMutation } from '../../app/services/userApi';
import { Spinner, Button, Card, CardHeader, CardBody, Divider, Modal, ModalHeader, ModalBody, ModalFooter, RadioGroup, Radio, CheckboxGroup, Checkbox, Image, Progress, Chip } from '@nextui-org/react';
import { ErrorMessage } from '../../components/error-message';
import { Question } from '../../app/types';
import { GoBack } from '../../components/go-back';
import { useSelector } from 'react-redux';
import { RootState } from '../../app/store';
import _ from 'lodash';
import CircularJSON from 'circular-json';
import 'katex/dist/katex.min.css';
import { InlineMath } from 'react-katex';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaCheckCircle, FaTimesCircle, FaInfoCircle } from 'react-icons/fa';

const shuffleArray = <T,>(array: T[]): T[] => {
    return [...array].sort(() => Math.random() - 0.5);
};

const renderTextWithMath = (text: string) => {
    const mathRegex = /\$(.*?)\$/g;
    const parts = text.split(mathRegex);
    return parts.map((part, index) => {
        if (index % 2 === 1) {
            return <InlineMath key={index} math={part} />;
        } else {
            return <span key={index}>{part}</span>;
        }
    });
};

export const TestPage = () => {
    const { testId } = useParams<{ testId: string }>();
    const { data: tests, error: testsError, isLoading: testsLoading } = useGetTestsQuery();
    const [submitTest] = useSubmitTestMutation();
    const [answers, setAnswers] = useState<{ [key: string]: string | string[] }>(() => {
        const savedAnswers = localStorage.getItem(`answers-${testId}`);
        return savedAnswers ? JSON.parse(savedAnswers) : {};
    });
    const [result, setResult] = useState<{ correctAnswersCount: number; percentage: string; mark: number } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const user = useSelector((state: RootState) => state.auth.user);
    const [studentId, setStudentId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [shuffledQuestions, setShuffledQuestions] = useState<Question[]>([]);
    const [shuffledAnswers, setShuffledAnswers] = useState<{ [key: string]: string[] }>({});
    const [missingAnswersError, setMissingAnswersError] = useState<string | null>(null);
    const [unansweredQuestions, setUnansweredQuestions] = useState<string[]>([]);
    const [showResults, setShowResults] = useState(false);
    const [correctAnswers, setCorrectAnswers] = useState<{ [key: string]: string[] }>({});
    const [showUserAnswers, setShowUserAnswers] = useState(false);
    const [isVisible, setIsVisible] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [timeLeft, setTimeLeft] = useState(3600); // 60 минут по умолчанию
    const [answeredCount, setAnsweredCount] = useState(0);

    useEffect(() => {
        if (user) {
            setStudentId(user.id);
        }
    }, [user]);

    useEffect(() => {
        // Обновляем счетчик отвеченных вопросов
        const count = shuffledQuestions.filter(q => answers[q.id]).length;
        setAnsweredCount(count);
    }, [answers, shuffledQuestions]);

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                setIsVisible(false);
                toast.warning('Пожалуйста, не переключайтесь между вкладками во время теста!', {
                    position: 'top-center',
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                });
            } else {
                setIsVisible(true);
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    // Таймер
    useEffect(() => {
        if (timeLeft <= 0 || result) return;

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleAutoSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, result]);

    useEffect(() => {
        if (tests && testId) {
            const test = tests.find(test => test.id === testId);
            if (test) {
                const shuffledQues = shuffleArray(test.questions);
                const shuffledAns = shuffledQues.reduce((acc, question) => {
                    acc[question.id] = shuffleArray(question.options);
                    return acc;
                }, {} as { [key: string]: string[] });

                setShuffledQuestions(shuffledQues);
                setShuffledAnswers(shuffledAns);

                const correctAns = shuffledQues.reduce((acc, question) => {
                    acc[question.id] = question.correctAnswer;
                    return acc;
                }, {} as { [key: string]: string[] });
                setCorrectAnswers(correctAns);
            }
        }
    }, [tests, testId]);

    useEffect(() => {
        try {
            const safeAnswers = CircularJSON.stringify(answers);
            localStorage.setItem(`answers-${testId}`, safeAnswers);
        } catch (error) {
            console.error('Ошибка при сохранении answers:', error);
            toast.error('Ошибка при сохранении ответов', {
                position: 'top-right',
            });
        }
    }, [answers, testId]);

    useEffect(() => {
        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            if (!result) {
                event.preventDefault();
                event.returnValue = '';
                toast.info('Ваши ответы будут сохранены', {
                    position: 'top-center',
                });
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [result]);
    const userRole = user?.role
    const handleAutoSubmit = async () => {
        toast.info('Время вышло! Тест будет автоматически отправлен', {
            position: 'top-center',
            autoClose: 3000,
        });
        await handleSubmit();
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleAnswerChange = (questionId: string, value: string | string[]) => {
        if (typeof value !== 'string' && !Array.isArray(value)) {
            console.error('Неверный тип значения:', value);
            return;
        }
        setAnswers(prev => ({
            ...prev,
            [questionId]: value,
        }));
        setUnansweredQuestions((prev) => prev.filter((id) => id !== questionId));
    };

    const handleSubmit = async () => {
        const unanswered = shuffledQuestions
          .filter((question) => !answers[question.id])
          .map((question) => question.id);

        if (unanswered.length > 0) {
            const errorMsg = `Необходимо ответить на все вопросы (осталось ${unanswered.length})`;
            setMissingAnswersError(errorMsg);
            setUnansweredQuestions(unanswered);

            toast.error(errorMsg, {
                position: 'top-center',
                autoClose: 5000,
            });

            // Прокрутка к первому неотвеченному вопросу
            const firstUnanswered = document.getElementById(`question-${unanswered[0]}`);
            if (firstUnanswered) {
                firstUnanswered.scrollIntoView({ behavior: 'smooth', block: 'center' });
                firstUnanswered.classList.add('animate-pulse');
                setTimeout(() => {
                    firstUnanswered.classList.remove('animate-pulse');
                }, 3000);
            }

            return;
        }

        setIsSubmitting(true);
        setMissingAnswersError(null);
        setError(null);

        try {
            const response = await submitTest({ testId: test.id, studentId, answers }).unwrap();
            setResult({
                correctAnswersCount: response.correctAnswersCount,
                percentage: response.percentage,
                mark: response.mark,
            });
            setShowResults(true);
            localStorage.removeItem(`answers-${testId}`);

            toast.success(
              <div>
                  <p className="font-bold">Тест успешно отправлен!</p>
                  <p>Правильных ответов: {response.correctAnswersCount}/{shuffledQuestions.length}</p>
                  <p>Оценка: {response.mark}/10</p>
              </div>,
              {
                  position: 'top-center',
                  autoClose: 10000,
                  closeButton: true,
              }
            );
        } catch (error) {
            const errorMsg = 'Не удалось отправить тест. Пожалуйста, попробуйте еще раз.';
            setError(errorMsg);
            toast.error(errorMsg, {
                position: 'top-center',
                autoClose: 5000,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const isAnswerCorrect = (questionId: string, option: string) => {
        if (!showResults || !showUserAnswers) return false;
        const userAnswer = answers[questionId];
        const correctAnswer = correctAnswers[questionId];

        if (Array.isArray(userAnswer)) {
            return userAnswer.includes(option) && correctAnswer.includes(option);
        } else {
            return userAnswer === option && correctAnswer.includes(option);
        }
    };

    const isAnswerIncorrect = (questionId: string, option: string) => {
        if (!showResults || !showUserAnswers) return false;
        const userAnswer = answers[questionId];
        const correctAnswer = correctAnswers[questionId];

        if (Array.isArray(userAnswer)) {
            return userAnswer.includes(option) && !correctAnswer.includes(option);
        } else {
            return userAnswer === option && !correctAnswer.includes(option);
        }
    };

    const isAnswerMissed = (questionId: string, option: string) => {
        if (!showResults || !showUserAnswers) return false;
        const userAnswer = answers[questionId];
        const correctAnswer = correctAnswers[questionId];

        return !userAnswer?.includes(option) && correctAnswer.includes(option);
    };

    const getQuestionColor = (questionId: string) => {
        if (!showResults || !showUserAnswers) return 'default';

        const userAnswer = answers[questionId];
        const correctAnswer = correctAnswers[questionId];

        if (Array.isArray(userAnswer)) {
            const isCorrect = _.isEqual(new Set(userAnswer), new Set(correctAnswer));
            return isCorrect ? 'success' : 'danger';
        } else {
            return correctAnswer.includes(userAnswer as string) ? 'success' : 'danger';
        }
    };

    if (testsLoading) return (
      <div className="flex justify-center items-center h-screen">
          <Spinner size="lg" aria-label="Загружаем тесты..." />
      </div>
    );

    if (testsError) return <ErrorMessage error="Ошибка при загрузке тестов." />;
    if (!studentId) return (
      <div className="flex justify-center items-center h-screen">
          <Spinner size="lg" aria-label="Загружаем информацию о пользователе..." />
      </div>
    );

    const test = tests?.find(test => test.id === testId);
    if (!test) return <ErrorMessage error="Тест не найден." />;

    return (
      <div className="test-page max-w-4xl mx-auto px-4 py-8">
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

          <div className="flex justify-between items-center mb-6">
              {!result && (
                <div className="flex items-center gap-4">
                    <Chip color="primary" variant="dot">
                        Отвечено: {answeredCount}/{shuffledQuestions.length}
                    </Chip>
                    <Chip color="warning" variant="dot">
                        Осталось: {formatTime(timeLeft)}
                    </Chip>
                </div>
              )}
          </div>

          <div className="mb-8">
              <h1 className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {test.title}
              </h1>
              <p className="text-lg text-center text-gray-600 dark:text-gray-300">
                  {test.description}
              </p>
          </div>

          {error && (
            <div className="mb-6">
                <ErrorMessage error={error} />
            </div>
          )}

          {result ? (
            <Card className="mb-8 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-500">
                    <h2 className="text-xl font-semibold text-white">Результаты теста</h2>
                </CardHeader>
                <Divider />
                <CardBody className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
                            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">Правильные ответы</h3>
                            <p className="text-2xl font-bold text-blue-600 dark:text-blue-300">
                                {result.correctAnswersCount} <span className="text-sm">из {shuffledQuestions.length}</span>
                            </p>
                        </div>
                        <div className="bg-purple-50 dark:bg-purple-900/30 p-4 rounded-lg">
                            <h3 className="text-sm font-medium text-purple-800 dark:text-purple-200">Процент успеха</h3>
                            <p className="text-2xl font-bold text-purple-600 dark:text-purple-300">
                                {result.percentage}%
                            </p>
                        </div>
                        <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg">
                            <h3 className="text-sm font-medium text-green-800 dark:text-green-200">Оценка</h3>
                            <p className="text-2xl font-bold text-green-600 dark:text-green-300">
                                {result.mark} <span className="text-sm">из 10</span>
                            </p>
                        </div>
                    </div>

                    <Progress
                      aria-label="Результат теста"
                      value={parseFloat(result.percentage)}
                      color="primary"
                      className="mb-6"
                    />

                    <Button
                      color="primary"
                      variant="flat"
                      onClick={() => setShowUserAnswers(!showUserAnswers)}
                      className="w-full mb-6"
                      endContent={showUserAnswers ? <FaTimesCircle /> : <FaInfoCircle />}
                    >
                        {showUserAnswers ? 'Скрыть ответы' : 'Посмотреть детализацию ответов'}
                    </Button>

                    {showUserAnswers && (
                      <div className="space-y-8">
                          {shuffledQuestions.map((question) => (
                            <Card
                              key={question.id}
                              className={`border-2 ${getQuestionColor(question.id) === 'success' ? 'border-green-500' : 'border-red-500'}`}
                            >
                                <CardHeader className="flex justify-between items-start">
                                    <div>
                                        <p className="font-semibold flex items-start gap-2">
                                            {getQuestionColor(question.id) === 'success' ? (
                                              <FaCheckCircle className="text-green-500 mt-1" />
                                            ) : (
                                              <FaTimesCircle className="text-red-500 mt-1" />
                                            )}
                                            Вопрос: {renderTextWithMath(question.text)}
                                        </p>
                                    </div>
                                </CardHeader>
                                <CardBody>
                                    {question.imageUrl && (
                                      <Image
                                        src={question.imageUrl}
                                        alt="Изображение вопроса"
                                        className="w-full max-h-96 object-contain mb-4 rounded-lg border"
                                      />
                                    )}
                                    {question.correctAnswer.length === 1 ? (
                                      <RadioGroup orientation="vertical" value={answers[question.id] as string || ''}>
                                          {shuffledAnswers[question.id].map((option, index) => (
                                            <Radio
                                              key={index}
                                              value={option}
                                              classNames={{
                                                  base: `flex items-center p-2 rounded-lg ${
                                                    isAnswerCorrect(question.id, option)
                                                      ? 'bg-green-100 dark:bg-green-900/50'
                                                      : isAnswerIncorrect(question.id, option)
                                                        ? 'bg-red-100 dark:bg-red-900/50'
                                                        : isAnswerMissed(question.id, option)
                                                          ? 'bg-yellow-100 dark:bg-yellow-900/50'
                                                          : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                                                  }`,
                                                  label: `${
                                                    isAnswerCorrect(question.id, option)
                                                      ? 'text-green-800 dark:text-green-200'
                                                      : isAnswerIncorrect(question.id, option)
                                                        ? 'text-red-800 dark:text-red-200'
                                                        : isAnswerMissed(question.id, option)
                                                          ? 'text-yellow-800 dark:text-yellow-200'
                                                          : ''
                                                  }`
                                              }}
                                            >
                                                <div className="flex items-center gap-2">
                                                    {option}
                                                    {isAnswerMissed(question.id, option) && (
                                                      <span className="text-xs text-yellow-600 dark:text-yellow-300">
                                                                        (Правильный ответ)
                                                                    </span>
                                                    )}
                                                </div>
                                            </Radio>
                                          ))}
                                      </RadioGroup>
                                    ) : (
                                      <CheckboxGroup orientation="vertical" value={answers[question.id] as string[] || []}>
                                          {shuffledAnswers[question.id].map((option, index) => (
                                            <Checkbox
                                              key={index}
                                              value={option}
                                              classNames={{
                                                  base: `flex items-center p-2 rounded-lg ${
                                                    isAnswerCorrect(question.id, option)
                                                      ? 'bg-green-100 dark:bg-green-900/50'
                                                      : isAnswerIncorrect(question.id, option)
                                                        ? 'bg-red-100 dark:bg-red-900/50'
                                                        : isAnswerMissed(question.id, option)
                                                          ? 'bg-yellow-100 dark:bg-yellow-900/50'
                                                          : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                                                  }`,
                                                  label: `${
                                                    isAnswerCorrect(question.id, option)
                                                      ? 'text-green-800 dark:text-green-200'
                                                      : isAnswerIncorrect(question.id, option)
                                                        ? 'text-red-800 dark:text-red-200'
                                                        : isAnswerMissed(question.id, option)
                                                          ? 'text-yellow-800 dark:text-yellow-200'
                                                          : ''
                                                  }`
                                              }}
                                            >
                                                <div className="flex items-center gap-2">
                                                    {option}
                                                    {isAnswerMissed(question.id, option) && (
                                                      <span className="text-xs text-yellow-600 dark:text-yellow-300">
                                                                        (Пропущенный правильный ответ)
                                                                    </span>
                                                    )}
                                                </div>
                                            </Checkbox>
                                          ))}
                                      </CheckboxGroup>
                                    )}
                                </CardBody>
                            </Card>
                          ))}
                      </div>
                    )}
                </CardBody>
            </Card>
          ) : (
            <Card className="mb-8 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-500">
                    <h2 className="text-xl font-semibold text-white">Вопросы:</h2>
                </CardHeader>
                <Divider />
                <CardBody className="p-6">
                    <div className="space-y-8">
                        {shuffledQuestions.map((question, qIndex) => (
                          <div
                            key={question.id}
                            id={`question-${question.id}`}
                            className={`p-4 rounded-lg transition-all duration-200 ${
                              unansweredQuestions.includes(question.id)
                                ? 'border-2 border-red-500 bg-red-50 dark:bg-red-900/10'
                                : 'border border-gray-200 dark:border-gray-700 hover:border-blue-500'
                            }`}
                          >
                              <div className="flex items-start gap-3 mb-4">
                                        <span
                                          className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 font-bold rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                                            {qIndex + 1}
                                        </span>
                                  <p className="font-semibold text-lg">
                                      {renderTextWithMath(question.text)}
                                  </p>
                              </div>

                              {question.imageUrl && (
                                <Image
                                  src={question.imageUrl}
                                  alt="Изображение вопроса"
                                  className="w-full max-h-96 object-contain mb-4 rounded-lg border"
                                />
                              )}

                              {question.correctAnswer.length === 1 ? (
                                <RadioGroup
                                  orientation="vertical"
                                  value={answers[question.id] as string || ''}
                                  onValueChange={(value) => handleAnswerChange(question.id, value)}
                                  classNames={{
                                      base: 'gap-2'
                                  }}
                                >
                                    {shuffledAnswers[question.id].map((option, index) => (
                                      <Radio
                                        key={index}
                                        value={option}
                                        classNames={{
                                            base: 'data-[selected=true]:border-blue-500',
                                            wrapper: 'data-[selected=true]:bg-blue-500',
                                            label: 'text-gray-800 dark:text-gray-200'
                                        }}
                                      >
                                          {option}
                                      </Radio>
                                    ))}
                                </RadioGroup>
                              ) : (
                                <CheckboxGroup
                                  value={answers[question.id] as string[] || []}
                                  onValueChange={(value) => handleAnswerChange(question.id, value)}
                                  classNames={{
                                      base: 'gap-2'
                                  }}
                                >
                                    {shuffledAnswers[question.id].map((option, index) => (
                                      <Checkbox
                                        key={index}
                                        value={option}
                                        classNames={{
                                            base: 'data-[selected=true]:border-blue-500',
                                            wrapper: 'data-[selected=true]:bg-blue-500',
                                            label: 'text-gray-800 dark:text-gray-200'
                                        }}
                                      >
                                          {option}
                                      </Checkbox>
                                    ))}
                                </CheckboxGroup>
                              )}
                          </div>
                        ))}
                    </div>

                    {missingAnswersError && (
                      <div className="mt-4 p-4 bg-red-100 dark:bg-red-900/30 rounded-lg">
                          <p className="text-red-600 dark:text-red-300 flex items-center gap-2">
                              <FaTimesCircle />
                              {missingAnswersError}
                          </p>
                      </div>
                    )}

                    <div className="mt-8 flex justify-end">
                        <Button
                          color={userRole === 'STUDENT' ? 'primary' : 'default'}
                          onClick={userRole === 'STUDENT' ? handleSubmit : undefined}
                          disabled={isSubmitting || userRole !== 'STUDENT'}
                          size="lg"
                          className="w-full md:w-auto px-8 py-6 text-lg font-bold"
                          endContent={!isSubmitting && <FaCheckCircle />}
                        >
                            {isSubmitting ? (
                              <span className="flex items-center gap-2">
                            <Spinner size="sm" color="white" />
                            Отправка...
                          </span>
                            ) : userRole === 'STUDENT' ? 'Завершить тест' : 'Только для учеников'}
                        </Button>
                    </div>
                </CardBody>
            </Card>
          )}
      </div>
    );
};