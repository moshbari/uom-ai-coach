// UOM AI Coach — production server (v2.2)
// Static frontend + OpenAI proxy + custom auth email pipeline.
//
// Why custom auth emails:
// The Supabase project is shared with GoNoGo (different app). Supabase's
// project-level SMTP is configured for GoNoGo branding. We can't change it
// without breaking GoNoGo. Solution: bypass Supabase email entirely for UOM.
// Our /api/auth/* endpoints generate magic links via Supabase admin API,
// then send the email ourselves via Resend with UOM-branded HTML.

const express = require('express');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const app = express();

const PORT = process.env.PORT || 3000;
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const FROM_EMAIL = process.env.FROM_EMAIL || 'UOM AI Coach <uomaicoach@onesign.click>';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'engrmoshbari@gmail.com';
const APP_URL = process.env.APP_URL || 'https://uom-ai-coach-production.up.railway.app';
const DEVRANT_URL = process.env.DEVRANT_URL || '';   // Optional — UOM's devrant creator suite

app.use(express.json({ limit: '32kb' }));

// Admin Supabase client (service role bypasses RLS — used only on server)
let sbAdmin = null;
if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
  sbAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

// ============================================================
// HEALTH
// ============================================================
app.get('/healthz', (_, res) => res.json({
  ok: true, service: 'uom-ai-coach', version: '2.2.0',
  supabase: !!SUPABASE_URL, openai: !!OPENAI_API_KEY,
  resend: !!RESEND_API_KEY, admin_client: !!sbAdmin
}));

// ============================================================
// CLIENT CONFIG — anon key only (never service role)
// ============================================================
app.get('/config.js', (_, res) => {
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.send(`window.UOM_CONFIG = ${JSON.stringify({
    supabaseUrl: SUPABASE_URL,
    supabaseAnonKey: SUPABASE_ANON_KEY,
    adminEmail: ADMIN_EMAIL,
    polishUrl: '/api/polish',
    sparkReflectUrl: '/api/spark-reflect',
    sparkExploreUrl: '/api/spark-explore',
    sparkToPostUrl: '/api/spark-to-post',
    personalPostUrl: '/api/personal-post',
    devrantUrl: DEVRANT_URL,
    magicLinkUrl: '/api/auth/magic-link',
    signupUrl: '/api/auth/signup',
    resetUrl: '/api/auth/reset'
  })};`);
});

// ============================================================
// EMAIL SENDING (via Resend)
// ============================================================
async function sendEmail({ to, subject, html }) {
  if (!RESEND_API_KEY) throw new Error('Email not configured (RESEND_API_KEY missing)');
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html })
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error('Resend error: ' + (data.message || r.statusText));
  return data;
}

