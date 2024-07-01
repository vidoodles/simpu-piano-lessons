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
import CNotes from "./pages/CNotes";
import DNotes from "./pages/DNotes";
import PracticeSteps from "./pages/PracticeSteps";
import PitchDetector from "./pages/Testing";
import Notes from "./pages/Notes";

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
        path: "steps",
        element: <PracticeSteps />,
        loader: gsapLoader,
      },
      {
        path: "testing",
        element: <PitchDetector />,
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
        path: "cnotes",
        element: <CNotes />,
        loader: gsapLoader,
      },
      {
        path: "dnotes",
        element: <DNotes />,
        loader: gsapLoader,
      },
      {
        path: "notes",
        element: <Notes />,
        loader: gsapLoader,
      },
    ],
  },
]);

function Router() {
  return <RouterProvider router={router} />;
}

export default Router;
