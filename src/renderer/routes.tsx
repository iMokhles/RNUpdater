import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { MainScreen } from "./screens/main";

const router = createBrowserRouter([
  {
    path: "/",
    element: <MainScreen />,
  },
  // Add more routes as needed
]);

export function AppRoutes() {
  return <RouterProvider router={router} />;
}