// ============================================================
// BRANDED EMAIL TEMPLATES — clean, light, gold accent
// ============================================================
function emailShell({ title, intro, ctaText, ctaUrl, footerNote }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#F5F2EC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#2A2520;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#F5F2EC;padding:40px 16px;">
    <tr><td align="center">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:520px;background:#FFFFFF;border-radius:16px;box-shadow:0 6px 24px rgba(40,30,10,0.08);overflow:hidden;">
        <tr><td style="padding:36px 36px 16px 36px;text-align:center;">
          <div style="font-size:42px;line-height:1;margin-bottom:8px;">&#x1F451;</div>
          <div style="font-size:11px;letter-spacing:3px;color:#A38444;font-weight:700;text-transform:uppercase;margin-bottom:0;">UOM AI Coach</div>
          <div style="height:1px;width:36px;background:#C9A961;margin:18px auto 0;"></div>
        </td></tr>
        <tr><td style="padding:24px 36px 8px 36px;text-align:center;">
          <h1 style="margin:0;font-size:24px;font-weight:500;letter-spacing:-0.3px;color:#1A1610;">${title}</h1>
          <p style="margin:14px 0 0;font-size:15px;line-height:1.6;color:#5C5448;">${intro}</p>
        </td></tr>
        <tr><td style="padding:28px 36px 8px 36px;text-align:center;">
          <a href="${ctaUrl}" target="_blank" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#C9A961 0%,#D4B896 100%);color:#1A1610;text-decoration:none;border-radius:10px;font-size:14px;font-weight:700;letter-spacing:0.5px;box-shadow:0 4px 12px rgba(201,169,97,0.25);">${ctaText} &rarr;</a>
        </td></tr>
        <tr><td style="padding:14px 36px 0 36px;text-align:center;">
          <p style="margin:0;font-size:12px;color:#8A8478;line-height:1.6;">${footerNote || 'This link is single-use and expires in 1 hour.'}</p>
        </td></tr>
        <tr><td style="padding:24px 36px 32px 36px;text-align:center;">
          <p style="margin:0;font-size:11px;color:#A0998A;line-height:1.6;">If you didn't request this email, you can safely ignore it.<br/>One small win every day. Climb from Bronze to Crown.</p>
        </td></tr>
      </table>
      <p style="margin:18px 0 0;font-size:10px;color:#A0998A;letter-spacing:1px;">UOM AI COACH</p>
    </td></tr>
  </table>
</body>
</html>`;
}

function magicLinkEmail({ link }) {
  return emailShell({
    title: 'Sign in to UOM AI Coach',
    intro: 'Tap the button below to sign in. No password needed.',
    ctaText: 'Sign in',
    ctaUrl: link
  });
}

function welcomeEmail({ name, link }) {
  return emailShell({
    title: `Welcome${name ? ', ' + name : ''}!`,
    intro: 'Your UOM AI Coach account is ready. Tap below to sign in for the first time. You can set a password from your account settings after you arrive.',
    ctaText: 'Sign in for the first time',
    ctaUrl: link,
    footerNote: 'This first-time link expires in 1 hour. After signing in, you can also use your password if you set one.'
  });
}

function passwordResetEmail({ link }) {
  return emailShell({
    title: 'Reset your password',
    intro: 'Tap the button below to set a new password for your UOM AI Coach account.',
    ctaText: 'Reset password',
    ctaUrl: link,
    footerNote: 'This link expires in 1 hour. If you did not ask to reset your password, ignore this email.'
  });
}

function originFromReq(req) {
  // Returns URL WITH trailing slash so it matches Supabase allow-list /** pattern.
  const o = req.headers.origin;
  if (o) return o.replace(/\/+$/, '') + '/';
  const r = req.headers.referer;
  if (r) {
    try { const u = new URL(r); return `${u.protocol}//${u.host}/`; } catch (_) {}
  }
  return APP_URL.replace(/\/+$/, '') + '/';
}

// ============================================================
// AUTH — magic link
// ============================================================
app.post('/api/auth/magic-link', async (req, res) => {
  try {
    if (!sbAdmin) return res.status(500).json({ error: 'Auth not configured' });
    const email = ((req.body && req.body.email) || '').trim().toLowerCase();
    if (!email || !email.includes('@')) return res.status(400).json({ error: 'Valid email required' });

    const redirectTo = originFromReq(req);
    const { data, error } = await sbAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: { redirectTo }
    });
    if (error) throw error;
    const link = data && data.properties && data.properties.action_link;
    if (!link) throw new Error('No link generated');

    await sendEmail({
      to: email,
      subject: 'Sign in to UOM AI Coach',
      html: magicLinkEmail({ link })
    });
    res.json({ ok: true });
  } catch (e) {
    console.error('magic-link error:', e.message);
    res.status(500).json({ error: e.message || 'Could not send email' });
  }
});

