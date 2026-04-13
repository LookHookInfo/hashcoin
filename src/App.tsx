import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Shop from "./views/Shop";
import Coin from "./views/Coin";
import Road from "./views/Road";
import Paper from "./views/Paper";
import Gem from "./views/Gem";
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
      { path: "/gem", element: <Gem /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} future={{ v7_startTransition: true }} />
}
