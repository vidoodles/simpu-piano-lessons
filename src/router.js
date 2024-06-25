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


const router = createBrowserRouter([
  {
    path: "",
    element: <App />,
    children: [
      {
        path: "/keyboard",
        element:
          <Keyboard />
        ,
        loader: gsapLoader
      },
      {
        path: "/levelselector",
        element:
          <LevelSelector />
        ,
        loader: gsapLoader
      },
      {
        path: "/tutorial",
        element:

          <Tutorial />
        ,
        loader: gsapLoader
      },
    ],
  },
  {
    path: "/login",
    element: <LoginPage />,
    loader: gsapLoader
  },
]);

function Router() {
  return <RouterProvider router={router}></RouterProvider>;
}

export default Router;