// ============================================================
// AUTH — signup (create account + send welcome magic link)
// ============================================================
app.post('/api/auth/signup', async (req, res) => {
  try {
    if (!sbAdmin) return res.status(500).json({ error: 'Auth not configured' });
    const email = ((req.body && req.body.email) || '').trim().toLowerCase();
    const name = ((req.body && req.body.name) || '').trim();
    const password = (req.body && req.body.password) || '';
    if (!email || !email.includes('@')) return res.status(400).json({ error: 'Valid email required' });
    if (!name) return res.status(400).json({ error: 'Name required' });
    if (!password || password.length < 6) return res.status(400).json({ error: 'Password must be 6+ characters' });

    // Create user with email already confirmed (we'll verify via magic link instead)
    const { data: created, error: cErr } = await sbAdmin.auth.admin.createUser({
      email, password, email_confirm: true,
      user_metadata: { display_name: name }
    });
    if (cErr) throw cErr;

    // Send welcome magic link
    const redirectTo = originFromReq(req);
    const { data: linkData, error: lErr } = await sbAdmin.auth.admin.generateLink({
      type: 'magiclink', email, options: { redirectTo }
    });
    if (lErr) throw lErr;
    const link = linkData && linkData.properties && linkData.properties.action_link;

    if (link) {
      await sendEmail({
        to: email,
        subject: 'Welcome to UOM AI Coach',
        html: welcomeEmail({ name, link })
      });
    }
    res.json({ ok: true, user_id: created.user && created.user.id });
  } catch (e) {
    console.error('signup error:', e.message);
    const msg = e.message || 'Signup failed';
    // Friendlier messages for common errors
    if (msg.toLowerCase().includes('already')) {
      return res.status(409).json({ error: 'An account with this email already exists. Use the Magic link or Password tab to sign in.' });
    }
    res.status(500).json({ error: msg });
  }
});

// ============================================================
// AUTH — password reset
// ============================================================
app.post('/api/auth/reset', async (req, res) => {
  try {
    if (!sbAdmin) return res.status(500).json({ error: 'Auth not configured' });
    const email = ((req.body && req.body.email) || '').trim().toLowerCase();
    if (!email || !email.includes('@')) return res.status(400).json({ error: 'Valid email required' });

    const redirectTo = originFromReq(req);
    const { data, error } = await sbAdmin.auth.admin.generateLink({
      type: 'recovery', email, options: { redirectTo }
    });
    if (error) throw error;
    const link = data && data.properties && data.properties.action_link;
    if (link) {
      await sendEmail({
        to: email,
        subject: 'Reset your UOM AI Coach password',
        html: passwordResetEmail({ link })
      });
    }
    // Always respond 200 — don't leak which emails exist
    res.json({ ok: true });
  } catch (e) {
    console.error('reset error:', e.message);
    // Still respond OK to avoid email-enumeration disclosure
    res.json({ ok: true });
  }
});


// ============================================================
// SPARK REFLECTION — 2-call AI Coach (classify then respond)
// ============================================================
// Why 2 calls: a single-prompt model kept inventing umbrella niches
// ("practical skills") to make K=1. Splitting into (1) deterministic
// JSON classify then (2) mode-locked reply forces honest scatter detection.

const CLASSIFY_PROMPT = `You are an industry classifier. For each spark below, output the SPECIFIC industry it lives in.

Rules:
- 1 to 3 words per industry, lowercase, specific.
- A niche = a real INDUSTRY or DOMAIN (fitness, agriculture, real estate, ai-coding, weight-loss, crypto, stock-trading, parenting, beauty, gaming, cooking, etc).
- DO NOT use vague umbrellas like "practical skills", "self improvement", "making money", "learning", "growth", "online business", "physical activities", "personal development".
- "ChatGPT for writing" = ai-writing.
- "Bicep curls" = fitness.
- "How to drive a tractor" = agriculture.
- "Today I learned to swim" = swimming.
- "AI cold email tools" = ai-sales.
- "AI for Facebook ads" = ai-marketing.
- "Weight loss tips" = weight-loss.
- "Crypto staking" = crypto.

Output ONLY valid JSON in this exact shape:
{"industries":["industry1","industry2",...]}

Match order to the input order. No prose. No labels.`;

