import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { Character, Story, Scene, VideoProject, StudioSettings } from './types';

const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Media storage folders
const ASSETS_DIRS = ['characters', 'scenes', 'audio', 'exports'].map(d => path.join(DATA_DIR, d));
ASSETS_DIRS.forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const DB_PATH = path.join(DATA_DIR, 'ytkids.db');
const db = new Database(DB_PATH);

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS characters (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    species TEXT NOT NULL,
    gender TEXT,
    age_appearance TEXT,
    traits TEXT NOT NULL, -- JSON array of strings
    visual_dna TEXT NOT NULL,
    style TEXT NOT NULL,
    avatar_url TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS stories (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    user_prompt TEXT NOT NULL,
    niche TEXT NOT NULL,
    age_group TEXT NOT NULL,
    style TEXT NOT NULL,
    language TEXT NOT NULL,
    character_ids TEXT NOT NULL, -- JSON array of IDs
    moral_or_hook TEXT,
    estimated_duration INTEGER DEFAULT 50,
    status TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS scenes (
    id TEXT PRIMARY KEY,
    story_id TEXT NOT NULL,
    scene_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    narration_text TEXT NOT NULL,
    visual_prompt TEXT NOT NULL,
    camera_direction TEXT DEFAULT 'zoom_in',
    duration_seconds REAL DEFAULT 6.0,
    image_url TEXT,
    video_url TEXT,
    audio_url TEXT,
    status TEXT NOT NULL,
    FOREIGN KEY(story_id) REFERENCES stories(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS videos (
    id TEXT PRIMARY KEY,
    story_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    tags TEXT, -- JSON array of strings
    aspect_ratio TEXT DEFAULT '9:16',
    engine TEXT NOT NULL,
    video_path TEXT,
    thumbnail_path TEXT,
    duration_seconds REAL DEFAULT 0,
    youtube_video_id TEXT,
    youtube_status TEXT DEFAULT 'draft',
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    gemini_api_key TEXT,
    fal_key TEXT,
    elevenlabs_api_key TEXT,
    youtube_client_id TEXT,
    youtube_client_secret TEXT,
    youtube_refresh_token TEXT,
    youtube_access_token TEXT,
    youtube_channel_title TEXT,
    youtube_channel_id TEXT,
    default_engine TEXT DEFAULT 'motion_storybook',
    default_tts TEXT DEFAULT 'edge_tts',
    default_style TEXT DEFAULT '3d_pixar',
    default_language TEXT DEFAULT 'English',
    default_voice TEXT DEFAULT 'en-US-AnaNeural'
  );
`);

// Dynamic column migrations if table already existed
try { db.exec("ALTER TABLE settings ADD COLUMN youtube_refresh_token TEXT;"); } catch {}
try { db.exec("ALTER TABLE settings ADD COLUMN youtube_access_token TEXT;"); } catch {}
try { db.exec("ALTER TABLE settings ADD COLUMN youtube_channel_title TEXT;"); } catch {}
try { db.exec("ALTER TABLE settings ADD COLUMN youtube_channel_id TEXT;"); } catch {}

// Insert default settings if not exists
const existingSettings = db.prepare('SELECT id FROM settings WHERE id = 1').get();
if (!existingSettings) {
  db.prepare(`
    INSERT INTO settings (id, default_engine, default_tts, default_style, default_language, default_voice)
    VALUES (1, 'motion_storybook', 'edge_tts', '3d_pixar', 'English', 'en-US-AnaNeural')
  `).run();
}

// Seed starter characters if empty
const countCharacters = db.prepare('SELECT COUNT(*) as count FROM characters').get() as { count: number };
if (countCharacters.count === 0) {
  const seedCharacters: Character[] = [
    {
      id: 'char_pip_fox',
      name: 'Pip the Little Fox',
      species: 'Red Fox',
      gender: 'Boy',
      age_appearance: '5-year-old child',
      traits: ['curious', 'big warm hazel eyes', 'fluffy white-tipped tail', 'wearing cozy yellow knitted sweater with red heart patch'],
      visual_dna: 'cute little red fox cub named Pip, vibrant burnt orange fur, soft white chest and cheeks, big friendly sparkling hazel eyes, tiny black button nose, wearing cozy mustard yellow knitted sweater with small red heart patch, fluffy oversized tail with white tip, rounded soft shapes, highly expressive joyful face',
      style: '3d_pixar',
      avatar_url: '/seed/pip.png',
      created_at: new Date().toISOString()
    },
    {
      id: 'char_luna_owl',
      name: 'Luna the Baby Owl',
      species: 'Snowy Barn Owl',
      gender: 'Girl',
      age_appearance: '4-year-old child',
      traits: ['gentle', 'oversized amethyst purple eyes', 'wearing tiny mint green bowtie', 'fluffy lavender-tinted feathers'],
      visual_dna: 'adorable baby barn owl named Luna, soft fluffy cream and lavender feathers, giant curious amethyst purple eyes with starry reflections, small golden beak, wearing tiny mint green bowtie, cute rounded plump body, friendly heartwarming expression',
      style: '3d_pixar',
      avatar_url: '/seed/luna.png',
      created_at: new Date().toISOString()
    }
  ];

  const insertChar = db.prepare(`
    INSERT INTO characters (id, name, species, gender, age_appearance, traits, visual_dna, style, avatar_url, created_at)
    VALUES (@id, @name, @species, @gender, @age_appearance, @traits, @visual_dna, @style, @avatar_url, @created_at)
  `);

  seedCharacters.forEach(c => {
    insertChar.run({
      ...c,
      traits: JSON.stringify(c.traits)
    });
  });
}

// Data Access Object
export const DB = {
  // Characters
  getCharacters(): Character[] {
    const rows = db.prepare('SELECT * FROM characters ORDER BY created_at DESC').all() as any[];
    return rows.map(r => ({ ...r, traits: JSON.parse(r.traits || '[]') }));
  },

  getCharacter(id: string): Character | null {
    const row = db.prepare('SELECT * FROM characters WHERE id = ?').get(id) as any;
    if (!row) return null;
    return { ...row, traits: JSON.parse(row.traits || '[]') };
  },

  saveCharacter(char: Character): void {
    const existing = db.prepare('SELECT id FROM characters WHERE id = ?').get(char.id);
    if (existing) {
      db.prepare(`
        UPDATE characters 
        SET name = @name, species = @species, gender = @gender, age_appearance = @age_appearance,
            traits = @traits, visual_dna = @visual_dna, style = @style, avatar_url = @avatar_url
        WHERE id = @id
      `).run({ ...char, traits: JSON.stringify(char.traits) });
    } else {
      db.prepare(`
        INSERT INTO characters (id, name, species, gender, age_appearance, traits, visual_dna, style, avatar_url, created_at)
        VALUES (@id, @name, @species, @gender, @age_appearance, @traits, @visual_dna, @style, @avatar_url, @created_at)
      `).run({ ...char, traits: JSON.stringify(char.traits) });
    }
  },

  deleteCharacter(id: string): void {
    db.prepare('DELETE FROM characters WHERE id = ?').run(id);
  },

  // Stories
  getStories(): Story[] {
    const rows = db.prepare('SELECT * FROM stories ORDER BY created_at DESC').all() as any[];
    return rows.map(r => {
      const story: Story = {
        ...r,
        character_ids: JSON.parse(r.character_ids || '[]')
      };
      story.scenes = db.prepare('SELECT * FROM scenes WHERE story_id = ? ORDER BY scene_number ASC').all(r.id) as Scene[];
      return story;
    });
  },

  getStory(id: string): Story | null {
    const row = db.prepare('SELECT * FROM stories WHERE id = ?').get(id) as any;
    if (!row) return null;
    const story: Story = {
      ...row,
      character_ids: JSON.parse(row.character_ids || '[]')
    };
    story.scenes = db.prepare('SELECT * FROM scenes WHERE story_id = ? ORDER BY scene_number ASC').all(id) as Scene[];
    return story;
  },

  saveStory(story: Story): void {
    const existing = db.prepare('SELECT id FROM stories WHERE id = ?').get(story.id);
    const params = {
      ...story,
      character_ids: JSON.stringify(story.character_ids)
    };

    if (existing) {
      db.prepare(`
        UPDATE stories
        SET title = @title, user_prompt = @user_prompt, niche = @niche, age_group = @age_group,
            style = @style, language = @language, character_ids = @character_ids,
            moral_or_hook = @moral_or_hook, estimated_duration = @estimated_duration, status = @status
        WHERE id = @id
      `).run(params);
    } else {
      db.prepare(`
        INSERT INTO stories (id, title, user_prompt, niche, age_group, style, language, character_ids, moral_or_hook, estimated_duration, status, created_at)
        VALUES (@id, @title, @user_prompt, @niche, @age_group, @style, @language, @character_ids, @moral_or_hook, @estimated_duration, @status, @created_at)
      `).run(params);
    }

    if (story.scenes && story.scenes.length > 0) {
      const insertScene = db.prepare(`
        INSERT OR REPLACE INTO scenes (id, story_id, scene_number, title, narration_text, visual_prompt, camera_direction, duration_seconds, image_url, video_url, audio_url, status)
        VALUES (@id, @story_id, @scene_number, @title, @narration_text, @visual_prompt, @camera_direction, @duration_seconds, @image_url, @video_url, @audio_url, @status)
      `);
      story.scenes.forEach(s => insertScene.run({
        id: s.id,
        story_id: s.story_id,
        scene_number: s.scene_number,
        title: s.title || '',
        narration_text: s.narration_text || '',
        visual_prompt: s.visual_prompt || '',
        camera_direction: s.camera_direction || 'zoom_in',
        duration_seconds: s.duration_seconds || 6.0,
        image_url: s.image_url || null,
        video_url: s.video_url || null,
        audio_url: s.audio_url || null,
        status: s.status || 'pending'
      }));
    }
  },

  deleteStory(id: string): void {
    db.prepare('DELETE FROM scenes WHERE story_id = ?').run(id);
    db.prepare('DELETE FROM stories WHERE id = ?').run(id);
  },

  // Scenes
  updateScene(scene: Partial<Scene> & { id: string }): void {
    const current = db.prepare('SELECT * FROM scenes WHERE id = ?').get(scene.id) as any;
    if (!current) return;
    const merged = { ...current, ...scene };
    db.prepare(`
      UPDATE scenes
      SET title = @title, narration_text = @narration_text, visual_prompt = @visual_prompt,
          camera_direction = @camera_direction, duration_seconds = @duration_seconds,
          image_url = @image_url, video_url = @video_url, audio_url = @audio_url, status = @status
      WHERE id = @id
    `).run({
      ...merged,
      image_url: merged.image_url || null,
      video_url: merged.video_url || null,
      audio_url: merged.audio_url || null
    });
  },

  // Videos
  getVideos(): VideoProject[] {
    const rows = db.prepare('SELECT * FROM videos ORDER BY created_at DESC').all() as any[];
    return rows.map(r => ({ ...r, tags: JSON.parse(r.tags || '[]') }));
  },

  saveVideo(video: VideoProject): void {
    const existing = db.prepare('SELECT id FROM videos WHERE id = ?').get(video.id);
    const params = {
      id: video.id,
      story_id: video.story_id,
      title: video.title,
      description: video.description || null,
      aspect_ratio: video.aspect_ratio || '9:16',
      engine: video.engine,
      video_path: video.video_path || null,
      thumbnail_path: video.thumbnail_path || null,
      duration_seconds: video.duration_seconds || 0,
      youtube_video_id: video.youtube_video_id || null,
      youtube_status: video.youtube_status || 'draft',
      created_at: video.created_at || new Date().toISOString(),
      tags: JSON.stringify(video.tags || [])
    };
    if (existing) {
      db.prepare(`
        UPDATE videos
        SET title = @title, description = @description, tags = @tags, aspect_ratio = @aspect_ratio,
            engine = @engine, video_path = @video_path, thumbnail_path = @thumbnail_path,
            duration_seconds = @duration_seconds, youtube_video_id = @youtube_video_id,
            youtube_status = @youtube_status
        WHERE id = @id
      `).run(params);
    } else {
      db.prepare(`
        INSERT INTO videos (id, story_id, title, description, tags, aspect_ratio, engine, video_path, thumbnail_path, duration_seconds, youtube_video_id, youtube_status, created_at)
        VALUES (@id, @story_id, @title, @description, @tags, @aspect_ratio, @engine, @video_path, @thumbnail_path, @duration_seconds, @youtube_video_id, @youtube_status, @created_at)
      `).run(params);
    }
  },

  // Settings
  getSettings(): StudioSettings {
    const row = db.prepare('SELECT * FROM settings WHERE id = 1').get() as any;
    if (!row) {
      return {
        default_engine: 'motion_storybook',
        default_tts: 'edge_tts',
        default_style: '3d_pixar',
        default_language: 'English',
        default_voice: 'en-US-AnaNeural'
      };
    }
    return {
      gemini_api_key: row.gemini_api_key || process.env.GEMINI_API_KEY || '',
      fal_key: row.fal_key || process.env.FAL_KEY || process.env.FAL_AI_API_KEY || '',
      elevenlabs_api_key: row.elevenlabs_api_key || process.env.ELEVENLABS_API_KEY || '',
      youtube_client_id: row.youtube_client_id || process.env.GOOGLE_OAUTH_CLIENT_ID || process.env.YOUTUBE_CLIENT_ID || '',
      youtube_client_secret: row.youtube_client_secret || process.env.GOOGLE_OAUTH_CLIENT_SECRET || process.env.YOUTUBE_CLIENT_SECRET || '',
      youtube_refresh_token: row.youtube_refresh_token || process.env.YOUTUBE_REFRESH_TOKEN || '',
      youtube_access_token: row.youtube_access_token || '',
      youtube_channel_title: row.youtube_channel_title || '',
      youtube_channel_id: row.youtube_channel_id || '',
      default_engine: row.default_engine || 'motion_storybook',
      default_tts: row.default_tts || 'edge_tts',
      default_style: row.default_style || '3d_pixar',
      default_language: row.default_language || 'English',
      default_voice: row.default_voice || 'en-US-AnaNeural'
    };
  },

  updateSettings(settings: Partial<StudioSettings>): StudioSettings {
    const current = this.getSettings();
    const merged = { ...current, ...settings };
    db.prepare(`
      UPDATE settings
      SET gemini_api_key = @gemini_api_key,
          fal_key = @fal_key,
          elevenlabs_api_key = @elevenlabs_api_key,
          youtube_client_id = @youtube_client_id,
          youtube_client_secret = @youtube_client_secret,
          youtube_refresh_token = @youtube_refresh_token,
          youtube_access_token = @youtube_access_token,
          youtube_channel_title = @youtube_channel_title,
          youtube_channel_id = @youtube_channel_id,
          default_engine = @default_engine,
          default_tts = @default_tts,
          default_style = @default_style,
          default_language = @default_language,
          default_voice = @default_voice
      WHERE id = 1
    `).run({
      gemini_api_key: merged.gemini_api_key || null,
      fal_key: merged.fal_key || null,
      elevenlabs_api_key: merged.elevenlabs_api_key || null,
      youtube_client_id: merged.youtube_client_id || null,
      youtube_client_secret: merged.youtube_client_secret || null,
      youtube_refresh_token: merged.youtube_refresh_token || null,
      youtube_access_token: merged.youtube_access_token || null,
      youtube_channel_title: merged.youtube_channel_title || null,
      youtube_channel_id: merged.youtube_channel_id || null,
      default_engine: merged.default_engine,
      default_tts: merged.default_tts,
      default_style: merged.default_style,
      default_language: merged.default_language,
      default_voice: merged.default_voice
    });
    return this.getSettings();
  }
};
