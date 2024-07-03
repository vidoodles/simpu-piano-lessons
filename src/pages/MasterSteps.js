import React, { useEffect, useState } from 'react';
import UserProfile from '../components/UserProfile';
import firebase from '../utils/FirebaseConfig';
import Confetti from 'react-confetti'; // Make sure you have this library installed

const MasterSteps = () => {
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
          <h2 className="text-lg font-semibold mb-4">Select a song below and Play the Tabs, You got this! Just remember what we practiced. </h2>
            <div className="flex items-center justify-center flex-wrap mb-10">
                <div className="flex justify-center items-center space-x-4 mb-10">
                    <div className="image-container mr-2">
                        
                    </div>
                  <a
                   href="/app/songpractice?title=Ode to Joy"
                    className={`big-button`}
                   
                  >
                     Ode to Joy
                  </a>
                  <a
                    href="/app/songpractice?title=Moonlight Sonata"
                   className={`big-button`}
                  
                 >
                    Moonlight Sonata
                 </a>
                 <a
                   href="/app/songpractice?title=Canon in D"
                   className={`big-button`}
                  
                 >
                    Canon in D
                 </a>
                 <a
                   href="/app/songpractice?title=River Flows in You"
                   className={`big-button`}
                  
                 >
                    River Flows in You
                 </a>
                </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback section */}
      <div className={`flex w-full justify-center p-6 ${allDone ? "bg-green-200" : ""}`}>
        {allDone ? (
          <div className="flex items-center justify-between w-full mt-4 px-4 bg-green-200">
            <div>
            <span className="text-lg ml-3 text-green-800 font-bold flex items-center">
  <img className="w-20 h-20 mr-2" src="/simpu.png" alt="logo" />
  ➡️ You have reached new heights, Push yourself to play these songs. Before you know it you'll be a grandmaster!
</span>
            </div>
         
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default MasterSteps;
