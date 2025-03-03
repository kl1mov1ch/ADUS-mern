import { Container } from "../container";
import { Outlet } from "react-router-dom";
import { Header } from "../header";
import { NavBar } from "../nav-bar";
import { TeacherListPage } from "../../pages/teacherList";
import { ProfileCard } from "../profileCard";
import {usePersistedLocation} from "../../usePersistedLocation";
import {CalendarContainer} from "../calendar";
import ChatPage from "../../pages/chatGPT";

export const Layout = () => {
    usePersistedLocation();

    return (
        <>
            <Header />
            <Container>
                <div className="flex flex-col lg:flex-row lg:justify-between gap-4 p-4 w-full">
                    <div className="w-full">
                        <Outlet />
                    </div>
                </div>
            </Container>
        </>
    );
};
