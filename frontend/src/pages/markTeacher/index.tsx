//@ts-nocheck
import React, { useState, useEffect } from 'react';
import { useGetTeachersMarksQuery } from '../../app/services/userApi';
import { Spinner, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Card, CardBody, Input, Button, Select, SelectItem, Checkbox, Divider, Chip, Progress, Badge } from '@nextui-org/react';
import { ErrorMessage } from '../../components/error-message';
import { IoIosArrowUp, IoIosArrowDown, IoIosSearch, IoMdClose } from "react-icons/io";
import { motion, AnimatePresence } from 'framer-motion';
import Papa from 'papaparse';
import { FaFileDownload, FaUserGraduate, FaChalkboardTeacher, FaCalendarAlt, FaClock } from "react-icons/fa";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

type RawStudent = {
    studentId: string;
    studentName: string;
    grade: number;
    completedAt: string;
    classes: { classId: string; className: string }[];
    role?: 'student' | 'teacher' | 'admin';
};

type RawTest = {
    testId: string;
    title: string;
    students: RawStudent[];
};

type GradeWithTimestamp = {
    grade: number;
    completedAt: string;
};

type ProcessedStudent = {
    studentId: string;
    studentName: string;
    attempts: number;
    grades: GradeWithTimestamp[];
    classes: { classId: string; className: string }[];
    role?: 'student' | 'teacher' | 'admin';
};

type ProcessedTest = {
    testId: string;
    title: string;
    students: ProcessedStudent[];
};

const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return { day, month, year, time: `${hours}:${minutes}:${seconds}` };
};

const processMarks = (marks: RawTest[]): ProcessedTest[] => {
    return marks.map((test) => {
        const studentMap: { [key: string]: ProcessedStudent } = {};
        test.students.forEach((student) => {
            if (!studentMap[student.studentId]) {
                studentMap[student.studentId] = {
                    studentId: student.studentId,
                    studentName: student.studentName,
                    attempts: 0,
                    grades: [],
                    classes: student.classes,
                    role: student.role || 'student',
                };
            }
            studentMap[student.studentId].attempts += 1;
            studentMap[student.studentId].grades.push({
                grade: student.grade,
                completedAt: student.completedAt,
            });
        });

        return {
            testId: test.testId,
            title: test.title,
            students: Object.values(studentMap),
        };
    });
};

