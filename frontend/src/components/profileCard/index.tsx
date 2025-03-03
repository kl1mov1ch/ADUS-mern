import React, { useState, useEffect } from 'react';
import { useCurrentQuery, useGetTeachersQuery } from '../../app/services/userApi';
import { useNavigate } from 'react-router-dom';
import { Spinner, CardHeader, Divider, CardBody, Card, Image } from '@nextui-org/react';
import { ErrorMessage } from '../error-message';
import { IoIosSettings } from "react-icons/io";
import { motion } from 'framer-motion';

export const ProfileCard = () => {
    const { data: currentUser, isLoading: isLoadingCurrent, error: currentError } = useCurrentQuery();
    const { data: profile, error: profileError, isLoading: profileLoading } = useGetTeachersQuery();
    const navigate = useNavigate();

    const [userData, setUserData] = useState({
        name: '',
        email: '',
        avatarUrl: ''
    });

    const handleProfileClick = () => {
        if (currentUser?.id) {
            navigate(`/profile/${currentUser.id}`);
        }
    };

    useEffect(() => {
        if (currentUser) {
            setUserData({
                name: currentUser.name || '',
                email: currentUser.email || '',
                avatarUrl: currentUser.avatarUrl || ''
            });
        }
    }, [currentUser]);

    if (isLoadingCurrent || profileLoading) return <Spinner aria-label="Загружаем профиль..." />;
    if (currentError || profileError) return <ErrorMessage error="Ошибка при загрузке профиля" />;

    return (
        <div className="teacher-list-page flex flex-col items-center justify-center">
            <div className="teachers-list flex flex-col items-center">
                <Card className="w-full max-w-md">
                    <CardHeader className="relative flex justify-end pr-5">
                        <motion.div
                            whileHover={{ rotate: 360 }}
                            whileTap={{ rotate: 180 }}
                            transition={{ duration: 3, ease: "easeInOut" }}
                        >
                            <IoIosSettings
                                className="text-lg w-6 h-6 cursor-pointer"
                                onClick={handleProfileClick}
                            />
                        </motion.div>
                    </CardHeader>

                    <CardBody className="flex flex-col items-center">
                        <Image
                            isBlurred
                            width={240}
                            src={userData.avatarUrl || currentUser?.avatarUrl}
                            alt="Avatar"
                            className="mb-4"
                        />
                        <Divider className="w-full" />
                        <div className="flex flex-col mt-4 w-full px-4 items-center text-center">
                            <p className="text-lg font-semibold mb-2">{userData.name}</p>
                            <p className="text-lg text-gray-600">{userData.email}</p>
                        </div>
                    </CardBody>
                </Card>
            </div>
        </div>
    );
};
