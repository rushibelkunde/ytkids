import { ContentNiche, TargetAgeGroup, VisualStyle } from './types';

export interface StyleOption {
  id: VisualStyle;
  label: string;
  badge: string;
  description: string;
  promptSuffix: string;
  previewGradient: string;
}

export const VISUAL_STYLES: StyleOption[] = [
  {
    id: '3d_pixar',
    label: '3D Pixar Animation',
    badge: '🔥 Highest Views',
    description: 'Vibrant, cinematic 3D CGI with rich lighting, big expressive eyes, and glossy friendly textures.',
    promptSuffix: 'in vibrant 3D Pixar Disney animation style, octane render 8k, cinematic lighting, cute friendly features, smooth glossy textures, ultra detailed character, children film quality',
    previewGradient: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 50%, #FFA07A 100%)'
  },
  {
    id: '2d_storybook',
    label: 'Pastel Storybook',
    badge: 'Calming & Cozy',
    description: 'Gentle watercolor illustrations with soft pastel tones, pencil outlines, and storybook charm.',
    promptSuffix: 'in whimsical pastel children book illustration style, soft watercolor textures, gentle pencil outlines, warm cozy palette, storybook aesthetic',
    previewGradient: 'linear-gradient(135deg, #A8EDEA 0%, #FED6E3 100%)'
  },
  {
    id: 'claymation_3d',
    label: 'Chunky 3D Clay',
    badge: 'Tactile & Cute',
    description: 'Handcrafted plasticine clay look with fingerprint textures, playful rounded shapes, and stop-motion charm.',
    promptSuffix: 'in cute 3D claymation plasticine style, handmade clay stop-motion look, chunky rounded features, warm ambient occlusion lighting, playful studio miniature',
    previewGradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
  },
  {
    id: 'cartoon_modern',
    label: 'Cocomelon Cartoon',
    badge: 'Super Engaging',
    description: 'Ultra-bright colors, bold outlines, simple readable shapes designed for toddler retention.',
    promptSuffix: 'modern high-energy kids educational cartoon style, bold clean vector outlines, ultra-bright primary colors, cheerful friendly expression, simple readable composition',
    previewGradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
  },
  {
    id: 'anime_ghibli',
    label: 'Whimsical Anime',
    badge: 'Artistic & Lush',
    description: 'Ghibli-inspired lush hand-painted backgrounds, fluffy clouds, and expressive character moments.',
    promptSuffix: 'in studio ghibli anime style, hand-painted scenic background, fluffy summer clouds, warm sunlight, charming endearing character, cinematic anime still',
    previewGradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
  }
];

export interface NicheOption {
  id: ContentNiche;
  title: string;
  icon: string;
  hook: string;
  suggestedDuration: number; // in seconds
}

export const CONTENT_NICHES: NicheOption[] = [
  {
    id: 'educational',
    title: 'Educational & Numbers',
    icon: '🔢',
    hook: 'Counting objects, colors, shapes, ABCs with interactive questions',
    suggestedDuration: 45
  },
  {
    id: 'moral_story',
    title: 'Moral & Kindness Story',
    icon: '❤️',
    hook: 'Short emotional tale about sharing, honesty, patience, or friendship',
    suggestedDuration: 55
  },
  {
    id: 'bedtime',
    title: 'Bedtime Soothing Tale',
    icon: '🌙',
    hook: 'Gentle, sleepy journey with calm animals getting ready for dreams',
    suggestedDuration: 60
  },
  {
    id: 'nursery_rhyme',
    title: 'Rhyme & Musical Beat',
    icon: '🎵',
    hook: 'Rhythmic, catchy lines with repeatable chorus and bouncy scenes',
    suggestedDuration: 40
  },
  {
    id: 'adventure',
    title: 'Tiny Animal Adventure',
    icon: '🐾',
    hook: 'A brave little creature explores a magical garden or forest',
    suggestedDuration: 50
  },
  {
    id: 'fun_facts',
    title: 'Amazing Kids Facts',
    icon: '💡',
    hook: 'Did you know? Fun science facts about space, oceans, and dinosaurs',
    suggestedDuration: 45
  }
];

export const AGE_GROUPS = [
  {
    id: 'toddler' as TargetAgeGroup,
    label: 'Toddlers (2-4 yrs)',
    badge: 'Simple Words & Big Actions',
    description: 'Ultra-simple language, repetitiveness, loud clear visual cues, happy sounds.'
  },
  {
    id: 'early' as TargetAgeGroup,
    label: 'Early Learners (5-7 yrs)',
    badge: 'Curiosity & Story',
    description: 'Relatable mini-conflicts, problem solving, funny character expressions.'
  },
  {
    id: 'kids' as TargetAgeGroup,
    label: 'Curious Kids (8-10 yrs)',
    badge: 'Clever & Educational',
    description: 'Fascinating facts, cool storylines, moral decisions, and witty moments.'
  }
];

export const SUGGESTED_VOICES = [
  {
    id: 'en-US-AnaNeural',
    name: 'Ana (Sweet & Gentle)',
    type: 'free',
    gender: 'Female',
    personality: 'Warm Storyteller'
  },
  {
    id: 'en-US-JennyNeural',
    name: 'Jenny (Warm & Friendly)',
    type: 'free',
    gender: 'Female',
    personality: 'Calm Motherly Narrator'
  },
  {
    id: 'en-US-GuyNeural',
    name: 'Guy (Upbeat & Clear)',
    type: 'free',
    gender: 'Male',
    personality: 'Friendly Teacher'
  },
  {
    id: 'en-US-AriaNeural',
    name: 'Aria (Enthusiastic & Vivid)',
    type: 'free',
    gender: 'Female',
    personality: 'Excited Explorer'
  },
  {
    id: 'hi-IN-SwaraNeural',
    name: 'Swara (Hindi Warm)',
    type: 'free',
    gender: 'Female',
    personality: 'Gentle Hindi Storyteller'
  },
  {
    id: 'es-ES-ElviraNeural',
    name: 'Elvira (Spanish Melodic)',
    type: 'free',
    gender: 'Female',
    personality: 'Friendly Spanish Narrator'
  }
];

export const STARTER_PROMPTS = [
  {
    title: 'Pip the Squirrel Shares His Acorns',
    niche: 'moral_story' as ContentNiche,
    prompt: 'Pip the tiny red squirrel finds three giant golden acorns in the autumn woods. His friend Barnaby the hedgehog is hungry, and Pip learns why sharing makes treats taste double as sweet.',
    style: '3d_pixar' as VisualStyle
  },
  {
    title: 'Counting 5 Bouncing Baby Bunnies',
    niche: 'educational' as ContentNiche,
    prompt: 'Five colorful fluffy bunnies hop through a magical strawberry patch. One by one, they find shiny hidden surprises, counting from 1 to 5 with bright cheerful celebration!',
    style: '3d_pixar' as VisualStyle
  },
  {
    title: 'Why Do Fireflies Glow in the Dark?',
    niche: 'fun_facts' as ContentNiche,
    prompt: 'Lumi the little glowing firefly explains to a curious baby owl how fireflies use their magic glow-bellies to talk and play hide-and-seek at night.',
    style: 'anime_ghibli' as VisualStyle
  },
  {
    title: 'Sleepy Bear Goes to Dreamland',
    niche: 'bedtime' as ContentNiche,
    prompt: 'Barnaby the fluffy brown cub yawns under a sky of marshmallow clouds. The stars tuck him in with a silver blanket as he drifts happily to sleep.',
    style: '2d_storybook' as VisualStyle
  }
];
