import { GoogleGenAI } from '@google/genai';
import { DB } from '../db';
import { ContentNiche, TargetAgeGroup, VisualStyle, Scene, Character } from '../types';
import { VISUAL_STYLES } from '../presets';

export interface GeneratedStoryResult {
  title: string;
  moral_or_hook: string;
  estimated_duration: number;
  scenes: Array<{
    scene_number: number;
    title: string;
    narration_text: string;
    visual_prompt: string;
    camera_direction: 'zoom_in' | 'zoom_out' | 'pan_left' | 'pan_right' | 'static';
    duration_seconds: number;
  }>;
}

export async function generateKidsStory(params: {
  prompt: string;
  niche: ContentNiche;
  age_group: TargetAgeGroup;
  style: VisualStyle;
  language: string;
  characters: Character[];
  scene_count?: number;
}): Promise<GeneratedStoryResult> {
  const settings = DB.getSettings();
  const apiKey = settings.gemini_api_key || process.env.GEMINI_API_KEY;

  const styleObj = VISUAL_STYLES.find(s => s.id === params.style) || VISUAL_STYLES[0];
  const charDescriptions = params.characters.map(c => 
    `CHARACTER [${c.name}]: Species: ${c.species}, Age appearance: ${c.age_appearance}. Visual DNA: "${c.visual_dna}". Key traits: ${c.traits.join(', ')}.`
  ).join('\n');

  const isSlapstick = params.niche === 'slapstick_comedy';
  const sceneCount = params.scene_count || (isSlapstick ? 3 : 5);

  // Build the visual consistency style block that must appear in EVERY visual_prompt
  const styleBlock = `3D Pixar-style CGI animation, bright warm cinematic sunshine, soft ambient bounce light, saturated cheerful colors, clean clutter-free background, smooth fluid motion, consistent character design`;

  const systemInstruction = `
You are a master children's content creator specializing in VIRAL YouTube Shorts for kids.
Your mission is to write ultra-engaging, child-friendly content designed for MAXIMUM retention, replay loops, and viral distribution.

${isSlapstick ? `
=== SLAPSTICK COMEDY MODE (ACTIVE) ===
You MUST follow the 4-BEAT VIRAL SPINE structure:

BEAT 1 - HOOK (0-2 seconds): Open with an IMPOSSIBLE or BIZARRE visual that forces the viewer to stop scrolling. NOT a dance — something weird, oversized, glowing, or "wrong". This must be visually arresting.

BEAT 2 - SETUP (2-6 seconds): Quick context. Characters attempt something simple. Build micro-tension. Something must change visually every 1.5 seconds.

BEAT 3 - TWIST (6-12 seconds): THE KEY BEAT. Something COMPLETELY UNEXPECTED happens — NOT what the setup promised. Cartoon physics. Absurdity. Chain reactions. The "WAIT WHAT?!" moment that makes viewers rewatch.

BEAT 4 - LOOP (12-15 seconds): Quick payoff + the visual state must seamlessly transition back to how Beat 1 started. The viewer should NOT realize it looped.

RULES FOR SLAPSTICK:
- NO boring educational lectures, counting, or slow moral stories
- NO dialogue — rely entirely on physical comedy, reactions, and sound
- Narration should be very short exclamations only (e.g., "Oh no!", "Look out!", "SPLAT!")
- Maximum ENERGY, maximum CHAOS, maximum FUNNY
- Think Tom & Jerry meets Pixar meets viral TikTok
` : `
=== STANDARD KIDS CONTENT MODE ===
Target Audience: Age group '${params.age_group}'. Keep vocabulary, rhythm, and themes tailored to this age.
Niche: '${params.niche}'. Ensure the story delivers on this niche.
Each scene should have 1-2 lively sentences (approx 12-25 words), perfect for 5-8 seconds of video per scene.
`}

=== CRITICAL: VISUAL CONSISTENCY RULES ===
Every scene in this video will be animated by AI. The #1 problem is that characters look DIFFERENT between scenes (different face, different outfit, different style). You MUST prevent this:

1. In EVERY scene's 'visual_prompt', you MUST copy-paste the EXACT character Visual DNA described below. Do NOT paraphrase, summarize, or abbreviate it.
2. EVERY visual_prompt must START with this style block: "${styleBlock}"
3. EVERY visual_prompt must describe the SAME environment/location. If Scene 1 is in a sunny park, ALL scenes must be in the same sunny park with the same lighting.
4. EVERY visual_prompt must end with: "${styleObj.promptSuffix}"
5. Characters must wear the SAME outfit in every scene. Do NOT change their clothing between scenes.
6. Describe scenes as CONTINUOUS ACTION — each scene's visual should flow naturally from where the previous scene ended.

CHARACTERS IN THIS STORY:
${charDescriptions || 'Use Goofy Ducky (giant fluffy yellow duck in red sneakers) and Baby Leo (adorable smiling toddler in denim overalls).'}

FORMAT: Exactly ${sceneCount} scenes. Language: ${params.language}.

OUTPUT FORMAT:
Respond with ONLY a valid JSON object (no markdown code fence, no commentary) matching this schema:
{
  "title": "Fun, Catchy Title with Emoji",
  "moral_or_hook": "The curiosity hook or funny premise",
  "estimated_duration": ${isSlapstick ? 15 : 45},
  "scenes": [
    {
      "scene_number": 1,
      "title": "Beat name",
      "narration_text": "Short narration or exclamation",
      "visual_prompt": "${styleBlock}, [EXACT character visual DNA], [action description], [SAME environment], ${styleObj.promptSuffix}",
      "camera_direction": "zoom_in" | "zoom_out" | "pan_left" | "pan_right" | "static",
      "duration_seconds": ${isSlapstick ? 5 : 6}
    }
  ]
}
`;

  if (!apiKey) {
    return getFallbackStory(params, styleObj);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Create a ${isSlapstick ? 'hilarious slapstick comedy YouTube Short' : `compelling ${params.niche} story`} based on this idea: "${params.prompt}". The visual style is ${styleObj.label}. ${isSlapstick ? 'Follow the 4-Beat Viral Spine (HOOK→SETUP→TWIST→LOOP). Make it FUNNY with impossible physics and surprise twists.' : 'Make sure each scene has rich visual descriptions for image generation.'}`,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        temperature: isSlapstick ? 0.85 : 0.7 // Higher creativity for comedy
      }
    });

    const text = response.text || '';
    const parsed = JSON.parse(text.replace(/```json/g, '').replace(/```/g, '').trim()) as GeneratedStoryResult;
    return parsed;
  } catch (err) {
    console.error('Gemini story generation failed, using fallback:', err);
    return getFallbackStory(params, styleObj);
  }
}

function getFallbackStory(params: any, styleObj: any): GeneratedStoryResult {
  const char = params.characters[0] || {
    name: 'Goofy Ducky',
    visual_dna: 'giant fluffy yellow duck with orange beak, bright round cartoon eyes, wearing oversized red sneakers with white laces, chunky cuddly body with soft feather textures'
  };

  const styleBlock = '3D Pixar-style CGI animation, bright warm cinematic sunshine, soft ambient bounce light, saturated cheerful colors, clean clutter-free background, smooth fluid motion, consistent character design';
  const isSlapstick = params.niche === 'slapstick_comedy';

  if (isSlapstick) {
    // 4-Beat Viral Spine fallback
    return {
      title: `${char.name}'s Giant Sneaker Surprise! 🦆👟😱`,
      moral_or_hook: 'What happens when you find a sneaker bigger than a HOUSE?!',
      estimated_duration: 15,
      scenes: [
        {
          scene_number: 1,
          title: 'HOOK - The Impossible Sneaker',
          narration_text: 'WHOA! Look at THAT!',
          visual_prompt: `${styleBlock}, ${char.visual_dna}, standing inside a massive red sneaker as big as a two-story house in a bright sunny park with green grass, looking up in amazement with huge round cartoon eyes wide open, ${styleObj.promptSuffix}`,
          camera_direction: 'zoom_out',
          duration_seconds: 5
        },
        {
          scene_number: 2,
          title: 'SETUP & TWIST - The Lace Disaster',
          narration_text: 'Oh no... not the LACES!',
          visual_prompt: `${styleBlock}, ${char.visual_dna}, tangled up with an adorable smiling toddler in denim overalls (Baby Leo) in the enormous white shoelace of the massive red sneaker, both spinning like a top in the same bright sunny park with green grass, exaggerated cartoon motion blur, funny cross-eyed expressions, ${styleObj.promptSuffix}`,
          camera_direction: 'static',
          duration_seconds: 5
        },
        {
          scene_number: 3,
          title: 'LOOP - The Dizzy Landing',
          narration_text: 'Again! Again!',
          visual_prompt: `${styleBlock}, ${char.visual_dna}, dizzy with spinning stars around head, stumbling back towards the same massive red sneaker in the same bright sunny park with green grass, about to step inside it again, adorable smiling toddler in denim overalls (Baby Leo) pointing and laughing, seamless loop transition, ${styleObj.promptSuffix}`,
          camera_direction: 'zoom_in',
          duration_seconds: 5
        }
      ]
    };
  }

  // Standard story fallback
  return {
    title: `${char.name}'s Big Sunny Adventure`,
    moral_or_hook: 'A joyful lesson in curiosity and sharing happiness with friends.',
    estimated_duration: 35,
    scenes: [
      {
        scene_number: 1,
        title: 'Morning in the Enchanted Meadow',
        narration_text: `Good morning! Meet ${char.name}, the happiest little friend in the whispering forest.`,
        visual_prompt: `${styleBlock}, ${char.visual_dna}, waking up in a cozy hollow tree surrounded by glowing golden morning light and wildflowers, smiling cheerfully, ${styleObj.promptSuffix}`,
        camera_direction: 'zoom_in',
        duration_seconds: 6
      },
      {
        scene_number: 2,
        title: 'The Sparkling Discovery',
        narration_text: `Look! Down by the singing brook, something shiny was twinkling under the clover leaves!`,
        visual_prompt: `${styleBlock}, ${char.visual_dna}, peeking curiously through giant emerald clover leaves at three sparkling rainbow berries, wide amazed eyes, same cozy hollow tree forest environment with golden morning light, ${styleObj.promptSuffix}`,
        camera_direction: 'pan_right',
        duration_seconds: 6
      },
      {
        scene_number: 3,
        title: 'Meeting a Friend',
        narration_text: `Just then, a tiny friend hopped by, with a tummy that went rumble-rumble-rumble!`,
        visual_prompt: `${styleBlock}, ${char.visual_dna}, kneeling down warmly next to a small hungry baby hedgehog on a mossy log, gentle compassionate expression, same forest environment with golden morning light, ${styleObj.promptSuffix}`,
        camera_direction: 'zoom_in',
        duration_seconds: 6
      },
      {
        scene_number: 4,
        title: 'Sharing is Double Fun',
        narration_text: `${char.name} smiled and shared the biggest, juiciest berry. Yum! Sharing made it taste twice as sweet!`,
        visual_prompt: `${styleBlock}, ${char.visual_dna}, happily sharing bright glowing berries with his little hedgehog friend, colorful sparkles in the air, joyous smiles, same forest environment with golden morning light, ${styleObj.promptSuffix}`,
        camera_direction: 'zoom_out',
        duration_seconds: 7
      },
      {
        scene_number: 5,
        title: 'The Sunset Celebration',
        narration_text: `What a wonderful day! Remember, little superstars: a kind heart makes every adventure magical!`,
        visual_prompt: `${styleBlock}, ${char.visual_dna}, standing on a soft grassy hill waving happily towards the camera against a breathtaking pastel sunset sky, same forest environment, ${styleObj.promptSuffix}`,
        camera_direction: 'zoom_in',
        duration_seconds: 6
      }
    ]
  };
}