async function classifySparks(sparkLines) {
  if (!sparkLines || sparkLines.length === 0) return [];
  const userMsg = sparkLines.map((s, i) => `${i+1}. ${s}`).join('\n');
  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_API_KEY}` },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: CLASSIFY_PROMPT },
        { role: 'user', content: userMsg }
      ],
      max_tokens: 200,
      temperature: 0,
      response_format: { type: 'json_object' }
    })
  });
  const data = await r.json();
  if (!r.ok) throw new Error('Classify failed: ' + ((data.error && data.error.message) || 'unknown'));
  try {
    const parsed = JSON.parse(data.choices[0].message.content);
    return (parsed.industries || []).map(s => String(s).toLowerCase().trim());
  } catch (e) {
    throw new Error('Classify returned invalid JSON');
  }
}

function pickMode(N, K) {
  if (N === 1) return 'A';
  if (N >= 2 && N <= 3 && K === 1) return 'B';
  if (N >= 2 && N <= 3 && K >= 2) return 'C';
  if (N >= 4 && K === 1) return 'E';
  if (N >= 4 && K === 2) return 'B_soft';
  return 'D';
}

function modeTemplate(mode) {
  const templates = {
    A: `Member just wrote their FIRST EVER spark. There is NO yesterday spark — do not invent one.
Required shape (3 lines, blank line between each):
- Reflect back what they noticed in plain warm words.
- Suggest ONE specific 5-minute video angle for tomorrow related to their spark.
- "Spark #1 saved. See you tomorrow."`,

    B: `All sparks share ONE niche. Praise the focus.
Required shape (4 lines):
- "Your sparks are calling it — [niche name in 2-4 words]. That is your niche showing up. Not picked, discovered."
- "From tomorrow every spark should serve this lane. Depth before breadth. This is how experts are built."
- ONE specific 5-minute video suggestion that goes deeper in the lane.
- "Spark #[N] saved."
FORBIDDEN words: "scattered", "spreading thin", "different topics", "open Sparks tab to choose".`,

    B_soft: `Sparks lean toward ONE main lane with a side-theme. Praise the main lane, gently flag the side-theme.
Required shape (4 lines):
- "Most of your sparks point to [main niche]. That is your lane forming."
- "One spark touched [side niche] — fine to explore, but next 7 days, stay in [main niche] to go deeper."
- ONE specific 5-minute video suggestion in the main lane.
- "Spark #[N] saved."`,

    C: `Sparks are in DIFFERENT niches with only 2-3 total. Gentle redirect.
Required shape (4 lines):
- "Yesterday was [yesterday's spark in plain words]. Today is [today's spark in plain words]. Both are great, but they live in different niches."
- "We have 45 to 90 minutes a day to chase one thing. The fastest path to your first sale is ONE lane, not two."
- "Open your Sparks tab. Read both. Which one made you feel more alive? Come back to that one tomorrow."
- "Spark #[N] saved."
FORBIDDEN: combining the two topics into one niche. They are different lanes — say so.`,

    D: `Sparks are SCATTERED across 3+ different industries. Honest call-out, soft framing.
Required shape (5 lines):
- "In [N] sparks you have written about [K] different niches: [list each industry separated by commas]."
- Quote 3 of the actual spark lines as evidence.
- "Spreading thin keeps you a beginner in each one. Experts are built by going deep in ONE lane."
- "Open your Sparks tab. Read every spark again. Which one still excites you most? Tomorrow, come back to that one."
- "Spark #[N] saved."`,

    E: `Sparks are CONVERGING on ONE niche over 4+ days. Member is winning. Confident energizing tone.
Required shape (4 lines):
- "Your sparks are calling it — [niche name in 2-4 words]. That is your niche showing up. Not picked, discovered."
- "From tomorrow every spark should serve this lane. Depth before breadth."
- ONE specific 5-minute video suggestion that goes deeper in that lane.
- "Spark #[N] saved."
FORBIDDEN: "scattered", "spreading thin", "different topics", "open Sparks tab to choose".`
  };
  return templates[mode] || templates.A;
}

const REPLY_SYSTEM = `You are the AI Coach for a UOM member building an online business with 45-90 min per day.

