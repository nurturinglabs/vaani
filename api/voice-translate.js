const FormData = require('form-data');
const fetch = require('node-fetch');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { audio_base64, from_lang, to_lang } = req.body;

    if (!audio_base64 || !from_lang || !to_lang) {
      return res.status(400).json({ error: 'Missing required fields: audio_base64, from_lang, to_lang' });
    }

    const API_KEY = process.env.SARVAM_API_KEY;
    if (!API_KEY) {
      return res.status(500).json({ error: 'Server configuration error: missing API key' });
    }

    // ═══════════════════════════════════════
    // STEP 1: STT — Saarika v2.5
    // Speech in source language → text
    // ═══════════════════════════════════════

    const audioBuffer = Buffer.from(audio_base64, 'base64');
    const formData = new FormData();
    formData.append('file', audioBuffer, {
      filename: 'recording.webm',
      contentType: 'audio/webm'
    });
    formData.append('language_code', from_lang);
    formData.append('model', 'saarika:v2.5');

    const sttResponse = await fetch('https://api.sarvam.ai/speech-to-text', {
      method: 'POST',
      headers: {
        'api-subscription-key': API_KEY,
        ...formData.getHeaders()
      },
      body: formData
    });

    if (!sttResponse.ok) {
      const errText = await sttResponse.text();
      console.error('STT error:', sttResponse.status, errText);
      return res.status(500).json({ error: 'Speech recognition failed. Please speak clearly and try again.' });
    }

    const sttData = await sttResponse.json();
    const originalText = sttData.transcript;

    if (!originalText || originalText.trim() === '') {
      return res.status(400).json({ error: 'Could not understand audio. Please try again.' });
    }

    // ═══════════════════════════════════════
    // STEP 2: TRANSLATE — Sarvam Translate
    // Text in source language → text in target language
    // ═══════════════════════════════════════

    const translateResponse = await fetch('https://api.sarvam.ai/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-subscription-key': API_KEY
      },
      body: JSON.stringify({
        input: originalText,
        source_language_code: from_lang,
        target_language_code: to_lang,
        model: 'mayura:v1',
        enable_preprocessing: true
      })
    });

    if (!translateResponse.ok) {
      const errText = await translateResponse.text();
      console.error('Translate error:', translateResponse.status, errText);
      return res.status(500).json({ error: 'Translation failed. Please try again.' });
    }

    const translateData = await translateResponse.json();
    const translatedText = translateData.translated_text;

    // ═══════════════════════════════════════
    // STEP 3: TTS — Bulbul V3
    // Text in target language → speech
    // ═══════════════════════════════════════

    const chunks = splitText(translatedText, 900);
    let audioChunks = [];

    for (const chunk of chunks) {
      const ttsResponse = await fetch('https://api.sarvam.ai/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-subscription-key': API_KEY
        },
        body: JSON.stringify({
          text: chunk,
          model: 'bulbul:v3',
          target_language_code: to_lang
        })
      });

      if (!ttsResponse.ok) {
        const errText = await ttsResponse.text();
        console.error('TTS error:', ttsResponse.status, errText);
        return res.status(500).json({ error: 'Audio generation failed. Please try again.' });
      }

      const ttsData = await ttsResponse.json();
      // API returns audios array, take first element
      const audioB64 = ttsData.audios ? ttsData.audios[0] : ttsData.audio;
      audioChunks.push(audioB64);
    }

    // ═══════════════════════════════════════
    // RETURN EVERYTHING
    // ═══════════════════════════════════════

    return res.status(200).json({
      original_text: originalText,
      translated_text: translatedText,
      audio_chunks: audioChunks,
      from_lang: from_lang,
      to_lang: to_lang
    });

  } catch (error) {
    console.error('Voice translate error:', error);
    return res.status(500).json({ error: 'Translation failed. Please try again.' });
  }
};

function splitText(text, maxLength) {
  if (text.length <= maxLength) return [text];
  const chunks = [];
  let remaining = text;
  while (remaining.length > 0) {
    if (remaining.length <= maxLength) {
      chunks.push(remaining);
      break;
    }
    let splitAt = remaining.lastIndexOf('.', maxLength);
    if (splitAt === -1 || splitAt < maxLength / 2) {
      splitAt = remaining.lastIndexOf(' ', maxLength);
    }
    if (splitAt === -1) splitAt = maxLength;
    chunks.push(remaining.substring(0, splitAt + 1).trim());
    remaining = remaining.substring(splitAt + 1).trim();
  }
  return chunks;
}
