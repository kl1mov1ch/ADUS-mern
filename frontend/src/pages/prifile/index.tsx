//@ts-nocheck
import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../app/store";
import { useCurrentQuery, useUpdateUserAvatarMutation } from "../../app/services/userApi";
import {
    Button,
    Spinner,
    Card,
    CardHeader,
    CardBody,
    Divider,
    Input,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    useDisclosure,
    Avatar,
    Chip,
    Tooltip,
    Image
} from "@nextui-org/react";
import { jwtDecode } from "jwt-decode";
import { ErrorMessage } from "../../components/error-message";
import { motion } from "framer-motion";
import { CiEdit } from "react-icons/ci";
import { FaUserCircle, FaRegUser } from "react-icons/fa";
import { MdEmail, MdVerified } from "react-icons/md";
import { RiShieldUserLine } from "react-icons/ri";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface DecodedToken {
    id: string;
    role?: string;
}

export const ProfilePage = () => {
    const { data: currentUser, isLoading: isLoadingCurrent, error: currentError, refetch } = useCurrentQuery();
    const [updateAvatar, { isLoading: isUpdating }] = useUpdateUserAvatarMutation();
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const { isOpen, onOpen, onClose } = useDisclosure();

    const token = useSelector((state: RootState) => state.auth.token);
    const decodedToken: DecodedToken | null = token ? jwtDecode<DecodedToken>(token) : null;
    const userId = decodedToken?.id;
    const userRole = decodedToken?.role || "USER";

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Проверка типа файла
            if (!file.type.match('image.*')) {
                toast.error('Пожалуйста, выберите изображение (JPEG, PNG)');
                return;
            }

            // Проверка размера файла (максимум 5MB)
            if (file.size > 5 * 1024 * 1024) {
                toast.error('Размер файла не должен превышать 5MB');
                return;
            }

            setAvatarFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleAvatarUpdate = async () => {
        if (!avatarFile || !userId) {
            toast.error("Файл не выбран или пользователь не определен");
            return;
        }

        try {
            await updateAvatar({ userId, avatar: avatarFile }).unwrap();
            toast.success("Аватар успешно обновлен!", {
                position: "top-right",
                autoClose: 3000,
            });
            refetch();
            onClose();
            setPreviewUrl(null);
            setAvatarFile(null);
        } catch (error) {
            toast.error("Ошибка при обновлении аватара", {
                position: "top-right",
                autoClose: 3000,
            });
            console.error("Update avatar error:", error);
        }
    };

    useEffect(() => {
        // Очистка объекта URL при размонтировании
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    if (isLoadingCurrent) return (
      <div className="flex justify-center items-center h-screen">
          <Spinner size="lg" color="primary" aria-label="Загрузка профиля..." />
      </div>
    );

    if (currentError) return <ErrorMessage error="Ошибка при загрузке профиля." />;

    const roleColors = {
        ADMIN: "bg-gradient-to-r from-red-500 to-pink-500",
        TEACHER: "bg-gradient-to-r from-blue-500 to-cyan-500",
        STUDENT: "bg-gradient-to-r from-green-500 to-emerald-500",
        USER: "bg-gradient-to-r from-gray-500 to-slate-500"
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-center py-8 px-4"
      >
          <Card className="w-full max-w-2xl p-6 shadow-lg rounded-2xl border-3 bg-gradient-to-br from-white to-gray-100 dark:from-gray-800 dark:to-gray-900">
              <CardHeader className="flex flex-col items-center pb-0">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="relative group"
                  >
                      {currentUser?.avatarUrl ? (
                        <Image
                          src={currentUser.avatarUrl}
                          alt="Аватар"
                          className="w-32 h-32 object-cover rounded-full border-4 border-white dark:border-gray-700"
                        />
                      ) : (
                        <Avatar
                          icon={<FaUserCircle className="w-20 h-20" />}
                          className="w-32 h-32 text-large border-4 border-white dark:border-gray-700"
                        />
                      )}
                      <Tooltip content="Изменить аватар" placement="bottom">
                          <Button
                            isIconOnly
                            radius="full"
                            size="sm"
                            className="z-[100] absolute bottom-0 right-0 bg-blue-500 text-white shadow-lg group-hover:scale-110 transition-transform"
                            onPress={onOpen}
                          >
                              <CiEdit size={20} />
                          </Button>
                      </Tooltip>
                  </motion.div>

                  <div className="mt-4 text-center">
                      <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                          {currentUser?.name}
                      </h2>
                      <Chip
                        className={`mt-2 text-white ${roleColors[userRole]}`}
                        startContent={<RiShieldUserLine size={16} />}
                      >
                          {userRole === "ADMIN" && "Администратор"}
                          {userRole === "TEACHER" && "Преподаватель"}
                          {userRole === "STUDENT" && "Ученик"}
                          {userRole === "USER" && "Пользователь"}
                      </Chip>
                  </div>
              </CardHeader>

              <Divider className="my-6" />

              <CardBody className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <motion.div
                        whileHover={{ scale: 1.01 }}
                        className="bg-white dark:bg-gray-700 p-4 rounded-xl shadow-sm"
                      >
                          <div className="flex items-center space-x-3">
                              <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900">
                                  <FaRegUser className="text-blue-600 dark:text-blue-300" size={20} />
                              </div>
                              <div>
                                  <p className="text-sm text-gray-500 dark:text-gray-300">Имя пользователя</p>
                                  <p className="font-medium">{currentUser?.name}</p>
                              </div>
                          </div>
                      </motion.div>

                      <motion.div
                        whileHover={{ scale: 1.01 }}
                        className="bg-white dark:bg-gray-700 p-4 rounded-xl shadow-sm"
                      >
                          <div className="flex items-center space-x-3">
                              <div className="p-2 rounded-full bg-green-100 dark:bg-green-900">
                                  <MdEmail className="text-green-600 dark:text-green-300" size={20} />
                              </div>
                              <div>
                                  <p className="text-sm text-gray-500 dark:text-gray-300">Электронная почта</p>
                                  <div className="flex items-center">
                                      <p className="font-medium">{currentUser?.email}</p>
                                      {currentUser?.isVerified && (
                                        <Tooltip content="Подтверждён">
                                            <MdVerified className="ml-2 text-blue-500" size={20} />
                                        </Tooltip>
                                      )}
                                  </div>
                              </div>
                          </div>
                      </motion.div>
                  </div>
              </CardBody>

              {/* Модальное окно для изменения аватара */}
              <Modal isOpen={isOpen} onClose={onClose} backdrop="blur">
                  <ModalContent>
                      {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1">Изменить аватар</ModalHeader>
                            <ModalBody>
                                <div className="flex flex-col items-center gap-4">
                                    {previewUrl ? (
                                      <img
                                        src={previewUrl}
                                        alt="Предпросмотр"
                                        className="w-32 h-32 rounded-full object-cover border-4 border-blue-500"
                                      />
                                    ) : (
                                      <Avatar
                                        src={currentUser?.avatarUrl}
                                        className="w-32 h-32 border-4 border-gray-200"
                                        icon={<FaUserCircle className="w-20 h-20" />}
                                      />
                                    )}
                                    <Input
                                      type="file"
                                      accept="image/jpeg, image/png"
                                      onChange={handleFileChange}
                                      label="Выберите изображение"
                                      variant="bordered"
                                      description="Поддерживаются JPG и PNG, размером до 5MB"
                                    />
                                </div>
                            </ModalBody>
                            <ModalFooter>
                                <Button color="danger" variant="light" onPress={onClose}>
                                    Отмена
                                </Button>
                                <Button
                                  color="primary"
                                  onPress={handleAvatarUpdate}
                                  isLoading={isUpdating}
                                  isDisabled={!avatarFile}
                                >
                                    {isUpdating ? "Сохранение..." : "Сохранить"}
                                </Button>
                            </ModalFooter>
                        </>
                      )}
                  </ModalContent>
              </Modal>
          </Card>
      </motion.div>
    );
};