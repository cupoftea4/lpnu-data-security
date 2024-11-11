import "@/index.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Lab1 from "./pages/Lab1";
import Navigation from "./pages/Navigation";
import Lab2 from "./pages/Lab2";
import Lab3 from "./pages/Lab3";
import Lab4 from "./pages/Lab4";
import Lab5 from "./pages/Lab5";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigation />,
  },
  {
    path: "/lab1",
    element: <Lab1 />,
  },
  {
    path: "/lab2",
    element: <Lab2 />,
  },
  {
    path: "/lab3",
    element: <Lab3 />,
  },
  {
    path: "/lab4",
    element: <Lab4 />,
  },
  {
    path: "/lab5",
    element: <Lab5 />,
  },
]);

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary-foreground to-primary">
      <RouterProvider router={router} />
    </div>
  );
}

export default App;
