//@ts-nocheck
import React, { useState, useEffect } from 'react';
import { useGetTeachersMarksQuery } from '../../app/services/userApi';
import { Spinner, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Card, CardBody, Input, Button, Link, Select, SelectItem, Checkbox } from '@nextui-org/react';
import { ErrorMessage } from '../../components/error-message';
import { IoIosArrowUp, IoIosArrowDown, IoIosSearch, IoMdClose } from "react-icons/io";
import { motion, AnimatePresence } from 'framer-motion';
import Papa from 'papaparse';

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

const downloadCSV = (data: any[], filename: string) => {
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

// Function to process marks
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

// Format date helper function
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

// Main component
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
    const [reportPaths, setReportPaths] = useState<{ [key: string]: string }>({});
    const [selectedClasses, setSelectedClasses] = useState<{ [key: string]: string[] }>({});
    const [selectedUsers, setSelectedUsers] = useState<{ [key: string]: string[] }>({});
    const clearSearchInputs = () => {
        setSearchTerm('');
        setStudentSearchTerm('');
    };

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

        const filteredStudents = marks
          .find((test) => test.testId === testId)
          ?.students.filter((student) =>
            (selectedClassIds.length > 0
              ? student.classes.some((cls) => selectedClassIds.includes(cls.classId))
              : true) &&
            (selectedUserIds.length > 0
              ? selectedUserIds.includes(student.studentId)
              : true)
          );

        if (filteredStudents) {
            const csvData = filteredStudents.map(student => ({
                'Имя студента': student.studentName,
                'Классы': student.classes.map(cls => cls.className).join(', '),
                'Попытки': student.attempts,
                'Оценки': student.grades.map(grade => grade.grade).join(', '),
                'Даты завершения': student.grades.map(grade => formatDate(grade.completedAt).day + '.' + formatDate(grade.completedAt).month + '.' + formatDate(grade.completedAt).year).join(', ')
            }));

            const csv = Papa.unparse(csvData);
            const BOM = '\uFEFF';
            const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });

            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `Отчет_${testId}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    useEffect(() => {}, [rawMarks]);

    if (isLoading) {
        return <Spinner aria-label="Загрузка отметок..." />;
    }

    if (error) {
        return <ErrorMessage error="Ошибка при загрузке отметок." />;
    }

    const marks = processMarks(rawMarks);
    const filteredMarks = marks.filter((test: ProcessedTest) =>
      test.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const toggleExpandTest = (testId: string) => {
        setExpandedTest(expandedTest === testId ? null : testId);
    };

    const toggleExpandStudent = (studentId: string) => {
        setExpandedStudent(expandedStudent === studentId ? null : studentId);
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

          {filteredMarks.map((test) => (
            <Card key={test.testId} className="mb-4 flex">
                <CardBody className="flex">
                    <div onClick={() => toggleExpandTest(test.testId)}
                         className="cursor-pointer font-bold text-lg flex items-center">
                        {test.title}
                        <motion.div
                          className="ml-2"
                          animate={{ rotate: expandedTest === test.testId ? 180 : 0 }}
                          transition={{ duration: 0.3 }}
                        >
                            {expandedTest === test.testId ? <IoIosArrowUp /> : <IoIosArrowDown />}
                        </motion.div>
                        <span className="ml-2 text-sm black ">
                        {test.students.length} ученика(ов), {test.students.reduce((acc, student) => acc + student.attempts, 0)} попытки(ок)
                        </span>
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
                              <Input
                                isClearable
                                placeholder="Поиск ученика..."
                                startContent={<IoIosSearch />}
                                endContent={studentSearchTerm && (
                                  <IoMdClose
                                    className="cursor-pointer"
                                    onClick={() => setStudentSearchTerm('')}
                                  />
                                )}
                                value={studentSearchTerm}
                                onValueChange={setStudentSearchTerm}
                                className="mb-4 mt-2 w-1/2"
                              />

                              <Select
                                label="Выберите классы"
                                selectionMode="multiple"
                                selectedKeys={selectedClasses[test.testId] || []}
                                onSelectionChange={(keys) => setSelectedClasses((prev) => ({
                                    ...prev,
                                    [test.testId]: Array.from(keys),
                                }))}
                                className="mb-4 w-2/5 ml-auto"
                              >
                                  {test.students && test.students.length > 0 ? (
                                    <>
                                        {/* Создаем маппинг классов */}
                                        {(() => {
                                            const classMap = new Map(
                                              test.students.flatMap((s) =>
                                                s.classes.map((c) => [c.classId, c.className] as const)
                                              )
                                            );
                                            return Array.from(new Set(test.students.flatMap((s) => s.classes.map((c) => c.classId)))).map((classId) => (
                                              <SelectItem key={classId} value={classId}>
                                                  {classMap.get(classId) || 'Неизвестный класс'}
                                              </SelectItem>
                                            ));
                                        })()}
                                    </>
                                  ) : (
                                    <SelectItem>Нет доступных классов</SelectItem>
                                  )}
                              </Select>
                              <Button
                                color="success"
                                onClick={() => handleReportDownload(test.testId)}
                                className="ml-4 mt-4 mb-4 w-1/5"
                              >
                                  Скачать отчет
                              </Button>
                              <Table aria-label="Таблица студентов" className="mt-4">
                                  <TableHeader>
                                      <TableColumn>Выбрать</TableColumn>
                                      <TableColumn>Имя студента</TableColumn>
                                      <TableColumn>Попытки</TableColumn>
                                      <TableColumn>Классы</TableColumn>
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
                                        .map((student) => (
                                          <TableRow key={student.studentId}>
                                              <TableCell>
                                                  <Checkbox
                                                    isSelected={selectedUsers[test.testId]?.includes(student.studentId)}
                                                    onValueChange={() => handleUserSelection(test.testId, student.studentId)}
                                                  />
                                              </TableCell>
                                              <TableCell>{student.studentName}</TableCell>
                                              <TableCell>{student.attempts}</TableCell>
                                              <TableCell>
                                                  {student.classes.map((cls) => (
                                                    <div key={cls.classId}>{cls.className}</div>
                                                  ))}
                                              </TableCell>
                                              <TableCell>
                                                  <button
                                                    onClick={() => toggleExpandStudent(student.studentId)}
                                                    className="text-blue-600 hover:underline"
                                                  >
                                                      {expandedStudent === student.studentId ? 'Скрыть' : 'Показать'}
                                                  </button>
                                              </TableCell>
                                          </TableRow>
                                        ))}
                                  </TableBody>
                              </Table>

                              {/* Show student grades */}
                              {test.students.map((student) => {
                                  if (student.studentId === expandedStudent) {
                                      return (
                                        <motion.div
                                          key={student.studentId}
                                          initial={{ opacity: 0, height: 0 }}
                                          animate={{ opacity: 1, height: 'auto' }}
                                          exit={{ opacity: 0, height: 0 }}
                                          transition={{ duration: 0.3 }}
                                          className="overflow-hidden mt-4"
                                        >
                                            <Table aria-label="Таблица оценок">
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
                                                              <TableCell>{index + 1}</TableCell>
                                                              <TableCell>{grade.grade === 'N/A' ? 1 : grade.grade}</TableCell>
                                                              <TableCell>{`${day}.${month}.${year}`}</TableCell>
                                                              <TableCell>{time}</TableCell>
                                                          </TableRow>
                                                        );
                                                    })}
                                                </TableBody>
                                            </Table>
                                        </motion.div>
                                      );
                                  }
                                  return null;
                              })}
                          </motion.div>
                        )}
                    </AnimatePresence>
                </CardBody>
            </Card>
          ))}
      </div>
    );
};

export default TeacherMarksPage;