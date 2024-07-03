import React, { useEffect, useState } from 'react';
import { Piano, KeyboardShortcuts, MidiNumbers } from 'react-piano';
import '../piano.css';
import Pitchfinder from 'pitchfinder';
import abcjs from 'abcjs';
import UserProfile from '../components/UserProfile';
import { useLocation } from 'react-router-dom';

const Songs = () => {
  const firstNote = MidiNumbers.fromNote('c3');
  const lastNote = MidiNumbers.fromNote('c5');
  const keyboardShortcuts = KeyboardShortcuts.create({
    firstNote,
    lastNote,
    keyboardConfig: KeyboardShortcuts.HOME_ROW,
  });

  const [activeNotes, setActiveNotes] = useState([]);
  const [songTab, setSongTab] = useState("");
  const [songName, setSongName] = useState("");
  const [loggedInUser, setLoggedInUser] = useState(null);

  const location = useLocation();

  const songs = {
    "London Bridge": `
      X: 1
      T: London Bridge
      M: 4/4
      K: C
      G4 A4 G4 F4 | E4 F4 G4 | D4 E4 F4 | E4 F4 G4 |
      G4 A4 G4 F4 | E4 F4 G4 | D4 G4 | E4 C4 |
    `,
    "Ba Ba Black Sheep": `
      X: 3
      T: Ba Ba Black Sheep
      M: 4/4
      K: C
      G4 G4 D4 D4 | E4 E4 D4 | C4 C4 B4 B4 | A4 A4 G4 |
    `,
    "Lullaby Baby": `
      X: 4
      T: Lullaby Baby
      M: 4/4
      K: C
      G4 A4 G4 F4 | E4 D4 C4 | C4 D4 E4 F4 | G4 A4 B4 |
    `,
    "Ode to Joy": `
    X: 1
    T: Ode to Joy
    M: 4/4
    K: C
    L: 1/4
    E E F G | G F E D | C C D E | E D D | E E F G | G F E D | C C D E | D C C
    `,
    "Moonlight Sonata": `
    X: 2
    T: Moonlight Sonata
    M: 4/4
    K: C#m
    L: 1/4
    V:1 treble
    L: 1/8
    "Em" z4 z4 | "Em" B3 E G B3 | "Em" d3 B G E3 | "Em" d3 B G E3 | "Em" B3 E G B3 | "Em" d3 B G E3 | "Em" d3 B G E3 |
    `,
    "Canon in D": `
    X: 3
    T: Canon in D
    M: 4/4
    K: D
    L: 1/4
    P: A
    D E F# G | A F# D A | D E F# G | A F# D A |
    B A G F# | E D E F# | G F# E D | C# D E F# |
    G A B C# | D C# B A | G A B C# | D C# B A |
    B A G F# | E D E F# | G F# E D | C# D E F# |`,
    "River Flows in You": `
    X: 4
    T: River Flows in You
    M: 4/4
    K: Am
    L: 1/8
    P: A
    "Am" e2 e2 e2 g2 | "C" c2 c2 c2 c2 | "G" B2 B2 B2 B2 | "Am" e2 e2 e2 e2 |
    "F" a2 a2 a2 a2 | "G" b2 b2 b2 b2 | "C" c'2 c'2 c'2 c'2 | "Am" a2 a2 a2 a2 |
    "F" e2 e2 e2 e2 | "G" d2 d2 d2 d2 | "Am" e2 e2 e2 e2 | "F" g2 g2 g2 g2 |
    `
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setLoggedInUser(userData);
    }
  }, []);

  useEffect(() => {
    const detectPitch = () => {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const pitchfinder = Pitchfinder.AMDF();
      const dataArray = new Float32Array(analyser.fftSize);

      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          const source = audioContext.createMediaStreamSource(stream);
          source.connect(analyser);

          const detect = () => {
            analyser.getFloatTimeDomainData(dataArray);
            const pitch = pitchfinder(dataArray);

            if (pitch) {
              const midiNumber = Pitchfinder.getMidiNoteFromPitch(pitch);
              setActiveNotes([midiNumber]);
            }

            requestAnimationFrame(detect);
          };

          detect();
        })
        .catch(err => console.error('Error accessing microphone: ', err));
    };

    detectPitch();
  }, []);

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const title = query.get('title');
    if (title && songs[title]) {
      setSongName(title);
      setSongTab(songs[title]);
    }
  }, [location.search]);

  useEffect(() => {
    if (songTab) {
      abcjs.renderAbc("abcjs-container", songTab);
    }
  }, [songTab]);

  return (
    <div className="min-h-screen flex flex-col justify-between items-center p-4">
      {/* Progress bar */}
      <UserProfile user={loggedInUser} />
      <div className="flex justify-center my-2 w-full">
        <div className="w-full max-w-3xl">
          <div className="relative pt-1">
            <div className="flex mb-2 items-center justify-between">
              <span className="text-lg font-semibold inline-block text-green-600">
                SimProficient 🐧
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quiz section */}
      <div className="flex flex-col items-center justify-center flex-grow w-full">
        <div className="bg-white p-2 w-full max-w-3xl">
          <h2 className="text-lg font-semibold mb-4">Let's Practice! Play the Generated Tab below. You got this! Just remember what we practiced.</h2>
          <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
            <div className="flex flex-col items-center">
              {/* ABCJS */}
              {`🎵 ${songName} 🎵`}
              <div id="abcjs-container" className="flex w-full justify-center p-6 mb-10"></div>
              {/* Piano */}
              <Piano
                className="w-full"
                noteRange={{ first: firstNote, last: lastNote }}
                width={700}
                playNote={(midiNumber) => {
                  // Handle note on logic if needed
                }}
                stopNote={(midiNumber) => {
                  // Handle note off logic if needed
                }}
                activeNotes={activeNotes}
                keyboardShortcuts={keyboardShortcuts}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Feedback section */}
      <div className="flex w-full justify-center p-6">
        <div className="flex items-center justify-between w-full mt-4 px-4 bg-green-200">
     
        </div>
      </div>
      <div></div>
    </div>
  );
};

export default Songs;
