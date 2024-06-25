import React from 'react';

const PianoKey = ({ note, onNotePlayed }) => {
  const handleClick = () => {
    onNotePlayed(note);
  };

  return (
    <button className="piano-key" onClick={handleClick}>
      {note}
    </button>
  );
};

export default PianoKey;
