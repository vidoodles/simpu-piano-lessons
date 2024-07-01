import React from 'react';
import 'tailwindcss/tailwind.css';

const MusicTab = () => {
  const whiteKeys = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C'];
  const blackKeys = ['', 'C#', 'D#', '', 'F#', 'G#', 'A#', ''];

  return (
    <div className="bg-gray-100 p-6">
      <div className="container mx-auto">
        <h1 className="text-2xl font-bold mb-4">Music Tab</h1>
        <div className="piano-container relative">
          {/* White keys */}
          {whiteKeys.map((note, index) => (
            <button
              key={index}
              className="white-key text-black"
            >
              {note}
            </button>
          ))}
          {/* Black keys */}
          <div className="black-keys-container absolute top-0">
            {blackKeys.map((note, index) => (
              note && (
                <button
                  key={index}
                  className="black-key text-white"
                >
                  {note}
                </button>
              )
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MusicTab;
