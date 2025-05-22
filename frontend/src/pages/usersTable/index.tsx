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
    Pagination,
    Card,
    Divider,
    Badge,
    Progress,
    CardBody
} from "@nextui-org/react";
import { ErrorMessage } from "../../components/error-message";
import { FaRegEdit, FaUserPlus, FaUserMinus } from "react-icons/fa";
import { MdDeleteForever, MdOutlineClass } from "react-icons/md";
import { HiOutlineDotsVertical } from "react-icons/hi";
import { User, Role } from "../../app/types";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { IoSearch, IoClose } from "react-icons/io5";
import { FiUser, FiMail, FiUsers, FiUserCheck } from "react-icons/fi";

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

    const [currentPage, setCurrentPage] = useState(1);
    const usersPerPage = 10;

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                toast.error("Пожалуйста, загружайте только изображения", {
                    position: "top-right",
                });
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                toast.error("Размер изображения не должен превышать 5MB", {
                    position: "top-right",
                });
                return;
            }
            setAvatarFile(file);
        }
    };

    const handleRemoveUserFromClass = async (classId: string, userId: string) => {
        try {
            await removeUserFromClass({ classId, userId }).unwrap();
            toast.success("Пользователь успешно удален из класса", {
                position: "top-right",
            });
            refetch();
        } catch (error) {
            toast.error("Ошибка при удалении пользователя из класса", {
                position: "top-right",
            });
        }
    };

    const handleDelete = async () => {
        if (userToDelete?.id) {
            try {
                await deleteUser(userToDelete.id).unwrap();
                setIsDeleteModalOpen(false);
                setUserToDelete(null);
                toast.success("Пользователь успешно удален", {
                    position: "top-right",
                });
                refetch();
            } catch (error) {
                toast.error("Ошибка при удалении пользователя", {
                    position: "top-right",
                });
            }
        }
    };

    const handleEditClick = (user: User) => {
        setUserData(user);
        setAvatarFile(null);
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
                await updateUser({
                    userData: formData,
                    id: userData.id,
                }).unwrap();
                setUserData(null);
                setAvatarFile(null);
                toast.success("Пользователь успешно обновлен", {
                    position: "top-right",
                });
                refetch();
            } catch (error) {
                toast.error("Ошибка при обновлении пользователя", {
                    position: "top-right",
                });
            }
        } else {
            toast.error("Недостаточно данных для обновления пользователя", {
                position: "top-right",
            });
        }
    };

    const handleAddUserToClass = async () => {
        if (!userToManageClass?.id) {
            toast.error("Пожалуйста, выберите валидного пользователя", {
                position: "top-right",
            });
            return;
        }

        if (!selectedClassId) {
            toast.error("Пожалуйста, выберите валидный класс", {
                position: "top-right",
            });
            return;
        }

        try {
            await addUserToClass({
                userId: userToManageClass.id,
                classId: selectedClassId,
            }).unwrap();
            toast.success("Пользователь успешно добавлен в класс", {
                position: "top-right",
            });
            setSelectedClassId(null);
            setUserToManageClass(null);
            refetch();
        } catch (error) {
            toast.error("Ошибка при добавлении пользователя в класс", {
                position: "top-right",
            });
        }
    };

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

    const roleColors = {
        ADMIN: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
        TEACHER: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
        STUDENT: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    };

    if (isLoading) return (
      <div className="flex justify-center items-center h-screen">
          <Spinner size="lg" aria-label="Загружаем пользователей..." />
      </div>
    );

    if (error) return <ErrorMessage error="Ошибка при загрузке пользователей" />;

    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
          <ToastContainer
            position="top-right"
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
                  Управление пользователями
              </h1>
              <p className="text-lg text-center text-gray-600 dark:text-gray-300">
                  Просмотр и редактирование пользователей системы
              </p>
          </div>

          <Card className="mb-6 shadow-lg">
              <CardBody className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <Input
                        placeholder="Поиск пользователей..."
                        startContent={<IoSearch className="text-gray-400" />}
                        endContent={searchTerm && (
                          <IoClose
                            className="cursor-pointer text-gray-400 hover:text-gray-600"
                            onClick={() => setSearchTerm('')}
                          />
                        )}
                        value={searchTerm}
                        onValueChange={setSearchTerm}
                        variant="bordered"
                        radius="lg"
                      />

                      <Select
                        label="Фильтр по ролям"
                        selectionMode="multiple"
                        selectedKeys={selectedRoles}
                        onSelectionChange={(keys) => setSelectedRoles(Array.from(keys) as string[])}
                        variant="bordered"
                        radius="lg"
                        startContent={<FiUserCheck className="text-gray-400" />}
                      >
                          <SelectItem key="ADMIN" value="ADMIN">
                              Администраторы
                          </SelectItem>
                          <SelectItem key="TEACHER" value="TEACHER">
                              Учителя
                          </SelectItem>
                          <SelectItem key="STUDENT" value="STUDENT">
                              Ученики
                          </SelectItem>
                      </Select>

                      <Select
                        label="Фильтр по классам"
                        selectionMode="multiple"
                        selectedKeys={selectedClasses}
                        onSelectionChange={(keys) => setSelectedClasses(Array.from(keys) as string[])}
                        variant="bordered"
                        radius="lg"
                        startContent={<MdOutlineClass className="text-gray-400" />}
                      >
                          {classes.map((cls) => (
                            <SelectItem key={cls.id} value={cls.id}>
                                {cls.name}
                            </SelectItem>
                          ))}
                      </Select>
                  </div>

                  <Divider className="my-4" />

                  <Table
                    aria-label="Таблица пользователей"
                    removeWrapper
                    classNames={{
                        th: "bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent",
                        td: "py-4",
                        tr: "hover:bg-gray-200 dark:hover:bg-gray-800/50",
                    }}
                  >
                      <TableHeader>
                          <TableColumn width={50}>АВАТАР</TableColumn>
                          <TableColumn>ИМЯ</TableColumn>
                          <TableColumn>EMAIL</TableColumn>
                          <TableColumn>РОЛЬ</TableColumn>
                          <TableColumn>КЛАССЫ</TableColumn>
                          <TableColumn width={1}>ДЕЙСТВИЯ</TableColumn>
                      </TableHeader>
                      <TableBody>
                          {currentUsers.map((item) => (
                            <TableRow key={item.id}>
                                <TableCell>
                                    <Avatar
                                      src={item.avatarUrl}
                                      name={item.name}
                                      className="border-2 border-gray-200 dark:border-gray-700"
                                    />
                                </TableCell>
                                <TableCell>
                                    <div className="font-medium">{item.name}</div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                        <FiMail className="text-gray-400" />
                                        {item.email}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Chip
                                      className={`${roleColors[item.role]} font-medium`}
                                      size="sm"
                                    >
                                        {item.role === "ADMIN" && "Администратор"}
                                        {item.role === "TEACHER" && "Учитель"}
                                        {item.role === "STUDENT" && "Ученик"}
                                    </Chip>
                                </TableCell>
                                <TableCell>
                                    {item.classes?.length > 0 ? (
                                      <div className="flex flex-wrap gap-1">
                                          {item.classes.map((cls) => (
                                            <Chip
                                              key={cls.id}
                                              variant="flat"
                                              color="primary"
                                              size="sm"
                                            >
                                                {cls.name}
                                            </Chip>
                                          ))}
                                      </div>
                                    ) : (
                                      <span className="text-gray-400">Без класса</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Dropdown>
                                        <DropdownTrigger>
                                            <Button isIconOnly variant="light" size="sm">
                                                <HiOutlineDotsVertical className="text-gray-500" />
                                            </Button>
                                        </DropdownTrigger>
                                        <DropdownMenu aria-label="Действия пользователя">
                                            <DropdownItem
                                              key="edit"
                                              startContent={<FaRegEdit />}
                                              onClick={() => handleEditClick(item)}
                                            >
                                                Редактировать
                                            </DropdownItem>
                                            <DropdownItem
                                              key="delete"
                                              color="danger"
                                              startContent={<MdDeleteForever />}
                                              onClick={() => handleDeleteClick(item)}
                                            >
                                                Удалить
                                            </DropdownItem>
                                            {item.role === "STUDENT" && (
                                              <>
                                                  <DropdownItem
                                                    key="add_to_class"
                                                    startContent={<FaUserPlus />}
                                                    onClick={() => {
                                                        setUserToManageClass(item);
                                                        setSelectedClassId(null);
                                                    }}
                                                  >
                                                      Добавить в класс
                                                  </DropdownItem>
                                                  {item.classes?.map((cls) => (
                                                    <DropdownItem
                                                      key={`remove_${cls.id}`}
                                                      color="warning"
                                                      startContent={<FaUserMinus />}
                                                      onClick={() =>
                                                        handleRemoveUserFromClass(cls.id, item.id)
                                                      }
                                                    >
                                                        Удалить из {cls.name}
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

                  <Divider className="my-4" />

                  <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-500">
                          Показано {indexOfFirstUser + 1}-{Math.min(indexOfLastUser, sortedUsers.length)} из {sortedUsers.length} пользователей
                      </div>
                      <Pagination
                        isCompact
                        showControls
                        total={Math.ceil(sortedUsers.length / usersPerPage)}
                        page={currentPage}
                        onChange={setCurrentPage}
                        color="primary"
                      />
                  </div>
              </CardBody>
          </Card>

          {/* Edit User Modal */}
          <Modal isOpen={!!userData} onClose={() => setUserData(null)}>
              <ModalContent>
                  <ModalHeader className="border-b border-gray-200 dark:border-gray-700 pb-4">
                      <h2 className="text-xl font-semibold">Редактирование пользователя</h2>
                  </ModalHeader>
                  <ModalBody className="py-6">
                      {userData && (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <Input
                              label="Имя"
                              value={userData.name || ""}
                              onChange={(e) =>
                                setUserData({ ...userData, name: e.target.value })
                              }
                              required
                              startContent={<FiUser className="text-gray-400" />}
                              variant="bordered"
                              radius="lg"
                            />
                            <Input
                              label="Email"
                              value={userData.email || ""}
                              onChange={(e) =>
                                setUserData({ ...userData, email: e.target.value })
                              }
                              required
                              startContent={<FiMail className="text-gray-400" />}
                              variant="bordered"
                              radius="lg"
                            />
                            <Select
                              label="Роль"
                              selectedKeys={[userData.role]}
                              onSelectionChange={(keys) => {
                                  const selected = Array.from(keys)[0] as Role;
                                  setUserData({ ...userData, role: selected });
                              }}
                              variant="bordered"
                              radius="lg"
                              startContent={<FiUserCheck className="text-gray-400" />}
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

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Аватар</label>
                                <div className="flex items-center gap-4">
                                    <Avatar
                                      src={avatarFile ? URL.createObjectURL(avatarFile) : userData.avatarUrl}
                                      name={userData.name}
                                      size="lg"
                                      className="border-2 border-gray-200 dark:border-gray-700"
                                    />
                                    <Button
                                      as="label"
                                      htmlFor="avatar-upload"
                                      color="primary"
                                      variant="bordered"
                                      startContent={<FaRegEdit />}
                                      className="cursor-pointer"
                                    >
                                        Изменить фото
                                        <input
                                          id="avatar-upload"
                                          type="file"
                                          accept="image/*"
                                          onChange={handleImageChange}
                                          className="hidden"
                                        />
                                    </Button>
                                </div>
                            </div>
                        </form>
                      )}
                  </ModalBody>
                  <ModalFooter className="border-t border-gray-200 dark:border-gray-700 pt-4">
                      <Button color="danger" variant="light" onClick={() => setUserData(null)}>
                          Отмена
                      </Button>
                      <Button color="primary" onClick={handleSubmit}>
                          Сохранить изменения
                      </Button>
                  </ModalFooter>
              </ModalContent>
          </Modal>

          {/* Delete User Confirmation Modal */}
          <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)}>
              <ModalContent>
                  <ModalHeader className="border-b border-gray-200 dark:border-gray-700 pb-4">
                      <h2 className="text-xl font-semibold">Подтверждение удаления</h2>
                  </ModalHeader>
                  <ModalBody className="py-6">
                      <p className="text-gray-600 dark:text-gray-300">
                          Вы действительно хотите удалить пользователя <span className="font-semibold">{userToDelete?.name}</span>?
                          Это действие нельзя отменить.
                      </p>
                  </ModalBody>
                  <ModalFooter className="border-t border-gray-200 dark:border-gray-700 pt-4">
                      <Button color="default" variant="light" onClick={() => setIsDeleteModalOpen(false)}>
                          Отмена
                      </Button>
                      <Button color="danger" onClick={handleDelete}>
                          Удалить
                      </Button>
                  </ModalFooter>
              </ModalContent>
          </Modal>

          {/* Add User to Class Modal */}
          <Modal isOpen={!!userToManageClass} onClose={() => setUserToManageClass(null)}>
              <ModalContent>
                  <ModalHeader className="border-b border-gray-200 dark:border-gray-700 pb-4">
                      <h2 className="text-xl font-semibold">Добавление в класс</h2>
                  </ModalHeader>
                  <ModalBody className="py-6">
                      <p className="text-gray-600 dark:text-gray-300 mb-4">
                          Пользователь: <span className="font-semibold">{userToManageClass?.name}</span>
                      </p>
                      <Select
                        label="Выберите класс"
                        selectedKeys={selectedClassId ? [selectedClassId] : []}
                        onSelectionChange={(keys) => {
                            const selected = Array.from(keys)[0] as string;
                            setSelectedClassId(selected || null);
                        }}
                        variant="bordered"
                        radius="lg"
                        startContent={<MdOutlineClass className="text-gray-400" />}
                      >
                          {classes.map((cls) => (
                            <SelectItem key={cls.id} value={cls.id}>
                                {cls.name}
                            </SelectItem>
                          ))}
                      </Select>
                  </ModalBody>
                  <ModalFooter className="border-t border-gray-200 dark:border-gray-700 pt-4">
                      <Button color="default" variant="light" onClick={() => setUserToManageClass(null)}>
                          Отмена
                      </Button>
                      <Button color="primary" onClick={handleAddUserToClass}>
                          Добавить
                      </Button>
                  </ModalFooter>
              </ModalContent>
          </Modal>
      </div>
    );
};