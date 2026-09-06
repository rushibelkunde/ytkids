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

  const sceneCount = params.scene_count || 5;

  const systemInstruction = `
You are a master children's author and director for top-tier YouTube Kids channels and viral YouTube Shorts.
Your mission is to write an ultra-engaging, child-friendly story designed for maximum audience retention, emotional resonance, and visual delight.

CRITICAL GUIDELINES:
1. Target Audience: Age group '${params.age_group}'. Keep vocabulary, rhythm, and themes tailored to this age.
2. Niche: '${params.niche}'. Ensure the story delivers on this niche (e.g. counting numbers, moral lesson of kindness, soothing bedtime tone, or upbeat rhyme).
3. Visual Consistency: The characters must look IDENTICAL in every scene. In every scene's 'visual_prompt', you MUST reference the character's exact Visual DNA described below.
4. Short, punchy narration: Each scene should have 1-2 lively sentences (approx 12-25 words), perfect for 5-8 seconds of video per scene.
5. Format: Exactly ${sceneCount} scenes.
6. Language: Output the narration in ${params.language}.

CHARACTERS IN THIS STORY:
${charDescriptions || 'Create 1-2 lovable animal or child characters with consistent visual features.'}

VISUAL STYLE PROMPT SUFFIX TO APPEND TO EVERY VISUAL PROMPT:
"${styleObj.promptSuffix}"

OUTPUT FORMAT:
Respond with ONLY a valid JSON object (no markdown code fence, no commentary) matching this schema:
{
  "title": "Fun, Catchy Title",
  "moral_or_hook": "The core lesson or curiosity hook",
  "estimated_duration": 45,
  "scenes": [
    {
      "scene_number": 1,
      "title": "Scene summary",
      "narration_text": "Narration words spoken by voiceover",
      "visual_prompt": "Detailed description of the action and environment, including the exact character visual DNA, ${styleObj.promptSuffix}",
      "camera_direction": "zoom_in" | "zoom_out" | "pan_left" | "pan_right" | "static",
      "duration_seconds": 6
    }
  ]
}
`;

  if (!apiKey) {
    // Return high quality intelligent mock if no API key is set yet
    return getFallbackStory(params, styleObj);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Write a compelling ${params.niche} story based on this idea: "${params.prompt}". The visual style is ${styleObj.label}. Make sure each scene has rich visual descriptions for image generation.`,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        temperature: 0.7
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
    name: 'Pip the Little Fox',
    visual_dna: 'cute little red fox cub with bright orange fur, white chest, warm hazel eyes and cozy yellow knitted sweater'
  };

  return {
    title: `${char.name}'s Big Sunny Adventure`,
    moral_or_hook: 'A joyful lesson in curiosity and sharing happiness with friends.',
    estimated_duration: 35,
    scenes: [
      {
        scene_number: 1,
        title: 'Morning in the Enchanted Meadow',
        narration_text: `Good morning! Meet ${char.name}, the happiest little friend in the whispering forest.`,
        visual_prompt: `${char.visual_dna}, waking up in a cozy hollow tree surrounded by glowing golden morning light and wildflowers, smiling cheerfully, ${styleObj.promptSuffix}`,
        camera_direction: 'zoom_in',
        duration_seconds: 6
      },
      {
        scene_number: 2,
        title: 'The Sparkling Discovery',
        narration_text: `Look! Down by the singing brook, something shiny was twinkling under the clover leaves!`,
        visual_prompt: `${char.visual_dna}, peeking curiously through giant emerald clover leaves at three sparkling rainbow berries, wide amazed eyes, ${styleObj.promptSuffix}`,
        camera_direction: 'pan_right',
        duration_seconds: 6
      },
      {
        scene_number: 3,
        title: 'Meeting a Friend',
        narration_text: `Just then, a tiny friend hopped by, with a tummy that went rumble-rumble-rumble!`,
        visual_prompt: `${char.visual_dna}, kneeling down warmly next to a small hungry baby hedgehog on a mossy log, gentle compassionate expression, ${styleObj.promptSuffix}`,
        camera_direction: 'zoom_in',
        duration_seconds: 6
      },
      {
        scene_number: 4,
        title: 'Sharing is Double Fun',
        narration_text: `Pip smiled and shared the biggest, juiciest berry. Yum! Sharing made it taste twice as sweet!`,
        visual_prompt: `${char.visual_dna}, happily sharing bright glowing berries with his little hedgehog friend, colorful sparkles in the air, joyous smiles, ${styleObj.promptSuffix}`,
        camera_direction: 'zoom_out',
        duration_seconds: 7
      },
      {
        scene_number: 5,
        title: 'The Sunset Celebration',
        narration_text: `What a wonderful day! Remember, little superstars: a kind heart makes every adventure magical!`,
        visual_prompt: `${char.visual_dna}, standing on a soft grassy hill waving happily towards the camera against a breathtaking pastel sunset sky, ${styleObj.promptSuffix}`,
        camera_direction: 'zoom_in',
        duration_seconds: 6
      }
    ]
  };
}
