import React from "react";
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import App from "./App";
import LoginPage from "./pages/LoginPage";
import Keyboard from "./pages/Keyboard";
import LevelSelector from "./pages/LevelSelector";
import Tutorial from "./pages/Tutorial";
import TransitionComponent from "./components/TransitionComponent";
import { gsapLoader } from "./utils/gsapLoader";
import StepOne from "./pages/StepOne";

const router = createBrowserRouter([
  {
    path: "/",
    element: <LoginPage />,
    loader: gsapLoader,
  },
  {
    path: "/app",
    element: <App />,
    children: [
      {
        path: "keyboard",
        element: <Keyboard />,
        loader: gsapLoader,
      },
      {
        path: "levelselector",
        element: <LevelSelector />,
        loader: gsapLoader,
      },
      {
        path: "tutorial",
        element: <Tutorial />,
        loader: gsapLoader,
      },
      {
        path: "stepone",
        element: <StepOne />,
        loader: gsapLoader,
      },
    ],
  },
]);

function Router() {
  return <RouterProvider router={router} />;
}

export default Router;
