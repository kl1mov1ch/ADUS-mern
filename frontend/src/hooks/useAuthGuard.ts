import { useEffect } from 'react';
import { useDispatch } from "react-redux";
import { setAuthentication } from '../features/user/userSlice';

export const useRestoreAuthentication = () => {
    const dispatch = useDispatch();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            dispatch(setAuthentication(true)); // Восстанавливаем состояние аутентификации
        } else {
            dispatch(setAuthentication(false)); // Если нет токена, то аутентификация ложная
        }
    }, [dispatch]);
};
