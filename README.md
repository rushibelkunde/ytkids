# ytkids — AI Kids Animation & YouTube Shorts Studio

An AI-powered production studio built with Next.js, Google Gemini, Fal.ai (Flux + Kling AI), Edge-TTS, and FFmpeg for generating funny 3D slapstick animated YouTube Shorts and publishing directly to YouTube.

## 🚀 Key Capabilities
- **Real 3D Character Animation**: Authentic character motion, waddling, dancing, and cartoon physics powered by Fal.ai Kling Image-to-Video (`engine: 'full_ai_video'`).
- **Viral Slapstick Shorts Format**: High-retention 9:16 vertical video (12–18s) with bold yellow cartoon subtitles elevated above YouTube UI.
- **YouTube Direct Publisher**: Integrated Google OAuth2 and YouTube Data API v3 for 1-click publishing with automated COPPA "Made for Kids" compliance.
- **Mascot & Script Studio**: Character workshop and scriptwriting engine powered by Google Gemini with persistent SQLite storage.
- **Audio & Sound Design**: Neural Edge-TTS voiceover mixed with custom bouncy comedic marimba background music.

## 📖 Content Strategy & Playbook
See [`CONTENT_PLAYBOOK.md`](CONTENT_PLAYBOOK.md) for complete channel guidelines, benchmark references, 3-act comedy structure, and YouTube SEO templates.

## 🛠️ Quick Start

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment Variables** (`.env.local`):
   ```env
   GEMINI_API_KEY=your_gemini_api_key
   FAL_KEY=your_fal_api_key
   GOOGLE_OAUTH_CLIENT_ID=your_oauth_client_id.apps.googleusercontent.com
   GOOGLE_OAUTH_CLIENT_SECRET=your_oauth_client_secret
   ```

3. **Run Development Server**:
   ```bash
   npm run dev
   ```

4. **Open Studio**:
   Navigate to [http://localhost:3000](http://localhost:3000).
