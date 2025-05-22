//@ts-nocheck
import React, { useState, useEffect } from "react";
import {
  useGetAllClassesQuery,
  useCreateClassMutation,
  useDeleteClassMutation,
  useUpdateClassMutation,
} from "../../app/services/userApi";
import {
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
  Card,
  CardHeader,
  CardBody,
  Divider,
  Chip,
  Pagination,
} from "@nextui-org/react";
import { RiDeleteBinLine, RiEdit2Line, RiAddLine, RiSearchLine } from "react-icons/ri";
import { TbCategoryPlus } from "react-icons/tb";
import { ErrorMessage } from "../../components/error-message";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaCheckCircle } from "react-icons/fa";

export const ClassesPage = () => {
  const { data: classes, error, isLoading, refetch } = useGetAllClassesQuery();
  const [createClass] = useCreateClassMutation();
  const [deleteClass] = useDeleteClassMutation();
  const [updateClass] = useUpdateClassMutation();

  const [newClassName, setNewClassName] = useState("");
  const [editClassName, setEditClassName] = useState("");
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const rowsPerPage = 5;

  const { isOpen: isClassModalOpen, onOpen: openClassModal, onClose: closeClassModal } = useDisclosure();
  const { isOpen: isDeleteModalOpen, onOpen: openDeleteModal, onClose: closeDeleteModal } = useDisclosure();
  const [classToDelete, setClassToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (editingClassId && classes) {
      const classItem = classes.find((cls) => cls.id === editingClassId);
      if (classItem) setEditClassName(classItem.name);
    }
  }, [editingClassId, classes]);

  const filteredClasses = classes
    ?.filter(cls => cls.name.toLowerCase().includes(searchQuery.toLowerCase()))
    ?.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  if (isLoading) return (
    <div className="flex justify-center items-center h-screen">
      <Spinner size="lg" aria-label="Загружаем данные..." />
    </div>
  );

  if (error) return <ErrorMessage error="Ошибка при загрузке данных." />;

  const handleCreateClass = async () => {
    try {
      await createClass({ name: newClassName }).unwrap();
      setNewClassName("");
      closeClassModal();
      refetch();
      toast.success("Класс успешно создан!", {
        position: "top-center",
        autoClose: 3000,
      });
    } catch (err) {
      toast.error("Ошибка при создании класса", {
        position: "top-center",
      });
    }
  };

  const handleUpdateClass = async () => {
    try {
      await updateClass({ classId: editingClassId, name: editClassName }).unwrap();
      setEditingClassId(null);
      setEditClassName("");
      closeClassModal();
      refetch();
      toast.success("Класс успешно обновлен!", {
        position: "top-center",
        autoClose: 3000,
      });
    } catch (err) {
      toast.error("Ошибка при обновлении класса", {
        position: "top-center",
      });
    }
  };

  const handleDeleteClass = async (classId: string) => {
    try {
      await deleteClass(classId).unwrap();
      refetch();
      toast.success("Класс успешно удален!", {
        position: "top-center",
        autoClose: 3000,
      });
    } catch (err) {
      toast.error("Ошибка при удалении класса", {
        position: "top-center",
      });
    }
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
          Управление классами
        </h1>
        <p className="text-gray-600 text-center">Создавайте и управляйте классами в вашей системе</p>
      </div>

      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-500">
          <div className="flex justify-between items-center w-full">
            <h2 className="text-xl font-semibold text-white">Список классов</h2>
            <Button
              onClick={openClassModal}
              color="none"
              variant="shadow"
              className="text-white"
              endContent={<TbCategoryPlus className="ml-2" />}
            >
              Добавить класс
            </Button>
          </div>
        </CardHeader>
        <Divider />
        <CardBody className="p-6">
          <div className="mb-6">
            <Input
              placeholder="Поиск по классам"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              startContent={<RiSearchLine />}
              className="w-full"
            />
          </div>

          <div className="space-y-4">
            {filteredClasses?.map((classItem, index) => (
              <Card key={classItem.id} className="border-2 border-gray-200 dark:border-gray-700">
                <CardHeader className="flex justify-between items-center bg-blue-50 dark:bg-blue-900/20 p-4">
                  <div className="flex items-center gap-3">
                    <Chip color="primary" variant="dot">
                      {(page - 1) * rowsPerPage + index + 1}
                    </Chip>
                    <h3 className="text-lg font-semibold">{classItem.name}</h3>
                  </div>
                  <div className="flex gap-2">
                    <Dropdown>
                      <DropdownTrigger>
                        <Button isIconOnly size="sm" variant="flat" color="primary">
                          <RiEdit2Line />
                        </Button>
                      </DropdownTrigger>
                      <DropdownMenu>
                        <DropdownItem
                          key="edit-class"
                          startContent={<RiEdit2Line />}
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
                          startContent={<RiDeleteBinLine />}
                          color="danger"
                          onClick={() => {
                            setClassToDelete(classItem.id);
                            openDeleteModal();
                          }}
                        >
                          Удалить
                        </DropdownItem>
                      </DropdownMenu>
                    </Dropdown>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>

          <div className="mt-6 flex justify-center">
            <Pagination
              total={Math.ceil((classes?.length || 0) / rowsPerPage)}
              initialPage={1}
              page={page}
              onChange={setPage}
              color="primary"
            />
          </div>
        </CardBody>
      </Card>

      {/* Модальное окно создания/редактирования класса */}
      <Modal isOpen={isClassModalOpen} onClose={closeClassModal}>
        <ModalContent>
          <ModalHeader className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
            {editingClassId ? "Редактировать класс" : "Создать класс"}
          </ModalHeader>
          <ModalBody className="p-6">
            <Input
              label="Название класса"
              value={editingClassId ? editClassName : newClassName}
              onChange={(e) =>
                editingClassId ? setEditClassName(e.target.value) : setNewClassName(e.target.value)
              }
              variant="bordered"
            />
          </ModalBody>
          <ModalFooter>
            <Button
              color="primary"
              onClick={editingClassId ? handleUpdateClass : handleCreateClass}
              endContent={editingClassId ? <FaCheckCircle /> : <RiAddLine />}
            >
              {editingClassId ? "Сохранить" : "Создать"}
            </Button>
            <Button color="default" variant="flat" onClick={closeClassModal}>
              Отмена
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Модальное окно подтверждения удаления */}
      <Modal isOpen={isDeleteModalOpen} onClose={closeDeleteModal}>
        <ModalContent>
          <ModalHeader className="bg-gradient-to-r from-red-500 to-pink-500 text-white">
            Подтверждение удаления
          </ModalHeader>
          <ModalBody className="p-6">
            <p className="text-lg">
              Вы уверены, что хотите удалить этот класс?
              <br />
              Это действие нельзя отменить.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button
              color="danger"
              onClick={() => {
                if (classToDelete) {
                  handleDeleteClass(classToDelete);
                  closeDeleteModal();
                }
              }}
              endContent={<RiDeleteBinLine />}
            >
              Удалить
            </Button>
            <Button color="default" variant="flat" onClick={closeDeleteModal}>
              Отмена
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};