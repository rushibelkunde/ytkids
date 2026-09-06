export type ContentNiche = 
  | 'educational' 
  | 'moral_story' 
  | 'bedtime' 
  | 'nursery_rhyme' 
  | 'adventure' 
  | 'fun_facts';

export type TargetAgeGroup = 
  | 'toddler'   // 2-4 years
  | 'early'     // 5-7 years
  | 'kids';     // 8-10 years

export type VisualStyle = 
  | '3d_pixar'       // Default trending champion
  | '2d_storybook'   // Cute pastel watercolor
  | 'claymation_3d'  // Chunky cute 3D clay/chibi
  | 'cartoon_modern' // Cocomelon / Peppa dynamic cartoon
  | 'anime_ghibli';  // Soft whimsical anime

export type ProductionEngine = 
  | 'motion_storybook' // $0.05 budget mode: High-res images + Ken Burns camera animation + voice + subs
  | 'full_ai_video';   // $0.80 full video mode: Image-to-video AI animation

export type TTSEngine = 'edge_tts' | 'elevenlabs';

export interface Character {
  id: string;
  name: string;
  species: string; // e.g., "Fox", "Human Boy", "Baby Dino"
  gender?: string;
  age_appearance: string; // e.g., "5-year-old child"
  traits: string[]; // e.g. ["curious", "wearing red overalls", "fluffy tail"]
  visual_dna: string; // The core anchor prompt for model consistency
  style: VisualStyle;
  avatar_url?: string;
  created_at: string;
}

export interface Scene {
  id: string;
  story_id: string;
  scene_number: number;
  title: string;
  narration_text: string;
  visual_prompt: string;
  camera_direction: 'zoom_in' | 'zoom_out' | 'pan_left' | 'pan_right' | 'static';
  duration_seconds: number;
  image_url?: string;
  video_url?: string;
  audio_url?: string;
  status: 'pending' | 'generated' | 'rendering' | 'ready' | 'failed';
}

export interface Story {
  id: string;
  title: string;
  user_prompt: string;
  niche: ContentNiche;
  age_group: TargetAgeGroup;
  style: VisualStyle;
  language: string;
  character_ids: string[];
  moral_or_hook: string;
  estimated_duration: number; // in seconds
  status: 'draft' | 'scripted' | 'producing' | 'completed';
  created_at: string;
  scenes?: Scene[];
}

export interface VideoProject {
  id: string;
  story_id: string;
  title: string;
  description: string;
  tags: string[];
  aspect_ratio: '9:16' | '16:9';
  engine: ProductionEngine;
  video_path?: string;
  thumbnail_path?: string;
  duration_seconds: number;
  youtube_video_id?: string;
  youtube_status?: 'draft' | 'uploaded' | 'public';
  created_at: string;
}

export interface StudioSettings {
  gemini_api_key?: string;
  fal_key?: string;
  elevenlabs_api_key?: string;
  youtube_client_id?: string;
  youtube_client_secret?: string;
  youtube_refresh_token?: string;
  youtube_access_token?: string;
  youtube_channel_title?: string;
  youtube_channel_id?: string;
  default_engine: ProductionEngine;
  default_tts: TTSEngine;
  default_style: VisualStyle;
  default_language: string;
  default_voice: string;
}