Hard rules (apply to every reply):
1. Polite. Soft. Kind. Never punish. Never criticize.
2. Frame focus as a BENEFIT (faster expert, first sale sooner) — never as obedience.
3. End with one specific micro-action they can do tomorrow.
4. 5th grade reading level. No jargon. No "amazing" or "wow".
5. Maximum 100 words. Plain text. One blank line between paragraphs.
6. Output ONLY the coach reply. No preamble. No labels.

Below is the EXACT shape and tone for today's reply. Follow it precisely.`;

app.post('/api/spark-reflect', async (req, res) => {
  try {
    const sparks = (req.body && req.body.sparks) || null;
    const line = (req.body && req.body.line) || '';
    if (!OPENAI_API_KEY) return res.status(500).json({ error: 'AI not configured' });

    // Build the list of spark text in ORDER MOST-RECENT-FIRST
    let sparkObjs = [];
    if (Array.isArray(sparks) && sparks.length > 0) {
      sparkObjs = sparks.slice(0, 30).map(s => ({
        line: (typeof s === 'string' ? s : (s.line || '')).trim(),
        day: typeof s === 'object' ? s.day : null
      })).filter(s => s.line);
    } else if (line && line.trim()) {
      sparkObjs = [{ line: line.trim(), day: null }];
    } else {
      return res.status(400).json({ error: 'Spark required' });
    }

    const N = sparkObjs.length;

    // STEP 1: classify each spark's industry
    let industries = [];
    try {
      industries = await classifySparks(sparkObjs.map(s => s.line));
    } catch (e) {
      console.error('classify error:', e.message);
      return res.status(502).json({ error: 'AI classify busy. Try again.' });
    }
    const uniqueIndustries = [...new Set(industries.map(s => s.toLowerCase().trim()).filter(Boolean))];
    const K = uniqueIndustries.length;

    // STEP 2: pick mode
    const mode = pickMode(N, K);
    const template = modeTemplate(mode);

    // STEP 3: build the context block for the reply
    const sparkBlock = sparkObjs.map((s, i) => {
      const tag = (i === 0 ? 'TODAY' : (s.day ? 'Day ' + s.day : '#' + (i + 1)));
      const industry = industries[i] || 'unknown';
      return `  [${tag} | industry: ${industry}] ${s.line}`;
    }).join('\n');

    const userPayload = `Member spark history (most recent first):
${sparkBlock}

Stats: N=${N} (total sparks), K=${K} (distinct industries: ${uniqueIndustries.join(', ')})

Mode you must use: ${mode}

Mode template:
${template}

Now write the coach's reply, following the template's required shape exactly.`;

    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: REPLY_SYSTEM },
          { role: 'user', content: userPayload }
        ],
        max_tokens: 280,
        temperature: 0.5
      })
    });

// ============================================================
// SPARK EXPLORER — turn one spark into 40 content ideas
// ============================================================
const EXPLORE_PROMPT = `You are a content strategist for a Facebook creator who is building an online business through the Ultimate Online Mastery program.

The creator just saved this curiosity (their Daily Spark):
"[USER_SPARK]"

Generate 40 content ideas around this exact topic. Each idea must be a complete post topic the creator could write — not a generic prompt.

Organize into 4 categories of 10 ideas each:

1. quickWins (10) — posts they can write TODAY without any research. Universal truths, simple observations, lessons most people already agree with.
2. researchAngles (10) — questions they can answer in 10-15 minutes of YouTube or Google research. "How does X work" or "What is X" type posts.
3. comparisons (10) — X vs Y posts. Tool comparisons, approach comparisons, before/after, old way vs new way.
4. opinions (10) — controversial or bold-take questions. The ones that drive comments and arguments.

Hard rules for each idea:
- ONE line, 5-12 words maximum
- 5th-grade reading level — no jargon
- Specific to the spark topic — never generic
- No hashtags, no emojis, no quotation marks, no labels
- Each is a clear post-able TOPIC, not a question to the creator

Output ONLY valid JSON in this exact shape:
{
  "quickWins": ["idea 1", "idea 2", ...],
  "researchAngles": [...],
  "comparisons": [...],
  "opinions": [...]
}`;

