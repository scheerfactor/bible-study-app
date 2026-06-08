# Voice Engine Roadmap

Father's Business Bible Study should keep browser/device speech as the beta default, then add premium engines only when licensing, cost, privacy, and Scripture/audio rights are clear.

## Current Beta Recommendation

Use browser/device `speechSynthesis` first.

- No paid API calls.
- No server audio storage.
- Works with installed Apple/device voices when the browser exposes them.
- Best for beta Bible chapters, library books, commentary, sermon notes, and study playlists.
- Limitation: voice availability and quality vary by device, browser, and installed voices.

## Voice Profile Strategy

Profiles should be saved user preferences, not separate content systems.

- Pastor: steady lower voice, slower pacing, preaching prep.
- Teacher: clear balanced voice, study notes and commentary.
- Scripture: reverent, slower KJV chapter reading.
- Audiobook: comfortable long-form book reading.
- Devotional: softer pacing for prayer and daily reading.
- Fast Study: faster rate for review and scanning.

## Engine Comparison

| Engine | Best Use | Strengths | Risks / Limits | Fit For This App |
| --- | --- | --- | --- | --- |
| Browser Speech | Beta listening, local device voices, no-cost reading | No API key, no backend audio generation, can use Apple/device voices when available | Inconsistent voices between Safari/Chrome/devices; limited diagnostics; no guaranteed premium quality | Use now. Keep as default fallback forever. |
| OpenAI TTS | Future premium narration, generated audio snippets, server-side audio creation | Server API, clear developer platform, can fit an app-owned voice pipeline | Must keep API keys server-side; verify model/voice options, pricing, retention, and Scripture/audio rights before production | Good candidate for controlled premium TTS after beta. |
| ElevenLabs | High-quality audiobook-style narration and expressive voices | Strong voice library, long-form/streaming docs, voice design/cloning options | Cost, voice licensing, cloning consent, data retention settings, and commercial terms need careful review | Strong candidate for premium audiobooks/devotionals, not beta default. |
| PlayHT | Long-form and streaming TTS options | Voice engines, streaming endpoint, voice/emotion controls in docs | Must verify current terms, voice rights, pricing, and quality for Scripture-style reading | Candidate for premium comparison testing. |
| Cartesia | Real-time low-latency voice and future interactive workflows | Sonic TTS streaming, real-time focus, short-lived browser token pattern in docs | More advanced infrastructure; verify cost, rights, retention, and whether quality suits long-form Bible/book reading | Good research candidate for live/interactive future use. |
| Human Narration | Licensed Bible audio, premium audiobooks, sermons, and devotional collections | Best consistency, most natural long-form listening, strongest ministry trust when rights are documented | Highest production cost, requires recording/editing, narrator agreements, and audio storage/distribution rights | Best long-term quality path for flagship Scripture and library audio. |

## Practical Comparison

| Option | Quality | Device Consistency | Cost | Long-Form Audiobooks | Scripture / Audio Bible Fit |
| --- | --- | --- | --- | --- | --- |
| Browser Speech | Mixed; depends on installed voices | Low to medium; Safari, Chrome, iPhone, Mac, and Windows expose different voices | No direct API cost | Usable for beta, less polished for finished audiobooks | Good beta fallback, not final licensed audio. |
| OpenAI TTS | High, provider-dependent | High when generated server-side | Usage-based API cost | Promising, but needs chunking, caching, and rights controls | Good candidate for generated public-domain audio after legal review. |
| ElevenLabs | High and expressive | High when generated server-side | Usage-based; can become costly at scale | Strong candidate | Strong candidate if Scripture and voice licensing are clear. |
| Cartesia | High, real-time focused | High when generated server-side | Usage-based | Better for interactive/real-time; long-form needs testing | Candidate for interactive study/listening workflows. |
| PlayHT | Medium to high, voice-dependent | High when generated server-side | Usage-based | Candidate for long-form testing | Candidate after terms and voice quality review. |
| Human Narration | Highest when well produced | Highest | Highest upfront cost | Best | Best for final KJV/audio Bible and premium trusted resources. |

## Architecture Needed Before Paid Engines

1. Add a server-side voice provider abstraction.
2. Never expose paid provider API keys in the browser.
3. Store provider, model, voice ID, rights notes, cost estimate, and retention setting for every generated audio job.
4. Add a queue for long-form narration jobs.
5. Chunk long books and Bible chapters cleanly.
6. Cache generated audio only when rights permit.
7. Add admin-only controls for enabling premium engines.
8. Keep browser/device speech as fallback if a premium provider fails.

## Follow-Text Study Features To Plan

These should be designed before any paid voice API is enabled, because they affect storage, chunking, and user workflow.

- Follow-text reading: track the current Bible verse, commentary paragraph, or library paragraph while audio plays.
- Quote capture while listening: save a selected sentence or paragraph to sermon notes with source metadata.
- Sermon note capture while listening: add the current audio position and text snippet to the active sermon.
- Illustration capture while listening: save a teaching illustration candidate with source and rights notes.
- Continue listening: resume the exact playlist item, paragraph, or verse range across devices after Supabase sync is ready.
- Audio/text matching: store a stable content chunk ID so premium audio can line up with the reader without loading an entire book in the browser.

## Rights And Ministry Safety

- Do not generate, store, or publish audio for copyrighted books without documented permission.
- Treat KJV audio generation as a rights/product decision, not merely a technical feature.
- Do not clone preacher, narrator, or church-member voices without written consent.
- Keep user-purchased or personal-use uploads private to that user.
- Label AI/premium narration clearly if it is not a human recording.

## Suggested Rollout

### Now

- Improve browser voice selection.
- Save favorite voices.
- Add male/female favorites.
- Add voice profiles.
- Add diagnostics for browser, Apple, device, and future premium availability.

### Next

- Add Supabase sync for voice preferences.
- Add a server-side premium voice test route behind admin-only access.
- Test one provider with short, rights-safe public-domain text.
- Track cost per minute and user-perceived quality.

### Later

- Licensed KJV audio integration.
- Premium generated audio for verified public-domain books.
- Downloadable listening packs where rights permit.
- Church account voice presets.
- Narration job history and audio storage in Supabase Storage or Cloudflare R2.

## Sources Checked

- OpenAI API audio reference: https://developers.openai.com/api/reference/overview
- ElevenLabs Text to Speech documentation: https://elevenlabs.io/docs/overview/capabilities/text-to-speech
- ElevenLabs streaming endpoint: https://elevenlabs.io/docs/api-reference/text-to-speech/stream
- PlayHT text-to-speech streaming docs: https://docs.play.ht/reference/api-generate-tts-audio-stream
- Cartesia overview and Sonic TTS docs: https://docs.cartesia.ai/
- Cartesia WebSocket TTS docs: https://docs.cartesia.ai/api-reference/tts/websocket
