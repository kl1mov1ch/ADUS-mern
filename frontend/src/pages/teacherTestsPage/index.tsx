import React from 'react';
import { useParams } from 'react-router-dom';
import { useGetTestsByTeacherQuery } from '../../app/services/userApi';
import { Spinner, Card, CardBody, Divider } from '@nextui-org/react';
import { ErrorMessage } from '../../components/error-message';

export const TeacherTestsPage = () => {
    const { teacherId } = useParams(); // Получаем ID учителя из URL
    const { data: teacherTests, error: testsError, isLoading: testsLoading } = useGetTestsByTeacherQuery(teacherId!, { skip: !teacherId });

    if (testsLoading) return <Spinner aria-errormessage="Загружаем тесты учителя..." />;
    if (testsError) return <ErrorMessage error="Ошибка при загрузке тестов" />;

    return (
        <div className="teacher-tests-page">
            <h1 className="text-xl font-bold mb-4">Тесты учителя</h1>
            {teacherTests && teacherTests.length > 0 ? (
                teacherTests.map((test) => (
                    <Card key={test.id} className="mb-4">
                        <CardBody>
                            <p className="font-semibold">{test.title}</p>
                            <p>{test.description}</p>
                        </CardBody>
                        <Divider />
                    </Card>
                ))
            ) : (
                <p>Нет тестов, созданных этим учителем.</p>
            )}
        </div>
    );
};
