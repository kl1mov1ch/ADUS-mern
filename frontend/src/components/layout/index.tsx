import { useEffect } from "react"
import { Container } from "../container"
import { Link, Outlet, useNavigate } from "react-router-dom"
import { useSelector } from "react-redux"
import { Header } from "../header"
import {NavBar} from "../nav-bar";
import {TeacherListPage} from "../../pages/teacherList";

export const Layout = () => {
    return (
        <>
            <Header />
            <Container>
                <div className="flex-2 p-4">
                    <NavBar/>
                </div>
                <div className="flex-1 p-4">
                    <Outlet />
                </div>
                <div className="flex-2 p-4">
                    <TeacherListPage/>
                </div>
            </Container>
        </>
    )
}
