import "@/index.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Lab1 from "./pages/Lab1";
import Navigation from "./pages/Navigation";
import Lab2 from "./pages/Lab2";

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
]);

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary-foreground to-primary">
      <RouterProvider router={router} />
    </div>
  );
}

export default App;
