import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Shop from "./views/Shop";
import Coin from "./views/Coin";
import Road from "./views/Road";
import Paper from "./views/Paper";
import { AppLayout } from "./components/AppLayout";

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { path: "/", element: <Shop /> },
      { path: "/coin", element: <Coin /> },
      { path: "/road", element: <Road /> },
      { path: "/paper", element: <Paper /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />
}