const TeacherMarksPage: React.FC = () => {
    const token = localStorage.getItem("token");
    let teacherId = null;
    if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        teacherId = payload.userId;
    }

    const { data: rawMarks = [], error, isLoading, refetch } = useGetTeachersMarksQuery(teacherId);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [studentSearchTerm, setStudentSearchTerm] = useState<string>('');
    const [expandedTest, setExpandedTest] = useState<string | null>(null);
    const [expandedStudent, setExpandedStudent] = useState<string | null>(null);
    const [selectedClasses, setSelectedClasses] = useState<{ [key: string]: string[] }>({});
    const [selectedUsers, setSelectedUsers] = useState<{ [key: string]: string[] }>({});

    const marks = processMarks(rawMarks);
    const filteredMarks = marks.filter((test: ProcessedTest) =>
      test.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleUserSelection = (testId: string, studentId: string) => {
        setSelectedUsers((prev) => {
            const currentSelected = prev[testId] || [];
            if (currentSelected.includes(studentId)) {
                return {
                    ...prev,
                    [testId]: currentSelected.filter((id) => id !== studentId),
                };
            } else {
                return {
                    ...prev,
                    [testId]: [...currentSelected, studentId],
                };
            }
        });
    };

    const handleClassSelection = (testId: string, classId: string) => {
        setSelectedClasses((prev) => {
            const currentSelected = prev[testId] || [];
            if (currentSelected.includes(classId)) {
                return {
                    ...prev,
                    [testId]: currentSelected.filter((id) => id !== classId),
                };
            } else {
                return {
                    ...prev,
                    [testId]: [...currentSelected, classId],
                };
            }
        });
    };

    const handleReportDownload = (testId: string) => {
        const selectedClassIds = selectedClasses[testId] || [];
        const selectedUserIds = selectedUsers[testId] || [];

        const testData = marks.find((test) => test.testId === testId);
        if (!testData) return;

        const filteredStudents = testData.students.filter((student) =>
          (selectedClassIds.length > 0
            ? student.classes.some((cls) => selectedClassIds.includes(cls.classId))
            : true) &&
          (selectedUserIds.length > 0
            ? selectedUserIds.includes(student.studentId)
            : true)
        );

        if (filteredStudents.length === 0) {
            toast.warning('Нет данных для выбранных фильтров', {
                position: 'top-center',
                autoClose: 3000,
            });
            return;
        }

        const csvData = filteredStudents.map(student => ({
            'Имя студента': student.studentName,
            'Классы': student.classes.map(cls => cls.className).join(', '),
            'Попытки': student.attempts,
            'Оценки': student.grades.map(grade => grade.grade).join(', '),
            'Даты завершения': student.grades.map(grade => {
                const { day, month, year } = formatDate(grade.completedAt);
                return `${day}.${month}.${year}`;
            }).join(', ')
        }));

        const csv = Papa.unparse(csvData);
        const BOM = '\uFEFF';
        const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });

        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `Отчет_${testData.title.replace(/[^a-z0-9]/gi, '_')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success('Отчет успешно скачан', {
            position: 'top-center',
            autoClose: 3000,
        });
    };

    const clearSearchInputs = () => {
        setSearchTerm('');
        setStudentSearchTerm('');
    };

    const toggleExpandTest = (testId: string) => {
        setExpandedTest(expandedTest === testId ? null : testId);
    };

    const toggleExpandStudent = (studentId: string) => {
        setExpandedStudent(expandedStudent === studentId ? null : studentId);
    };

    const calculateAverageGrade = (grades: GradeWithTimestamp[]) => {
        const validGrades = grades.filter(g => !isNaN(g.grade) || []);
        if (validGrades.length === 0) return 0;
        return (validGrades.reduce((sum, g) => sum + (g.grade === 'N/A' ? 0 : g.grade), 0) / validGrades.length);
    };

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

    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
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
                  Результаты тестов
              </h1>
              <p className="text-lg text-center text-gray-600 dark:text-gray-300">
                  Просмотр и анализ результатов студентов
              </p>
          </div>

          <div className="flex items-center mb-6 justify-center gap-4">
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
                className="w-1/2"
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
                {filteredMarks.map((test) => (
                  <Card key={test.testId} className="shadow-lg border border-gray-200 dark:border-gray-700">
                      <CardBody className="p-0">
                          <div
                            onClick={() => toggleExpandTest(test.testId)}
                            className="cursor-pointer p-6 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                          >
                              <div className="flex items-center gap-4">
                                  <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg p-3 text-white">
                                      <FaChalkboardTeacher size={24} />
                                  </div>
                                  <div>
                                      <h2 className="text-xl font-semibold">{test.title}</h2>
                                      <div className="flex gap-3 mt-1">
                                          <Chip color="primary" variant="dot" size="sm">
                                              {test.students.length} студентов
                                          </Chip>
                                          <Chip color="secondary" variant="dot" size="sm">
                                              {test.students.reduce((acc, student) => acc + student.attempts, 0)} попыток
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
                                        <div className="flex flex-col md:flex-row gap-4 mb-6">
                                            <Input
                                              isClearable
                                              placeholder="Поиск ученика..."
                                              startContent={<IoIosSearch className="text-gray-400" />}
                                              endContent={studentSearchTerm && (
                                                <IoMdClose
                                                  className="cursor-pointer text-gray-400 hover:text-gray-600"
                                                  onClick={() => setStudentSearchTerm('')}
                                                />
                                              )}
                                              value={studentSearchTerm}
                                              onValueChange={setStudentSearchTerm}
                                              className="w-full md:w-1/2"
                                              variant="bordered"
                                              radius="lg"
                                            />

                                            <Select
                                              label="Выберите классы"
                                              selectionMode="multiple"
                                              selectedKeys={selectedClasses[test.testId] || []}
                                              onSelectionChange={(keys) => setSelectedClasses((prev) => ({
                                                  ...prev,
                                                  [test.testId]: Array.from(keys),
                                              }))}
                                              className="w-full md:w-1/3"
                                              variant="bordered"
                                              radius="lg"
                                            >
                                                {test.students && test.students.length > 0 ? (
                                                  Array.from(new Set(test.students.flatMap((s) => s.classes.map((c) => c.classId)))).map((classId) => {
                                                      const className = test.students
                                                        .flatMap(s => s.classes)
                                                        .find(c => c.classId === classId)?.className || 'Неизвестный класс';
                                                      return (
                                                        <SelectItem key={classId} value={classId}>
                                                            {className}
                                                        </SelectItem>
                                                      );
                                                  })
                                                ) : (
                                                  <SelectItem>Нет доступных классов</SelectItem>
                                                )}
                                            </Select>

                                            <Button
                                              color="primary"
                                              onClick={() => handleReportDownload(test.testId)}
                                              startContent={<FaFileDownload />}
                                              className="w-full md:w-auto"
                                            >
                                                Скачать отчет
                                            </Button>
                                        </div>

                                        <Table
                                          aria-label="Таблица студентов"
                                          removeWrapper
                                          classNames={{
                                              th: "bg-gray-100 dark:bg-gray-800",
                                              td: "py-4",
                                          }}
                                        >
                                            <TableHeader>
                                                <TableColumn width={50}>Выбрать</TableColumn>
                                                <TableColumn>Имя студента</TableColumn>
                                                <TableColumn>Классы</TableColumn>
                                                <TableColumn>Попытки</TableColumn>
                                                <TableColumn>Средний балл</TableColumn>
                                                <TableColumn>Детали</TableColumn>
                                            </TableHeader>
                                            <TableBody>
                                                {test.students
                                                  .filter((student) => {
                                                      const classFilter = selectedClasses[test.testId]?.length > 0
                                                        ? student.classes.some((cls) => selectedClasses[test.testId].includes(cls.classId))
                                                        : true;
                                                      return classFilter && student.studentName.toLowerCase().includes(studentSearchTerm.toLowerCase());
                                                  })
                                                  .map((student) => {
                                                      const avgGrade = calculateAverageGrade(student.grades);
                                                      return (
                                                        <TableRow key={student.studentId}>
                                                            <TableCell>
                                                                <Checkbox
                                                                  isSelected={selectedUsers[test.testId]?.includes(student.studentId)}
                                                                  onValueChange={() => handleUserSelection(test.testId, student.studentId)}
                                                                />
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex items-center gap-3">
                                                                    <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full">
                                                                        <FaUserGraduate className="text-blue-600 dark:text-blue-300" />
                                                                    </div>
                                                                    <span>{student.studentName}</span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex flex-wrap gap-1">
                                                                    {student.classes.map((cls) => (
                                                                      <Chip key={cls.classId} size="sm" variant="flat">
                                                                          {cls.className}
                                                                      </Chip>
                                                                    ))}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Badge content={student.attempts} color="primary" variant="shadow" />
                                                            </TableCell>
                                                            <TableCell>
                                                                <Progress
                                                                  aria-label="Средний балл"
                                                                  value={avgGrade * 10}
                                                                  color={avgGrade >= 8 ? 'success' : avgGrade >= 5 ? 'warning' : 'danger'}
                                                                  className="max-w-md"
                                                                  showValueLabel={true}
                                                                  label={`${avgGrade.toFixed(1)}/10`}
                                                                />
                                                            </TableCell>
                                                            <TableCell>
                                                                <Button
                                                                  size="sm"
                                                                  variant="light"
                                                                  onClick={() => toggleExpandStudent(student.studentId)}
                                                                  endContent={expandedStudent === student.studentId ? <IoIosArrowUp /> : <IoIosArrowDown />}
                                                                >
                                                                    {expandedStudent === student.studentId ? 'Скрыть' : 'Подробнее'}
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                      );
                                                  })}
                                            </TableBody>
                                        </Table>

                                        <AnimatePresence>
                                            {test.students.map((student) => {
                                                if (student.studentId === expandedStudent) {
                                                    return (
                                                      <motion.div
                                                        key={student.studentId}
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: 'auto' }}
                                                        exit={{ opacity: 0, height: 0 }}
                                                        transition={{ duration: 0.3 }}
                                                        className="overflow-hidden mt-6"
                                                      >
                                                          <Card className="border border-gray-200 dark:border-gray-700">
                                                              <CardBody className="p-0">
                                                                  <Table aria-label="Таблица оценок" removeWrapper>
                                                                      <TableHeader>
                                                                          <TableColumn>Попытка</TableColumn>
                                                                          <TableColumn>Оценка</TableColumn>
                                                                          <TableColumn>Дата</TableColumn>
                                                                          <TableColumn>Время</TableColumn>
                                                                      </TableHeader>
                                                                      <TableBody>
                                                                          {student.grades.map((grade, index) => {
                                                                              const { day, month, year, time } = formatDate(grade.completedAt);
                                                                              return (
                                                                                <TableRow key={index}>
                                                                                    <TableCell className="font-medium">#{index + 1}</TableCell>
                                                                                    <TableCell>
                                                                                        <Chip
                                                                                          color={grade.grade === 0 || grade.grade >= 8 ? 'success' : grade.grade >= 5 ? 'warning' : 'danger'}
                                                                                          variant="flat"
                                                                                        >
                                                                                            {grade.grade === 'N/A' ? 0 : grade.grade}
                                                                                        </Chip>
                                                                                    </TableCell>
                                                                                    <TableCell>
                                                                                        <div className="flex items-center gap-2">
                                                                                            <FaCalendarAlt className="text-gray-400" />
                                                                                            {`${day}.${month}.${year}`}
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
                                                              </CardBody>
                                                          </Card>
                                                      </motion.div>
                                                    );
                                                }
                                                return null;
                                            })}
                                        </AnimatePresence>
                                    </div>
                                </motion.div>
                              )}
                          </AnimatePresence>
                      </CardBody>
                  </Card>
                ))}
            </div>
          )}
      </div>
    );
};

export default TeacherMarksPage;