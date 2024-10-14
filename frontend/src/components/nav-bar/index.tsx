import React from "react";
import { GiNotebook } from "react-icons/gi";
import { FaBook } from "react-icons/fa6";
import { NavButton } from "../nav-button";
import { useSelector } from "react-redux"; // Импортируем useSelector для доступа к состоянию
import { RootState } from "../../app/store"; // Путь к RootState
import { FaUserPlus } from "react-icons/fa"; // Иконка для регистрации пользователей
import { IoMdCreate } from "react-icons/io";

export const NavBar: React.FC = () => {
    const user = useSelector((state: RootState) => state.auth.user); // Получаем информацию о пользователе из Redux

    return (
        <nav>
            <ul className="flex flex-col gap-5">
                {/* Кнопка для всех пользователей */}
                <li>
                    <NavButton href="/tests" icon={<GiNotebook />} >
                        Тесты
                    </NavButton>
                </li>

                {/* Кнопка для отметок только для учителей */}
                {user?.role === "TEACHER" || user?.role === "STUDENT" && (
                    <li>
                        <NavButton href="/marks/:id" icon={<FaBook />}>
                            Отметки
                        </NavButton>
                    </li>
                )}

                {/* Кнопка регистрации доступна для всех */}
                {user?.role === "ADMIN" && (
                    <li>
                        <NavButton href="/register" icon={<FaUserPlus />}>
                            Зарегистрировать
                        </NavButton>
                    </li>
                )}

                {/* Кнопка создания теста только для учителей */}
                {user?.role === "TEACHER" && (
                    <li>
                        <NavButton href="/test" icon={<IoMdCreate />}>
                            Создать тест
                        </NavButton>
                    </li>
                )}
            </ul>
        </nav>
    );
};
