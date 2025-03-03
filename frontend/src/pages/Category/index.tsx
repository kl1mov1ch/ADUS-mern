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
import { motion } from 'framer-motion'; // Импортируем framer-motion


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

  const { isOpen: isCategoryModalOpen, onOpen: openCategoryModal, onClose: closeCategoryModal } = useDisclosure();
  const { isOpen: isSubcategoryModalOpen, onOpen: openSubcategoryModal, onClose: closeSubcategoryModal } = useDisclosure();

  useEffect(() => {
    if (editingCategoryId && categories) {
      const category = categories.find((cat) => cat.id === editingCategoryId);
      if (category) setEditCategoryName(category.name);
    }
  }, [editingCategoryId, categories]);

  if (isLoading) return <Spinner aria-label="Загружаем данные..." />;
  if (error) return <ErrorMessage error="Ошибка при загрузке данных." />;

  const handleCreateCategory = async () => {
    try {
      await createCategory({ name: newCategoryName }).unwrap();
      setNewCategoryName("");
      closeCategoryModal();
      refetch();
    } catch (err) {
      console.error("Ошибка при создании предмета:", err);
    }
  };

  const handleUpdateCategory = async () => {
    try {
      await updateCategory({ categoryId: editingCategoryId, name: editCategoryName }).unwrap();
      setEditingCategoryId(null);
      setEditCategoryName("");
      closeCategoryModal();
      refetch();
    } catch (err) {
      console.error("Ошибка при обновлении категории:", err);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      await deleteCategory(categoryId).unwrap();
      refetch();
    } catch (err) {
      console.error("Ошибка при удалении предмета:", err);
    }
  };

  const handleCreateSubcategory = async () => {
    try {
      await createSubcategory({ name: newSubcategoryName, categoryId: editingCategoryId }).unwrap();
      setNewSubcategoryName("");
      closeSubcategoryModal();
      refetch();
    } catch (err) {
      console.error("Ошибка при создании темы:", err);
    }
  };

  const handleUpdateSubcategory = async () => {
    try {
      await updateSubcategory({ id: editingSubcategoryId, name: editSubcategoryName }).unwrap();
      setEditingSubcategoryId(null);
      setEditSubcategoryName("");
      closeSubcategoryModal();
      refetch();
    } catch (err) {
      console.error("Ошибка при обновлении темы:", err);
    }
  };

  const handleDeleteSubcategory = async (subcategoryId: string) => {
    try {
      await deleteSubcategory(subcategoryId).unwrap();
      refetch();
    } catch (err) {
      console.error("Ошибка при удалении темы:", err);
    }
  };

  return (
    <div>
      <GoBack />
      <h1 className="text-xl font-bold mb-4">Управление предметами и темами</h1>

      <Table aria-label="Предметы и темы">
        <TableHeader>
          <TableColumn>№</TableColumn>
          <TableColumn>Предметы</TableColumn>
          <TableColumn>Темы</TableColumn>
        </TableHeader>
        <TableBody>
          {categories?.map((category, index) => (
            <TableRow key={category.id}>
              <TableCell>{index + 1}</TableCell>
              <TableCell>
                <Dropdown>
                  <DropdownTrigger>
                    <Button className='bg-secondary-300' auto flat>{category.name}</Button>
                  </DropdownTrigger>
                  <DropdownMenu>
                    <DropdownItem
                      key="edit-category"
                      icon={<RiEdit2Line />}
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
                      icon={<RiDeleteBinLine />}
                      color="danger"
                      onClick={() => handleDeleteCategory(category.id)}
                    >
                      Удалить
                    </DropdownItem>
                    <DropdownItem
                      key="add-subcategory"
                      icon={<RiAddLine />}
                      onClick={() => {
                        setEditingCategoryId(category.id);
                        openSubcategoryModal();
                      }}
                    >
                      Добавить тему
                    </DropdownItem>
                  </DropdownMenu>
                </Dropdown>
              </TableCell>
              <TableCell>
                <div className="subcategory-grid">
                  {category.subcategories.map((subcategory) => (
                    <Dropdown key={subcategory.id}>
                      <DropdownTrigger>
                        <Button className='bg-warning-300' auto flat>{subcategory.name}</Button>
                      </DropdownTrigger>
                      <DropdownMenu>
                        <DropdownItem
                          key="edit-subcategory"
                          icon={<RiEdit2Line />}
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
                          icon={<RiDeleteBinLine />}
                          color="danger"
                          onClick={() => handleDeleteSubcategory(subcategory.id)}
                        >
                          Удалить
                        </DropdownItem>
                      </DropdownMenu>
                    </Dropdown>
                  ))}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>


      <Button onClick={openCategoryModal} color="success" className="mt-4">
        Добавить предмет <TbCategoryPlus className="ml-2" />
      </Button>

      <Modal isOpen={isCategoryModalOpen} onClose={closeCategoryModal}>
        <ModalContent>
          <ModalHeader>{editingCategoryId ? "Редактировать предмет" : "Создать предмет"}</ModalHeader>
          <ModalBody>
            <Input
              label="Название предмета"
              value={editingCategoryId ? editCategoryName : newCategoryName}
              onChange={(e) =>
                editingCategoryId ? setEditCategoryName(e.target.value) : setNewCategoryName(e.target.value)
              }
            />
          </ModalBody>
          <ModalFooter>
            <Button auto onClick={editingCategoryId ? handleUpdateCategory : handleCreateCategory}>
              {editingCategoryId ? "Сохранить изменения" : "Создать предмет"}
            </Button>
            <Button auto flat color="error" onClick={closeCategoryModal}>
              Отмена
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={isSubcategoryModalOpen} onClose={closeSubcategoryModal}>
        <ModalContent>
          <ModalHeader>{editingSubcategoryId ? "Редактировать тему" : "Создать тему"}</ModalHeader>
          <ModalBody>
            <Input
              label="Название темы"
              value={editingSubcategoryId ? editSubcategoryName : newSubcategoryName}
              onChange={(e) =>
                editingSubcategoryId ? setEditSubcategoryName(e.target.value) : setNewSubcategoryName(e.target.value)
              }
            />
          </ModalBody>
          <ModalFooter>
            <Button auto onClick={editingSubcategoryId ? handleUpdateSubcategory : handleCreateSubcategory}>
              {editingSubcategoryId ? "Сохранить изменения" : "Создать тему"}
            </Button>
            <Button auto flat color="error" onClick={closeSubcategoryModal}>
              Отмена
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <style jsx="true">{`
        .subcategory-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
        }
      `}</style>
    </div>
  );
};
