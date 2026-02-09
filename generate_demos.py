import requests
import base64
import os

SARVAM_API_KEY = os.environ.get('SARVAM_API_KEY')

if not SARVAM_API_KEY:
    print("ERROR: Set SARVAM_API_KEY environment variable first.")
    print("  export SARVAM_API_KEY=your_key_here")
    exit(1)

# Pre-generate the TRANSLATED audio (what the listener hears)
demos = [
    # Demo 1: Plumber Issue — Odia worker, Kannada employer
    {
        "id": "demo1_turn1",
        "description": "Worker tells employer about leak (heard in Kannada)",
        "text": "ಸಾರ್, ಬಾತ್ರೂಮ್ ಪೈಪ್ ಲೀಕ್ ಆಗ್ತಿದೆ. ಇವತ್ತೇ ಸರಿ ಮಾಡಿದ್ರೆ ಒಳ್ಳೆಯದು.",
        "language_code": "kn-IN",
    },
    {
        "id": "demo1_turn2",
        "description": "Employer replies (heard in Odia)",
        "text": "ଠିକ୍ ଅଛି, ପ୍ଲମ୍ବର୍ କୁ ଡାକୁଛି। ସନ୍ଧ୍ୟାରେ ଆସିବ।",
        "language_code": "od-IN",
    },
    # Demo 2: Doctor Visit — Bengali patient, Tamil doctor
    {
        "id": "demo2_turn1",
        "description": "Patient describes pain (heard in Tamil)",
        "text": "டாக்டர், என் வயிற்றில் மிகவும் வலி. மூன்று நாளாக இருக்கு.",
        "language_code": "ta-IN",
    },
    {
        "id": "demo2_turn2",
        "description": "Doctor gives advice (heard in Bengali)",
        "text": "খাবার ঠিকমতো খাচ্ছেন? জল বেশি করে খান। কাল আবার আসুন।",
        "language_code": "bn-IN",
    },
    # Demo 3: Wage Negotiation — Hindi worker, Malayalam employer
    {
        "id": "demo3_turn1",
        "description": "Worker asks about wages (heard in Malayalam)",
        "text": "ചേട്ടാ, ഇന്നത്തെ കൂലി എത്രയാ? ഇന്നലെ ആറുനൂറ് രൂപ പറഞ്ഞിരുന്നല്ലോ.",
        "language_code": "ml-IN",
    },
    {
        "id": "demo3_turn2",
        "description": "Employer offers rate (heard in Hindi)",
        "text": "आज ₹650 दूँगा। ओवरटाइम हुआ तो ₹800.",
        "language_code": "hi-IN",
    },
]

os.makedirs('audio', exist_ok=True)

for demo in demos:
    print(f"Generating: {demo['id']} ({demo['description']})...")
    response = requests.post(
        'https://api.sarvam.ai/text-to-speech',
        headers={
            'Content-Type': 'application/json',
            'api-subscription-key': SARVAM_API_KEY,
        },
        json={
            'text': demo['text'],
            'model': 'bulbul:v3',
            'target_language_code': demo['language_code'],
        },
    )

    if response.status_code != 200:
        print(f"  ERROR: {response.status_code} - {response.text}")
        continue

    data = response.json()
    print(f"  Response keys: {list(data.keys())}")

    # Handle different response formats
    audio_b64 = data.get('audio') or data.get('audios', [None])[0]
    if not audio_b64:
        print(f"  ERROR: No audio in response. Full response: {str(data)[:300]}")
        continue

    audio_bytes = base64.b64decode(audio_b64)
    with open(f"audio/{demo['id']}.wav", 'wb') as f:
        f.write(audio_bytes)
    print(f"  Saved audio/{demo['id']}.wav")

print("\nAll demo audio generated!")
