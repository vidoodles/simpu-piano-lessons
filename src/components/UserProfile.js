import React from 'react';

const UserProfile = ({ user }) => {
  if (!user) {
    return null; // or you can return a placeholder UI indicating that user data is not available
  }

  return (
    <div className="flex w-full justify-center my-4 w-full bg-green">
      <div className="flex items-center justify-between w-full mt-4 px-4">
        <div>
            <a className='font-birdgo2 text-5xl text-green-600'>Simpu</a>
        
        </div>
        <img
            className="w-8 h-8 p-1 rounded-full ring-2 ring-gray-300 dark:ring-gray-500"
            src={user.photo}
            alt="Bordered avatar"
          />
      </div>
    </div>
  );
};

export default UserProfile;
