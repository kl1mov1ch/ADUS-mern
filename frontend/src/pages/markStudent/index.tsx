//@ts-nocheck
import React, { useState } from 'react';
import { jwtDecode } from 'jwt-decode'; // Подключите библиотеку
import { useGetStudentMarksQuery } from '../../app/services/userApi';
import { Spinner, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Card, CardBody, Input } from '@nextui-org/react';
import { ErrorMessage } from '../../components/error-message';
import { IoIosArrowUp, IoIosArrowDown, IoIosSearch, IoMdClose } from "react-icons/io";
import { motion, AnimatePresence } from 'framer-motion';

const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${day}.${month}.${year} ${hours}:${minutes}:${seconds}`;
};

const StudentMarksPage = () => {
    const token = localStorage.getItem('token'); // Получаем токен
    const decodedToken: { userId?: string } = token ? jwtDecode(token) : {}; // Декодируем токен
    const userId = decodedToken.userId; // Извлекаем userId из токена

    console.log(userId);
    const { data: rawMarks = [], error, isLoading } = useGetStudentMarksQuery(userId || ''); // Передаем userId в запрос
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedTest, setExpandedTest] = useState<string | null>(null);

    if (isLoading) {
        return <Spinner aria-label="Загрузка отметок..." />;
    }

    if (error) {
        return <ErrorMessage error="Ошибка при загрузке отметок." />;
    }

    const filteredMarks = rawMarks.filter((test) =>
      test.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const toggleExpandTest = (testId: string) => {
        setExpandedTest(expandedTest === testId ? null : testId);
    };

    return (
      <div className="p-4">
          {/* Поиск по тестам */}
          <div className="flex items-center mb-4 justify-center">
              <Input
                isClearable
                placeholder="Поиск по тестам..."
                startContent={<IoIosSearch />}
                endContent={searchTerm && (
                  <IoMdClose
                    className="cursor-pointer"
                    onClick={() => setSearchTerm('')}
                  />
                )}
                value={searchTerm}
                onValueChange={setSearchTerm}
                className="w-1/2"
              />
          </div>

          {filteredMarks.map((test) => {
              // Фильтруем попытки, чтобы исключить некорректные данные
              const validAttempts = test.attempts.filter(attempt => {
                  return attempt.completedAt && attempt.completedAt !== "N/A";
              });

              return (
                <Card key={test.testId} className="mb-4">
                    <CardBody>
                        <div
                          onClick={() => toggleExpandTest(test.testId)}
                          className="cursor-pointer font-bold text-lg flex items-center"
                        >
                            {test.title}
                            <motion.div
                              className="ml-2"
                              animate={{ rotate: expandedTest === test.testId ? 180 : 0 }}
                              transition={{ duration: 0.3 }}
                            >
                                {expandedTest === test.testId ? <IoIosArrowUp /> : <IoIosArrowDown />}
                            </motion.div>
                        </div>
                        <AnimatePresence>
                            {expandedTest === test.testId && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                                className="overflow-hidden mt-4"
                              >
                                  {validAttempts.length > 0 ? (
                                    <Table aria-label="Таблица попыток" className="mt-4">
                                        <TableHeader>
                                            <TableColumn>Попытка</TableColumn>
                                            <TableColumn>Оценка</TableColumn>
                                            <TableColumn>Дата завершения</TableColumn>
                                        </TableHeader>
                                        <TableBody>
                                            {validAttempts.map((attempt, index) => (
                                              <TableRow key={index}>
                                                  <TableCell>{`Попытка №${index + 1}`}</TableCell>
                                                  <TableCell>{attempt.grade !== "N/A" ? attempt.grade : "0"}</TableCell>
                                                  <TableCell>{formatDate(attempt.completedAt)}</TableCell>
                                              </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                  ) : (
                                    <p className="text-gray-500 mt-4">Нет завершенных попыток.</p>
                                  )}
                              </motion.div>
                            )}
                        </AnimatePresence>
                    </CardBody>
                </Card>
              );
          })}
      </div>
    );
};

export default StudentMarksPage;