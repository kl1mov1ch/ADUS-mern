import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export const usePersistedLocation = () => {
    const location = useLocation();

    useEffect(() => {
        localStorage.setItem("lastVisitedPath", location.pathname);
    }, [location]);
};
