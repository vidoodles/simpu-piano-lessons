const OnePi = 1 * Math.PI;
const TwoPi = 2 * Math.PI;
const FourPi = 4 * Math.PI;

function sinc(x) {
    return x ? Math.sin(OnePi * x) / (OnePi * x) : 1;
}

const tapers = {
    'raw': null,
    'hann': function(x) { return 1 / 2 - 1 / 2 * Math.cos(TwoPi * x); },
    'hamming': function(x) { return 25 / 46 - 21 / 46 * Math.cos(TwoPi * x); },
    'blackman': function(x) { return 0.42 - 0.50 * Math.cos(TwoPi * x) + 0.08 * Math.cos(FourPi * x); },
    'lanczos': function(x) { return sinc(2 * x - 1); }
};

function applyWindow(arr, out, func) {
    if (arr.length !== out.length) throw 'Wrong in/out lengths';

    if (!func) {
        for (let i = 0, n = arr.length; i < n; i++) out[i] = arr[i];
    } else {
        for (let i = 0, n = arr.length; i < n; i++) out[i] = arr[i] * func(i / (n - 1));
    }
}

function getVolume(buf) {
    let sum = 0;
    for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
    return Math.sqrt(sum / buf.length);
}

function getQuadraticPeak(data, pos) {
    if (pos === 0 || pos === data.length - 1 || data.length < 3) return { x: pos, y: data[pos] };

    const A = data[pos - 1];
    const B = data[pos];
    const C = data[pos + 1];
    const D = A - 2 * B + C;

    return { x: pos - (C - A) / (2 * D), y: B - (C - A) * (C - A) / (8 * D) };
}

function findPeaks(data, threshold) {
    const peaks = [];
    let pos = 0;

    while (pos < data.length && data[pos] > 0) pos++;
    while (pos < data.length && data[pos] <= 0) pos++;

    while (pos < data.length) {
        let pos_max = -1;
        while (pos < data.length && data[pos] > 0) {
            if (pos_max < 0 || data[pos] > data[pos_max]) pos_max = pos;
            pos++;
        }

        if (pos_max !== -1 && data[pos_max] >= threshold) peaks.push(pos_max);
        while (pos < data.length && data[pos] <= 0) pos++;
    }

    return peaks;
}

function findMcLeodPeak(data, threshold, cutoff) {
    const i = null;
    const peaks_x = findPeaks(data, threshold);
    if (!peaks_x.length) return -1;

    const peaks_q = [];
    let peak_max = -1;
    for (let i = 0; i < peaks_x.length; i++) {
        const peak = getQuadraticPeak(data, peaks_x[i]);
        peaks_q.push(peak);
        peak_max = Math.max(peak_max, peak.y);
    }

    const cutoffValue = peak_max * cutoff;
    for (let i = 0; i < peaks_q.length; i++) if (peaks_q[i].y >= cutoffValue) break;

    return peaks_q[i].x;
}

function Detector_yin(dataSize, sampleRate) {
    this.conf = { threshold: 0.20 };
    this.sampleRate = sampleRate;
    this.tmp = new Float32Array(dataSize / 2);

    this.process = function(buf) {
        if (this.tmp.length !== buf.length / 2) throw 'Wrong buf.length';

        const yin = this.tmp;
        let sum = 0;
        let peak_pos = -1;
        let min_pos = 0;

        yin[0] = 1.0;
        for (let tau = 1; tau < yin.length; tau++) {
            yin[tau] = 0;
            for (let j = 0; j < yin.length; j++) {
                const diff = buf[j] - buf[j + tau];
                yin[tau] += diff * diff;
            }

            sum += yin[tau];
            if (sum) yin[tau] *= tau / sum;
            else yin[tau] = 1.0;

            if (yin[tau] < yin[min_pos]) min_pos = tau;

            const period = tau - 3;
            if (tau > 4 && yin[period] < this.conf.threshold && yin[period] < yin[period + 1]) {
                peak_pos = period;
                break;
            }
        }

        if (peak_pos === -1) {
            peak_pos = min_pos;
            if (yin[peak_pos] >= this.conf.threshold) return -1;
        }

        const t0 = getQuadraticPeak(yin, peak_pos).x;
        return t0 ? this.sampleRate / t0 : -1;
    };
}

function Detector_mpm(dataSize, sampleRate) {
    this.conf = {
        peak_ignore: 0.25,
        peak_cutoff: 0.93,
        pitch_min: 80
    };

    this.sampleRate = sampleRate;
    this.tmp = new Float32Array(dataSize);

    this.process = function(buf) {
        if (this.tmp.length !== buf.length) throw 'Wrong buf.length';

        const nsdf = this.tmp;
        nsdf.fill(0);

        for (let tau = 0; tau < buf.length / 2; tau++) {
            let acf = 0;
            let div = 0;

            for (let i = 0; i + tau < buf.length; i++) {
                acf += buf[i] * buf[i + tau];
                div += buf[i] * buf[i] + buf[i + tau] * buf[i + tau];
            }

            nsdf[tau] = div ? 2 * acf / div : 0;
        }

        const peak = findMcLeodPeak(nsdf, this.conf.peak_ignore, this.conf.peak_cutoff);
        const hz = peak > 0 ? this.sampleRate / peak : -1;

        return hz < this.conf.pitch_min ? -1 : hz;
    };
}

