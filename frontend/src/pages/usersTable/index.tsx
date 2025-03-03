//@ts-nocheck
import React, { useEffect, useState } from "react";
import {
    useGetUsersQuery,
    useDeleteUserMutation,
    useUpdateUserMutation,
    useGetAllClassesQuery,
    useAddUserToClassMutation,
    useRemoveUserFromClassMutation,
} from "../../app/services/userApi";
import {
    Table,
    Select,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    TableHeader,
    SelectItem,
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
    Avatar,
    Chip,
    Alert,
    Pagination,
} from "@nextui-org/react";
import { ErrorMessage } from "../../components/error-message";
import { FaRegEdit } from "react-icons/fa";
import { MdDeleteForever } from "react-icons/md";
import { HiOutlineDotsVertical } from "react-icons/hi";
import { User, Role } from "../../app/types";

export const UsersPage = () => {
    const { data: users, isLoading, error, refetch } = useGetUsersQuery();
    const [deleteUser] = useDeleteUserMutation();
    const [updateUser] = useUpdateUserMutation();
    const [addUserToClass] = useAddUserToClassMutation();
    const [removeUserFromClass] = useRemoveUserFromClassMutation();
    const { data: classes = [] } = useGetAllClassesQuery();

    const [searchTerm, setSearchTerm] = useState("");
    const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
    const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
    const [userData, setUserData] = useState<User | null>(null);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
    const [userToManageClass, setUserToManageClass] = useState<User | null>(null);

    const [alertMessage, setAlertMessage] = useState<string | null>(null);
    const [alertType, setAlertType] = useState<"success" | "danger">("success");

    const [currentPage, setCurrentPage] = useState(1);
    const usersPerPage = 10;

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setAvatarFile(file);
        }
    };

    const handleRemoveUserFromClass = async (classId: string, userId: string) => {
        try {
            await removeUserFromClass({ classId, userId }).unwrap();
            showSuccessAlert("Пользователь успешно удален из класса");
            refetch();
        } catch (error) {
            showErrorAlert("Ошибка при удалении пользователя из класса");
        }
    };

    const handleDelete = async () => {
        if (userToDelete?.id) {
            try {
                await deleteUser(userToDelete.id).unwrap();
                setIsDeleteModalOpen(false);
                setUserToDelete(null);
                showSuccessAlert("Пользователь успешно удален");
                refetch();
            } catch (error) {
                showErrorAlert("Ошибка при удалении пользователя");
            }
        }
    };

    const handleEditClick = (user: User) => {
        setUserData(user);
    };

    const handleDeleteClick = (user: User) => {
        setUserToDelete(user);
        setIsDeleteModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (userData && userData.id) {
            const formData = new FormData();
            formData.append("email", userData.email || "");
            formData.append("name", userData.name || "");
            formData.append("role", userData.role || "");

            if (avatarFile) {
                formData.append("avatar", avatarFile);
            }

            try {
                console.log(avatarFile)
                await updateUser({
                    userData: formData,
                    id: userData.id,
                }).unwrap();
                setUserData(null);
                setAvatarFile(null);
                showSuccessAlert("Пользователь успешно обновлен");
                refetch();
            } catch (error) {
                showErrorAlert("Ошибка при обновлении пользователя");
            }
        } else {
            showErrorAlert("Недостаточно данных для обновления пользователя");
        }
    };

    const handleAddUserToClass = async () => {
        if (!userToManageClass?.id) {
            showErrorAlert("Пожалуйста, выберите валидного пользователя.");
            return;
        }

        if (!selectedClassId) {
            showErrorAlert("Пожалуйста, выберите валидный класс.");
            return;
        }

        try {
            await addUserToClass({
                userId: userToManageClass.id,
                classId: selectedClassId,
            }).unwrap();
            showSuccessAlert("Пользователь успешно добавлен в класс");
            setSelectedClassId(null);
            refetch();
        } catch (error) {
            showErrorAlert("Ошибка при добавлении пользователя в класс");
        }
    };

    const showSuccessAlert = (message: string) => {
        setAlertMessage(message);
        setAlertType("success");
        setTimeout(() => setAlertMessage(null), 5000);
    };

    const showErrorAlert = (message: string) => {
        setAlertMessage(message);
        setAlertType("danger");
        setTimeout(() => setAlertMessage(null), 5000);
    };

    if (isLoading) return <Spinner />;
    if (error) return <ErrorMessage message="Ошибка при загрузке пользователей" />;

    // Фильтрация пользователей
    const filteredUsers =
      users?.filter((user) =>
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.classes &&
          user.classes.some((cls) =>
            cls.name?.toLowerCase().includes(searchTerm.toLowerCase())
          ))
      ) ?? [];

    const sortedUsers = filteredUsers.filter((user) => {
        if (selectedRoles.length > 0 && !selectedRoles.includes(user.role)) {
            return false;
        }

        if (
          selectedClasses.length > 0 &&
          !selectedClasses.some((clsId) =>
            user.classes?.some((cls) => cls.id === clsId)
          )
        ) {
            return false;
        }

        return true;
    });

    const indexOfLastUser = currentPage * usersPerPage;
    const indexOfFirstUser = indexOfLastUser - usersPerPage;
    const currentUsers = sortedUsers.slice(indexOfFirstUser, indexOfLastUser);

    return (
      <>
          {alertMessage && (
            <Alert color={alertType}>{alertMessage}</Alert>
          )}

      <div className="mb-4 flex gap-4 items-center">
          <Input
            placeholder="Поиск..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-1/3"
          />

          {/* Filter by Role */}
          <Select
            label="Роль"
            selectionMode="multiple"
            selectedKeys={selectedRoles}
            onSelectionChange={(keys) => setSelectedRoles(Array.from(keys) as string[])}
            className="w-1/3 mt-5"
          >
              <SelectItem key="ADMIN" value="ADMIN">
                  Администратор
              </SelectItem>
              <SelectItem key="TEACHER" value="TEACHER">
                  Учитель
              </SelectItem>
              <SelectItem key="STUDENT" value="STUDENT">
                  Ученик
              </SelectItem>
          </Select>

          {/* Filter by Classes */}
          <Select
            label="Класс"
            selectionMode="multiple"
          selectedKeys={selectedClasses}
          onSelectionChange={(keys) => setSelectedClasses(Array.from(keys) as string[])}
          className="w-1/3 mt-5"
          >
          {classes.map((cls) => (
            <SelectItem key={cls.id} value={cls.id}>
                {cls.name}
            </SelectItem>
          ))}
      </Select>
      </div>

    {/* Users Table */}
    <Table>
        <TableHeader>
            <TableColumn>Аватар</TableColumn>
            <TableColumn>Имя</TableColumn>
            <TableColumn>Email</TableColumn>
            <TableColumn>Роль</TableColumn>
            <TableColumn>Классы</TableColumn>
            <TableColumn>Действия</TableColumn>
        </TableHeader>
        <TableBody>
            {currentUsers.map((item) => (
              <TableRow key={item.id}>
                  <TableCell>
                      {item.avatarUrl ? (
                        <Avatar src={item.avatarUrl} />
                      ) : (
                        "Нет аватара"
                      )}
                  </TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.email}</TableCell>
                  <TableCell>
                      {item.role === "ADMIN" && "Администратор"}
                      {item.role === "TEACHER" && "Учитель"}
                      {item.role === "STUDENT" && "Ученик"}
                  </TableCell>
                  <TableCell>
                      {item.classes?.length > 0
                        ? item.classes.map((cls) => cls.name).join(", ")
                        : "Без класса"}
                  </TableCell>
                  <TableCell>
                      <Dropdown>
                          <DropdownTrigger>
                              <Button variant="flat" size="sm">
                                  <HiOutlineDotsVertical />
                              </Button>
                          </DropdownTrigger>
                          <DropdownMenu>
                              <DropdownItem onClick={() => handleEditClick(item)}>
                                  Редактировать
                              </DropdownItem>
                              <DropdownItem
                                onClick={() => handleDeleteClick(item)}
                                color="danger"
                              >
                                  Удалить
                              </DropdownItem>
                              {item.role === "STUDENT" && (
                                <>
                                    <DropdownItem
                                      onClick={() => {
                                          setUserToManageClass(item);
                                          setSelectedClassId(null);
                                      }}
                                    >
                                        Добавить в класс
                                    </DropdownItem>
                                    {item.classes?.map((cls) => (
                                      <DropdownItem
                                        key={cls.id}
                                        onClick={() =>
                                           handleRemoveUserFromClass(cls.id, item.id)
                                        }
                                        color="warning"
                                      >
                                          Удалить из класса {cls.name}
                                      </DropdownItem>
                                    ))}
                                </>
                              )}
                          </DropdownMenu>
                      </Dropdown>
                  </TableCell>
              </TableRow>
            ))}
        </TableBody>
    </Table>

    {/* Pagination */}
    <div className="flex justify-center mt-4">
        <Pagination
          isCompact
          showControls
          total={Math.ceil(sortedUsers.length / usersPerPage)}
          initialPage={1}
          onChange={(page) => setCurrentPage(page)}
        />
    </div>

    {/* Edit User Modal */}
          <Modal isOpen={!!userData} onClose={() => setUserData(null)}>
              <ModalContent>
                  <ModalHeader>Редактирование пользователя</ModalHeader>
                  <ModalBody>
                      {userData && (
                        <>
                            <Input
                              label="Имя"
                              value={userData.name || ""}
                              onChange={(e) =>
                                setUserData({ ...userData, name: e.target.value })
                              }
                              required
                              className="mb-4"
                            />
                            <Input
                              label="Email"
                              value={userData.email || ""}
                              onChange={(e) =>
                                setUserData({ ...userData, email: e.target.value })
                              }
                              required
                              className="mb-4"
                            />
                            <Select
                              label="Роль"
                              value={userData.role || ""}
                              onChange={(e) =>
                                setUserData({ ...userData, role: e.target.value as Role })
                              }
                              className="w-full p-2  rounded-md bg-white shadow-sm focus:outline-none focus:ring-1  "
                            >
                                <SelectItem key="ADMIN" value="ADMIN">
                                    Администратор
                                </SelectItem>
                                <SelectItem key="TEACHER" value="TEACHER">
                                    Учитель
                                </SelectItem>
                                <SelectItem key="STUDENT" value="STUDENT">
                                    Ученик
                                </SelectItem>
                            </Select>

                            {/* Поле для загрузки аватара с использованием компонентов NextUI */}
                            <div className="mt-4">
                                <div className="flex items-center gap-4">
                                    <Button
                                      as="label"
                                      htmlFor="avatar-upload"
                                      color="primary"
                                      variant="bordered"
                                      className="cursor-pointer"
                                    >
                                        Загрузить фото
                                    </Button>
                                    <input
                                      id="avatar-upload"
                                      type="file"
                                      accept="image/*"
                                      onChange={handleImageChange}
                                      className="hidden"
                                    />
                                    {avatarFile && (
                                      <Avatar
                                        src={URL.createObjectURL(avatarFile)}
                                        alt="Preview"
                                        size="lg"
                                      />
                                    )}
                                </div>
                            </div>
                        </>
                      )}
                  </ModalBody>
                  <ModalFooter>
                      <Button onClick={handleSubmit}>Сохранить изменения</Button>
                      <Button color="danger" onClick={() => setUserData(null)}>
                          Отмена
                      </Button>
                  </ModalFooter>
              </ModalContent>
          </Modal>
          {/* Delete User Confirmation Modal */}
    <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)}>
        <ModalContent>
            <ModalHeader>Подтверждение удаления</ModalHeader>
            <ModalBody>
                Вы действительно хотите удалить пользователя "{userToDelete?.name}"?
            </ModalBody>
            <ModalFooter>
                <Button color="danger" onClick={handleDelete}>
                    Удалить
                </Button>
                <Button onClick={() => setIsDeleteModalOpen(false)}>Отмена</Button>
            </ModalFooter>
        </ModalContent>
    </Modal>

    {/* Add User to Class Modal */}
    <Modal
      isOpen={!!userToManageClass}
      onClose={() => setUserToManageClass(null)}
    >
        <ModalContent>
            <ModalHeader>Добавление пользователя в класс</ModalHeader>
            <ModalBody>
                <Select
                  value={selectedClassId || ""}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full p-2 border rounded-md bg-white shadow-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                >
                    <SelectItem key="all" value="">
                        Выберите класс...
                    </SelectItem>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                          {cls.name}
                      </SelectItem>
                    ))}
                </Select>
            </ModalBody>
            <ModalFooter>
                <Button onClick={handleAddUserToClass}>Добавить</Button>
                <Button onClick={() => setUserToManageClass(null)}>Отмена</Button>
            </ModalFooter>
        </ModalContent>
    </Modal>
</>
);
};
