//@ts-nocheck
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useGetTestsQuery, useSubmitTestMutation } from '../../app/services/userApi';
import { Spinner, Button, Card, CardHeader, CardBody, Divider, RadioGroup, Radio, CheckboxGroup, Checkbox, Image } from '@nextui-org/react';
import { ErrorMessage } from '../../components/error-message';
import { Question } from '../../app/types';
import { GoBack } from '../../components/go-back';
import { useSelector } from 'react-redux';
import { RootState } from '../../app/store';
import _ from 'lodash';
import CircularJSON from 'circular-json';
import 'katex/dist/katex.min.css';
import { InlineMath } from 'react-katex';

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

    useEffect(() => {
        if (user) {
            setStudentId(user.id);
        }
    }, [user]);

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
        }
    }, [answers, testId]);

    if (testsLoading) return <Spinner aria-label="Загружаем тесты..." />;
    if (testsError) return <ErrorMessage error="Ошибка при загрузке тестов." />;
    if (!studentId) return <Spinner aria-label="Загружаем информацию о пользователе..." />;

    const test = tests?.find(test => test.id === testId);
    if (!test) return <ErrorMessage error="Тест не найден." />;

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
            setMissingAnswersError('Необходимо ответить на все вопросы перед отправкой.');
            setUnansweredQuestions(unanswered);
            return;
        }

        // Проверка формата ответов
        const isValid = shuffledQuestions.every(question => {
            const studentAnswer = answers[question.id];
            return Array.isArray(studentAnswer) || typeof studentAnswer === 'string';
        });

        if (!isValid) {
            setError('Некорректный формат ответов.');
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
        } catch (error) {
            setError('Не удалось отправить тест. Пожалуйста, попробуйте еще раз.');
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

    return (
      <div className="test-page">
          <GoBack />
          <h1 className="text-xl font-bold mb-4">Тест: {test.title}</h1>
          {error && <ErrorMessage error={error} />}
          {result ? (
            <Card>
                <CardHeader>
                    <h2 className="font-semibold text-lg">Результаты теста</h2>
                </CardHeader>
                <Divider />
                <CardBody>
                    <p>Количество правильных ответов: {result.correctAnswersCount}</p>
                    <p>Процент правильных ответов: {result.percentage}%</p>
                    <p>Ваша отметка: {result.mark} из 10</p>
                    <Button
                      color="primary"
                      onClick={() => setShowUserAnswers(!showUserAnswers)}
                      className="mt-4"
                    >
                        {showUserAnswers ? 'Скрыть ответы' : 'Посмотреть свои ответы'}
                    </Button>
                    {showUserAnswers && (
                      <div className="mt-4">
                          {shuffledQuestions.map((question) => (
                            <div key={question.id} className="mb-4">
                                <p className="font-semibold">Вопрос: {renderTextWithMath(question.text)}</p>
                                {question.imageUrl && (
                                  <Image
                                    src={question.imageUrl}
                                    alt="Изображение вопроса"
                                    className='size-96 mb-4 mt-4 border-5'
                                  />
                                )}
                                {question.correctAnswer.length === 1 ? (
                                  <RadioGroup orientation="vertical" value={answers[question.id] as string || ''}>
                                      {shuffledAnswers[question.id].map((option, index) => (
                                        <Radio
                                          key={index}
                                          value={option}
                                          className={
                                              isAnswerCorrect(question.id, option)
                                                ? 'text-green-600'
                                                : isAnswerIncorrect(question.id, option)
                                                  ? 'text-red-600'
                                                  : ''
                                          }
                                        >
                                            {option}
                                        </Radio>
                                      ))}
                                  </RadioGroup>
                                ) : (
                                  <CheckboxGroup orientation="vertical" value={answers[question.id] as string[] || []}>
                                      {shuffledAnswers[question.id].map((option, index) => (
                                        <Checkbox
                                          key={index}
                                          value={option}
                                          className={
                                              isAnswerCorrect(question.id, option)
                                                ? 'text-green-600'
                                                : isAnswerIncorrect(question.id, option)
                                                  ? 'text-red-600'
                                                  : ''
                                          }
                                        >
                                            {option}
                                        </Checkbox>
                                      ))}
                                  </CheckboxGroup>
                                )}
                                <Divider className="my-4" />
                            </div>
                          ))}
                      </div>
                    )}
                </CardBody>
            </Card>
          ) : (
            <Card>
                <CardHeader>
                    <h2 className="font-semibold text-lg">Описание: {renderTextWithMath(test.description)}</h2>
                </CardHeader>
                <Divider />
                <CardBody>
                    {shuffledQuestions.map((question) => (
                      <div
                        key={question.id}
                        className={`mb-4 ${unansweredQuestions.includes(question.id) ? 'text-red-600' : 'text-black'}`}
                      >
                          <p className="font-semibold">Вопрос: {renderTextWithMath(question.text)}</p>
                          {question.imageUrl && (
                            <Image
                              src={question.imageUrl}
                              alt="Изображение вопроса"
                              className='size-96 h-full w-100% mb-4 mt-4 border-5'
                            />
                          )}
                          {question.correctAnswer.length === 1 ? (
                            <RadioGroup
                              orientation="vertical"
                              value={answers[question.id]}
                              onValueChange={(value) => handleAnswerChange(question.id, value)}
                            >
                                {shuffledAnswers[question.id].map((option, index) => (
                                  <Radio key={index} value={option}>
                                      {option}
                                  </Radio>
                                ))}
                            </RadioGroup>
                          ) : (
                            <CheckboxGroup
                              value={answers[question.id] || []}
                              onValueChange={(value) => handleAnswerChange(question.id, value)}
                            >
                                {shuffledAnswers[question.id].map((option, index) => (
                                  <Checkbox key={index} value={option}>
                                      {option}
                                  </Checkbox>
                                ))}
                            </CheckboxGroup>
                          )}
                          <Divider className="my-4" />
                      </div>
                    ))}
                    {user?.role === 'STUDENT' && ( // Проверка роли пользователя
                      <Button color="primary" onClick={handleSubmit} disabled={isSubmitting}>
                          {isSubmitting ? 'Отправка...' : 'Отправить ответы'}
                      </Button>
                    )}
                    {missingAnswersError && (
                      <p className="text-red-600 mt-2">{missingAnswersError}</p>
                    )}
                </CardBody>
                <Divider />
            </Card>
          )}
      </div>
    );
};