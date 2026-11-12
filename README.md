# Tadabbur · Daily Quran Journey

A calm, reader-first web app for understanding the Quran one passage at a time.

Each day you study one passage (ruku) in five steps:

1. **Intro**: where the passage sits and what the surah is about
2. **Listen**: follow the Arabic while it is recited, ayah by ayah
3. **Words**: the meaning of every word, with audio, then a short quiz
4. **Meaning**: the translation, with an explanation (tafsir) for any ayah
5. **Reflect**: write a line in your journal

Two paths: **Prayer Surahs** (Al-Fatihah and Juz 'Amma, 40 passages) and the **Full Journey** (all 556 passages, about 18 months at one a day). The **Map** shows all 114 surahs filling in with gold as you study them.

## Install on iPhone

1. Open the GitHub Pages link in **Safari**.
2. Tap **Share**, then **Add to Home Screen**.
3. Open Tadabbur from its icon. It runs full-screen, like a native app.

Progress and reflections are stored on the device. Use **Journal → Save backup** now and then.

## Content sources

Loaded live from the [Quran.com API](https://api-docs.quran.foundation/) (Quran Foundation): Arabic text, word-by-word meanings, translations, tafsir and recitations. Surah introductions are from Tafhim al-Qur'an (via Quran.com). Passage divisions follow [Tanzil](https://tanzil.net) metadata. Passages you have opened stay available offline.

## Files

| File | Purpose |
|---|---|
| `index.html` | App shell |
| `style.css` | Night and Parchment themes, layout |
| `app.js` | Screens, session flow, progress, journal |
| `data.js` | Surah names and passage divisions, reflection prompts |
| `sw.js` | Offline support |
| `manifest.webmanifest`, `icons/` | Home-screen install |
