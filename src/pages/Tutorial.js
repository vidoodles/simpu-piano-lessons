import { useState, useEffect } from "react";
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import FloatingSpeechBubble from "../components/FloatingSpeechBubble";
import * as Pitchfinder from 'pitchfinder'; 
import Confetti from "../components/Confetti";
import FloatingText from "../components/FloatingText";

const DuolingoLayout = () => {
  const user = useSelector(state => state.user);
  const storedUser = localStorage.getItem('user');
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [highlightedNote, setHighlightedNote] = useState(null);
  const [correctNotesCount, setCorrectNotesCount] = useState(false); 
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [question, setQuestion] = useState('Translate "Hello" to Spanish.');
  const [answer, setAnswer] = useState('');

  useEffect(() => {
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setLoggedInUser(userData);
    }
  }, [storedUser]);

  const hammingWindow = (size) => {
    const window = new Float32Array(size);
    for (let i = 0; i < size; i++) {
      window[i] = 0.54 - 0.46 * Math.cos((2 * Math.PI * i) / (size - 1));
    }
    return window;
  };

  const applyWindow = (data, window) => {
    for (let i = 0; i < data.length; i++) {
      data[i] *= window[i];
    }
  };

  const startAudioContext = () => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    const pitchfinder = Pitchfinder.YIN({ sampleRate: audioContext.sampleRate });

    const getUserMedia = (constraints) => {
      return navigator.mediaDevices.getUserMedia(constraints);
    };

    getUserMedia({ audio: true }).then(stream => {
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      const data = new Float32Array(analyser.fftSize);
      const window = hammingWindow(analyser.fftSize);

      const detectPitch = () => {
        analyser.getFloatTimeDomainData(data);
        applyWindow(data, window); 
        const pitch = pitchfinder(data);
        if (pitch !== null) {
          const note = getNoteFromPitch(pitch);
          if (note !== highlightedNote) {
            setHighlightedNote(note);
            console.log(note)
            if (note === 'C#7') {
              setCorrectNotesCount(true); 
            }
          }
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
  };

  const getNoteFromPitch = (pitch) => {
    const noteStrings = [
      'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'
    ];
  
    const noteNumber = 69 + 12 * Math.log2(pitch / 440);
    console.log(noteNumber)
  
    const noteIndex = Math.round(noteNumber) % 12;
    const octave = Math.floor((Math.round(noteNumber) / 12)) - 1;
  
    const note = noteStrings[noteIndex];
  
    return `${note}${octave}`;
  };
  
  


  if (!loggedInUser) {
    return null;
  }


  const handleAnswerSubmit = (e) => {
    e.preventDefault();
    if (answer.toLowerCase() === 'hola') {
      setFeedback('Correct!');
      setProgress(progress + 10);
    } else {
      setFeedback('Try again!');
    }
    setAnswer('');
  };

  return (
    <div className="min-h-screen flex flex-col justify-between items-center p-4">
      {/* Progress bar */}
     

      {/* Quiz section */}
      <div className="flex flex-col items-center justify-center flex-grow w-full">
        <div className="bg-white p-6 rounded-lg  w-full max-w-3xl">
          <h2 className="text-xl font-semibold mb-4"></h2>
          <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
            <div className="flex flex-col items-center">
              <div className="mb-10 ">
            <span class="bubble">Welcome to the tutorial zone! Let's dive into learning something awesome together!</span>
            </div>
            <img className="w-45 h-40" src="/simpu-whole.png" alt="logo" />
            </div>
        </div>
        </div>
      </div>

      {/* Feedback section */}
          {/* Feedback section */}
      <div className="flex  w-full justify-center my-4 w-full bg-green">
      <div className="flex items-center justify-between w-full mt-4 px-4">
          <a></a>
        <a href="/app/stepone" className="button-19">LETS GO!</a>

        </div>
      </div>
    </div>
  );
};

export default DuolingoLayout;
