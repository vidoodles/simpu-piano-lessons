
import {Detector_acx, Detector_yin, Detector_mpm, getVolume} from '../utils/NoteDetector';


function NoteDetector (dataSize, sampleRate, windowType) {

    const OnePi  = 1 * Math.PI;
    const TwoPi  = 2 * Math.PI;
    const FourPi = 4 * Math.PI;

    
    function sinc(x) { return x ? Math.sin(OnePi * x) / (OnePi * x) : 1; }

    function applyWindow(arr, out, func)
    {
        if (arr.length != out.length)
            throw 'Wrong in/out lengths';
   
        if (! func)
            for (let i=0, n=arr.length; i<n; i++)
                out[i] = arr[i];
        else
            for (let i=0, n=arr.length; i<n; i++)
                out[i] = arr[i] * func( i/(n-1) );
    }

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
  
    this.isClose_ = function (a, b) {
      return Math.abs(a - b) < Math.abs(a + b) * 0.5 * close_threshold;
    };
  
    this.startTracking_ = function (hz, start) {
      candidate = null;
      tracking = { freq: hz, start: start, missed: 0 };
  
      detectors[0].volume_min /= 2;  // acx
      detectors[1].threshold *= 2;   // yin
      detectors[2].peak_ignore /= 2; // mpm
    };
  
    this.stopTracking_ = function () {
      tracking = null;
  
      detectors[0].volume_min *= 2;  // acx
      detectors[1].threshold /= 2;   // yin
      detectors[2].peak_ignore *= 2; // mpm
    };

    this.getNote = function()
    {

        if (!tracking) {
            return null; // Handle case where tracking is not initialized
        }

        let ms = performance.now() - tracking.start;
        return { freq: tracking.freq, stable: ms >= stable_note_ms };
    }

    this.getConsensus_ = function(est)
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
        }

        return res;
    }
  
    this.update = function (data) {
      applyWindow(data, buf, taper);
      for (let i = 0; i < detectors.length; i++)
        est[i] = detectors[i].process(buf);

  
      let res = this.getConsensus_(est);
      let freq = (res.cons <= 0) ? res.lone : res.cons;
      let lone = (res.cons <= 0);
  
      vol = getVolume(data);
  
      if (tracking) {
        if (this.isClose_(tracking.freq, freq))
          return;
  
        if (res.cons <= 0) {
          for (let i = 0; i < est.length; i++)
            if (this.isClose_(est[i], tracking.freq)) {
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
  
        this.stopTracking_();
      }
  
      if (!tracking) {
        if (res.cons <= 0 && res.lone <= 0) {
          candidate = null;
          return;
        }
  
        if (!candidate ||
          !this.isClose_(candidate.freq, freq)) {
          candidate = { freq: freq, lone: lone, start: performance.now() }
          return;
        }
  
        candidate.freq = (candidate.freq + freq) / 2;
        candidate.lone = lone;
  
        let ms = performance.now() - candidate.start;
  
        if (ms > track_cons_ms && !candidate.lone) {
          this.startTracking_(candidate.freq, candidate.start);
          return;
        }
  
        if (ms > track_lone_ms && candidate.lone) {
          this.startTracking_(candidate.freq, candidate.start);
          return;
        }
  
      }
    };
  };

export default NoteDetector;