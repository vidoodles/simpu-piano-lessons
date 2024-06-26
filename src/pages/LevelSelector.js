import { useState, useEffect } from "react";
import { useSelector } from 'react-redux';
import firebase from '../utils/FirebaseConfig';
import logger from "../utils/logger";
import FloatingText from "../components/FloatingText";
import { useNavigate } from 'react-router-dom';

const LevelSelector = () => {
  const user = useSelector(state => state.user);
  const storedUser = localStorage.getItem('user');
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setLoggedInUser(userData);
    }
  }, [storedUser]);

  const handleLevelSelect = (level) => {
    console.log(loggedInUser)
    if (loggedInUser) {
      firebase.firestore().collection('users').doc(loggedInUser.user).set({
        tutorial: {
          c: "",
          d: "",
          e: "",
          f: "",
          g: "",
          a: "",
          b: "",
        }
      }, { merge: true })
      firebase.firestore().collection('users').doc(loggedInUser.user).update({
        piano_expertise: level
      }).then(() => {
        logger(`Selected level ${level} saved to Firebase.`);
        if(level === "NOVICE"){
          navigate("/app/tutorial");
        }
      }).catch((error) => {
        logger(error, 'error');
      });
    }
  };

  if (!loggedInUser) {
    return null;
  }

  return (
    <section className="bg-gray-50 dark:bg-gray-900 min-h-screen flex items-center justify-center border-4 border-gray-200" id="content">
    <div className="flex flex-col items-center justify-center px-6 py-8 mx-auto md:h-screen lg:py-0 max-w-4xl">
      <div className="w-full bg-white rounded-lg shadow md:mt-0 sm:max-w-md xl:p-0 dark:bg-gray-800">
        <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
          <div className="flex flex-col items-center">
            <FloatingText username={loggedInUser.name}></FloatingText>
            <img className="w-45 h-40" src="/simpu.png" alt="logo" />
            <p className="text-lg text-gray-500 mt-4">Tell me what your expertise in using the piano</p>
          </div>
          <div className="flex justify-center space-x-4">
            <a className="big-button" onClick={() => handleLevelSelect('NOVICE')}>NOVICE</a>
            <a className="big-button" onClick={() => handleLevelSelect('EXPERT')}>EXPERT</a>
            <a className="big-button" onClick={() => handleLevelSelect('HALIMAW')}>HALIMAW</a>
          </div>
        </div>
      </div>
    </div>
  </section>
  
  
  );
};

export default LevelSelector;
