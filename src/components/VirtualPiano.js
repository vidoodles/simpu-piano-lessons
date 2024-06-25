import React from 'react';
import PianoKey from './PianoKey';

const VirtualPiano = ({ onNotePlayed }) => {
  const notes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

  return (
    <div className="virtual-piano">
      {notes.map((note) => (
        <PianoKey key={note} note={note} onNotePlayed={onNotePlayed} />
      ))}
    </div>
  );
};

export default VirtualPiano;
