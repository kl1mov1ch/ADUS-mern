//@ts-nocheck
import React, { useState, useEffect } from "react";
import {
  useGetAllClassesQuery,
  useCreateClassMutation,
  useDeleteClassMutation,
  useUpdateClassMutation,
} from "../../app/services/userApi";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Spinner,
  Input,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@nextui-org/react";
import { RiDeleteBinLine, RiEdit2Line, RiAddLine } from "react-icons/ri";
import { TbCategoryPlus } from "react-icons/tb";
import { ErrorMessage } from "../../components/error-message";
import { GoBack } from "../../components/go-back";

export const ClassesPage = () => {
  const { data: classes, error, isLoading, refetch } = useGetAllClassesQuery();
  const [createClass] = useCreateClassMutation();
  const [deleteClass] = useDeleteClassMutation();
  const [updateClass] = useUpdateClassMutation();

  const [newClassName, setNewClassName] = useState("");
  const [editClassName, setEditClassName] = useState("");
  const [editingClassId, setEditingClassId] = useState<string | null>(null);

  const { isOpen: isClassModalOpen, onOpen: openClassModal, onClose: closeClassModal } = useDisclosure();

  useEffect(() => {
    if (editingClassId && classes) {
      const classItem = classes.find((cls) => cls.id === editingClassId);
      if (classItem) setEditClassName(classItem.name);
    }
  }, [editingClassId, classes]);

  if (isLoading) return <Spinner aria-label="Загружаем данные..." />;
  if (error) return <ErrorMessage error="Ошибка при загрузке данных." />;

  const handleCreateClass = async () => {
    try {
      await createClass({ name: newClassName }).unwrap();
      setNewClassName("");
      closeClassModal();
      refetch();
    } catch (err) {
      console.error("Ошибка при создании класса:", err);
    }
  };

  const handleUpdateClass = async () => {
    try {
      await updateClass({ classId: editingClassId, name: editClassName }).unwrap();
      setEditingClassId(null);
      setEditClassName("");
      closeClassModal();
      refetch();
    } catch (err) {
      console.error("Ошибка при обновлении класса:", err);
    }
  };

  const handleDeleteClass = async (classId: string) => {
    try {
      await deleteClass(classId).unwrap();
      refetch();
    } catch (err) {
      console.error("Ошибка при удалении класса:", err);
    }
  };

  return (
    <div>
      <GoBack />
      <h1 className="text-xl font-bold mb-4">Управление классами</h1>

      <Table aria-label="Классы">
        <TableHeader>
          <TableColumn>№</TableColumn>
          <TableColumn>Название класса</TableColumn>
          <TableColumn>Действия</TableColumn>
        </TableHeader>
        <TableBody>
          {classes?.map((classItem, index) => (
            <TableRow key={classItem.id}>
              <TableCell>{index + 1}</TableCell>
              <TableCell>{classItem.name}</TableCell>
              <TableCell>
                <Dropdown>
                  <DropdownTrigger>
                    <Button auto flat>Действия</Button>
                  </DropdownTrigger>
                  <DropdownMenu>
                    <DropdownItem
                      key="edit-class"
                      icon={<RiEdit2Line />}
                      onClick={() => {
                        setEditingClassId(classItem.id);
                        setEditClassName(classItem.name);
                        openClassModal();
                      }}
                    >
                      Редактировать
                    </DropdownItem>
                    <DropdownItem
                      key="delete-class"
                      icon={<RiDeleteBinLine />}
                      color="danger"
                      onClick={() => handleDeleteClass(classItem.id)}
                    >
                      Удалить
                    </DropdownItem>
                  </DropdownMenu>
                </Dropdown>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Button onClick={openClassModal} color="success" className="mt-4">
        Добавить класс <TbCategoryPlus className="ml-2" />
      </Button>

      <Modal isOpen={isClassModalOpen} onClose={closeClassModal}>
        <ModalContent>
          <ModalHeader>{editingClassId ? "Редактировать класс" : "Создать класс"}</ModalHeader>
          <ModalBody>
            <Input
              label="Название класса"
              value={editingClassId ? editClassName : newClassName}
              onChange={(e) =>
                editingClassId ? setEditClassName(e.target.value) : setNewClassName(e.target.value)
              }
            />
          </ModalBody>
          <ModalFooter>
            <Button auto onClick={editingClassId ? handleUpdateClass : handleCreateClass}>
              {editingClassId ? "Сохранить изменения" : "Создать класс"}
            </Button>
            <Button auto flat color="error" onClick={closeClassModal}>
              Отмена
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};