// UOM AI Coach — production server
// Serves static frontend + tiny OpenAI proxy for the Polish-for-me feature.
// Also injects Supabase + OpenAI config into the client at /config.js
// so we never commit keys into HTML.

const express = require('express');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 3000;
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'engrmoshbari@gmail.com';

app.use(express.json({ limit: '32kb' }));

// Health check (Railway uses this)
app.get('/healthz', (_, res) => res.json({ ok: true, service: 'uom-ai-coach' }));

// Public config (anon key only — service role NEVER goes here)
app.get('/config.js', (_, res) => {
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.send(
    `window.UOM_CONFIG = ${JSON.stringify({
      supabaseUrl: SUPABASE_URL,
      supabaseAnonKey: SUPABASE_ANON_KEY,
      adminEmail: ADMIN_EMAIL,
      polishUrl: '/api/polish'
    })};`
  );
});

// OpenAI Polish proxy — hides the OpenAI key from the browser
const SYSTEM_PROMPT = `You are a Facebook post editor for beginner creators in the Ultimate Online Mastery program.

Your job: take the user's pasted text (often from YouTube transcripts, viral posts, or rough ideas) and rewrite it as a clean Facebook post using the PEEL framework (Point, Evidence, Explain, Link).

Hard rules:
- Output ONLY the rewritten post. No preamble, no quotes, no "Here is your post:".
- Maximum 5 short lines. One blank line between each.
- 5th-grade reading level. No jargon. No "leverage", "synergy", "ecosystem".
- Universal truths only. NEVER fabricate a personal claim ("I quit my job", "Last year I made $X") that the user hasn't already established.
- End with a question that invites a comment.
- No emojis unless the source text had them.
- No hashtags.`;

app.post('/api/polish', async (req, res) => {
  try {
    const text = (req.body && req.body.text) || '';
    if (typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Paste something first.' });
    }
    if (text.length > 4000) {
      return res.status(400).json({ error: 'Too long. Trim to under 4000 characters.' });
    }
    if (!OPENAI_API_KEY) {
      return res.status(500).json({ error: 'AI not configured yet.' });
    }

    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: text.trim() }
        ],
        max_tokens: 300,
        temperature: 0.7
      })
    });

    const data = await r.json();
    if (!r.ok) {
      return res.status(502).json({ error: (data.error && data.error.message) || 'AI is busy. Try again in 5 seconds.' });
    }
    const polished = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '';
    res.json({ polished: polished.trim() });
  } catch (e) {
    res.status(500).json({ error: 'Server error: ' + e.message });
  }
});

// Static frontend
app.use(express.static(path.join(__dirname, 'public'), {
  extensions: ['html'],
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) res.setHeader('Cache-Control', 'no-cache');
  }
}));

// Default → member app
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Not found' });
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`UOM AI Coach listening on :${PORT}`);
  console.log(`Supabase: ${SUPABASE_URL ? 'configured' : 'MISSING'}`);
  console.log(`OpenAI:   ${OPENAI_API_KEY ? 'configured' : 'MISSING'}`);
});
