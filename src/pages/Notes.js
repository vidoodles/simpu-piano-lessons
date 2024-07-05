import { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import * as Pitchfinder from "pitchfinder";
import Confetti from "../components/Confetti";
import { Howl } from "howler";
import firebase from '../utils/FirebaseConfig';
import { throttle } from 'lodash';
import {Detector_acx, Detector_yin, Detector_mpm, getConsensus_, getVolume, hzToNoteString} from '../utils/NoteDetector';


const Notes = () => {
  const user = useSelector((state) => state.user);
  const location = useLocation();
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
  const [noteToLetter, setNoteToLetter] = useState(null);
  const [correctNoteDetected, setCorrectNoteDetected] = useState(false);
  const OnePi  = 1 * Math.PI;
  const TwoPi  = 2 * Math.PI;
  const FourPi = 4 * Math.PI;
  const noteQueue = ["C5", "C6"];

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const noteLetter = searchParams.get('note');
    setNoteToLetter(noteLetter.toUpperCase());
    setNoteToGuess(getRandomNote(noteLetter));
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

  function sinc(x) { return x ? Math.sin(OnePi * x) / (OnePi * x) : 1; }


  const applyWindow = (data, window) => {
    for (let i = 0; i < data.length; i++) {
      data[i] *= window[i];
    }
  };

  const NoteDetector = (dataSize, sampleRate, windowType) => {
    const tapers = {
      'raw': null,
      'hann': function (x) { return 1 / 2 - 1 / 2 * Math.cos(2 * Math.PI * x); },
      'hamming': function (x) { return 25 / 46 - 21 / 46 * Math.cos(2 * Math.PI * x); },
      'blackman': function (x) { return 0.42 - 0.50 * Math.cos(2 * Math.PI * x) + 0.08 * Math.cos(4 * Math.PI * x); },
      'lanczos': function (x) { return sinc(2 * x - 1); }
    };
  
    const trace = function (x) { };
    const close_threshold = 0.03;
    const track_lone_ms = 50;
    const track_cons_ms = 50;
    const detrack_min_volume = 0.01;
    const detrack_est_none_ms = 100;
    const detrack_est_some_ms = 50;
    const stable_note_ms = 50;
    const taper = tapers[windowType];
  
    let candidate = null;
    let tracking = null;
  
    const detectors = [
      Detector_acx(dataSize, sampleRate),
      Detector_yin(dataSize, sampleRate),
      Detector_mpm(dataSize, sampleRate),
    ];
  
    const buf = new Float32Array(dataSize);
    const est = new Float32Array(detectors.length);
    let vol = 0;
  
    const isClose_ = function (a, b) {
      return Math.abs(a - b) < Math.abs(a + b) * 0.5 * close_threshold;
    };
  
    const startTracking_ = function (hz, start) {
      candidate = null;
      tracking = { freq: hz, start: start, missed: 0 };
  
      detectors[0].volume_min /= 2;  // acx
      detectors[1].threshold *= 2;   // yin
      detectors[2].peak_ignore /= 2; // mpm
    };
  
    const stopTracking_ = function () {
      tracking = null;
  
      detectors[0].volume_min *= 2;  // acx
      detectors[1].threshold /= 2;   // yin
      detectors[2].peak_ignore *= 2; // mpm
    };

    const getConsensus_ = function(est)
    {
        let res = { cons: 0, lone: 0 };
        let num = 0;

        for (let i=0; i+1 < est.length; i++)
        {
            if (est[i] <= 0)
                continue;

            if (res.lone == 0) res.lone = est[i];
            else               res.lone = -1;

            for (let j=i+1; i+j < est.length; j++)
            {
                if (est[j] <= 0)
                    continue;

                if (this.isClose_(est[i], est[j]))
                {
                    res.cons += (est[i] + est[j])/2;
                    num++;
                }
            }
        }

        if (num)
            res.cons /= num;

        if (res.cons || res.lone)
        {
            function v6(v) { return v.toFixed(0).toString().padStart(6); }

            let x = '';
            for (let i=0; i<est.length; i++) x += v6(est[i]);
            this.trace( 'est[' + x + '], consensus: ' + v6(res.cons) + ', lone_est: ' + v6(res.lone));
        }

        return res;
    }
  
    const update = function (data) {
      applyWindow(data, buf, taper);
  
      for (let i = 0; i < detectors.length; i++)
        est[i] = detectors[i].process(buf);
  
      let res = getConsensus_(est);
      let freq = (res.cons <= 0) ? res.lone : res.cons;
      let lone = (res.cons <= 0);
  
      vol = getVolume(data);
  
      if (tracking) {
        if (isClose_(tracking.freq, freq))
          return;
  
        if (res.cons <= 0) {
          for (let i = 0; i < est.length; i++)
            if (isClose_(est[i], tracking.freq)) {
              tracking.missed = 0;
              return;
            }
  
          if (vol < detrack_min_volume) {
            trace('** TOO QUIET @ ' + vol.toFixed(5));
          } else {
            if (!tracking.missed) {
              tracking.missed = performance.now();
              return;
            }
  
            let ms = performance.now() - tracking.missed;
  
            if (res.lone != 0 && ms < detrack_est_some_ms ||
              res.lone == 0 && ms < detrack_est_none_ms)
              return;
  
            trace('** GONE STALE in ' + ms.toFixed(0) + ' ms ');
          }
        }
  
        stopTracking_();
      }
  
      if (!tracking) {
        if (res.cons <= 0 && res.lone <= 0) {
          candidate = null;
          return;
        }
  
        if (!candidate ||
          !isClose_(candidate.freq, freq)) {
          candidate = { freq: freq, lone: lone, start: performance.now() }
          return;
        }
  
        candidate.freq = (candidate.freq + freq) / 2;
        candidate.lone = lone;
  
        let ms = performance.now() - candidate.start;
  
        if (ms > track_cons_ms && !candidate.lone) {
          trace('** TRACKING by consensus');
          startTracking_(candidate.freq, candidate.start);
          return;
        }
  
        if (ms > track_lone_ms && candidate.lone) {
          trace('** TRACKING by lone estimate');
          startTracking_(candidate.freq, candidate.start);
          return;
        }
  
        // still priming
      }
    };
  
    return {
      update,
      getNote: function () {
        if (candidate && candidate.freq) {
          return {
            freq: candidate.freq,
            stable: true, // Example, adjust as per your logic
          };
        } else {
          return {
            freq: 0, // Default or placeholder value
            stable: false,
          };
        }
      },
      // Other methods or properties as needed
    };
  };


  const startAudioContext = async () => {
    stopAudioContext(); // Stop any existing audio context before starting a new one
    playRecordingSound();
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    audioContextRef.current = audioContext;
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 4096;
    analyser.v_uint8 = new Uint8Array(4096);
    analyser.v_float = new Float32Array(4096);
    source.connect(analyser);
  
    const detector = NoteDetector(2048, audioContext.sampleRate, 'hamming');
  
    const throttledIncrement = throttle(() => {
      update();
    }, 100); // 100ms throttle time
  
    function update() {
      if (!analyser) return; // Ensure analyzer is initialized
  
      const input_8 = analyser.v_uint8;
      const input_f = analyser.v_float;
  
      analyser.getByteTimeDomainData(input_8);
  
      for (let i = 0; i < input_8.length; i++)
        input_f[i] = input_8[i] / 128.0 - 1.0;
  
      detector.update(input_f);
  
      const note = detector.getNote();
      const desc = note && note.stable ? hzToNoteString(note.freq) : "";
      requestAnimationFrame(update);
    }
  
    // Start analyzing audio
    requestAnimationFrame(update);
  
    const getUserMedia = (constraints) => {
      return navigator.mediaDevices.getUserMedia(constraints);
    };
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

  const isValidPianoNote = (note) => {
    const match = note.match(/^([A-G]#?)(\d)$/);
    if (!match) return false;
    const [, , octave] = match;
    return octave >= 0 && octave <= 8;
  };

  const getRandomNote = (note) => {
    const octaves = Array.from({ length: 9 }, (_, i) => i); // Generates [0, 1, 2, ..., 8]
    const randomOctave = octaves[Math.floor(Math.random() * octaves.length)];
    return `${note}${randomOctave}`;
  };

  const handleContinue = () => {
    setNoteToGuess(getRandomNote(noteToLetter));
    setCorrectNotesCount(false);
    setHighlightedNote(null);
    startAudioContext();
  };

  const handleNoteDone = async (note) => {
    const userRef = firebase.firestore().collection('users').doc(loggedInUser.user);
    await userRef.update({
      [`tutorial.${note.toString().toLowerCase()}`]: "done"
    });
    navigate('/app/novice/steps');
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
                   <button   onClick={() => handleNoteDone(noteToLetter)} className="button-small">
                Done
              </button>
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
              {highlightedNote && (
                <div className="text-lg text-gray-500 mt-4 mb-5">
                  Detected Note: {highlightedNote}
                </div>
              )}
              {correctNotesCount && (
                <div className="text-lg text-gray-500 mt-4 mb-5">
                  Correct note detected!
                </div>
              )}
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

export default Notes;
