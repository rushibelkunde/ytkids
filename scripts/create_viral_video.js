// Script to create and render a viral slapstick YouTube Short
const http = require('http');

async function postJson(path, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    const req = http.request({
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (res.statusCode >= 400) {
            reject(new Error(`HTTP ${res.statusCode}: ${body}`));
          } else {
            resolve(parsed);
          }
        } catch (e) {
          reject(new Error(`Failed to parse response: ${body}`));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function main() {
  console.log('🎬 [Step 1] Generating Viral Script with 4-Beat Spine (Gemini AI)...');
  
  const storyPayload = {
    prompt: "Goofy Ducky finds a sneaker as big as a house in the park. Baby Leo tries to tie the giant lace but it wraps around both of them and they spin like a top. Hilarious impossible physics, slapstick comedy.",
    niche: "slapstick_comedy",
    age_group: "toddler",
    style: "3d_pixar",
    language: "English",
    character_ids: ["char_goofy_duck"],
    scene_count: 3
  };

  const story = await postJson('/api/stories/generate', storyPayload);
  console.log(`\n✅ Story Created: "${story.title}" (ID: ${story.id})`);
  console.log(`🪝 Hook: ${story.moral_or_hook}`);
  console.log(`⏱️ Estimated Duration: ${story.estimated_duration}s`);
  console.log(`\n📋 Scenes (${story.scenes.length}):`);
  story.scenes.forEach((s, i) => {
    console.log(`\n--- Scene ${i + 1}: ${s.title} (${s.duration_seconds}s) ---`);
    console.log(`🎙️ Narration: "${s.narration_text}"`);
    console.log(`🎨 Visual: ${s.visual_prompt.slice(0, 140)}...`);
  });

  console.log('\n🚀 [Step 2] Rendering Production Video with Full AI Video & Frame-Chaining...');
  console.log('   (This generates Kling AI clips, chains frames, synthesizes Edge-TTS, and stitches in FFmpeg)');

  const renderStartTime = Date.now();
  const renderPayload = {
    story_id: story.id,
    aspect_ratio: '9:16',
    engine: 'full_ai_video'
  };

  const video = await postJson('/api/production/render', renderPayload);
  const elapsed = Math.round((Date.now() - renderStartTime) / 1000);

  console.log(`\n🎉 [COMPLETE] Video Rendered in ${elapsed}s!`);
  console.log(`📹 Video ID: ${video.id}`);
  console.log(`📂 Video Path: ${video.video_path}`);
  console.log(`🖼️ Thumbnail Path: ${video.thumbnail_path}`);
  console.log(`⏱️ Final Duration: ${video.duration_seconds}s`);
  console.log(`🏷️ Tags: ${video.tags.slice(0, 5).join(', ')}...`);
  console.log(`📝 Description Preview: ${video.description.slice(0, 100)}...`);
  console.log('\n✨ Ready to view or publish directly to YouTube Shorts!');
}

main().catch(err => {
  console.error('\n❌ Error generating viral video:', err);
  process.exit(1);
});
