import React, { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Input,
  Checkbox,
  Button,
  Select,
  SelectItem,
} from "@nextui-org/react";
import { User } from "../../app/types";

interface AddStudentsToClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: User[];
  classes: { id: string; name: string }[];
  onAddToClass: (studentIds: string[], classId: string) => void;
}

export const AddStudentsToClassModal: React.FC<AddStudentsToClassModalProps> = ({
                                                                                  isOpen,
                                                                                  onClose,
                                                                                  students,
                                                                                  classes,
                                                                                  onAddToClass,
                                                                                }) => {
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const handleSelectStudent = (studentId: string) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleAddToClass = () => {
    if (selectedClass && selectedStudents.length > 0) {
      onAddToClass(selectedStudents, selectedClass);
      onClose();
    }
  };

  const filteredStudents = students.filter(
    (student) =>
      student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="3xl" backdrop="blur">
      <ModalContent>
        <ModalHeader>Добавить студентов в класс</ModalHeader>
        <ModalBody>
          <div className="flex items-center mb-4">
            <Input
              placeholder="Поиск по имени или почте"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mr-4"
            />
            <Select
              label="Выберите класс"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="max-w-xs"
            >
              {classes.map((cls) => (
                <SelectItem key={cls.id} value={cls.id}>
                  {cls.name}
                </SelectItem>
              ))}
            </Select>
          </div>
          <Table aria-label="Таблица студентов">
            <TableHeader>
              <TableColumn>Выбрать</TableColumn>
              <TableColumn>Имя</TableColumn>
              <TableColumn>Почта</TableColumn>
              <TableColumn>Роль</TableColumn>
            </TableHeader>
            <TableBody>
              {filteredStudents.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>
                    <Checkbox
                      isSelected={selectedStudents.includes(student.id)}
                      onChange={() => handleSelectStudent(student.id)}
                    />
                  </TableCell>
                  <TableCell>{student.name}</TableCell>
                  <TableCell>{student.email}</TableCell>
                  <TableCell>{student.role}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ModalBody>
        <ModalFooter>
          <Button onClick={onClose} color="danger">
            Отмена
          </Button>
          <Button onClick={handleAddToClass} color="primary">
            Добавить в класс
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};