import { useState, useEffect } from "react";
import { useSelector } from 'react-redux';
import firebase from '../utils/FirebaseConfig';
import logger from "../utils/logger";
import FloatingText from "../components/FloatingText";
import { useNavigate } from 'react-router-dom';
import Confetti from "../components/Confetti";
import UserProfile from "../components/UserProfile";

const LevelSelector = () => {
  const user = useSelector(state => state.user);
  const storedUser = localStorage.getItem('user');
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [tutorialData, setTutorialData] = useState({});
  const [allDone, setAllDone] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setLoggedInUser(userData);
      const fetchTutorialData = async () => {
        try {
          const userRef = firebase.firestore().collection('users').doc(userData.user);
          const userDoc = await userRef.get();
          if (userDoc.exists) {
            const tutorial = userDoc.data().tutorial;
            if (!tutorial) {
              // If tutorial does not exist, create it
              const initialTutorialData = {
                c: "",
                d: "",
                e: "",
                f: "",
                g: "",
                a: "",
                b: "",
              };
              await userRef.set({ tutorial: initialTutorialData }, { merge: true });
              setTutorialData(initialTutorialData);
              checkAllDone(initialTutorialData);
            } else {
              // If tutorial exists, use it
              setTutorialData(tutorial);
              checkAllDone(tutorial);
            }
          }
        } catch (error) {
          console.error("Error fetching tutorial data: ", error);
        }
      };
      fetchTutorialData();
    }
  }, [storedUser]);

  const checkAllDone = (tutorial) => {
    const allFieldsDone = Object.values(tutorial).every((value) => value === "done");
    setAllDone(allFieldsDone);
  };

  const handleLevelSelect = (level) => {
    if (loggedInUser) {
      firebase.firestore().collection('users').doc(loggedInUser.user).update({
        piano_expertise: level
      }).then(() => {
        logger(`Selected level ${level} saved to Firebase.`);
        const lvl = level.toLowerCase();
        const navigator = "/app/" + lvl;
        navigate(navigator);
      }).catch((error) => {
        logger(error, 'error');
      });
    }
  };

  if (!loggedInUser) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col justify-between items-center">
         <UserProfile user={loggedInUser} />
      <div className="flex items-center justify-center w-full">
        <div className="bg-white p-6 rounded-lg max-w-3xl">
          <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
            <div className="flex flex-col items-center">
              <FloatingText username={loggedInUser.name}></FloatingText>
              <img className="w-45 h-40" src="/simpu.png" alt="logo" />
              <p className="text-lg text-gray-500 mt-4">Tell me what your expertise in using the piano</p>
            </div>
            <div className="flex justify-center space-x-4">
              <a className="big-button" onClick={() => handleLevelSelect('NOVICE')}>Novice</a>
              <a className={`big-button ${allDone ? '' : 'disabled'}`} onClick={() => handleLevelSelect('PROFICIENT')}>Proficient</a>
              <a className={`big-button ${allDone ? '' : 'disabled'}`} onClick={() => handleLevelSelect('MASTER')}>MASTER</a>
            </div>
          </div>
        </div>
      </div>
      <div className={`flex w-full justify-center p-6`}>
       
      </div>
    </div>
  );
};

export default LevelSelector;
