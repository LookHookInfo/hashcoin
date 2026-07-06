import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { lazy } from "react";
import { AppLayout } from "./components/AppLayout";

// Route-level code splitting. Each view downloads only when first navigated
// to — so a fresh visitor landing on `/` (Shop) no longer pays the bundle
// cost of Coin (DonutChart/recharts), Gem (TradePanel/MiningPanel/etc.),
// Road, or Paper. Suspense fallback lives in AppLayout around <Outlet/>.
const Shop = lazy(() => import("./views/Shop"));
const Coin = lazy(() => import("./views/Coin"));
const Road = lazy(() => import("./views/Road"));
const Paper = lazy(() => import("./views/Paper"));
const Gem = lazy(() => import("./views/Gem"));

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
