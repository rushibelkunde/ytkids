import { exec } from 'child_process';
import util from 'util';
import path from 'path';
import fs from 'fs';
import { DB } from '../db';

const execPromise = util.promisify(exec);

export interface TTSResult {
  audioPath: string; // Absolute path on disk
  audioUrl: string;  // Public URL served by Next.js
  durationSeconds: number;
}

export async function generateSpeech(text: string, voiceId?: string, sceneId?: string): Promise<TTSResult> {
  const settings = DB.getSettings();
  const selectedVoice = voiceId || settings.default_voice || 'en-US-AnaNeural';
  const outFilename = `narration_${sceneId || Date.now()}_${Math.random().toString(36).slice(2, 7)}.mp3`;
  
  const audioDir = path.join(process.cwd(), 'data', 'audio');
  if (!fs.existsSync(audioDir)) {
    fs.mkdirSync(audioDir, { recursive: true });
  }

  const outPath = path.join(audioDir, outFilename);

  // If ElevenLabs is configured and selected
  if (settings.default_tts === 'elevenlabs' && settings.elevenlabs_api_key) {
    try {
      const elResult = await callElevenLabs(text, settings.elevenlabs_api_key, outPath);
      return elResult;
    } catch (err) {
      console.warn('ElevenLabs generation failed, falling back to Free Edge-TTS:', err);
    }
  }

  // Use Edge-TTS (Free, Neural, high-quality)
  const edgeTtsCmd = `~/.local/bin/edge-tts --voice "${selectedVoice}" --text "${text.replace(/"/g, '\\"')}" --write-media "${outPath}"`;
  await execPromise(edgeTtsCmd);

  // Measure exact duration using ffprobe
  let duration = 6.0;
  try {
    const { stdout } = await execPromise(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${outPath}"`);
    const parsed = parseFloat(stdout.trim());
    if (!isNaN(parsed) && parsed > 0) {
      duration = parsed;
    }
  } catch (probeErr) {
    console.warn('ffprobe duration check failed, defaulting to 6s:', probeErr);
  }

  return {
    audioPath: outPath,
    audioUrl: `/api/media/audio/${outFilename}`,
    durationSeconds: duration
  };
}

async function callElevenLabs(text: string, apiKey: string, outPath: string): Promise<TTSResult> {
  // Voice ID: Rachel (warm friendly narrator) by default: 21m00Tcm4TlvDq8ikWAM
  const voiceId = '21m00Tcm4TlvDq8ikWAM';
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_turbo_v2_5',
      voice_settings: {
        stability: 0.6,
        similarity_boost: 0.8
      }
    })
  });

  if (!response.ok) {
    throw new Error(`ElevenLabs API error: ${response.status} ${await response.text()}`);
  }

  const buffer = await response.arrayBuffer();
  fs.writeFileSync(outPath, Buffer.from(buffer));

  let duration = 6.0;
  try {
    const { stdout } = await execPromise(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${outPath}"`);
    const parsed = parseFloat(stdout.trim());
    if (!isNaN(parsed) && parsed > 0) duration = parsed;
  } catch {}

  const outFilename = path.basename(outPath);
  return {
    audioPath: outPath,
    audioUrl: `/api/media/audio/${outFilename}`,
    durationSeconds: duration
  };
}
