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

## 3. The 4-Beat Viral Spine (12–18 Seconds)

YouTube Shorts algorithm heavily favors **>100% average view duration (loops)**. A 15-second video watched twice delivers a 200% retention score, triggering viral distribution.

> **⚠️ KEY UPGRADE**: The old 3-Act structure (Hook → Mishap → Triumph) was too predictable. The 4-Beat Spine adds a **TWIST** beat that makes the content genuinely surprising and rewatchable.

| Beat | Time | What Happens | Why It Works |
|---|---|---|---|
| **HOOK** | 0s – 2s | Open with an impossible/bizarre visual that forces the viewer to STOP scrolling. NOT a dance — something weird, oversized, glowing, or "wrong". | Swipe-away rate is measured in the first 1.5s. Generic dance openings no longer stop the scroll. |
| **SETUP** | 2s – 6s | Quick context. Characters attempt something. Build micro-tension. Change something visually every 1.5 seconds. | Establishes the "promise" of what the short is about. Fast pacing prevents mid-video drop-off. |
| **TWIST** | 6s – 12s | **THE KEY BEAT.** Something UNEXPECTED happens — NOT what the setup promised. Cartoon physics. Absurdity. Chain reactions. This is the "wait, what?!" moment. | This is what separates viral from cute. The unpredictability triggers rewatches ("did I catch everything?"). |
| **LOOP** | 12s – 15s | Quick payoff + seamless visual transition back to Beat 1. The viewer should NOT realize it looped. End frame must visually match the opening frame. | Target: >100% AVD. Kids watch it 3–5 times without swiping away. |

---

## 3B. Visual Continuity & Consistency Rules (CRITICAL)

> **🚨 THE #1 PROBLEM**: Videos feel like separate clips stitched together with abrupt cuts between different animation styles. Every Short MUST feel like ONE continuous, cohesive animation — not a slideshow of disconnected AI generations.

### The "Single Video" Mandate:
1. **Same Character, Same Look, EVERY Frame**: Characters must look identical across all beats. No style drift, no face morphing, no outfit changes between scenes (unless the story calls for it).
2. **Continuous Motion Flow**: The end of Beat 1 must visually flow into the start of Beat 2. No hard cuts to entirely different camera angles, lighting, or environments.
3. **Consistent Environment**: If the video is set in a sunny park, ALL beats must be in the same sunny park with the same lighting, colors, and background elements.
4. **Unified Color Grading**: All clips must share the same warm, saturated, Pixar-like color palette. Post-production color grading pass is MANDATORY to unify clips.
5. **Smooth Transitions Only**: Use cross-dissolves (0.3–0.5s) between clips, NEVER hard cuts. Motion-based transitions (spinning, zooming, bouncing) are preferred over visual cuts.

### How to Achieve This:
- **Frame Chaining**: The LAST frame of Clip A becomes the START frame of Clip B (see Section 5F).
- **Style Block Prepend**: Every image/video generation prompt must start with the same style block:
  ```
  "3D Pixar-style CGI animation, bright warm cinematic sunshine, soft ambient bounce light, 
  saturated cheerful colors, clean clutter-free background, smooth fluid motion, 
  consistent character design, [CHARACTER VISUAL DNA]"
  ```
- **Character Reference Anchoring**: Always include the character's `visual_dna` from the database in EVERY prompt. Never rely on text alone to describe the character.
- **Single Session Generation**: When possible, generate all beats in sequence using the same model session/seed to minimize style drift.

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

#### ⚠️ Consistency Rules for Kling Generation:
- **ALWAYS prepend the style block** to every prompt: `"3D Pixar-style CGI animation, bright warm cinematic lighting, saturated cheerful colors, smooth fluid motion, [CHARACTER visual_dna]..."`
- **ALWAYS include negative prompt elements** (if supported): `"distorted face, inconsistent clothing, color shift, morphing, extra limbs, different art style, 2D flat, realistic photo"`
- **Frame Chaining is MANDATORY**: Extract the last frame of each generated clip and use it as the `image_url` input for the next clip's generation. This prevents the character from "drifting" between scenes.
- **Limit motion intensity**: If characters morph or face-melt during high-action scenes, reduce the described motion and use shorter 3-second clips stitched together.
- **Same seed/session**: When possible, maintain the same generation seed across all clips in a single video.

### D. Audio & Sound Design:
- **Narration**: Microsoft Edge-TTS (`en-US-AnaNeural`) with short, punchy comedic voiceover lines (< 4 seconds each).
- **Background Music**: Bouncy marimba/accordion toy comedy music (`data/audio/comedy_bouncy_bgm.mp3`).
- **Audio Mix**: Voiceover at 100% volume, background music at 15% volume (`weights=1.0 0.15`).

### E. Subtitles & Visual Overlay:
- Font: Bold cartoon styling.
- Colors: **Yellow text** (`fontcolor=yellow`) with thick **black outline** (`borderw=4:bordercolor=black`).
- Position: Centered horizontally, elevated above the bottom YouTube UI area (`y=h-240`).

### F. Scene Transition & Continuity Pipeline (NEW — CRITICAL):

To ensure the final video feels like ONE continuous animation, not a slideshow:

1. **Frame Chaining**: After each Kling clip is generated:
   - Extract the **last frame** using ffmpeg: `ffmpeg -sseof -0.1 -i clip_N.mp4 -vframes 1 last_frame_N.png`
   - Use `last_frame_N.png` as the `image_url` input for generating `clip_N+1`
   - This creates visual continuity — same characters, same poses, same environment carry over

2. **Cross-Dissolve Stitching**: When assembling clips in ffmpeg:
   - Use `xfade=transition=fade:duration=0.4` between clips instead of hard concat
   - This smooths out any remaining micro-inconsistencies between clip boundaries

3. **Color Unification Pass**: After stitching all clips:
   - Apply a consistent color grade filter: `eq=brightness=0.04:saturation=1.3,hue=h=5`
   - This forces all clips into the same warm, saturated look even if individual clips drifted slightly

4. **Quality Checklist Before Export**:
   - [ ] Characters look the same in frame 1 and frame last?
   - [ ] No abrupt lighting changes between beats?
   - [ ] No character face morphing or outfit changes?
   - [ ] Transitions feel smooth, not jarring?
   - [ ] Does the video feel like ONE continuous scene?

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
