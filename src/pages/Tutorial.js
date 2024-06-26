import { useState, useEffect } from "react";
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import FloatingSpeechBubble from "../components/FloatingSpeechBubble";
import * as Pitchfinder from 'pitchfinder'; // Use pitchfinder for pitch detection

const LevelSelector = () => {
  const user = useSelector(state => state.user);
  const storedUser = localStorage.getItem('user');
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [highlightedNote, setHighlightedNote] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setLoggedInUser(userData);
    }
  }, [storedUser]);

  useEffect(() => {
    if (!loggedInUser) return;

    // Set up the Web Audio API
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const pitchfinder = Pitchfinder.YIN();

    const getUserMedia = (constraints) => {
      return navigator.mediaDevices.getUserMedia(constraints);
    };

    getUserMedia({ audio: true }).then(stream => {
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      const data = new Float32Array(analyser.fftSize);
      const detectPitch = () => {
        analyser.getFloatTimeDomainData(data);
        const pitch = pitchfinder(data);
        if (pitch !== null) {
          const note = getNoteFromPitch(pitch);
          setHighlightedNote(note);
        }
        requestAnimationFrame(detectPitch);
      };
      detectPitch();
    }).catch(err => {
      console.error('Error accessing microphone', err);
    });

    return () => {
      audioContext.close();
    };
  }, [loggedInUser]);

  const getNoteFromPitch = (pitch) => {
    const notes = [
      'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'
    ];
    const noteNumber = Math.round(12 * (Math.log2(pitch / 440)) + 69);
    const note = notes[noteNumber % 12];
    return note;
  };

  if (!loggedInUser) {
    return null;
  }

  return (
    <section className="bg-gray-50 dark:bg-gray-900 min-h-screen flex items-center justify-center" id="content">
      <div className="wrapper flex flex-col md:flex-row items-center justify-center px-6 py-8 mx-auto md:h-screen lg:py-0">
        <div className="w-full bg-white rounded-lg shadow md:mt-0 sm:max-w-md xl:p-0 dark:bg-gray-800">
          <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
            <div className="flex flex-col items-center">
              <FloatingSpeechBubble message={'We will start by pressing Piano Keys one by one'}></FloatingSpeechBubble>
              <img className="w-45 h-40" src="/simpu.png" alt="logo" />
              <p className="text-lg text-gray-500 mt-4">Can you Try and Press the <a className="text-bold text-5xl text-orange-500">C#</a> Note on your piano</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center w-full justify-center bg-gray-900 px-6 py-8 mx-auto md:h-screen lg:py-0">
          <div className="keyboard-container">
            <div className="naturals-container">
              <button className={`button-20 ${highlightedNote === 'C' ? 'bg-green-500' : ''}`}><p>C</p></button>
              <button className={`button-20 ${highlightedNote === 'D' ? 'bg-green-500' : ''}`}><p>D</p></button>
              <button className={`button-20 ${highlightedNote === 'E' ? 'bg-green-500' : ''}`}><p>E</p></button>
              <button className={`button-20 ${highlightedNote === 'F' ? 'bg-green-500' : ''}`}><p>F</p></button>
              <button className={`button-20 ${highlightedNote === 'G' ? 'bg-green-500' : ''}`}><p>G</p></button>
              <button className={`button-20 ${highlightedNote === 'A' ? 'bg-green-500' : ''}`}><p>A</p></button>
              <button className={`button-20 ${highlightedNote === 'B' ? 'bg-green-500' : ''}`}><p>B</p></button>
            </div>
            <div className="accidentals-container">
              <button className={`button-20 ${highlightedNote === 'C#' ? 'bg-green-500' : ''} C`}>C#</button>
              <button className={`button-20 ${highlightedNote === 'D#' ? 'bg-green-500' : ''} D`}>D#</button>
              <button className={`button-20 ${highlightedNote === 'F#' ? 'bg-green-500' : ''} F`}>F#</button>
              <button className={`button-20 ${highlightedNote === 'G#' ? 'bg-green-500' : ''} G`}>G#</button>
              <button className={`button-20 ${highlightedNote === 'A#' ? 'bg-green-500' : ''} A`}>A#</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LevelSelector;
