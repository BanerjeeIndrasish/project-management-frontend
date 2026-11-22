import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import PublicRoute from "./PublicRoute";
import ProtectedRoute from "./ProtectedRoute";
import MainLayout from "../components/layout/MainLayout";
import UsersPage from "../pages/users/UsersPage";
import Login from "../pages/auth/Login";
import ProjectsPage from "../pages/projects/ProjectPage";
import TimeLogsPage from "../pages/timelogs/TimeLogsPage";
import TasksPage from "../pages/tasks/TasksPage";
import ErrorFallback from "../pages/error/ErrorFallback";
import Dashboard from "../pages/home/Dashboard";

const router = createBrowserRouter([
    {
        path: "/",
        element: <Navigate to="/login" replace />,
    },
    {
        element: <PublicRoute />,
        children: [
            {
                path: "/login",
                element: <Login />,
            },
        ],
    },

    {
        element: <ProtectedRoute />,
        children: [
            {
                element: <MainLayout />,
                children: [
                    {
                        path: "/home",
                        element: <Dashboard />,
                    },
                    {
                        path: "/users",
                        element: <UsersPage />,
                    },
                    {
                        path: "/projects",
                        element: <ProjectsPage />,
                    },
                    {
                        path: "/tasks",
                        element: <TasksPage />,
                    },
                    {
                        path: "/timelogs",
                        element: <TimeLogsPage />,
                    },
                ],
            },
        ],
        errorElement: <ErrorFallback />
    },
]);

const AppRouter = () => {
    return <RouterProvider router={router} />;
};

export default AppRouter;