function Detector_acx(dataSize, sampleRate) {
    this.conf = {
        volume_min: 0.01,
        peak_ignore: 0.00,
        peak_cutoff: 0.93
    };

    this.sampleRate = sampleRate;
    this.tmp = new Float32Array(dataSize);

    this.process = function(buf) {
        if (this.tmp.length !== buf.length) throw 'Wrong buf.length';

        const acfv = this.tmp;
        acfv.fill(0);

        for (let tau = 0; tau < buf.length / 2; tau++) {
            let acf = 0;
            let div = buf.length - tau;

            for (let i = 0; i + tau < buf.length; i++) acf += buf[i] * buf[i + tau];

            acfv[tau] = acf / div;

            if (tau === 0) {
                const vol = Math.sqrt(acfv[0]);
                if (vol < this.conf.volume_min) return -1;
            }
        }

        const peak = findMcLeodPeak(acfv, this.conf.peak_ignore, this.conf.peak_cutoff);
        const hz = peak > 0 ? this.sampleRate / peak : -1;

        return hz;
    };
}

function NoteDetector(dataSize, sampleRate, windowType) {
    this.conf = {
        close_threshold: 0.03,
        track_lone_ms: 50,
        track_cons_ms: 50,
        detrack_min_volume: 0.01,
        detrack_est_none_ms: 100,
        detrack_est_some_ms: 50,
        stable_note_ms: 50,
    };

    this.trace = function(x) {};
    this.taper = tapers[windowType];

    this.candidate = null;
    this.tracking = null;

    this.detectors = [
        new Detector_acx(dataSize, sampleRate),
        new Detector_yin(dataSize, sampleRate),
        new Detector_mpm(dataSize, sampleRate)
    ];

    this.buf = new Float32Array(dataSize);
    this.est = new Float32Array(this.detectors.length);
    this.vol = 0;

    this.update = function(data) {
        applyWindow(data, this.buf, this.taper);

        const est = this.est;

        for (let i = 0; i < this.detectors.length; i++) est[i] = this.detectors[i].process(this.buf);

        const res = this.getConsensus_(est);
        const freq = res.cons <= 0 ? res.none : res.mean;
        const vol = getVolume(this.buf);

        this.vol = vol;
        this.track_(vol, freq, res.cons);

        return this.tracking && this.tracking.freq > 0 ? this.tracking : null;
    };

    this.getConsensus_ = function(est) {
        let none = 0;
        let mean = 0;
        let sum = 0;
        let cons = 0;

        for (let i = 0; i < est.length; i++) {
            if (est[i] > 0) {
                cons++;
                mean += est[i];
            }
        }

        if (cons > 1) {
            mean /= cons;
            for (let i = 0; i < est.length; i++) {
                if (est[i] > 0 && Math.abs(est[i] - mean) / mean > this.conf.close_threshold) {
                    none = est[i];
                    est[i] = 0;
                    cons--;
                }
            }
        }

        if (cons > 1) {
            mean = 0;
            for (let i = 0; i < est.length; i++) {
                if (est[i] > 0) mean += est[i];
            }
            mean /= cons;
        } else if (cons === 1) {
            for (let i = 0; i < est.length; i++) {
                if (est[i] > 0) mean = est[i];
            }
        } else {
            mean = none;
        }

        return { none, mean, cons };
    };

    this.track_ = function(volume, freq, cons) {
        const now = Date.now();

        if (!this.tracking) {
            if (freq > 0 && volume >= this.conf.detrack_min_volume) {
                if (!this.candidate || this.candidate.freq !== freq || now - this.candidate.time_start > this.conf.track_lone_ms) {
                    this.candidate = {
                        freq: freq,
                        time_start: now,
                        time_stop: now,
                        timeout: setTimeout(this.track_.bind(this), this.conf.track_cons_ms)
                    };
                } else {
                    this.candidate.time_stop = now;
                }
            }

            if (this.candidate && now - this.candidate.time_start >= this.conf.track_cons_ms) {
                this.tracking = {
                    freq: this.candidate.freq,
                    time_start: now,
                    time_stop: now,
                    timeout: setTimeout(this.track_.bind(this), this.conf.stable_note_ms)
                };

                this.trace(this.tracking.freq);
                clearTimeout(this.candidate.timeout);
                this.candidate = null;
            }
        } else {
            if (freq > 0 && volume >= this.conf.detrack_min_volume) {
                this.tracking.time_stop = now;
                this.tracking.freq = freq;
            }

            if (now - this.tracking.time_stop > this.conf.detrack_est_some_ms) {
                if (now - this.tracking.time_stop > this.conf.detrack_est_none_ms) {
                    clearTimeout(this.tracking.timeout);
                    this.tracking = null;
                } else if (cons > 0) {
                    this.tracking.freq = freq;
                }
            }
        }
    };
}

export default NoteDetector;
