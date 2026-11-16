/**
 * Compiles the 8 HD Storefront Demonstration Scenes into the Apple-Level Cinematic Product Film
 * Featuring synthesized warm ambient piano/strings soundtrack and smooth crossfades
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const SCENES_DIR = path.join(__dirname, '..', 'temp_video_scenes');
const OUTPUT_DIR = path.join(__dirname, '..', 'public');

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

console.log('======================================================');
console.log('🍎 PulseMascot: Assembling Cinematic Storefront Film');
console.log('======================================================');

// 1. Synthesize 60s Apple Ambient Piano/Cello Soundtrack
console.log('🎹 Synthesizing 60s acoustic piano & ambient soundtrack...');
const sampleRate = 44100;
const totalSeconds = 60;
const numSamples = sampleRate * totalSeconds;
const numChannels = 2;
const bytesPerSample = 2;
const blockAlign = numChannels * bytesPerSample;
const wavBuffer = Buffer.alloc(44 + numSamples * blockAlign);

// WAV Header
wavBuffer.write('RIFF', 0);
wavBuffer.writeUInt32LE(36 + numSamples * blockAlign, 4);
wavBuffer.write('WAVEfmt ', 8);
wavBuffer.writeUInt32LE(16, 16);
wavBuffer.writeUInt16LE(1, 20); // PCM
wavBuffer.writeUInt16LE(numChannels, 22);
wavBuffer.writeUInt32LE(sampleRate, 24);
wavBuffer.writeUInt32LE(sampleRate * blockAlign, 28);
wavBuffer.writeUInt16LE(blockAlign, 32);
wavBuffer.writeUInt16LE(16, 34);
wavBuffer.write('data', 36);
wavBuffer.writeUInt32LE(numSamples * blockAlign, 40);

const chordProgression = [
  { root: 130.81, notes: [261.63, 329.63, 392.00, 493.88] }, // Cmaj7
  { root: 110.00, notes: [220.00, 261.63, 329.63, 392.00] }, // Am7
  { root: 87.31,  notes: [174.61, 220.00, 261.63, 329.63] }, // Fmaj7
  { root: 98.00,  notes: [196.00, 261.63, 293.66, 392.00] }, // Gsus4
];

const barDuration = 7.5;

for (let i = 0; i < numSamples; i++) {
  const t = i / sampleRate;
  const chordIdx = Math.floor(t / barDuration) % chordProgression.length;
  const currentChord = chordProgression[chordIdx];
  const barTime = t % barDuration;

  // Warm Acoustic Piano Voices
  let piano = 0;
  for (let n = 0; n < currentChord.notes.length; n++) {
    const f = currentChord.notes[n];
    const noteOffset = n * 0.4;
    if (barTime >= noteOffset) {
      const nt = barTime - noteOffset;
      const decay = Math.exp(-nt * 1.8);
      const voice = (Math.sin(2 * Math.PI * f * nt) + 0.35 * Math.sin(4 * Math.PI * f * nt) + 0.12 * Math.sin(6 * Math.PI * f * nt)) * decay;
      piano += voice * 0.22;
    }
  }

  // Cello Sub-bass
  const celloDecay = Math.exp(-barTime * 0.6);
  const cello = Math.sin(2 * Math.PI * currentChord.root * barTime) * 0.3 * celloDecay;

  // Celesta Chime at act transitions
  let celesta = 0;
  const actTransitions = [7.5, 15, 22.5, 30, 37.5, 45, 52.5];
  for (const at of actTransitions) {
    if (t >= at && t < at + 2.5) {
      const dt = t - at;
      const cFreq = 1046.50; // C6
      celesta += (Math.sin(2 * Math.PI * cFreq * dt) + 0.4 * Math.sin(4 * Math.PI * cFreq * dt)) * Math.exp(-dt * 2.2) * 0.28;
    }
  }

  // Master Fade
  let master = 1.0;
  if (t < 2.0) master = t / 2.0;
  else if (t > totalSeconds - 3.0) master = Math.max(0, (totalSeconds - t) / 3.0);

  const left = (piano * 0.85 + cello * 0.9 + celesta * 0.8) * master;
  const right = (piano * 1.1 + cello * 0.9 + celesta * 1.0) * master;

  const clampedL = Math.max(-1, Math.min(1, left));
  const clampedR = Math.max(-1, Math.min(1, right));

  const offset = 44 + i * blockAlign;
  wavBuffer.writeInt16LE(Math.floor(clampedL * 31500), offset);
  wavBuffer.writeInt16LE(Math.floor(clampedR * 31500), offset + 2);
}

const audioPath = path.join(SCENES_DIR, 'soundtrack.wav');
fs.writeFileSync(audioPath, wavBuffer);
console.log('✓ Soundtrack written:', (fs.statSync(audioPath).size / 1024).toFixed(0), 'KB');

// 2. Build FFmpeg concat script with smooth xfade transitions
console.log('🎬 Rendering 60s 1080p Landscape Film (pulse-mascot-apple.mp4)...');

// Each scene runs for 8.0s with 0.8s crossfade to next
// Total duration = 8 * 8 - 7 * 0.8 = 64 - 5.6 = 58.4s (~60s)
const sceneFiles = [
  'scene_01.png',
  'scene_02.png',
  'scene_03.png',
  'scene_04.png',
  'scene_05.png',
  'scene_06.png',
  'scene_07.png',
  'scene_08.png'
];

const sceneInputs = [];
sceneFiles.forEach(f => {
  sceneInputs.push('-loop', '1', '-t', '8.2', '-i', path.join(SCENES_DIR, f));
});

// Construct xfade filter chain
let filterChain = '';
let lastOut = '[0:v]';
let offset = 7.4; // 8.2 - 0.8

for (let i = 1; i < sceneFiles.length; i++) {
  const nextOut = `[v${i}]`;
  filterChain += `${lastOut}[${i}:v]xfade=transition=fade:duration=0.8:offset=${offset.toFixed(1)}${i === sceneFiles.length - 1 ? '[vout]' : nextOut};`;
  lastOut = nextOut;
  offset += 7.4;
}

const outputPath169 = path.join(OUTPUT_DIR, 'pulse-mascot-apple.mp4');

const ffmpegArgs = [
  '-y',
  ...sceneInputs,
  '-i', audioPath,
  '-filter_complex', filterChain,
  '-map', '[vout]',
  '-map', `${sceneFiles.length}:a`,
  '-c:v', 'libx264',
  '-preset', 'fast',
  '-pix_fmt', 'yuv420p',
  '-c:a', 'aac',
  '-b:a', '192k',
  '-shortest',
  outputPath169
];

const res169 = spawnSync('ffmpeg', ffmpegArgs, { stdio: 'inherit' });
if (res169.status !== 0) {
  console.error('FFmpeg landscape failed with code', res169.status);
} else {
  console.log('✓ Successfully rendered Landscape 1080p film:', (fs.statSync(outputPath169).size / 1024 / 1024).toFixed(2), 'MB');
}

// 3. Render 9:16 Vertical Video for TikTok / Instagram Reels
console.log('📱 Rendering 60s 1080p Vertical Video (pulse-mascot-apple-vertical.mp4)...');
const outputPath916 = path.join(OUTPUT_DIR, 'pulse-mascot-apple-vertical.mp4');

// Vertical filter: split into blurred background fill + centered crisp 16:9 storefront
const verticalFilter = `${filterChain}[vout]split=2[vfg][vbg];[vbg]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=20:5[bgblur];[vfg]scale=1080:608:force_original_aspect_ratio=decrease[fgscaled];[bgblur][fgscaled]overlay=(W-w)/2:(H-h)/2[vvert]`;

const ffmpegArgsVert = [
  '-y',
  ...sceneInputs,
  '-i', audioPath,
  '-filter_complex', verticalFilter,
  '-map', '[vvert]',
  '-map', `${sceneFiles.length}:a`,
  '-c:v', 'libx264',
  '-preset', 'fast',
  '-pix_fmt', 'yuv420p',
  '-c:a', 'aac',
  '-b:a', '192k',
  '-shortest',
  outputPath916
];

const resVert = spawnSync('ffmpeg', ffmpegArgsVert, { stdio: 'inherit' });
if (resVert.status !== 0) {
  console.error('FFmpeg vertical failed with code', resVert.status);
} else {
  console.log('✓ Successfully rendered Vertical 9:16 film:', (fs.statSync(outputPath916).size / 1024 / 1024).toFixed(2), 'MB');
}

// Also duplicate to promo video paths for consistency
fs.copyFileSync(outputPath169, path.join(OUTPUT_DIR, 'pulse-mascot-promo.mp4'));
fs.copyFileSync(outputPath916, path.join(OUTPUT_DIR, 'pulse-mascot-promo-vertical.mp4'));
console.log('✓ Synchronized promo video paths!');
