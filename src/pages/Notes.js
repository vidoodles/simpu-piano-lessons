import { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { Howl } from "howler";
import firebase from '../utils/FirebaseConfig';
import NoteDetector from "../utils/DetectorClass";
import { hzToNoteString } from '../utils/NoteDetector';
import Confetti from '../components/Confetti';

const Notes = () => {
  const user = useSelector((state) => state.user);
  const location = useLocation();
  const storedUser = localStorage.getItem("user");
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [highlightedNote, setHighlightedNote] = useState(null);
  const [correctNotesCount, setCorrectNotesCount] = useState(0);
  const [noteToGuess, setNoteToGuess] = useState(null);
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const audioContextRef = useRef(null);
  const [detectionEnabled, setDetectionEnabled] = useState(true);
  const searchParams = new URLSearchParams(location.search);
  const noteLetter = searchParams.get('note');

  const [noteQueue, setNoteQueue] = useState([]);

  function getRandomNoteWithOctave(noteLetter) {
    const octave = getRandomOctave();
    const noteWithOctave = `${noteLetter}${octave}`;
    return noteWithOctave;
  }
  
  function getRandomOctave() {
    return Math.floor(Math.random() * (7 - 3 + 1)) + 3; // Generates a random integer between 3 and 7 (inclusive)
  }

  
  const [currentPosition, setCurrentPosition] = useState(0);
  const analyser = useRef(null);
  const source = useRef(null);
  const detector = useRef(null);
  const stream = useRef(null);
  const lastNote = useRef(null);
  const lastVol = useRef(0);
  const noteToGuessRef = useRef(null); // useRef for noteToGuess
  const [noteToLetter, setNoteToletter] = useState("");
  const [slicedNoteToGuess, setSlicedNoteToGuess] = useState(true);


  useEffect(() => {
    if (noteLetter) {
      const notes = [];
      for (let i = 0; i < 7; i++) {
        if (i === 0 || i % 2 === 0) { // Add index 0 and skip odd indices
          notes.push(getRandomNoteWithOctave(noteLetter));
        } else {
          notes.push(""); // Push an empty string for odd indices you want to skip
        }
      }
      setNoteQueue(notes);
    }
  }, [noteLetter]);

  function getRandomNoteWithOctave(noteLetter) {
    const octave = getRandomOctave();
    const noteWithOctave = `${noteLetter}${getSharpOrNatural()}${octave}`;
    return noteWithOctave;
  }

  function getRandomOctave() {
    return Math.floor(Math.random() * (7 - 3 + 1)) + 3; // Generates a random integer between 3 and 7 (inclusive)
  }

  function getSharpOrNatural() {
    return Math.random() < 0.5 ? "#" : ""; // Randomly chooses between sharp (#) or natural (empty string)
  }
  
  useEffect(() => {

    setNoteToGuess(noteQueue[0]); // Set the first note in the queue
    noteToGuessRef.current = noteQueue[0]; // Initialize noteToGuessRef
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setLoggedInUser(userData);
    }
  }, [storedUser, noteQueue, location.search]);

  useEffect(() => {
    // Update noteToGuessRef whenever noteToGuess changes
    noteToGuessRef.current = noteToGuess;
  }, [noteToGuess]);

  const playCorrectSound = () => {
    const sound = new Howl({
      src: ["/sounds/correct.mp3"],
    });
    sound.play();
  };

  const playRecordingSound = () => {
    const sound = new Howl({
      src: ["/sounds/recording.mp3"],
    });
    sound.play();
  };

  const startAudioContext = async () => {
    playRecordingSound();
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    audioContextRef.current = audioContext;
    stream.current = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    onOpened(stream.current);

    function onOpened(_stream) {
      source.current = audioContext.createMediaStreamSource(_stream);
      initAnalyzer();
      update();
    }

    function initAnalyzer() {
      const analyserNew = audioContext.createAnalyser();
      analyserNew.fftSize = 2048;
      analyserNew.v_uint8 = new Uint8Array(2048);
      analyserNew.v_float = new Float32Array(2048);
      source.current.connect(analyserNew);
      const detectorRef = new NoteDetector(2048, audioContext.sampleRate, 'hamming');
      analyser.current = analyserNew;
      detector.current = detectorRef;
    }

    function update() {
      if (!analyser.current) return; // Ensure analyzer is initialized

      const input_8 = analyser.current.v_uint8;
      const input_f = analyser.current.v_float;

      analyser.current.getByteTimeDomainData(input_8);

      for (let i = 0; i < input_8.length; i++) {
        input_f[i] = input_8[i] / 128.0 - 1.0;
      }

      detector.current.update(input_f);

      const note = detector.current.getNote();
      const desc = note && note.stable ? hzToNoteString(note.freq) : "";
      const currentNote = desc.replace(".", "");
      
      setHighlightedNote(currentNote.slice(0, -1)); 

      console.log(`Detected note: ${currentNote}, Note to guess: ${noteToGuessRef.current}`);
      if (currentPosition < noteQueue.length) {
        const expectedNote = noteQueue[currentPosition];
        if (
          lastNote.current !== currentNote ||
          ((detector.current.vol - lastVol.current) / lastVol.current) * 100 > 50
        ) {
          lastNote.current = currentNote;
          lastVol.current = detector.current.vol;

          if (noteToGuessRef.current === currentNote) {
            playCorrectSound();
            setSlicedNoteToGuess(noteToGuessRef.current.slice(0, -1))
            setHighlightedNote(noteToGuessRef.current);
            setCorrectNotesCount((prevCount) => {
              const newCount = prevCount + 1;
              const filteredArray = noteQueue.filter(str => str !== "");
              const pr_igress = Math.round((newCount / filteredArray.length) * 100)
              setProgress(pr_igress);
              if(pr_igress >= 100){
                // call the stop here
              }else{
                setCurrentPosition(prevPosition => {
                  const nextPosition = prevPosition + 1;
                  if (nextPosition < noteQueue.length) {
                    setNoteToGuess(noteQueue[nextPosition]);
                    noteToGuessRef.current = noteQueue[nextPosition];
                  }
                  return nextPosition;
                });
              }
              return newCount;
            });
          }else{
  
          }
        }
      }

      requestAnimationFrame(update);
    }

    // Start analyzing audio
    requestAnimationFrame(update);
  };

  const handleNoteDone = async (note) => {
    const userRef = firebase.firestore().collection('users').doc(loggedInUser.user);
    await userRef.update({
      [`tutorial.${    noteLetter
        .toString().toLowerCase()}`]: "done"
    });
    navigate('/app/novice/steps')
    
  };

  if (!loggedInUser) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col justify-between items-center p-4">
      {/* Progress bar */}
      <div className="flex justify-center my-4 w-full">
        <div className="w-full max-w-3xl">
          <div className="relative pt-1">
            <div className="flex mb-2 items-center justify-between">
              <div>
                <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-green-600 bg-green-200">
                  Progress
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold inline-block text-green-600">
                  {progress}%
                </span>
              </div>
              <img
                className="w-8 h-8 p-1 rounded-full ring-2 ring-gray-300 dark:ring-gray-500"
                src={loggedInUser.photo}
                alt="Bordered avatar"
              />
              <button onClick={() => handleNoteDone(noteToLetter)} className="button-small">
                Done
              </button>
            </div>
            <div className="w-full bg-gray-200 rounded-full dark:bg-gray-700">
              <div
                className="bg-green-600 text-xs font-medium text-blue-100 text-center p-0.5 leading-none rounded-full"
                style={{ width: `${progress}%` }}
              >
                {" "}
                {progress}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quiz section */}
      <div className="flex flex-col items-center justify-center flex-grow w-full">
        <div className="bg-white p-2 w-full max-w-3xl">
          <h2 className="text-xl font-semibold mb-4">Let's Practice! </h2>
          <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
            <div className="flex flex-col items-center">
              <p className="text-lg text-gray-500 mt-4 mb-5">
                Click the button below and try to play the{" "}
                <a className="text-bold text-5xl text-orange-500">
                  {noteToGuess}
                </a>{" "}
                Note on your piano
              </p>
              <div className="mb-5">
              <div className="keyboard-container">
                  <div className="naturals-container">
                    <button
                      className={`button-20 ${
                        highlightedNote === "C" && highlightedNote === slicedNoteToGuess
                        ? "button-21"
                        : highlightedNote === "C" && highlightedNote !== slicedNoteToGuess
                        ? "button-22"
                        : "button-20"
                      }`}
                    >
                      <p>C</p>
                    </button>
                    <button
                      className={`${
                        highlightedNote === "D" && highlightedNote === slicedNoteToGuess
                        ? "button-21"
                        : highlightedNote === "D" && highlightedNote !== slicedNoteToGuess
                        ? "button-22"
                        : "button-20"
                      }`}
                    >
                      <p>D</p>
                    </button>
                    <button
                      className={`${
                        highlightedNote === "E" && highlightedNote === slicedNoteToGuess
                        ? "button-21"
                        : highlightedNote === "E" && highlightedNote !== slicedNoteToGuess
                        ? "button-22"
                        : "button-20"
                      }`}
                    >
                      <p>E</p>
                    </button>
                    <button
                    className={`${
                      highlightedNote === "F" && highlightedNote === slicedNoteToGuess
                        ? "button-21"
                        : highlightedNote === "F" && highlightedNote !== slicedNoteToGuess
                        ? "button-22"
                        : "button-20"
                    }`}
                  >
                    <p>F</p>
                  </button>
                    <button
                      className={`${
                        highlightedNote === "G" && highlightedNote === slicedNoteToGuess
                        ? "button-21"
                        : highlightedNote === "G" && highlightedNote !== slicedNoteToGuess
                        ? "button-22"
                        : "button-20"
                      }`}
                    >
                      <p>G</p>
                    </button>
                    <button
                      className={`${
                        highlightedNote === "A" && highlightedNote === slicedNoteToGuess
                        ? "button-21"
                        : highlightedNote === "A" && highlightedNote !== slicedNoteToGuess
                        ? "button-22"
                        : "button-20"
                      }`}
                    >
                      <p>A</p>
                    </button>
                    <button
                      className={`${
                        highlightedNote === "B" && highlightedNote === slicedNoteToGuess
                        ? "button-21"
                        : highlightedNote === "B" && highlightedNote !== slicedNoteToGuess
                        ? "button-22"
                        : "button-20"
                      }`}
                    >
                      <p>B</p>
                    </button>
                  </div>
                  <div className="accidentals-container">
                    <button
                      className={`${
                        highlightedNote === "C#" && highlightedNote === slicedNoteToGuess
                        ? "button-21"
                        : highlightedNote === "C#" && highlightedNote !== slicedNoteToGuess
                        ? "button-22"
                        : "button-20"
                      } C`}
                    >
                      C#
                    </button>
                    <button
                      className={`${
                        highlightedNote === "D#" && highlightedNote === slicedNoteToGuess
                        ? "button-21"
                        : highlightedNote === "D#" && highlightedNote !== slicedNoteToGuess
                        ? "button-22"
                        : "button-20"
                      } D`}
                    >
                      D#
                    </button>
                    <button
                      className={`${
                        highlightedNote === "F#" && highlightedNote === slicedNoteToGuess
                        ? "button-21"
                        : highlightedNote === "F#" && highlightedNote !== slicedNoteToGuess
                        ? "button-22"
                        : "button-20"
                      } F`}
                    >
                      F#
                    </button>
                    <button
                      className={`${
                        highlightedNote === "G#" && highlightedNote === slicedNoteToGuess
                        ? "button-21"
                        : highlightedNote === "G#" && highlightedNote !== slicedNoteToGuess
                        ? "button-22"
                        : "button-20"
                      } G`}
                    >
                      G#
                    </button>
                    <button
                      className="button-20">
                      A#
                    </button>
                  </div>
                </div>
              </div>
              
              
              <div className="space-y-4 md:space-y-6">
              <a onClick={startAudioContext} className="button-start">
                START PRACTICING!
              </a>
              </div>
            </div>
              </div>
            </div>
          </div>

      {/* Confetti */}
      {progress >= 100 && 
       <div className="flex w-full justify-center p-6 bg-green-200">
  <div className="flex items-center justify-between w-full mt-4 px-4 bg-green-200">
            <div>
              <div className="image-container">
                <img
                  src="https://d35aaqx5ub95lt.cloudfront.net/images/bed2a542bc7eddc78e75fbe85260b89e.svg"
                  className="image"
                />
              </div>
              <span className="text-lg ml-3 text-green-800 font-bold">
                Correct
              </span>
            </div>
            <button onClick={handleNoteDone(noteToLetter)} className="button-19">
              CONTINUE
            </button>
      <Confetti />
      </div>
      </div>
      }
    </div>
  );
};

export default Notes;
