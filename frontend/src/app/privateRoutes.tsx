import React from 'react';
import { Navigate, Outlet } from 'react-router-dom'; // Импортируем Navigate и Outlet
import { useSelector } from 'react-redux';
import { selectIsAuthenticated } from '../features/user/userSlice';

const RequireAuth: React.FC = () => {
    const isAuthenticated = useSelector(selectIsAuthenticated);

    if (!isAuthenticated) {
        return <Navigate to="/auth" replace />;
    }
    return <Outlet />;
}; 

export default RequireAuth;
