import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useGetTestsQuery, useSubmitTestMutation } from '../../app/services/userApi';
import { Spinner, Button, Card, CardHeader, CardBody, CardFooter, Divider, RadioGroup, Radio } from '@nextui-org/react';
import { ErrorMessage } from '../../components/error-message';
import { Question } from '../../app/types';
import { GoBack } from '../../components/go-back';
import { useSelector } from 'react-redux';
import { RootState } from '../../app/store';

export const TestPage = () => {
    const { testId } = useParams<{ testId: string }>();
    const { data: tests, error: testsError, isLoading: testsLoading } = useGetTestsQuery();
    const [submitTest] = useSubmitTestMutation();
    const [answers, setAnswers] = useState<{ [key: string]: string }>({});
    const [result, setResult] = useState<{ correctAnswersCount: number; percentage: string; mark: number } | null>(null);
    const user = useSelector((state: RootState) => state.auth.user);
    const [studentId, setStudentId] = useState<string | null>(null);


    useEffect(() => {
        if (user) {
            setStudentId(user.id);
        }
    }, [user]);

    if (testsLoading) return <Spinner aria-label="Загружаем тесты..." />;
    if (testsError) return <ErrorMessage error="Ошибка при загрузке тестов." />;
    if (!studentId) return <Spinner aria-label="Загружаем информацию о пользователе..." />;

    const test = tests?.find(test => test.id === testId);
    if (!test) return <ErrorMessage error="Тест не найден." />;

    const handleAnswerChange = (questionId: string, event: React.ChangeEvent<HTMLInputElement>) => {
        const answer = event.target.value;
        setAnswers(prev => ({
            ...prev,
            [questionId]: answer,
        }));
    };

    const handleSubmit = async () => {
        try {
            // Логирование данных, которые отправляются на сервер
            console.log('Отправляемые данные:', {
                testId: test.id,
                studentId,
                answers
            });

            const response = await submitTest({
                testId: test.id,
                studentId,
                answers
            }).unwrap();

            // Логирование ответа от сервера
            console.log('Ответ от сервера:', response);

            setResult({
                correctAnswersCount: response.correctAnswersCount, // Количество правильных ответов
                percentage: response.percentage, // Процент правильных ответов
                mark: response.mark // Оценка
            });
        } catch (error) {
            console.error('Ошибка при отправке теста:', error);
        }
    };


    return (
        <div className="test-page">
            <GoBack />
            <h1 className="text-xl font-bold mb-4">Тест: {test.title}</h1>
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
                    </CardBody>
                </Card>
            ) : (
                <Card>
                    <CardHeader>
                        <h2 className="font-semibold text-lg">Описание: {test.description}</h2>
                    </CardHeader>
                    <Divider />
                    <CardBody>
                        {test.questions.map((question: Question) => (
                            <div key={question.id} className="mb-4">
                                <p className="font-semibold">Вопрос: {question.text}</p>
                                <RadioGroup
                                    orientation="vertical"
                                    value={answers[question.id] || ''}
                                    onChange={(event) => handleAnswerChange(question.id, event)}
                                >
                                    {question.options.map((option, index) => (
                                        <Radio key={index} value={option}>
                                            {option}
                                        </Radio>
                                    ))}
                                </RadioGroup>
                                <Divider className="my-4" />
                            </div>
                        ))}
                    </CardBody>
                    <Divider />
                    <CardFooter>
                        <Button color="primary" onClick={handleSubmit}>
                            Отправить ответы
                        </Button>
                    </CardFooter>
                </Card>
            )}
        </div>
    );
};
