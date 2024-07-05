export function getVolume(buf)
{
    var sum = 0;

    for (var i=0; i < buf.length; i++)
        sum += buf[i] * buf[i];

    return Math.sqrt(sum / buf.length);
}

export function Detector_mpm(dataSize, sampleRate) {
    const peak_ignore = 0.25;  // ignore peaks smaller than this fraction of max
    const peak_cutoff = 0.93;  // pick first peak that's larger than this fraction of max
    const pitch_min = 80;      // if we arrive at hz less than this, then fail detection

    const tmp = new Float32Array(dataSize);

    const process = function(buf) {
        if (tmp.length !== buf.length)
            console.log("Wrong buf.length")

        const nsdf = tmp;
        let peak;
        let hz;

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

        peak = findMcLeodPeak(nsdf, peak_ignore, peak_cutoff);
        hz = (peak > 0) ? sampleRate / peak : -1;

        return (hz < pitch_min) ? -1 : hz;
    };

    return { process };
}

export function Detector_yin(dataSize, sampleRate) {
    const threshold = 0.20;

    const tmp = new Float32Array(dataSize / 2);

    const process = function(buf) {
        if (tmp.length !== buf.length / 2)
            throw 'Wrong buf.length';

        const yin = tmp;
        let sum = 0;
        let peak_pos = -1;
        let min_pos = 0;

        yin[0] = 1.0;

        for (let tau = 1; tau < yin.length; tau++) {
            yin[tau] = 0;
            for (let j = 0; j < yin.length; j++) {
                let diff = buf[j] - buf[j + tau];
                yin[tau] += diff * diff;
            }

            sum += yin[tau];

            if (sum) yin[tau] *= tau / sum;
            else yin[tau] = 1.0;

            if (yin[tau] < yin[min_pos])
                min_pos = tau;

            let period = tau - 3;

            if (tau > 4 &&
                yin[period] < threshold &&
                yin[period] < yin[period + 1]) {
                peak_pos = period;
                break;
            }
        }

        if (peak_pos === -1) {
            peak_pos = min_pos;
            if (yin[peak_pos] >= threshold)
                return -1;
        }

        let t0 = getQuadraticPeak(yin, peak_pos).x;
        let hz = t0 ? sampleRate / t0 : -1;

        return hz;
    };

    return { process };
}

export function Detector_acx(dataSize, sampleRate) {
    const volume_min = 0.01;
    const peak_ignore = 0.00;   // ignore peaks smaller than this fraction of max
    const peak_cutoff = 0.93;   // pick first peak that's larger than this fraction of max

    const tmp = new Float32Array(dataSize);

    const process = function(buf) {
        if (tmp.length !== buf.length)
            throw 'Wrong buf.length';

        const acfv = tmp;
        let peak;
        let hz;

        acfv.fill(0);

        for (let tau = 0; tau < buf.length / 2; tau++) {
            let acf = 0;
            let div = buf.length - tau;

            for (let i = 0; i + tau < buf.length; i++)
                acf += buf[i] * buf[i + tau];

            acfv[tau] = acf / div;

            if (tau === 0) {
                let vol = Math.sqrt(acfv[0]);
                if (vol < volume_min)
                    return -1;
            }
        }

        peak = findMcLeodPeak(acfv, peak_ignore, peak_cutoff);
        hz = (peak > 0) ? sampleRate / peak : -1;

        return hz;
    };

    return { process };
}

function findMcLeodPeak(data, threshold, cutoff) {
    let peaks_x;
    let peaks_q = [];
    let peak_max = -1;

    peaks_x = findPeaks(data, threshold);
    if (!peaks_x.length)
        return -1;

    for (let i = 0; i < peaks_x.length; i++) {
        let peak = getQuadraticPeak(data, peaks_x[i]);
        peaks_q.push(peak);
        peak_max = Math.max(peak_max, peak.y);
    }

    cutoff = peak_max * cutoff;
    for (let i = 0; i < peaks_q.length; i++) {
        if (peaks_q[i].y >= cutoff)
            return peaks_q[i].x;
    }

    return -1;
}

function getQuadraticPeak(data, pos) {
    if (pos === 0 || pos === data.length - 1 || data.length < 3)
        return { x: pos, y: data[pos] };

    let A = data[pos - 1];
    let B = data[pos];
    let C = data[pos + 1];
    let D = A - 2 * B + C;

    return { x: pos - (C - A) / (2 * D), y: B - (C - A) * (C - A) / (8 * D) };
}

function findPeaks(data, threshold) {
    let peaks = [];
    let pos = 0;

    while (pos < data.length && data[pos] > 0)
        pos++;

    while (pos < data.length && data[pos] <= 0)
        pos++;

    while (pos < data.length) {
        let pos_max = -1;

        while (pos < data.length && data[pos] > 0) {
            if (pos_max < 0 || data[pos] > data[pos_max])
                pos_max = pos;
            pos++;
        }

        if (pos_max !== -1 && data[pos_max] >= threshold)
            peaks.push(pos_max);

        while (pos < data.length && data[pos] <= 0)
            pos++;
    }

    return peaks;
}
function noteString(note)
{
    const notes = ["A", "A#", "B", "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#"];
    const letter = notes[(note - 1) % notes.length];
    const octave = Math.floor((note + 8) / notes.length); // Adjusted to shift one octave higher

    return letter + (letter.length < 2 ? '.' : '') + octave;
}

function hzToNote(freq)
{   
    var note = 12 * (Math.log(freq / 440) / Math.log(2));
    return Math.round(note) + 49;
}

export function hzToNoteString(freq) {
    return noteString(hzToNote(freq));
}

function noteToHz(note) {
    return 440 * Math.pow(2, (note - 49) / 12);
}
