//@ts-nocheck
import React, { useContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { ThemeContext } from "../theme-provider";
import {
    Navbar,
    NavbarBrand,
    NavbarContent,
    NavbarItem,
    Button,
    NavbarMenu,
    NavbarMenuToggle,
    NavbarMenuItem,
} from "@nextui-org/react";
import { FaRegMoon, FaBook, FaUserPlus, FaUserCircle, FaCloud } from "react-icons/fa";
import { LuSunMedium } from "react-icons/lu";
import { CiLogout } from "react-icons/ci";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { GiNotebook } from "react-icons/gi";
import { logout, selectIsAuthenticated } from "../../features/user/userSlice";
import { MdFormatListBulletedAdd } from "react-icons/md";
import { FaListOl } from "react-icons/fa";
import { FaUsersBetweenLines } from "react-icons/fa6";
import { MdChat } from "react-icons/md";
import { motion } from "framer-motion";

export const Header = () => {
    const isAuthenticated = useSelector(selectIsAuthenticated);
    const { theme, toggleTheme } = useContext(ThemeContext);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [activeItem, setActiveItem] = useState<string>(localStorage.getItem("activeItem") || "Тесты");

    const getUserRole = () => {
        const token = localStorage.getItem("token");
        if (token) {
            try {
                const decoded = jwtDecode(token);
                return decoded.role || "USER";
            } catch (error) {
                console.error("Invalid token:", error);
            }
        }
        return "USER";
    };

    const getUserId = () => {
        const token = localStorage.getItem("token");
        if (token) {
            try {
                const decoded = jwtDecode(token);
                return decoded.userId || null;
            } catch (error) {
                console.error("Invalid token:", error);
            }
        }
        return null;
    };

    const userRole = getUserRole();
    const userId = getUserId();

    const handleLogout = () => {
        dispatch(logout());
        localStorage.removeItem("token");
        localStorage.removeItem("activeItem");
        navigate("/auth");
    };

    const handleMenuClick = (label: string, onClick: () => void) => {
        setActiveItem(label);
        localStorage.setItem("activeItem", label);
        onClick();
    };

    const menuItems = [
        { label: "Тесты", onClick: () => navigate("/tests"), icon: <GiNotebook /> },
        ...(userRole === "ADMIN" ? [{ label: "Зарегистрировать", onClick: () => navigate("/register"), icon: <FaUserPlus /> }] : []),
        ...(userRole === "TEACHER" ? [{ label: "Создать тест", onClick: () => navigate("/test"), icon: <MdFormatListBulletedAdd /> }] : []),
        ...(userRole === "ADMIN" ? [{ label: "Пользователи", onClick: () => navigate("/users"), icon: <FaUsersBetweenLines /> }] : []),
        { label: "Профиль", onClick: () => navigate(`/profile/${userId}`), icon: <FaUserCircle /> },
        ...(userRole === "TEACHER" ? [{ label: "Результаты тестов", onClick: () => navigate(`/test-results/${userId}`), icon: <FaListOl /> }] : []),
        ...(userRole === "TEACHER" ? [{ label: "Чат", onClick: () => navigate("/chat"), icon: <MdChat /> }] : []),
        ...(userRole === "STUDENT" ? [{ label: "Отметки за тесты ", onClick: () => navigate(`/student-mark/${userId}`), icon: <FaListOl /> }] : []),
        ...(userRole === "ADMIN" ? [{ label: "Категории ", onClick: () => navigate(`/categories`), icon: <FaListOl /> }] : []),
        ...(userRole === "ADMIN" ? [{ label: "Классы ", onClick: () => navigate(`/classes`), icon: <FaUserPlus /> }] : []),
    ];

    return (
      <Navbar isBordered>
          <NavbarContent className="sm:hidden" justify="start">
              <NavbarMenuToggle
                aria-label={isMenuOpen ? "Закрыть меню" : "Открыть меню"}
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              />
          </NavbarContent>

          <NavbarContent justify="center" className="hidden sm:flex">
              <NavbarBrand>
                  <p className="font-bold text-inherit">ADUSK</p>
              </NavbarBrand>
          </NavbarContent>

          <NavbarContent justify="end" className="hidden sm:flex gap-5">
              {menuItems.map((item, index) => (
                <NavbarItem key={index}>
                    <motion.div
                      className="relative"
                      whileHover={{ scale: 1.05 }} // Анимация при наведении
                      whileTap={{ scale: 0.95 }} // Анимация при нажатии
                    >
                        <Button
                          variant="light" // Убираем задний фон
                          className={`flex items-center gap-2 ${activeItem === item.label ? "text-blue-500" : "text-black"}`}
                          onClick={() => handleMenuClick(item.label, item.onClick)}
                        >
                            {item.icon}
                            <span>{item.label}</span>
                        </Button>
                        {activeItem === item.label && (
                          <motion.div
                            className="absolute inset-0 border-2 border-blue-500 rounded-lg"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                          />
                        )}
                    </motion.div>
                </NavbarItem>
              ))}

              {isAuthenticated && (
                <NavbarItem>
                    <Button color="default" variant="flat" className="gap-2" onClick={handleLogout}>
                        <CiLogout /> <span>Выйти</span>
                    </Button>
                </NavbarItem>
              )}
          </NavbarContent>

          <NavbarMenu className="sm:hidden">
              {isMenuOpen && (
                <>
                    {menuItems.map((item, index) => (
                      <NavbarMenuItem key={index}>
                          <motion.div
                            className="relative"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                              <Button
                                variant="light"
                                className={`flex items-center gap-2 w-full ${activeItem === item.label ? "text-blue-500" : "text-black"}`}
                                onClick={() => handleMenuClick(item.label, item.onClick)}
                              >
                                  {item.icon}
                                  <span>{item.label}</span>
                              </Button>
                              {activeItem === item.label && (
                                <motion.div
                                  className="absolute inset-0 border-2 border-blue-500 rounded-lg"
                                  initial={{ scale: 0.9, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  exit={{ scale: 0.9, opacity: 0 }}
                                  transition={{ duration: 0.3 }}
                                />
                              )}
                          </motion.div>
                      </NavbarMenuItem>
                    ))}
                    {isAuthenticated && (
                      <>
                          <NavbarMenuItem>
                              <Button variant="flat" className="w-full bg-tranpsar" onClick={handleLogout}>
                                  <CiLogout /> <span>Выйти</span>
                              </Button>
                          </NavbarMenuItem>
                      </>
                    )}
                </>
              )}
          </NavbarMenu>
      </Navbar>
    );
};