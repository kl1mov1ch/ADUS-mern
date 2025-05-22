//@ts-nocheck
import React, { useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useGetStudentMarksQuery } from '../../app/services/userApi';
import { Spinner, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Card, CardBody, Input, Chip, Progress, Divider, Badge } from '@nextui-org/react';
import { ErrorMessage } from '../../components/error-message';
import { IoIosArrowUp, IoIosArrowDown, IoIosSearch, IoMdClose } from "react-icons/io";
import { motion, AnimatePresence } from 'framer-motion';
import { FaBook, FaGraduationCap, FaCalendarAlt, FaClock } from "react-icons/fa";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return {
        fullDate: `${day}.${month}.${year} ${hours}:${minutes}:${seconds}`,
        date: `${day}.${month}.${year}`,
        time: `${hours}:${minutes}:${seconds}`
    };
};

const StudentMarksPage = () => {
    const token = localStorage.getItem('token');
    const decodedToken: { userId?: string } = token ? jwtDecode(token) : {};
    const userId = decodedToken.userId;

    const { data: rawMarks = [], error, isLoading } = useGetStudentMarksQuery(userId || '');
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedTest, setExpandedTest] = useState<string | null>(null);

    if (isLoading) {
        return (
          <div className="flex justify-center items-center h-screen">
              <Spinner size="lg" aria-label="Загружаем оценки..." />
          </div>
        );
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

    const calculateAverageGrade = (grades: {grade: string | number}[]) => {
        const validGrades = grades.filter(g => g.grade !== "N/A" && !isNaN(Number(g.grade)));
        if (validGrades.length === 0) return 0;
        return validGrades.reduce((sum, g) => sum + Number(g.grade), 0) / validGrades.length;
    };

    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
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

          <div className="mb-8">
              <h1 className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Мои результаты тестов
              </h1>
              <p className="text-lg text-center text-gray-600 dark:text-gray-300">
                  Просмотр ваших оценок и попыток
              </p>
          </div>

          <div className="flex items-center mb-6 justify-center">
              <Input
                isClearable
                placeholder="Поиск по тестам..."
                startContent={<IoIosSearch className="text-gray-400" />}
                endContent={searchTerm && (
                  <IoMdClose
                    className="cursor-pointer text-gray-400 hover:text-gray-600"
                    onClick={() => setSearchTerm('')}
                  />
                )}
                value={searchTerm}
                onValueChange={setSearchTerm}
                className="w-full md:w-1/2"
                variant="bordered"
                radius="lg"
              />
          </div>

          {filteredMarks.length === 0 ? (
            <Card className="p-8 text-center">
                <p className="text-gray-500 text-lg">Нет доступных тестов для отображения</p>
            </Card>
          ) : (
            <div className="space-y-6">
                {filteredMarks.map((test) => {
                    const validAttempts = test.attempts.filter(attempt =>
                      attempt.completedAt && attempt.completedAt !== "N/A"
                    );
                    const avgGrade = calculateAverageGrade(test.attempts);

                    return (
                      <Card key={test.testId} className="shadow-lg border border-gray-200 dark:border-gray-700">
                          <CardBody className="p-0">
                              <div
                                onClick={() => toggleExpandTest(test.testId)}
                                className="cursor-pointer p-6 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                              >
                                  <div className="flex items-center gap-4">
                                      <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg p-3 text-white">
                                          <FaBook size={20} />
                                      </div>
                                      <div>
                                          <h2 className="text-xl font-semibold">{test.title}</h2>
                                          <div className="flex gap-3 mt-1">
                                              <Chip color="primary" variant="dot" size="sm">
                                                  {validAttempts.length} попыток
                                              </Chip>
                                              <Chip
                                                color={avgGrade >= 8 ? 'success' : avgGrade >= 5 ? 'warning' : 'danger'}
                                                variant="dot"
                                                size="sm"
                                              >
                                                  Средний балл: {avgGrade.toFixed(1)}
                                              </Chip>
                                          </div>
                                      </div>
                                  </div>
                                  <motion.div
                                    animate={{ rotate: expandedTest === test.testId ? 180 : 0 }}
                                    transition={{ duration: 0.3 }}
                                  >
                                      <IoIosArrowDown className="text-gray-500" />
                                  </motion.div>
                              </div>

                              <AnimatePresence>
                                  {expandedTest === test.testId && (
                                    <motion.div
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: 'auto' }}
                                      exit={{ opacity: 0, height: 0 }}
                                      transition={{ duration: 0.3 }}
                                      className="overflow-hidden"
                                    >
                                        <Divider />
                                        <div className="p-6">
                                            {validAttempts.length > 0 ? (
                                              <Table
                                                aria-label="Таблица попыток"
                                                removeWrapper
                                                classNames={{
                                                    th: "bg-gray-100 dark:bg-gray-800",
                                                    td: "py-4",
                                                }}
                                              >
                                                  <TableHeader>
                                                      <TableColumn>Попытка</TableColumn>
                                                      <TableColumn>Оценка</TableColumn>
                                                      <TableColumn>Дата</TableColumn>
                                                      <TableColumn>Время</TableColumn>
                                                  </TableHeader>
                                                  <TableBody>
                                                      {validAttempts.map((attempt, index) => {
                                                          const { date, time } = formatDate(attempt.completedAt);
                                                          const grade = attempt.grade === "N/A" ? 0 : attempt.grade;
                                                          return (
                                                            <TableRow key={index}>
                                                                <TableCell className="font-medium">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full">
                                                                            <FaGraduationCap className="text-blue-600 dark:text-blue-300" />
                                                                        </div>
                                                                        Попытка #{index + 1}
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Chip
                                                                      color={Number(grade) >= 8 ? 'success' : Number(grade) >= 5 ? 'warning' : 'danger'}
                                                                      variant="flat"
                                                                    >
                                                                        {grade}
                                                                    </Chip>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <div className="flex items-center gap-2">
                                                                        <FaCalendarAlt className="text-gray-400" />
                                                                        {date}
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <div className="flex items-center gap-2">
                                                                        <FaClock className="text-gray-400" />
                                                                        {time}
                                                                    </div>
                                                                </TableCell>
                                                            </TableRow>
                                                          );
                                                      })}
                                                  </TableBody>
                                              </Table>
                                            ) : (
                                              <Card className="border border-gray-200 dark:border-gray-700">
                                                  <CardBody className="text-center py-8">
                                                      <p className="text-gray-500">Нет завершенных попыток</p>
                                                  </CardBody>
                                              </Card>
                                            )}

                                            {validAttempts.length > 0 && (
                                              <div className="mt-6">
                                                  <Progress
                                                    aria-label="Средний балл"
                                                    value={avgGrade * 10}
                                                    color={avgGrade >= 8 ? 'success' : avgGrade >= 5 ? 'warning' : 'danger'}
                                                    className="max-w-md mx-auto"
                                                    showValueLabel={true}
                                                    label={`Средний балл: ${avgGrade.toFixed(1)}/10`}
                                                  />
                                              </div>
                                            )}
                                        </div>
                                    </motion.div>
                                  )}
                              </AnimatePresence>
                          </CardBody>
                      </Card>
                    );
                })}
            </div>
          )}
      </div>
    );
};

export default StudentMarksPage;