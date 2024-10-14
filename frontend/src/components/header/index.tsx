import React, { useContext } from "react";
import { ThemeContext } from "../theme-provider";
import { Navbar, NavbarBrand, NavbarContent, NavbarItem, Button } from "@nextui-org/react";
import { FaRegMoon } from "react-icons/fa";
import { LuSunMedium } from "react-icons/lu";
import { CiLogout } from "react-icons/ci";
import { logout, selectIsAuthenticated } from "../../features/user/userSlice";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { selectUser } from "../../features/user/userSlice"; // Импортируем селектор для получения данных пользователя

export const Header = () => {
    const isAuthenticated = useSelector(selectIsAuthenticated);
    const user = useSelector(selectUser); // Получаем информацию о пользователе
    const { theme, toggleTheme } = useContext(ThemeContext);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleLogout = () => {
        dispatch(logout());
        localStorage.removeItem('token');
        navigate("/auth");
    };

    const handleProfileClick = () => {
        //@ts-ignore
        navigate(`/profile/${user.id}`); // Перенаправляем на страницу профиля пользователя
    };

    return (
        <Navbar>
            <NavbarBrand>
                <p className="font-bold text-inherit">ADUSK</p>
            </NavbarBrand>

            <NavbarContent justify="end">
                <NavbarItem className="lg:flex text-3xl cursor-pointer" onClick={toggleTheme}>
                    {theme === "light" ? <FaRegMoon /> : <LuSunMedium />}
                </NavbarItem>
                <NavbarItem>
                    {isAuthenticated && user && (
                        <div className="flex items-center cursor-pointer" onClick={handleProfileClick}>
                            <img
                                src={user.avatarUrl}
                                alt="Profile"
                                className="w-8 h-8 rounded-full mr-2"
                            />
                            <span>{user.name}</span>
                        </div>
                    )}
                </NavbarItem>
                <NavbarItem>
                    {isAuthenticated && (
                        <Button color="default" variant="flat" className="gap-2" onClick={handleLogout}>
                            <CiLogout /> <span>Выйти</span>
                        </Button>
                    )}
                </NavbarItem>
            </NavbarContent>
        </Navbar>
    );
};
