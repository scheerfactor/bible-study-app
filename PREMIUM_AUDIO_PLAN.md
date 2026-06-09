# Premium Audio Plan

Last reviewed: June 9, 2026

## Goal

Improve Bible, commentary, sermon, and library listening without making the app dependent on paid audio too early.

The current beta should continue using browser/device speech synthesis. Premium audio should be added later behind clear settings, cost controls, and rights checks.

## Recommended Rollout

### Phase 1: Browser Speech First

- Keep browser/device voices as the default.
- Save voice profile, speed, sleep timer, and last listening position.
- Improve follow-along text, paragraph highlighting, and quote capture while listening.
- Do not charge users for audio while this remains device-based.

### Phase 2: Premium Voice Pilot

- Add one premium provider behind an admin/tester-only feature flag.
- Start with short-form generation only: selected verses, commentary excerpts, sermon notes, and short devotional readings.
- Cache generated audio in storage so the same text is not regenerated repeatedly.
- Track cost per generated minute and per active listener.

### Phase 3: Long-Form Audio

- Add audiobook-style generation only after cost, quality, pronunciation, storage, and rights controls are proven.
- Support chapter-level audio files and text/audio sync metadata.
- Add human-narrated or licensed KJV audio later if rights are secured.

## Provider Comparison

| Provider | Best Fit | Quality | Cost Model | Audiobook Suitability | Bible Reading Suitability | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Browser Speech API | Beta default, free listening, device voices | Varies by device/browser | No API cost | Good enough for personal use; inconsistent voices | Good enough for early beta | Apple voices can be strong on macOS/iOS, but voice lists differ by browser and device. |
| OpenAI TTS | Short-form premium narration, app-generated clips, sermon/lesson audio | Good and consistent; `tts-1` optimized for speed, HD option costs more | Official model page lists `tts-1` at `$15.00 / 1M characters` and `tts-1-hd` at `$30.00 / 1M characters` | Possible, but long-form cost and caching must be controlled | Good for generated Scripture reading only after careful pronunciation testing | Use for premium pilot if cost predictability is more important than voice cloning. Source: https://developers.openai.com/api/docs/models/tts-1 |
| ElevenLabs | Highest-quality expressive narration, premium audiobook feel, voice design | Very strong, especially for expressive reading | Subscription/credit model; current public pricing shows free through enterprise tiers, credits, and included minutes | Strong candidate for premium audiobooks | Strong, but test consistency and Scripture pronunciation | Good for a premium “best voice” tier, but credit costs need guardrails. Source: https://elevenlabs.io/pricing |
| Cartesia | Fast TTS, low-latency reading, voice-agent future | Strong real-time focus | Plan/credit model; pricing page lists free, Pro, Startup, Scale, and custom Enterprise tiers | Good candidate if speed and streaming matter | Good candidate for live/follow-along Bible reading | Strong for responsive listening controls and low-latency starts. Source: https://www.cartesia.ai/pricing |
| PlayHT | Creator/audiobook-style generation and broad voice catalog | Potentially good, but must be re-tested | Public pricing should be verified directly before selection | Possible | Possible | Keep as a secondary review option. Verify current API access, commercial rights, and reliability before building. Source: https://play.ht/pricing/ |
| Human narration | Best long-term quality for core Bible/audio products | Highest and most trusted | Highest upfront production cost; licensing/contract dependent | Best for finished audiobooks | Best for KJV audio if licensed or recorded properly | Best final product, but requires narrator agreements, editing, hosting, and rights management. |

## Cost Controls Required Before Paid Audio

- Feature flag every paid provider.
- Estimate generated minutes before generation.
- Confirm user intent before generating long passages.
- Cache by text checksum, voice, speed, and provider.
- Store provider, voice, cost estimate, source text, and generation date.
- Add admin dashboard for total generated minutes and estimated spend.
- Never generate copyrighted books, commentary, sermons, or audio without rights.
- Keep KJV/public-domain/licensed-source metadata attached to every generated audio asset.

## Audio Rights Rules

- Public-domain text does not automatically solve narration rights for generated or human audio distribution.
- Modern books, sermons, and copyrighted commentaries require written permission before public audio generation.
- User personal uploads should remain private and personal-use only.
- Licensed KJV audio files should be tracked separately from generated TTS.

## Recommendation

Use this order:

1. Browser/device speech for beta.
2. OpenAI TTS or Cartesia for a limited premium pilot.
3. ElevenLabs for premium expressive narration tests.
4. Human narration or licensed audio for the highest-value finished products.

The first paid test should focus on short Scripture and commentary samples, not full audiobooks.
