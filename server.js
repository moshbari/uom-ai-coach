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
// SPARK REFLECTION — AI mirror for the Daily Spark
// ============================================================
const SPARK_PROMPT = `You are an encouraging coach for a member of the Ultimate Online Mastery (UOM) program who is building a daily creator habit.

Each day, the member writes ONE line about what they learned and what they want to know more about. This is called a Daily Spark. After 14 sparks, the topic that shows up most becomes their content niche.

The member just wrote this Spark:
"[USER_SPARK]"

This is spark #[SPARK_COUNT] in their log.

Write a 4-line response. Each line is short and on its own (one blank line between each). Be SPECIFIC to what they wrote — do not be generic. Do not lecture.

LINE 1: Reflect back what they noticed and tell them what it shows about them (their creator instinct). Be warm, not over-the-top.

LINE 2: Connect it to a bigger pattern — what kind of niche or angle this could become if it keeps showing up.

LINE 3: ONE specific micro-action they could take tomorrow (5-7 minutes max). Concrete and doable. Not "explore more."

LINE 4: A short identity-affirming closer that mentions their spark count and makes them want to come back tomorrow.

Hard rules:
- 5th grade reading level
- No emojis
- Never start with "Great" or "Amazing" or "Wow"
- Sound like a wise friend, not a corporate motivator
- Specific to THEIR words — never generic
- Maximum 70 words total across all 4 lines
- Output ONLY the 4 lines. No preamble, no labels.`;

app.post('/api/spark-reflect', async (req, res) => {
  try {
    const line = (req.body && req.body.line) || '';
    const count = parseInt((req.body && req.body.count) || 1, 10);
    if (typeof line !== 'string' || !line.trim()) return res.status(400).json({ error: 'Spark required' });
    if (line.length > 1000) return res.status(400).json({ error: 'Too long' });
    if (!OPENAI_API_KEY) return res.status(500).json({ error: 'AI not configured' });

    const prompt = SPARK_PROMPT.replace('[USER_SPARK]', line.trim()).replace('[SPARK_COUNT]', count);
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: line.trim() }
        ],
        max_tokens: 200,
        temperature: 0.8
      })
    });
    const data = await r.json();
    if (!r.ok) return res.status(502).json({ error: (data.error && data.error.message) || 'AI busy' });
    res.json({ reflection: (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content || '').trim() });
  } catch (e) {
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
