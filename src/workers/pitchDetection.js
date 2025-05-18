// pitchDetection.js - Web Worker for pitch detection using autocorrelation

// Autocorrelation pitch detection
function autoCorrelate(buffer, sampleRate) {
  // Remove DC offset
  let size = buffer.length;
  let sum = 0;
  for (let i = 0; i < size; i++) sum += buffer[i];
  let mean = sum / size;
  for (let i = 0; i < size; i++) buffer[i] -= mean;

  let maxSamples = Math.floor(size / 2);
  let bestOffset = -1;
  let bestCorrelation = 0;
  let rms = 0;
  for (let i = 0; i < size; i++) rms += buffer[i] * buffer[i];
  rms = Math.sqrt(rms / size);
  if (rms < 0.01) return -1; // Too quiet

  let correlations = new Array(maxSamples);
  for (let offset = 0; offset < maxSamples; offset++) {
    let correlation = 0;
    for (let i = 0; i < maxSamples; i++) {
      correlation += buffer[i] * buffer[i + offset];
    }
    correlations[offset] = correlation;
    if (correlation > bestCorrelation) {
      bestCorrelation = correlation;
      bestOffset = offset;
    }
  }
  if (bestCorrelation > 0.01) {
    // Parabolic interpolation for better accuracy
    let shift = (correlations[bestOffset + 1] - correlations[bestOffset - 1]) /
      (2 * (2 * correlations[bestOffset] - correlations[bestOffset - 1] - correlations[bestOffset + 1]));
    let period = bestOffset + shift;
    return sampleRate / period;
  }
  return -1;
}

self.onmessage = function (e) {
  const { audioBuffer, sampleRate } = e.data;
  const pitch = autoCorrelate(audioBuffer, sampleRate);
  self.postMessage({ pitch });
};
