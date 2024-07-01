import React, { useEffect, useState } from 'react';
import UserProfile from '../components/UserProfile';
import firebase from '../utils/FirebaseConfig';
import Confetti from 'react-confetti'; // Make sure you have this library installed

const PracticeSteps = () => {
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [tutorialData, setTutorialData] = useState({});
  const [allDone, setAllDone] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setLoggedInUser(userData);

      const fetchTutorialData = async () => {
        try {
          const userRef = firebase.firestore().collection('users').doc(userData.user);
          const userDoc = await userRef.get();
          if (userDoc.exists) {
            const tutorial = userDoc.data().tutorial;
            setTutorialData(tutorial);
            checkAllDone(tutorial);
          }
        } catch (error) {
          console.error("Error fetching tutorial data: ", error);
        }
      };

      fetchTutorialData();
    }
  }, []);

  const checkAllDone = (tutorial) => {
    const allFieldsDone = Object.values(tutorial).every((value) => value === "done");
    setAllDone(allFieldsDone);
  };

  const handleContinue = () => {
    // Implement the logic for the continue button here
  };

  return (
    <div className="min-h-screen flex flex-col justify-between items-center">
      <UserProfile user={loggedInUser} />
      <div className="flex items-center justify-center w-full">
        <div className="bg-white p-6 rounded-lg max-w-3xl">
          <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
            <div className="flex items-center justify-center flex-wrap mb-10">
              {["c", "d", "e", "f", "g", "a", "b"].map((note, index) => (
                <div className="flex justify-center items-center space-x-4 mb-10" key={index}>
                  {tutorialData[note] ? (
                    <div className="image-container mr-2">
                      <img
                        src="https://d35aaqx5ub95lt.cloudfront.net/images/bed2a542bc7eddc78e75fbe85260b89e.svg"
                        className="image"
                        alt={`Note ${note.toUpperCase()} completed`}
                      />
                    </div>
                  ) : (
                    <div></div>
                  )}
                  <a
                    href={`/app/notes?note=${note.toUpperCase()}`}
                    className={`big-button ${tutorialData[note] === "done" ? "done" : ""}`}
                    disabled={tutorialData[note] === "done"}
                  >
                    {note.toUpperCase()}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Feedback section */}
      <div className={`flex w-full justify-center p-6 ${allDone ? "bg-green-200" : ""}`}>
        {allDone ? (
          <div className="flex items-center justify-between w-full mt-4 px-4 bg-green-200">
            <div>
              <span className="text-lg ml-3 text-green-800 font-bold">Great Work!, You have completed all the Key Practice. You are now ready to move to the next stage!</span>
            </div>
            <a href="/app/levelselector" className="button-19">CONTINUE</a>
            <Confetti />
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default PracticeSteps;
