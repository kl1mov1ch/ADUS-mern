import React from 'react';
import { useGetTeachersQuery } from '../../app/services/userApi';
import { useNavigate } from 'react-router-dom';
import { Spinner, Button } from '@nextui-org/react';
import { ErrorMessage } from '../../components/error-message';

export const TeacherListPage = () => {
    const { data: teachers, error: teachersError, isLoading: teachersLoading } = useGetTeachersQuery();
    const navigate = useNavigate(); // Для навигации между страницами

    if (teachersLoading) return <Spinner aria-errormessage="Загружаем список учителей..." />;
    if (teachersError) return <ErrorMessage error="Ошибка при загрузке учителей" />;

    const handleTeacherClick = (teacherId: string) => {
        navigate(`/teachers/${teacherId}/tests`); // Переход на страницу с тестами учителя
    };

    return (
        <div className="teacher-list-page">
            <h1 className="text-xl font-bold mb-4">Список учителей</h1>
            <div className="teachers-list">
                {teachers?.map((teacher) => (
                    <Button
                        key={teacher.id}
                        onClick={() => handleTeacherClick(teacher.id)}
                        className="teacher-button"
                    >
                        {teacher.name}
                    </Button>

                ))}
            </div>

        </div>
    );
};
