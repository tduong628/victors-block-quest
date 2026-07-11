// Run manually, off-tablet, on a machine with ELEVENLABS_API_KEY set. NEVER commit the key.
// Usage: ELEVENLABS_API_KEY=... node scripts/generate-audio.mjs
import fs from "node:fs/promises";
import path from "node:path";

const API_KEY = process.env.ELEVENLABS_API_KEY;
if (!API_KEY) {
  console.error("ELEVENLABS_API_KEY is required. This script is never run from inside the app or CI.");
  process.exit(1);
}

// itemId -> { en: text, vi: text }. Extend this table as content packs grow.
const PHRASES = {
  "letter-A": { en: "A", vi: "chữ A" },
  "letter-B": { en: "B", vi: "chữ B" },
  "letter-C": { en: "C", vi: "chữ C" },
  "letter-D": { en: "D", vi: "chữ D" },
  "letter-E": { en: "E", vi: "chữ E" },
  "number-0": { en: "zero", vi: "số không" },
  "number-1": { en: "one", vi: "số một" },
  "number-2": { en: "two", vi: "số hai" },
  "number-3": { en: "three", vi: "số ba" },
  "number-4": { en: "four", vi: "số bốn" },
};

const VOICE_ID_EN = process.env.ELEVENLABS_VOICE_EN ?? "REPLACE_WITH_CHOSEN_ENGLISH_VOICE_ID";
const VOICE_ID_VI = process.env.ELEVENLABS_VOICE_VI ?? "REPLACE_WITH_CHOSEN_VIETNAMESE_VOICE_ID";
const OUT_DIR = path.resolve(process.cwd(), "public/audio");

async function synth(text, voiceId, outFile) {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: { "xi-api-key": API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ text, model_id: "eleven_flash_v2_5" }),
  });
  if (!res.ok) throw new Error(`ElevenLabs TTS failed for "${text}": HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.writeFile(outFile, buf);
  console.log(`wrote ${outFile}`);
}

await fs.mkdir(OUT_DIR, { recursive: true });
for (const [itemId, { en, vi }] of Object.entries(PHRASES)) {
  await synth(en, VOICE_ID_EN, path.join(OUT_DIR, `en_${itemId}.mp3`));
  await synth(vi, VOICE_ID_VI, path.join(OUT_DIR, `vi_${itemId}.mp3`));
}
