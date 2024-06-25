import React, { useState } from 'react';
import VirtualPiano from '../components/VirtualPiano';

const Tutorial = () => {
  const [detectedNote, setDetectedNote] = useState('');

  const handleNotePlayed = (note) => {
    setDetectedNote(note); // Update detected note state
    console.log('Played note:', note);
  };

  return (
    <div className="App">
      <h1>Virtual Piano Note Detector</h1>
      <VirtualPiano onNotePlayed={handleNotePlayed} />
      <div>
        <p>Detected Note: {detectedNote}</p>
      </div>
    </div>
  );
};

export default Tutorial;
