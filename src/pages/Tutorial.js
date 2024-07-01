import { useState, useEffect } from "react";


const Tutorial = () => {
  const storedUser = localStorage.getItem('user');
  const [loggedInUser, setLoggedInUser] = useState(null);

  useEffect(() => {
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setLoggedInUser(userData);
    }
  }, [storedUser]);
  

  if (!loggedInUser) {
    return null;
  }


  return (
    <div className="min-h-screen flex flex-col justify-between items-center p-4">
      {/* Progress bar */}
      <div className="flex  w-full justify-center my-4 w-full bg-green">
      <div className="flex items-center justify-between w-full mt-4 px-4">
        <div>
        <img class="w-8 h-8 p-1 rounded-full ring-2 ring-gray-300 dark:ring-gray-500" src={loggedInUser.photo} alt="Bordered avatar" />
         </div>
          <p class="text-gray-700 justify-right">🔰</p>
          2047/Hamming
      </div>
      </div>
      
     
      {/* Quiz section */}
      <div className="flex flex-col items-center justify-center flex-grow w-full">
        <div className="bg-white p-6 rounded-lg  w-full max-w-3xl">
          <h2 className="text-xl font-semibold mb-4"></h2>
          <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
            <div className="flex flex-col items-center">
              <div className="mb-10 ">
            <span class="bubble">Hi there <a className="font-semibold text-sm font-italic">{loggedInUser.name }</a>! Are you ready to learn 🎹 with me?</span>
            </div>
            <img className="w-45 h-40" src="/simpu-whole.png" alt="logo" />
            </div>
        </div>
        </div>
      </div>

      {/* Feedback section */}
          {/* Feedback section */}
      <div className="flex  w-full justify-center my-4 w-full bg-green border-t-2 mt-10">
      <div className="flex items-center justify-between w-full mt-4 px-4">
          <a></a>
        <a href="/app/steps" className="button-19">LETS GO!</a>

        </div>
      </div>
    </div>
  );
};

export default Tutorial;
