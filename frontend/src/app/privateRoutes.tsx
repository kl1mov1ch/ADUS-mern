import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated } from '../features/user/userSlice';

export const usePersistedLocation = () => {
    const location = useLocation();

    useEffect(() => {
        if (location.pathname !== '/tests') {
            localStorage.setItem('lastVisitedPath', location.pathname);
        }
    }, [location]);
};

const RequireAuth: React.FC = () => {
    const isAuthenticated = useSelector(selectIsAuthenticated);
    const location = useLocation();
    usePersistedLocation();

    useEffect(() => {
        // Если пользователь аутентифицирован
        if (isAuthenticated) {
            const lastVisitedPath = localStorage.getItem('lastVisitedPath');
            if (lastVisitedPath && lastVisitedPath !== location.pathname) {
                window.location.href = lastVisitedPath;
            }
        }
    }, [isAuthenticated, location]);

    if (!isAuthenticated) {
        return <Navigate to="/auth" state={{ from: location }} replace />;
    }


    if (location.pathname === '/auth' || location.pathname === '/') {
        return <Navigate to="/tests" replace />;
    }

    return <Outlet />;
};

export default RequireAuth;
