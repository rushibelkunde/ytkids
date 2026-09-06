# YTKids Content Playbook & Video Creation Guidelines

> **CRITICAL DIRECTIVE**: This document defines the exact style, tone, format, and technical pipeline for all YouTube Shorts and videos created for this channel. Any AI assistant working on this project **MUST** follow these rules without exception.

---

## 1. Core Channel Vision & Pivot

### What We Create:
- **Genre**: Hilarious, high-energy, slapstick **3D animated comedy Shorts** for kids and toddlers.
- **Vibe**: Laugh-out-loud funny, infectious joy, silly physical mishaps, dance duos, cartoon physics.
- **Core Characters**: Cute toddlers paired with goofy, oversized animal mascots (e.g. Baby & Big Fluffy Duck wearing sneakers).

### 🚫 What We DO NOT Create:
- ❌ **No boring or slow educational lectures**: No counting numbers, ABC recitations, or dry moral lessons.
- ❌ **No 2.5D camera pans on static still images**: The user explicitly rejected slideshows and image zoom-pans.
- ❌ **No long, slow videos**: Avoid 50+ second bedtime formats. All Shorts must be fast-paced and punchy.

### ✅ What We ALWAYS Create:
- 🌟 **Real character movement & animation**: Characters must physically move, flap wings, waddle in shoes, jump, slip mid-air, dance, and express big facial reactions.
- 🌟 **Full AI Video Engine**: Every scene must be rendered through the `full_ai_video` pipeline (Kling AI Image-to-Video on Fal.ai).
- 🌟 **High-retention infinite looping**: 12 to 18 seconds total duration, designed to loop seamlessly back to the beginning.

---

## 2. Benchmark Reference Videos

These reference videos define the gold standard for pacing, visuals, and comedic timing:

1. **[Cute Baby Dancing with Big Duck](https://www.youtube.com/shorts/NpomiDmPPC0)**:
   - *Key Elements*: Giant lovable animal mascot dancing side-by-side with an adorable laughing baby; high-energy waddle steps; vibrant sunny park; cheerful infectious music.
2. **[Beach Slapstick & Candy Mishaps](https://www.youtube.com/shorts/x6XOASWoW2U)**:
   - *Key Elements*: Slapstick cartoon physics; unexpected slip/trip; comically frozen mid-air reactions; playful beach setting.
3. **[Animal Builder & Craft Mishaps](https://www.youtube.com/shorts/tLZjL-dMH_g)**:
   - *Key Elements*: Animals clumsily attempting a simple action; silly chaos unfolding; triumphant and laughing recovery.

---

## 3. The Proven 3-Act Shorts Structure (12–18 Seconds)

YouTube Shorts algorithm heavily favors **>100% average view duration (loops)**. A 15-second video watched twice delivers a 200% retention score, triggering viral distribution.

| Act | Time | Action | Comedy Beat |
|---|---|---|---|
| **Act 1: The Hook** | 0s – 5s | Baby & Mascot duo start an energetic, funny dance or silly activity | Immediate visual hook, adorable character design, catchy upbeat movement |
| **Act 2: The Mishap** | 5s – 10s | Slapstick accident occurs (stepping on soapy bubble, banana peel, funny tumble) | Characters fly mid-air, funny cross-eyed expressions, goofy cartoon slip sound |
| **Act 3: The Triumph** | 10s – 15s | Bounce back on feet, giant bubble pop celebration, triumphant pose | Victory dance, laughing baby, seamless loop transition back to Act 1 |

---

## 4. Visual & Artistic Style (Pixar 3D Aesthetic)

- **Art Direction**: 3D animated CGI style (Pixar / Illumination / Disney modern look).
- **Character Proportions**:
  - Chunky, soft, cuddly bodies with tactile fur or feather textures.
  - Giant expressive eyes with wide pupil highlights.
  - Anthropomorphic accessories: Giant sneakers, oversized sunglasses, baseball caps, overalls.
- **Lighting & Color Palette**:
  - Bright, warm cinematic sunshine with soft ambient bounce light.
  - Saturated, cheerful colors: Sun yellow, baby sky blue, vibrant lawn green, iridescent shiny bubbles.
  - Clean, clutter-free backgrounds that keep complete focus on the characters.
- **Aspect Ratio**: Always **9:16 Vertical** (`720x1280` or `1080x1920`).

---

## 5. Technical Production Pipeline

When generating videos in this codebase:

### A. Mascot Character Creation (`/api/characters`):
- Assign unique personality traits (`goofy`, `clumsy`, `lovable`, `dancer`).
- Store recurring visual DNA in SQLite DB (`char_goofy_duck`) to maintain character consistency across future episodes.

### B. Image Generation (Fal.ai Flux Schnell):
- Generate high-resolution 9:16 keyframes for each act.
- Ensure keyframes depict dynamic, action-oriented poses (not stiff portrait poses).

### C. Character Motion Generation (Fal.ai Kling Video):
- Model: `fal-ai/kling-video/v1/standard/image-to-video`
- Settings:
  - `aspect_ratio`: `'9:16'`
  - `duration`: `'5'` (seconds)
  - `prompt`: Must describe active physical movements (e.g. *"fluffy yellow duck flapping wings and waddling in sneakers, baby jumping and dancing, smooth 3D cartoon animation, fluid motion"*).

### D. Audio & Sound Design:
- **Narration**: Microsoft Edge-TTS (`en-US-AnaNeural`) with short, punchy comedic voiceover lines (< 4 seconds each).
- **Background Music**: Bouncy marimba/accordion toy comedy music (`data/audio/comedy_bouncy_bgm.mp3`).
- **Audio Mix**: Voiceover at 100% volume, background music at 15% volume (`weights=1.0 0.15`).

### E. Subtitles & Visual Overlay:
- Font: Bold cartoon styling.
- Colors: **Yellow text** (`fontcolor=yellow`) with thick **black outline** (`borderw=4:bordercolor=black`).
- Position: Centered horizontally, elevated above the bottom YouTube UI area (`y=h-240`).

---

## 6. YouTube Upload Strategy & SEO Template

### Title Formula:
`[Character/Action] Funny Dance Gone Wrong! 🦆😂 #Shorts`
- Keep under 60 characters so it fits on mobile screens without truncation.
- Always include 1-2 funny emojis and `#Shorts`.

### Description Template:
```text
Watch what happens when Goofy Ducky tries to show off his dance moves to Baby! 🦆👶 Slippery bubbles everywhere! 😂💥

Subscribe for more daily funny cartoons, dancing animals, and laugh-out-loud slapstick animations!

#Shorts #Funny #Animation #Comedy #DuckDance #BabyDance #Slapstick #KidsAnimation #Trending
```

### High-CTR Tags:
`funny shorts, duck dance, baby dancing, funny duck, slapstick comedy, cartoon funny, trending shorts, viral shorts, kids comedy, 3d animation, pixar style`

### Audience Setting:
- Select **"Yes, it's made for kids"** (or general comedy entertainment).

---

## 7. Recurring Character Duo Roster

To build a loyal subscriber base, we reuse and build recognizable character duos:

1. **Goofy Ducky & Baby Leo**:
   - Giant fluffy yellow duck in red sneakers + smiling toddler in denim overalls.
   - Themes: Bubble dance mishaps, park adventures, snack chases.
2. **Bumble Bear & Toddler Mia**:
   - Tiny chubby baby bear stuck in honey pots or bouncing on giant trampoline.
3. **Puggy & Baby Sam**:
   - Round wrinkly pug wearing oversized sunglasses doing breakdance spins.

---

*Keep this playbook as the central guide for every new story, scene, and video generation.*
