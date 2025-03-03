import React, { useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../app/store";
import { useCurrentQuery, useUpdateAvatarMutation } from "../../app/services/userApi";
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
} from "@nextui-org/react";
import { jwtDecode } from "jwt-decode";
import { ErrorMessage } from "../../components/error-message";

interface DecodedToken {
    id: string;
}

export const ProfilePage = () => {
    const { data: currentUser, isLoading: isLoadingCurrent, error: currentError } = useCurrentQuery();
    const [updateUser, { isLoading: isUpdating, error: updateError }] = useUpdateAvatarMutation();
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const { isOpen, onOpen, onClose } = useDisclosure();

    const token = useSelector((state: RootState) => state.auth.token);

    // Извлекаем ID из токена
    const decodedToken: DecodedToken | null = token ? jwtDecode<DecodedToken>(token) : null;
    const userId = decodedToken?.id;

    if (isLoadingCurrent) return <Spinner aria-label="Загрузка профиля..." />;
    if (currentError) return <ErrorMessage error="Ошибка при загрузке профиля." />;
    if (updateError) return <ErrorMessage error="Ошибка при обновлении аватара." />;

    return (
        <div className="flex items-start justify-center min-h-max mt-6">
            <Card className="w-full max-w-md p-6 shadow-lg border-5 rounded-lg br-4 ">
                <CardHeader className="flex justify-center">
                    <h2 className="font-semibold text-lg">Профиль</h2>
                </CardHeader>
                <Divider />
                <CardBody className="text-center">
                    {currentUser?.avatarUrl ? (
                        <img
                            src={currentUser.avatarUrl}
                            alt="Avatar"
                            style={{
                                width: "100px",
                                height: "100px",
                                borderRadius: "50%",
                                margin: "0 auto",
                            }}
                        />
                    ) : null}
                    <p className="mt-4">
                        <strong>Имя:</strong> {currentUser?.name}
                    </p>
                    <p>
                        <strong>Email:</strong> {currentUser?.email}
                    </p>
                </CardBody>
            </Card>
        </div>
    );
};