app.post('/api/spark-explore', async (req, res) => {
  try {
    const spark = ((req.body && req.body.spark) || '').trim();
    if (!spark || spark.length < 3) return res.status(400).json({ error: 'Spark required' });
    if (spark.length > 1000) return res.status(400).json({ error: 'Spark too long' });
    if (!OPENAI_API_KEY) return res.status(500).json({ error: 'AI not configured' });

    const prompt = EXPLORE_PROMPT.replace('[USER_SPARK]', spark);
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: spark }
        ],
        max_tokens: 1600,
        temperature: 0.85,
        response_format: { type: 'json_object' }
      })
    });
    const data = await r.json();
    if (!r.ok) return res.status(502).json({ error: (data.error && data.error.message) || 'AI busy. Retry in 5s.' });

    const content = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '{}';
    let ideas;
    try { ideas = JSON.parse(content); } catch (_) { return res.status(500).json({ error: 'AI returned invalid format. Try again.' }); }

    // Validate shape
    const required = ['quickWins', 'researchAngles', 'comparisons', 'opinions'];
    for (const k of required) {
      if (!Array.isArray(ideas[k])) ideas[k] = [];
    }
    res.json({ ideas });
  } catch (e) {
    console.error('spark-explore error:', e.message);
    res.status(500).json({ error: e.message });
  }
});


// ============================================================
// SPARK IDEA → POST DRAFT (one tap expand)
// ============================================================
const IDEA_TO_POST_PROMPT = `You are a Facebook post writer for a beginner creator in the UOM program.

You will be given a SHORT post topic. Expand it into a complete Facebook post using the PEEL framework (Point, Evidence, Explain, Link).

Hard rules:
- Output ONLY the finished post. No preamble, no quotes, no labels.
- Maximum 5 short lines. One blank line between each.
- 5th-grade reading level. No jargon.
- Universal truths only. Never fabricate personal claims.
- End with a question that invites a comment.
- No emojis. No hashtags. No links.`;

