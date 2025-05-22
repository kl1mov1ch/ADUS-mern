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
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    Avatar,
    Chip,
    Tooltip
} from "@nextui-org/react";
import { FaRegMoon, FaBook, FaUserPlus, FaUserCircle, FaCloud } from "react-icons/fa";
import { LuSunMedium } from "react-icons/lu";
import { CiLogout, CiSettings } from "react-icons/ci";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { GiNotebook } from "react-icons/gi";
import { logout, selectIsAuthenticated } from "../../features/user/userSlice";
import { MdFormatListBulletedAdd } from "react-icons/md";
import { FaListOl } from "react-icons/fa";
import { FaUsersBetweenLines } from "react-icons/fa6";
import { MdChat } from "react-icons/md";
import { motion } from "framer-motion";
import { TbSchoolBell } from "react-icons/tb";
import { useCurrentQuery } from "../../app/services/userApi.ts"

export const Header = () => {
    const isAuthenticated = useSelector(selectIsAuthenticated);
    const { theme, toggleTheme } = useContext(ThemeContext);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [activeItem, setActiveItem] = useState<string>(localStorage.getItem("activeItem") || "Тесты");
    const { data: currentUser, isLoading: isLoadingCurrent, error: currentError, refetch } = useCurrentQuery();

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
        setIsMenuOpen(false);
    };

    const menuItems = [
        { label: "Тесты", onClick: () => navigate("/tests"), icon: <GiNotebook size={20} />, roles: ["ADMIN", "TEACHER", "STUDENT"] },
        { label: "Зарегистрировать", onClick: () => navigate("/register"), icon: <FaUserPlus size={20} />, roles: ["ADMIN"] },
        { label: "Создать тест", onClick: () => navigate("/test"), icon: <MdFormatListBulletedAdd size={20} />, roles: ["TEACHER"] },
        { label: "Пользователи", onClick: () => navigate("/users"), icon: <FaUsersBetweenLines size={20} />, roles: ["ADMIN"] },
        { label: "Результаты", onClick: () => navigate(`/test-results/${userId}`), icon: <FaListOl size={20} />, roles: ["TEACHER"] },
        { label: "Чат", onClick: () => navigate("/chat"), icon: <MdChat size={18} />, roles: ["TEACHER"] },
        { label: "Отметки", onClick: () => navigate(`/student-mark/${userId}`), icon: <FaListOl size={20} />, roles: ["STUDENT"] },
        { label: "Предметы и темы", onClick: () => navigate(`/categories`), icon: <FaBook size={20} />, roles: ["ADMIN"] },
        { label: "Классы", onClick: () => navigate(`/classes`), icon: <TbSchoolBell size={20} />, roles: ["ADMIN"] },
    ];

    const filteredMenuItems = menuItems.filter(item =>
      item.roles.includes(userRole) || (userRole === "ADMIN" && !item.roles)
    );

    return (
      <Navbar isBordered maxWidth="full" className="h-16 px-4">
          {/* Мобильное меню */}
          <NavbarContent className="sm:hidden" justify="start">
              <NavbarMenuToggle
                aria-label={isMenuOpen ? "Закрыть меню" : "Открыть меню"}
                className="text-gray-600 dark:text-gray-300"
              />
          </NavbarContent>

          {/* Логотип */}
          <NavbarContent justify="start" className="hidden sm:flex">
              <NavbarBrand>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate("/")}
                    className="cursor-pointer"
                  >
                      <p className="font-bold text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                          ADUSK
                      </p>
                  </motion.div>
              </NavbarBrand>
          </NavbarContent>

          {/* Основные пункты меню (десктоп) */}
          <NavbarContent justify="center" className="hidden sm:flex gap-1">
              {filteredMenuItems.map((item, index) => (
                <NavbarItem key={index}>
                    <Tooltip content={item.label} placement="bottom" showArrow classNames={{content: "text-md p-3 shadow-xl"}}>
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                            <Button
                              isIconOnly
                              variant="light"
                              className={`w-10 h-10 ${activeItem === item.label ? "bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300" : "text-gray-600 dark:text-gray-300"}`}
                              onClick={() => handleMenuClick(item.label, item.onClick)}
                            >
                                {item.icon}
                            </Button>
                        </motion.div>
                    </Tooltip>
                </NavbarItem>
              ))}
          </NavbarContent>
          <NavbarContent justify="end" className="gap-2">
              {isAuthenticated && (
                <Dropdown placement="bottom-end">
                    <DropdownTrigger>
                        <Avatar
                          src={currentUser?.avatarUrl}
                          as="button"
                          size="md"
                          className="transition-transform hover:scale-110 opacity-100" // Явно задаем opacity-100
                          imgProps={{
                              className: "opacity-100" // Принудительно убираем анимацию для изображения
                          }}
                        />
                    </DropdownTrigger>
                    <DropdownMenu aria-label="Profile Actions">
                        <DropdownItem
                          key="profile"
                          startContent={
                              <Avatar
                                src={currentUser?.avatarUrl}
                                size="sm"
                                className="transition-transform opacity-100 mr-2 w-7 h-7"
                                imgProps={{
                                    className: "opacity-100"
                                }}
                                icon={!currentUser?.avatarUrl ? <FaUserCircle /> : undefined}
                              />
                          }
                          onClick={() => navigate(`/profile/${userId}`)}
                        >
                            Профиль
                        </DropdownItem>

                        <DropdownItem
                          key="logout"
                          color="danger"
                          startContent={<CiLogout />}
                          onClick={handleLogout}
                        >
                            Выйти
                        </DropdownItem>
                    </DropdownMenu>
                </Dropdown>
              )}
          </NavbarContent>

          <NavbarMenu className="pt-4">
              {filteredMenuItems.map((item, index) => (
                <NavbarMenuItem key={index}>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`flex items-center p-2 rounded-lg ${activeItem === item.label ? "bg-blue-100 dark:bg-blue-900/30" : ""}`}
                      onClick={() => handleMenuClick(item.label, item.onClick)}
                    >
                        <span className="mr-3 text-lg">{item.icon}</span>
                        <span>{item.label}</span>
                    </motion.div>
                </NavbarMenuItem>
              ))}
              {isAuthenticated && (
                <NavbarMenuItem>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex items-center p-2 rounded-lg text-red-500"
                      onClick={handleLogout}
                    >
                        <span className="mr-3 text-lg"><CiLogout /></span>
                        <span>Выйти</span>
                    </motion.div>
                </NavbarMenuItem>
              )}
          </NavbarMenu>
      </Navbar>
    );
};