import { createBrowserRouter } from "react-router-dom";
import App from "../App.tsx";
import { ROUTES } from "./routes.ts";

export const router = createBrowserRouter([
  {
    path: ROUTES.home,
    element: <App />,
  },
]);
