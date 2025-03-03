import React from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import App from "./App";
import { store } from "./app/store";
import "./index.css";
import { NextUIProvider } from "@nextui-org/react";
import { ThemeProvider } from "./components/theme-provider";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Auth } from "./pages/auth";
import { Layout } from "./components/layout";
import TeacherMarksPage from "./pages/markTeacher";
import { Register } from "./features/user/register";
import { CreateTest } from "./pages/createTest";
import { TestList } from "./pages/tests";
import { TestPage } from "./pages/testsAnswers";
import { TeacherListPage } from "./pages/teacherList";
import { TeacherTestsPage } from "./pages/teacherTestsPage";
import RequireAuth from "../src/app/privateRoutes";
import {ProfilePage} from "./pages/prifile";
import {UsersPage} from "./pages/usersTable";
import StudentMarksPage from "./pages/markStudent";
import {ChatPage} from "./pages/chatGPT";
import {EditTestPage} from "./pages/editTestPage";
import { CategorySubcategoryPage } from "./pages/Category"
import { ClassesPage } from "./pages/ClassPage"

const container = document.getElementById("root");
const router = createBrowserRouter([
    {
        path: "/auth",
        element: <Auth />,
    },
    {
        element: <RequireAuth />,
        children: [{
        path: "/",
        element: <Layout />,
        children: [
                    {
                        path: "/test-results/:userId",
                        element: <TeacherMarksPage />,
                    },
                    {
                        path: "/tests",
                        element: <TestList />,
                    },
                    {
                        path: "/register",
                        element: <Register />,
                    },
                    {
                        path: "/test",
                        element: <CreateTest />,
                    },
                    {
                        path: "/tests/:testId",
                        element: <TestPage />,
                    },
                    {
                        path: "/teachers/:teacherId/tests",
                        element: <TeacherTestsPage />,
                    },
                    {
                        path: "/profile/:userId",
                        element: <ProfilePage />,
                    },
                    {
                        path: "/users",
                        element: <UsersPage />,
                    },
                    {
                        path: "/chat",
                        element: <ChatPage />,
                    },
                    {
                        path: "/student-mark/:userId",
                        element: <StudentMarksPage />,
                    },
                    {
                        path: "/edit-test/:testId",
                        element: <EditTestPage />,
                    },
                    {
                        path: "/categories",
                        element: <CategorySubcategoryPage />,
                    },
                    {
                        path: "/classes",
                        element: <ClassesPage />,
                    },
                ],
            },
        ],
    },
]);

if (container) {
    const root = createRoot(container);

    root.render(
        <React.StrictMode>
            <Provider store={store}>
                <ThemeProvider>
                    <NextUIProvider>
                        <RouterProvider router={router} />
                    </NextUIProvider>
                </ThemeProvider>
            </Provider>
        </React.StrictMode>
    );
} else {
    throw new Error(
        "Root element with ID 'root' was not found in the document. Ensure there is a corresponding HTML element with the ID 'root' in your HTML file."
    );
}
