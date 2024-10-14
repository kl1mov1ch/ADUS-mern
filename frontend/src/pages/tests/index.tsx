import React from 'react';
import { useGetTestsQuery } from '../../app/services/userApi';
import { Card, Spinner, Button, Divider, CardHeader, CardBody, CardFooter } from '@nextui-org/react';
import { ErrorMessage } from '../../components/error-message';
import { Link, useNavigate } from 'react-router-dom'; // Импортируем useNavigate для навигации
import { useSelector } from 'react-redux';
import { RootState } from '../../app/store';

export const TestList = () => {
    const { data: tests, error, isLoading } = useGetTestsQuery();
    const navigate = useNavigate();
    const user = useSelector((state: RootState) => state.auth.user); // Получаем информацию о пользователе

    if (isLoading) return <Spinner aria-label="Загружаем тесты..." />;
    if (error) return <ErrorMessage error="Ошибка при загрузке тестов" />;

    const handleTestClick = (testId: string) => {
        if (user) {
            navigate(`/tests/${testId}`); // Если пользователь авторизован, переходим на страницу теста
        } else {
            navigate('/login'); // Если не авторизован, перенаправляем на страницу входа
        }
    };

    return (
        <div className="test-list">
            <h1 className="text-xl font-bold mb-4">Список тестов</h1>
            {tests && tests.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                    {tests.map((test) => (
                        <Card key={test.id} className="p-4 min-h-32 w-100vh">
                            {/* Header */}
                            <CardHeader>
                                <h2 className="font-semibold text-lg">Название: {test.title}</h2>
                            </CardHeader>
                            <Divider />

                            {/* Body */}
                            <CardBody>
                                <p>Описание: {test.description}</p>
                                <span className="text-gray-600">Количество вопросов: {test.questions.length}</span>
                            </CardBody>
                            <Divider />

                            {/* Footer */}
                            <CardFooter>
                                <Button color="primary" onClick={() => handleTestClick(test.id)}>
                                    Пройти тест
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            ) : (
                <p>Тесты не найдены.</p>
            )}
        </div>
    );
};
