import React from "react";
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import App from "./App";
import LoginPage from "./pages/LoginPage";
import Keyboard from "./pages/Keyboard";
import LevelSelector from "./pages/LevelSelector";
import Novice from "./pages/Novice";
import TransitionComponent from "./components/TransitionComponent";
import { gsapLoader } from "./utils/gsapLoader";
import CNotes from "./pages/CNotes";
import DNotes from "./pages/DNotes";
import PracticeSteps from "./pages/PracticeSteps";
import PitchDetector from "./pages/Testing";
import Notes from "./pages/Notes";
import Proficient from "./pages/Proficient";
import ProficientSteps from "./pages/ProficientSteps";
import Songs from "./pages/Songs";
import Master from "./pages/Master";
import MasterSteps from "./pages/MasterSteps";
import Assessment from "./pages/AssessmentSongs";

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
        path: "novice/steps",
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
        path: "novice",
        element: <Novice />,
        loader: gsapLoader,
      },
      {
        path: "proficient",
        element: <Proficient />,
        loader: gsapLoader,
      },
      {
        path: "proficient/steps",
        element: <ProficientSteps />,
        loader: gsapLoader,
      },
      {
        path: "master",
        element: <Master />,
        loader: gsapLoader,
      },
      {
        path: "master/steps",
        element: <MasterSteps />,
        loader: gsapLoader,
      },
      {
        path: "songpractice",
        element: <Songs />,
        loader: gsapLoader,
      },
      {
        path: "assessment",
        element: <Assessment />,
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
