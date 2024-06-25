import React, { useState, useEffect } from 'react';

const OnePi = 1 * Math.PI;
const TwoPi = 2 * Math.PI;
const FourPi = 4 * Math.PI;

const tapers = {
  'raw': null,
  'hann': function (x) { return 1 / 2 - 1 / 2 * Math.cos(TwoPi * x); },
  'hamming': function (x) { return 25 / 46 - 21 / 46 * Math.cos(TwoPi * x); },
  'blackman': function (x) { return 0.42 - 0.50 * Math.cos(TwoPi * x) + 0.08 * Math.cos(FourPi * x); },
  'lanczos': function (x) { return sinc(2 * x - 1); }
};

function sinc(x) {
  return x ? Math.sin(OnePi * x) / (OnePi * x) : 1;
}

function applyWindow(arr, out, func) {
  if (arr.length !== out.length)
    throw 'Wrong in/out lengths';

  if (!func)
    for (let i = 0, n = arr.length; i < n; i++)
      out[i] = arr[i];
  else
    for (let i = 0, n = arr.length; i < n; i++)
      out[i] = arr[i] * func(i / (n - 1));
}

function getVolume(buf) {
  var sum = 0;

  for (var i = 0; i < buf.length; i++)
    sum += buf[i] * buf[i];

  return Math.sqrt(sum / buf.length);
}

function getQuadraticPeak(data, pos) {
  if (pos === 0 || pos === data.length - 1 || data.length < 3)
    return { x: pos, y: data[pos] };

  var A = data[pos - 1];
  var B = data[pos];
  var C = data[pos + 1];
  var D = A - 2 * B + C;

  return { x: pos - (C - A) / (2 * D), y: B - (C - A) * (C - A) / (8 * D) };
}

function findPeaks(data, threshold) {
  var peaks = [];
  let pos = 0;

  // skip while above zero
  while (pos < data.length && data[pos] > 0) pos++;

  // skip until above zero again
  while (pos < data.length && data[pos] <= 0) pos++;

  while (pos < data.length) {
    let pos_max = -1;

    // while above zero
    while (pos < data.length && data[pos] > 0) {
      if (pos_max < 0 || data[pos] > data[pos_max])
        pos_max = pos;
      pos++;
    }

    if (pos_max !== -1 && data[pos_max] >= threshold)
      peaks.push(pos_max);

    // while below zero or zero
    while (pos < data.length && data[pos] <= 0)
      pos++;
  }

  return peaks;
}

function findMcLeodPeak(data, threshold, cutoff) {
  var peaks_x;
  var peaks_q;
  var peak_max;
  var cutoff_value;
  var i;

  // find peak positions

  peaks_x = findPeaks(data, threshold);
  if (!peaks_x.length)
    return -1;

  // refine them

  peaks_q = [];
  peak_max = -1;
  for (i = 0; i < peaks_x.length; i++) {
    let peak;

    peak = getQuadraticPeak(data, peaks_x[i]);
    peaks_q.push(peak);
    peak_max = Math.max(peak_max, peak.y);
  }

  // find first large-enough peak

  cutoff_value = peak_max * cutoff;
  for (i = 0; i < peaks_q.length; i++)
    if (peaks_q[i].y >= cutoff_value)
      break;

  // i < peaks_q.length

  return peaks_q[i].x;
}

function hzToNote(freq) {
  var note = 12 * (Math.log(freq / 440) / Math.log(2));
  return Math.round(note) + 49;
}

function noteString(note) {
  const notes = ["A", "A#", "B", "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#"];
  const letter = notes[(note + 11) % notes.length];
  const octave = Math.floor((note - 49) / notes.length) + 4;

  return letter + (letter.length < 2 ? '.' : '') + octave;
}

function hzToNoteString(freq) {
  return noteString(hzToNote(freq));
}

function noteToHz(note) {
  return 440 * Math.pow(2, (note - 49) / 12);
}

const Tutorial = () => {
  const [pitch, setPitch] = useState(null);

  useEffect(() => {
    // Initialize Web Audio API
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048; // Adjust FFT size as needed for accuracy
        const microphone = audioContext.createMediaStreamSource(stream);
        microphone.connect(analyser);

        const dataArray = new Float32Array(analyser.fftSize);

        const processAudio = () => {
          analyser.getFloatTimeDomainData(dataArray);
          const volume = getVolume(dataArray);
          const pitchHz = findMcLeodPeak(dataArray, 0.5, 0.7);
          setPitch({
            frequency: pitchHz > 0 ? audioContext.sampleRate / pitchHz : null,
            volume: volume,
            note: pitchHz > 0 ? hzToNoteString(audioContext.sampleRate / pitchHz) : 'N/A'
          });
          requestAnimationFrame(processAudio);
        };

        processAudio();

      }).catch(error => {
        console.error('Error accessing microphone:', error);
      });
  }, []);

  return (
    <div>
      <h1>Note Detector with Real-Time Pitch Detection</h1>
      {pitch && (
        <div>
          <p>Detected Frequency: {pitch.frequency ? pitch.frequency.toFixed(2) + ' Hz' : 'N/A'}</p>
          <p>Volume: {pitch.volume.toFixed(2)}</p>
          <p>Detected Note: {pitch.note}</p>
        </div>
      )}
    </div>
  );
};

export default Tutorial;
