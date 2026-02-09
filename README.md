# वाणी | Vaani

**Speak. Be Understood.**

Vaani is a two-way voice translator that bridges the language gap for India's 100 million migrant workers. Speak in your language — the other person hears it in theirs. No typing. No English. Just speak.

Built for the [Sarvam AI Bulbul Challenge](https://www.sarvam.ai/) using three Sarvam AI products chained together per turn.

---

## How It Works

Each voice message flows through a three-step pipeline:

```
🎙️ Speech (Source Language)
   ↓  Saarika STT v2.5
📝 Text (Source Language)
   ↓  Mayura Translate v1
📝 Text (Target Language)
   ↓  Bulbul TTS v3
🔊 Speech (Target Language)
```

Two people tap their respective mic buttons, speak in their own language, and hear the translation spoken back in the other's language — creating a natural back-and-forth conversation.

---

## Supported Languages

| Language   | Code   |
|------------|--------|
| Hindi      | hi-IN  |
| Kannada    | kn-IN  |
| Tamil      | ta-IN  |
| Telugu     | te-IN  |
| Malayalam  | ml-IN  |
| Bengali    | bn-IN  |
| Marathi    | mr-IN  |
| Gujarati   | gu-IN  |
| Odia       | od-IN  |
| Punjabi    | pa-IN  |

**10 languages. 90 translation pairs.**

---

## Pages

| Page | Description |
|------|-------------|
| **Landing** (`index.html`) | Language pair selector with animated multilingual hero text |
| **Translate** (`translate.html`) | Two-way voice conversation interface with dual mic buttons |
| **Demos** (`demos.html`) | Pre-recorded sample conversations showcasing real scenarios |

---

## Project Structure

```
vaani/
├── index.html              # Landing page
├── translate.html          # Voice translator
├── demos.html              # Demo conversations
├── css/
│   └── style.css           # All styles (Denim + Dark Ocean Blue theme)
├── js/
│   ├── translate.js        # Recording, API calls, playback logic
│   └── demos.js            # Demo audio playback
├── api/
│   └── voice-translate.js  # Serverless function (STT → Translate → TTS)
├── audio/                  # Pre-generated demo WAV files
├── generate_demos.py       # Script to generate demo audio via Bulbul V3
├── server.js               # Local dev server
├── vercel.json             # Vercel deployment config
└── package.json            # Dependencies
```

---

## Getting Started

### Prerequisites

- Node.js (v16+)
- A [Sarvam AI](https://www.sarvam.ai/) API key

### Local Development

```bash
# Install dependencies
npm install

# Set your API key
export SARVAM_API_KEY=your_api_key_here

# Start the local server
node server.js
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Generate Demo Audio (Optional)

If you need to regenerate the demo conversation audio files:

```bash
pip install requests
export SARVAM_API_KEY=your_api_key_here
python generate_demos.py
```

This creates 6 WAV files in the `audio/` directory.

---

## Deploy to Vercel

The project is pre-configured for Vercel deployment.

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

**Important:** Set the `SARVAM_API_KEY` environment variable in your Vercel project settings:

> Vercel Dashboard → Project → Settings → Environment Variables → Add `SARVAM_API_KEY`

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Static HTML, CSS, vanilla JavaScript |
| Audio Capture | MediaRecorder API (WebM) |
| Backend | Vercel Serverless Functions (Node.js) |
| STT | Sarvam Saarika v2.5 |
| Translation | Sarvam Mayura v1 |
| TTS | Sarvam Bulbul v3 |
| Fonts | Google Noto Sans (all 10 Indic scripts) |

---

## API Endpoint

### `POST /api/voice-translate`

**Request:**
```json
{
  "audio_base64": "<base64-encoded-webm-audio>",
  "from_lang": "hi-IN",
  "to_lang": "kn-IN"
}
```

**Response:**
```json
{
  "original_text": "आज का मज़दूरी कितना है?",
  "translated_text": "ಇವತ್ತಿನ ಕೂಲಿ ಎಷ್ಟು?",
  "audio_chunks": ["<base64-wav-audio>"],
  "from_lang": "hi-IN",
  "to_lang": "kn-IN"
}
```

---

## Demo Scenarios

| Scenario | Languages | Context |
|----------|-----------|---------|
| Plumber Issue | Odia ↔ Kannada | Worker reports a leaking pipe to employer |
| Doctor Visit | Bengali ↔ Tamil | Patient describes stomach pain to doctor |
| Wage Negotiation | Hindi ↔ Malayalam | Worker asks about daily wage |

---

## License

ISC

---

*Built with Sarvam AI — Saarika + Translate + Bulbul V3 | #TheMicIsYours*
