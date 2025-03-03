import React, {useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {useGetTestsByTeacherQuery, useGetTestsQuery} from '../../app/services/userApi';
import {Spinner, Card, CardBody, Divider, Input, CardHeader, CardFooter, Button} from '@nextui-org/react';
import { ErrorMessage } from '../../components/error-message';
import {useSelector} from "react-redux";
import {RootState} from "../../app/store";


export const TeacherTestsPage = () => {
    const { data: tests, error, isLoading } = useGetTestsQuery();
    const navigate = useNavigate();
    const user = useSelector((state: RootState) => state.auth.user); // Получаем информацию о пользователе
    const [searchQuery, setSearchQuery] = useState(''); // Стейт для хранения значения поиска

    if (isLoading) return <Spinner aria-label="Загружаем тесты..." />;
    if (error) return <ErrorMessage error="Ошибка при загрузке тестов" />;

    const handleTestClick = (testId: string) => {
        if (user) {
            navigate(`/tests/${testId}`); // Если пользователь авторизован, переходим на страницу теста
        } else {
            navigate('/login'); // Если не авторизован, перенаправляем на страницу входа
        }
    };

    // Фильтрация тестов по поисковому запросу
    const filteredTests = tests?.filter((test) =>
        test.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="test-list">
            <h1 className="text-xl font-bold mb-4">Список тестов</h1>

            {/* Поисковое поле */}
            <div className="mb-6 w-full flex justify-center">
                <Input
                    type="text"
                    placeholder="Поиск по названию теста"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)} // Обновляем значение поиска
                    className="w-1/2" // Устанавливаем ширину инпута на половину контейнера
                />
            </div>

            {/* Список тестов */}
            {filteredTests && filteredTests.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                    {filteredTests.map((test) => (
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