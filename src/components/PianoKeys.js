import React from 'react';
import classNames from 'classnames';

const PianoKey = ({ note, pressed, isBlackKey, onMouseDown, onMouseUp }) => {
  const keyClass = classNames('piano-key', {
    'piano-key-pressed': pressed,
    'piano-key-white': !isBlackKey,
    'piano-key-black': isBlackKey,
  });

  const keyStyle = {
    width: isBlackKey ? '60%' : '100%', // Adjust width for black keys
    marginLeft: isBlackKey ? '20%' : '0%', // Adjust margin for black keys
  };

  return (
    <div
      className={keyClass}
      style={keyStyle}
      onMouseDown={() => onMouseDown(note)}
      onMouseUp={() => onMouseUp(note)}
      onTouchStart={() => onMouseDown(note)}
      onTouchEnd={() => onMouseUp(note)}
    >
      {note}
    </div>
  );
};

export default PianoKey;