app.post('/api/spark-to-post', async (req, res) => {
  try {
    const idea = ((req.body && req.body.idea) || '').trim();
    if (!idea) return res.status(400).json({ error: 'Idea required' });
    if (idea.length > 500) return res.status(400).json({ error: 'Idea too long' });
    if (!OPENAI_API_KEY) return res.status(500).json({ error: 'AI not configured' });

    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: IDEA_TO_POST_PROMPT },
          { role: 'user', content: idea }
        ],
        max_tokens: 300,
        temperature: 0.75
      })
    });
    const data = await r.json();
    if (!r.ok) return res.status(502).json({ error: (data.error && data.error.message) || 'AI busy' });
    res.json({ post: ((data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '').trim() });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


// ============================================================
// PERSONAL POST GENERATOR — every member gets a unique post,
// drawn from their sparks + the day's framework hint.
// ============================================================
const PERSONAL_POST_PROMPT = `You are a Facebook post writer for a member of the Ultimate Online Mastery program.

You will be given:
1. The member's recent learnings (their Daily Sparks — what they have been curious about)
2. The day's FRAMEWORK HINT — the style/angle of post they should publish today
3. A random variation seed so every member gets a different post

Write ONE Facebook post that:
- Uses the framework hint as the structure/angle
- Pulls from the member's actual recent learnings (use their words when possible — do NOT invent topics they have not mentioned)
- If they have no sparks yet, write a universal-truth post that hints at the framework angle but mentions no specific topic
- Is 4 to 6 short lines, one blank line between each
- 5th-grade reading level — no jargon
- Never fabricates a personal claim (no "I quit my job", no "Last year I made $X") unless it is supported by their sparks
- Ends with ONE question that invites a comment
- No emojis, no hashtags, no links

Output ONLY the finished post. No preamble. No quotation marks. No labels.`;

app.post('/api/personal-post', async (req, res) => {
  try {
    const { day, frameworkHint, sparks, displayName, seed } = req.body || {};
    if (!OPENAI_API_KEY) return res.status(500).json({ error: 'AI not configured.' });
    if (!frameworkHint) return res.status(400).json({ error: 'frameworkHint required' });

    const sparkLines = Array.isArray(sparks) ? sparks.slice(0, 10) : [];
    const sparkBlock = sparkLines.length
      ? sparkLines.map((s, i) => `  ${i + 1}. ${s}`).join('\n')
      : '  (none yet — this is an early-day member)';

    const userMessage = `Day in journey: ${day || 'Bronze'}
Member name: ${displayName || 'a UOM member'}
Variation seed: ${seed || Math.floor(Math.random() * 100000)}

FRAMEWORK HINT for today:
${frameworkHint}

MEMBER'S RECENT LEARNINGS (most recent first):
${sparkBlock}

Write the post now. Make it unique to this member based on their learnings above. If they have no learnings yet, write a universal-truth version that matches the framework hint but mentions no specific topic.`;

    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: PERSONAL_POST_PROMPT },
          { role: 'user', content: userMessage }
        ],
        max_tokens: 350,
        temperature: 0.95,
        top_p: 0.95,
        frequency_penalty: 0.4,
        presence_penalty: 0.3
      })
    });
    const data = await r.json();
    if (!r.ok) return res.status(502).json({ error: (data.error && data.error.message) || 'AI busy. Try again.' });
    const post = ((data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '').trim();
    res.json({ post });
  } catch (e) {
    console.error('personal-post error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ============================================================
// OPENAI POLISH PROXY
// ============================================================
const POLISH_PROMPT = `You are a Facebook post editor for beginner creators in the Ultimate Online Mastery program.

Your job: take the user's pasted text (often from YouTube transcripts, viral posts, or rough ideas) and rewrite it as a clean Facebook post using the PEEL framework (Point, Evidence, Explain, Link).

Hard rules:
- Output ONLY the rewritten post. No preamble, no quotes, no "Here is your post:".
- Maximum 5 short lines. One blank line between each.
- 5th-grade reading level. No jargon.
- Universal truths only. NEVER fabricate a personal claim the user hasn't established.
- End with a question that invites a comment.
- No emojis unless source text had them. No hashtags.`;

app.post('/api/polish', async (req, res) => {
  try {
    const text = (req.body && req.body.text) || '';
    if (typeof text !== 'string' || !text.trim()) return res.status(400).json({ error: 'Paste something first.' });
    if (text.length > 4000) return res.status(400).json({ error: 'Too long. Under 4000 characters.' });
    if (!OPENAI_API_KEY) return res.status(500).json({ error: 'AI not configured.' });

    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'system', content: POLISH_PROMPT }, { role: 'user', content: text.trim() }],
        max_tokens: 300, temperature: 0.7
      })
    });
    const data = await r.json();
    if (!r.ok) return res.status(502).json({ error: (data.error && data.error.message) || 'AI busy. Retry in 5s.' });
    res.json({ polished: (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content || '').trim() });
  } catch (e) {
    res.status(500).json({ error: 'Server error: ' + e.message });
  }
});

// ============================================================
// STATIC FRONTEND
// ============================================================
app.use(express.static(path.join(__dirname, 'public'), {
  extensions: ['html'],
  setHeaders: (res, filePath) => { if (filePath.endsWith('.html')) res.setHeader('Cache-Control', 'no-cache'); }
}));

app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Not found' });
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`UOM AI Coach v2.2 on :${PORT}`);
  console.log(`Supabase: ${SUPABASE_URL ? 'OK' : 'MISSING'}  |  AdminClient: ${sbAdmin ? 'OK' : 'MISSING'}  |  Resend: ${RESEND_API_KEY ? 'OK' : 'MISSING'}  |  OpenAI: ${OPENAI_API_KEY ? 'OK' : 'MISSING'}`);
});
