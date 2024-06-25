import React from 'react';

const FloatingText = (username) => {
  return (
    <div className="floating-text">
      <p>Hi <a className="text-gray-800">{username.username}!</a> Let me help you get this 🏀 rolling!</p>
    </div>
  );
};

export default FloatingText;
