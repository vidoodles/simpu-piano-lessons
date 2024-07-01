import { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import FloatingSpeechBubble from "../components/FloatingSpeechBubble";
import * as Pitchfinder from "pitchfinder";
import Confetti from "../components/Confetti";
import { Howl } from "howler";

const DNotes = () => {
  const user = useSelector((state) => state.user);
  const storedUser = localStorage.getItem("user");
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [highlightedNote, setHighlightedNote] = useState(null);
  const [correctNotesCount, setCorrectNotesCount] = useState(false);
  const [noteToGuess, setNoteToGuess] = useState(null);
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const audioContextRef = useRef(null);
  const streamRef = useRef(null);
  const rafIdRef = useRef(null);

  useEffect(() => {
    setNoteToGuess(getRandomDNote);
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

  const applyWindow = (data, window) => {
    for (let i = 0; i < data.length; i++) {
      data[i] *= window[i];
    }
  };

  const startAudioContext = () => {
    stopAudioContext(); // Stop any existing audio context before starting a new one
    playRecordingSound();
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    audioContextRef.current = audioContext;

    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 8192;
    const pitchfinder = Pitchfinder.YIN({
      sampleRate: audioContext.sampleRate,
    });

    const getUserMedia = (constraints) => {
      return navigator.mediaDevices.getUserMedia(constraints);
    };

    getUserMedia({ audio: true })
      .then((stream) => {
        streamRef.current = stream;
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
            if (note != "D#10" || note != "D10") {
              console.log(note)
              setHighlightedNote(note);
              if (note === noteToGuess) {
                playCorrectSound();
                setCorrectNotesCount(true);
              }
            }
          }
          rafIdRef.current = requestAnimationFrame(detectPitch);
        };
        detectPitch();
      })
      .catch((err) => {
        console.error("Error accessing microphone", err);
      });
  };

  const stopAudioContext = () => {
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      const tracks = streamRef.current.getTracks();
      tracks.forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
  };

  const getNoteFromPitch = (pitch) => {
    const noteStrings = [
      "C",
      "C#",
      "D",
      "D#",
      "E",
      "F",
      "F#",
      "G",
      "G#",
      "A",
      "A#",
      "B",
    ];

    const noteNumber = 69 + 12 * Math.log2(pitch / 440);

    const noteIndex = Math.round(noteNumber) % 12;
    const octave = Math.floor(Math.round(noteNumber) / 12) - 1;

    const note = noteStrings[noteIndex];

    return `${note}${octave}`;
  };

  const getRandomDNote = () => {
    const octaves = Array.from({ length: 9 }, (_, i) => i); // Generates [0, 1, 2, ..., 8]
    const randomOctave = octaves[Math.floor(Math.random() * octaves.length)];
    return `D${randomOctave}`;
  };

  const handleContinue = () => {
    setNoteToGuess(getRandomDNote());
    setCorrectNotesCount(false);
    setHighlightedNote(null);
    startAudioContext();
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
            </div>
            <div className="w-full bg-gray-200 rounded-full dark:bg-gray-700">
              <div
                className="bg-green-600 text-xs font-medium text-blue-100 text-center p-0.5 leading-none rounded-full"
                style={{ width: `${progress}%` }}
              >
                {" "}
                45%
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
                      className={`${
                        highlightedNote === "C7" ? "button-22" : "button-20"
                      }`}
                    >
                      <p>C</p>
                    </button>
                    <button
                      className={`${
                        highlightedNote === "D7" ? "button-22" : "button-20"
                      }`}
                    >
                      <p>D</p>
                    </button>
                    <button
                      className={`${
                        highlightedNote === "E7" ? "button-22" : "button-20"
                      }`}
                    >
                      <p>E</p>
                    </button>
                    <button
                      className={`${
                        highlightedNote === "F7" ? "button-22" : "button-20"
                      }`}
                    >
                      <p>F</p>
                    </button>
                    <button
                      className={`${
                        highlightedNote === "G7" ? "button-22" : "button-20"
                      }`}
                    >
                      <p>G</p>
                    </button>
                    <button
                      className={`${
                        highlightedNote === "A7" ? "button-22" : "button-20"
                      }`}
                    >
                      <p>A</p>
                    </button>
                    <button
                      className={`${
                        highlightedNote === "B7" ? "button-22" : "button-20"
                      }`}
                    >
                      <p>B</p>
                    </button>
                  </div>
                  <div className="accidentals-container">
                    <button
                      className={`${
                        highlightedNote === "C#7" ? "button-21" : "button-20"
                      } C`}
                    >
                      C#
                    </button>
                    <button
                      className={`${
                        highlightedNote === "D#7" ? "button-22" : "button-20"
                      } D`}
                    >
                      D#
                    </button>
                    <button
                      className={`${
                        highlightedNote === "F#7" ? "button-22" : "button-20"
                      } F`}
                    >
                      F#
                    </button>
                    <button
                      className={`${
                        highlightedNote === "G#7" ? "button-22" : "button-20"
                      } G`}
                    >
                      G#
                    </button>
                    <button
                      className={`${
                        highlightedNote === "A#7" ? "button-22" : "button-20"
                      } A`}
                    >
                      A#
                    </button>
                  </div>
                </div>
              </div>
              <button onClick={startAudioContext} className="button-start">
                START PRACTICING!
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback section */}
      <div
        className={`flex w-full justify-center p-6 ${
          correctNotesCount ? "bg-green-200" : ""
        }`}
      >
        {correctNotesCount ? (
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
            <button onClick={handleContinue} className="button-19">
              CONTINUE
            </button>

            <Confetti />
          </div>
        ) : null}
      </div>
      <div></div>
    </div>
  );
};

export default DNotes;
