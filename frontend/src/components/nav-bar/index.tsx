import React from "react";
import { GiNotebook } from "react-icons/gi";
import { FaBook } from "react-icons/fa6";
import { NavButton } from "../nav-button";
import { useSelector } from "react-redux";
import { RootState } from "../../app/store";
import { FaUserPlus } from "react-icons/fa";
import { IoMdCreate } from "react-icons/io";

export const NavBar: React.FC = () => {
    const user = useSelector((state: RootState) => state.auth.user);

    return (
        <nav>
            <ul className="flex flex-col gap-5">
                {/* Кнопка для всех пользователей */}
                <li>
                    <NavButton href="/tests" icon={<GiNotebook />} >
                        <span className="text-sm sm:text-base md:text-lg lg:text-xl">Тесты</span>
                    </NavButton>
                </li>

                {/* Кнопка для отметок только для учителей и студентов */}
                {(user?.role === "TEACHER" || user?.role === "STUDENT") && (
                    <li>
                        <NavButton href="/marks/:id" icon={<FaBook />}>
                            <span className="text-sm sm:text-base md:text-lg lg:text-xl">Отметки</span>
                        </NavButton>
                    </li>
                )}
                {user?.role === "ADMIN" && (
                    <li>
                        <NavButton href="/register" icon={<FaUserPlus />}>
                            <span className="text-sm sm:text-base md:text-lg lg:text-xl">Зарегистрировать</span>
                        </NavButton>
                    </li>
                )}
                {user?.role === "TEACHER" && (
                    <li>
                        <NavButton href="/test" icon={<IoMdCreate />}>
                            <span className="text-sm sm:text-base md:text-lg lg:text-xl">Создать тест</span>
                        </NavButton>
                    </li>
                )}
            </ul>
        </nav>
    );
};
