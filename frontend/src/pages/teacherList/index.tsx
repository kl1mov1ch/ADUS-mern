import React, { useState } from 'react';
import { useGetTeachersQuery } from '../../app/services/userApi';
import { useNavigate } from 'react-router-dom';
import { Spinner, Button, Input, Pagination } from '@nextui-org/react';
import { ErrorMessage } from '../../components/error-message';

export const TeacherListPage = () => {
    const { data: teachers, error: teachersError, isLoading: teachersLoading } = useGetTeachersQuery();
    const navigate = useNavigate();

    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 3;

    if (teachersLoading) return <Spinner aria-errormessage="Загружаем список учителей..." />;
    if (teachersError) return <ErrorMessage error="Ошибка при загрузке учителей" />;

    const handleTeacherClick = (teacherId: string) => {
        navigate(`/teachers/${teacherId}/tests`);
    };

    const filteredTeachers = teachers?.filter(teacher =>
        teacher.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const indexOfLastTeacher = currentPage * itemsPerPage;
    const indexOfFirstTeacher = indexOfLastTeacher - itemsPerPage;
    const currentTeachers = filteredTeachers?.slice(indexOfFirstTeacher, indexOfLastTeacher);

    // Обработка изменения страницы
    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    return (
        <div className="teacher-list-page flex flex-col items-center">
            <h1 className="text-xl font-bold mb-4">Список учителей</h1>
            <Input
                placeholder="Поиск учителя..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mb-4"
            />
            <div className="teachers-list flex flex-col items-center">
                {currentTeachers?.map((teacher) => (
                    <Button
                        key={teacher.id}
                        onClick={() => handleTeacherClick(teacher.id)}
                        className="mb-2"
                        style={{ width: '200px' }}
                    >
                        {teacher.name || 'Неизвестный учитель'}
                    </Button>
                ))}
            </div>

            {filteredTeachers && filteredTeachers.length > itemsPerPage && (
                <Pagination
                    isCompact
                    showControls
                    total={Math.ceil(filteredTeachers.length / itemsPerPage)}
                    initialPage={currentPage}
                    onChange={handlePageChange}
                    className="mt-4"
                />
            )}
        </div>
    );
};
