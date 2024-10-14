import React, { useState, useEffect } from "react";
import { useSelector } from 'react-redux';
import { RootState } from '../../app/store';
import { useCurrentQuery, useUpdateUserMutation } from "../../app/services/userApi";
import { Button, Input, Spinner, Card, CardHeader, CardBody, Divider } from "@nextui-org/react";
import { ErrorMessage } from '../../components/error-message';

export const ProfilePage = () => {
    const { data: currentUser, isLoading: isLoadingCurrent, error: currentError } = useCurrentQuery(); // Загружаем текущего пользователя
    const [updateUser, { isLoading: isUpdating, error: updateError }] = useUpdateUserMutation(); // Мутация для обновления данных
    const [userData, setUserData] = useState({
        name: currentUser?.name || "", // Строковые поля для формы
        email: currentUser?.email || "",
        avatarUrl: currentUser?.avatarUrl || "",
    });
    const [isEditing, setIsEditing] = useState(false); // Управление режимом редактирования
    const token = useSelector((state: RootState) => state.auth.token); // Получаем токен пользователя из store

    useEffect(() => {
        if (currentUser) {
            setUserData({
                name: currentUser.name || "",
                email: currentUser.email || "",
                avatarUrl: currentUser.avatarUrl || "",
            });
        }
    }, [currentUser]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setUserData((prev) => ({ ...prev, [name]: value }));
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]; // Получаем файл из инпута
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setUserData((prev) => ({ ...prev, avatarUrl: reader.result as string })); // Обновляем состояние аватара
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUpdate = async () => {
        if (currentUser && token) {
            const formData = new FormData();
            formData.append("name", userData.name);
            formData.append("email", userData.email);
            if (userData.avatarUrl) {
                formData.append("avatarUrl", userData.avatarUrl);
            }

            try {
                await updateUser({ userData: formData, id: currentUser.id }).unwrap();
                setIsEditing(false);
            } catch (error) {
                console.error('Ошибка при обновлении профиля:', error);
            }
        }
    };

    if (isLoadingCurrent) return <Spinner aria-label="Загрузка профиля..." />;
    if (currentError) return <ErrorMessage error="Ошибка при загрузке профиля." />;
    if (updateError) return <ErrorMessage error="Ошибка при обновлении профиля." />;

    return (
        <div className="profile-page">
            <h1 className="text-xl font-bold mb-4">Профиль пользователя</h1>
            <Card>
                <CardHeader>
                    <h2 className="font-semibold text-lg">Информация</h2>
                </CardHeader>
                <Divider />
                <CardBody>
                    {/* Аватар */}
                    {userData.avatarUrl || currentUser?.avatarUrl ? (
                        <img
                            src={userData.avatarUrl || currentUser?.avatarUrl}
                            alt="Avatar"
                            style={{ width: "100px", height: "100px", borderRadius: "50%" }}
                        />
                    ) : null}

                    {isEditing ? (
                        <>
                            <Input
                                type="file"
                                accept="image/*"
                                onChange={handleAvatarChange}
                            />
                            <Input
                                label="Имя"
                                name="name"
                                value={userData.name}
                                onChange={handleChange}
                            />
                            <Input
                                label="Email"
                                name="email"
                                value={userData.email}
                                onChange={handleChange}
                            />
                        </>
                    ) : (
                        <>
                            <p><strong>Имя:</strong> {currentUser?.name}</p>
                            <p><strong>Email:</strong> {currentUser?.email}</p>
                        </>
                    )}
                </CardBody>
                <Divider />
                <div className="card-footer">
                    {!isEditing ? (
                        <Button onClick={() => setIsEditing(true)}>
                            Изменить
                        </Button>
                    ) : (
                        <Button onClick={handleUpdate} disabled={isUpdating}>
                            Применить изменения
                        </Button>
                    )}
                </div>
            </Card>
        </div>
    );
};
