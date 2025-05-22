//@ts-nocheck
import React, { useState, useEffect } from "react";
import {
  useGetAllCategoriesQuery,
  useCreateCategoryMutation,
  useDeleteCategoryMutation,
  useCreateSubcategoryMutation,
  useDeleteSubcategoryMutation,
  useUpdateCategoryMutation,
  useUpdateSubcategoryMutation,
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
  Pagination,
  Chip,
  Progress,
  Image
} from "@nextui-org/react";
import { RiDeleteBinLine, RiEdit2Line, RiAddLine, RiSearchLine } from "react-icons/ri";
import { TbCategoryPlus } from "react-icons/tb";
import { ErrorMessage } from "../../components/error-message";
import { GoBack } from "../../components/go-back";
import { FaCheckCircle, FaTimesCircle, FaInfoCircle } from "react-icons/fa";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export const CategorySubcategoryPage = () => {
  const { data: categories, error, isLoading, refetch } = useGetAllCategoriesQuery();
  const [createCategory] = useCreateCategoryMutation();
  const [deleteCategory] = useDeleteCategoryMutation();
  const [createSubcategory] = useCreateSubcategoryMutation();
  const [deleteSubcategory] = useDeleteSubcategoryMutation();
  const [updateCategory] = useUpdateCategoryMutation();
  const [updateSubcategory] = useUpdateSubcategoryMutation();

  const [newCategoryName, setNewCategoryName] = useState("");
  const [editCategoryName, setEditCategoryName] = useState("");
  const [newSubcategoryName, setNewSubcategoryName] = useState("");
  const [editSubcategoryName, setEditSubcategoryName] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingSubcategoryId, setEditingSubcategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const rowsPerPage = 5;

  const { isOpen: isCategoryModalOpen, onOpen: openCategoryModal, onClose: closeCategoryModal } = useDisclosure();
  const { isOpen: isSubcategoryModalOpen, onOpen: openSubcategoryModal, onClose: closeSubcategoryModal } = useDisclosure();
  const { isOpen: isDeleteModalOpen, onOpen: openDeleteModal, onClose: closeDeleteModal } = useDisclosure();
  const [itemToDelete, setItemToDelete] = useState<{ type: 'category' | 'subcategory', id: string } | null>(null);

  useEffect(() => {
    if (editingCategoryId && categories) {
      const category = categories.find((cat) => cat.id === editingCategoryId);
      if (category) setEditCategoryName(category.name);
    }
  }, [editingCategoryId, categories]);

  if (isLoading) return (
    <div className="flex justify-center items-center h-screen">
      <Spinner size="lg" aria-label="Загружаем данные..." />
    </div>
  );

  if (error) return <ErrorMessage error="Ошибка при загрузке данных." />;

  const filteredCategories = categories?.filter(category =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.subcategories.some(subcategory => subcategory.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .slice((page - 1) * rowsPerPage, page * rowsPerPage));

  const handleCreateCategory = async () => {
    try {
      await createCategory({ name: newCategoryName }).unwrap();
      setNewCategoryName("");
      closeCategoryModal();
      refetch();
      toast.success("Предмет успешно создан!", {
        position: "top-center",
        autoClose: 3000,
      });
    } catch (err) {
      toast.error("Ошибка при создании предмета", {
        position: "top-center",
      });
    }
  };

  const handleUpdateCategory = async () => {
    try {
      await updateCategory({ categoryId: editingCategoryId, name: editCategoryName }).unwrap();
      setEditingCategoryId(null);
      setEditCategoryName("");
      closeCategoryModal();
      refetch();
      toast.success("Предмет успешно обновлен!", {
        position: "top-center",
        autoClose: 3000,
      });
    } catch (err) {
      toast.error("Ошибка при обновлении предмета", {
        position: "top-center",
      });
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      await deleteCategory(categoryId).unwrap();
      refetch();
      toast.success("Предмет успешно удален!", {
        position: "top-center",
        autoClose: 3000,
      });
    } catch (err) {
      toast.error("Ошибка при удалении предмета", {
        position: "top-center",
      });
    }
  };

  const handleCreateSubcategory = async () => {
    try {
      await createSubcategory({ name: newSubcategoryName, categoryId: editingCategoryId }).unwrap();
      setNewSubcategoryName("");
      closeSubcategoryModal();
      refetch();
      toast.success("Тема успешно создана!", {
        position: "top-center",
        autoClose: 3000,
      });
    } catch (err) {
      toast.error("Ошибка при создании темы", {
        position: "top-center",
      });
    }
  };

  const handleUpdateSubcategory = async () => {
    try {
      await updateSubcategory({ id: editingSubcategoryId, name: editSubcategoryName }).unwrap();
      setEditingSubcategoryId(null);
      setEditSubcategoryName("");
      closeSubcategoryModal();
      refetch();
      toast.success("Тема успешно обновлена!", {
        position: "top-center",
        autoClose: 3000,
      });
    } catch (err) {
      toast.error("Ошибка при обновлении темы", {
        position: "top-center",
      });
    }
  };

  const handleDeleteSubcategory = async (subcategoryId: string) => {
    try {
      await deleteSubcategory(subcategoryId).unwrap();
      refetch();
      toast.success("Тема успешно удалена!", {
        position: "top-center",
        autoClose: 3000,
      });
    } catch (err) {
      toast.error("Ошибка при удалении темы", {
        position: "top-center",
      });
    }
  };

  const handleDeleteConfirmation = () => {
    if (itemToDelete) {
      if (itemToDelete.type === 'category') {
        handleDeleteCategory(itemToDelete.id);
      } else {
        handleDeleteSubcategory(itemToDelete.id);
      }
      closeDeleteModal();
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
          Управление предметами и темами
        </h1>
      </div>

      <Card className="mb-8 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-500">
          <div className="flex justify-between items-center w-full">
            <h2 className="text-xl font-semibold text-white">Список предметов</h2>
            <Button
              onClick={openCategoryModal}
              color="none"
              variant="shadow"
              className="text-white"
              endContent={<TbCategoryPlus className="ml-2" />}
            >
              Добавить предмет
            </Button>
          </div>
        </CardHeader>
        <Divider />
        <CardBody className="p-6">
          <div className="mb-6">
            <Input
              placeholder="Поиск по предметам и темам"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              startContent={<RiSearchLine />}
              className="w-full"
            />
          </div>

          <div className="space-y-6">
            {filteredCategories?.map((category, index) => (
              <Card key={category.id} className="border-2 border-gray-200 dark:border-gray-700">
                <CardHeader className="flex justify-between items-center bg-blue-50 dark:bg-blue-900/20 p-4">
                  <div className="flex items-center gap-3">
                    <Chip color="primary" variant="dot">
                      {(page - 1) * rowsPerPage + index + 1}
                    </Chip>
                    <h3 className="text-lg font-semibold">{category.name}</h3>
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
                          key="edit-category"
                          startContent={<RiEdit2Line />}
                          onClick={() => {
                            setEditingCategoryId(category.id);
                            setEditCategoryName(category.name);
                            openCategoryModal();
                          }}
                        >
                          Редактировать
                        </DropdownItem>
                        <DropdownItem
                          key="delete-category"
                          startContent={<RiDeleteBinLine />}
                          color="danger"
                          onClick={() => {
                            setItemToDelete({ type: 'category', id: category.id });
                            openDeleteModal();
                          }}
                        >
                          Удалить
                        </DropdownItem>
                        <DropdownItem
                          key="add-subcategory"
                          startContent={<RiAddLine />}
                          onClick={() => {
                            setEditingCategoryId(category.id);
                            openSubcategoryModal();
                          }}
                        >
                          Добавить тему
                        </DropdownItem>
                      </DropdownMenu>
                    </Dropdown>
                  </div>
                </CardHeader>
                <CardBody className="p-4">
                  <div className="flex flex-wrap gap-3">
                    {category.subcategories.map((subcategory) => (
                      <div key={subcategory.id} className="relative group">
                        <Dropdown>
                          <DropdownTrigger>
                            <Chip
                              color="secondary"
                              variant="dot"
                              className="cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-900/50"
                            >
                              {subcategory.name}
                            </Chip>
                          </DropdownTrigger>
                          <DropdownMenu>
                            <DropdownItem
                              key="edit-subcategory"
                              startContent={<RiEdit2Line />}
                              onClick={() => {
                                setEditingSubcategoryId(subcategory.id);
                                setEditSubcategoryName(subcategory.name);
                                openSubcategoryModal();
                              }}
                            >
                              Редактировать
                            </DropdownItem>
                            <DropdownItem
                              key="delete-subcategory"
                              startContent={<RiDeleteBinLine />}
                              color="danger"
                              onClick={() => {
                                setItemToDelete({ type: 'subcategory', id: subcategory.id });
                                openDeleteModal();
                              }}
                            >
                              Удалить
                            </DropdownItem>
                          </DropdownMenu>
                        </Dropdown>
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>

          <div className="mt-6 flex justify-center">
            <Pagination
              total={Math.ceil((categories?.length || 0) / rowsPerPage)}
              initialPage={1}
              page={page}
              onChange={setPage}
              color="primary"
            />
          </div>
        </CardBody>
      </Card>

      {/* Модальные окна */}
      <Modal isOpen={isCategoryModalOpen} onClose={closeCategoryModal}>
        <ModalContent>
          <ModalHeader className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
            {editingCategoryId ? "Редактировать предмет" : "Создать предмет"}
          </ModalHeader>
          <ModalBody className="p-6">
            <Input
              label="Название предмета"
              value={editingCategoryId ? editCategoryName : newCategoryName}
              onChange={(e) =>
                editingCategoryId ? setEditCategoryName(e.target.value) : setNewCategoryName(e.target.value)
              }
              variant="bordered"
            />
          </ModalBody>
          <ModalFooter>
            <Button
              color="primary"
              onClick={editingCategoryId ? handleUpdateCategory : handleCreateCategory}
              endContent={editingCategoryId ? <FaCheckCircle /> : <RiAddLine />}
            >
              {editingCategoryId ? "Сохранить" : "Создать"}
            </Button>
            <Button color="default" variant="flat" onClick={closeCategoryModal}>
              Отмена
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={isSubcategoryModalOpen} onClose={closeSubcategoryModal}>
        <ModalContent>
          <ModalHeader className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
            {editingSubcategoryId ? "Редактировать тему" : "Создать тему"}
          </ModalHeader>
          <ModalBody className="p-6">
            <Input
              label="Название темы"
              value={editingSubcategoryId ? editSubcategoryName : newSubcategoryName}
              onChange={(e) =>
                editingSubcategoryId ? setEditSubcategoryName(e.target.value) : setNewSubcategoryName(e.target.value)
              }
              variant="bordered"
            />
          </ModalBody>
          <ModalFooter>
            <Button
              color="primary"
              onClick={editingSubcategoryId ? handleUpdateSubcategory : handleCreateSubcategory}
              endContent={editingSubcategoryId ? <FaCheckCircle /> : <RiAddLine />}
            >
              {editingSubcategoryId ? "Сохранить" : "Создать"}
            </Button>
            <Button color="default" variant="flat" onClick={closeSubcategoryModal}>
              Отмена
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={isDeleteModalOpen} onClose={closeDeleteModal}>
        <ModalContent>
          <ModalHeader className="bg-gradient-to-r from-red-500 to-pink-500 text-white">
            Подтверждение удаления
          </ModalHeader>
          <ModalBody className="p-6">
            <p className="text-lg">
              Вы уверены, что хотите удалить {itemToDelete?.type === 'category' ? 'предмет' : 'тему'}?
              <br />
              Это действие нельзя отменить.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" onClick={handleDeleteConfirmation} endContent={<RiDeleteBinLine />}>
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