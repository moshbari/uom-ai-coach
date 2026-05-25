// UOM AI Coach — frontend logic with Supabase backend (v2.1: magic link + settings)
(function(){
  'use strict';

  const C = window.UOM_CONFIG || {};
  if (!C.supabaseUrl || !C.supabaseAnonKey) {
    document.getElementById('loading').innerHTML =
      '<div style="text-align:center;color:#C56B5C;padding:20px;">Configuration missing. Contact admin.</div>';
    return;
  }
  const sb = window.supabase.createClient(C.supabaseUrl, C.supabaseAnonKey, {
    auth: { persistSession: true, detectSessionInUrl: true, autoRefreshToken: true }
  });
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => document.querySelectorAll(s);

  // ============================================================
  // TIER + TASK DATA
  // ============================================================
  const TIERS = [
    { id:'bronze',   name:'Bronze',   icon:'🟫', color:'#CD7F32', desc:'14-day starter ladder. Build the daily habit. End with your first 7 posts.' },
    { id:'silver',   name:'Silver',   icon:'⚪', color:'#C0C0C0', desc:'Image posts. Add a picture to your words.' },
    { id:'gold',     name:'Gold',     icon:'🟡', color:'#FFD700', desc:'Threads. A short story across 5 posts.' },
    { id:'platinum', name:'Platinum', icon:'🔘', color:'#E5E4E2', desc:'Voice videos. No face — just your voice + text on screen.' },
    { id:'diamond',  name:'Diamond',  icon:'💎', color:'#B9F2FF', desc:'Face or AI avatar videos. The big leap.' },
    { id:'crown',    name:'Crown',    icon:'👑', color:'#C9A961', desc:'$1,000 in real commissions earned through UOM.' }
  ];

  const BRONZE = [
    { day:1, title:"Save 1 viral post in your niche", time:"⏱ 90 sec",
      why:"This is the seed for tomorrow. One tiny action your brain cannot refuse.",
      source:"<b>SOURCE:</b> BJ Fogg, Tiny Habits (Stanford, 2019).",
      steps:["Open Facebook on your phone","Scroll until ONE post stops you","Tap Save"],
      type:"action", badge:null,
      subtasks: [ { id:"save", label:"Save 1 viral post", goal:1 } ],
    },
    { day:2, title:"First viral thread + 3 Comment Squad comments", time:"⏱ 20 min",
      why:"By tonight you have content live + a strategic comment on a big post. Both ship same day.",
      source:"<b>SOURCE:</b> RANT Squad + Viral Thread Publisher + Comment Squad (Gary Vee $1.80 Strategy).",
      steps:[
        "Open RANT Squad → paste a viral video URL → activate agents → rant script appears",
        "Click Viral Thread Publisher → 1 click → copy → post to Facebook",
        "Activate Comment Squad on 3 big posts (1000+ likes) in your niche → post each comment"
      ],
      type:"action", badge:null,
      subtasks: [ { id:"thread", label:"Viral thread shipped", goal:1 }, { id:"comments", label:"Comment Squad comments", goal:3 } ],
      devrantTool:{ route:"/laboratory", label:"Open RANT Squad" }
    },
    { day:3, title:"First viral post + 7 Comment Squad comments", time:"⏱ 28 min",
      why:"Volume climbs fast. 7 borrowed-audience comments + 2 pieces of your own = 10 reach moments today.",
      source:"<b>SOURCE:</b> Viral Post Creator (Miner, Judge, Baiter, Director, Cleaner) + Comment Squad.",
      steps:[
        "Repeat Day 2 — rant script + viral thread → post",
        "Open Viral Post Creator → 5 agents → viral post → post to Facebook",
        "Activate Comment Squad on 7 big posts in your niche → post each comment"
      ],
      type:"action", badge:null,
      subtasks: [ { id:"thread", label:"Viral thread shipped", goal:1 }, { id:"post", label:"Viral post shipped", goal:1 }, { id:"comments", label:"Comment Squad comments", goal:7 } ],
      devrantTool:{ route:"/laboratory", label:"Open Viral Post Creator" }
    },
    { day:4, title:"Full flow + 8 Comment Squad comments (18 total — 🎉 First Wave)", time:"⏱ 35 min",
      why:"Daily rhythm set: 2 posts of your own + 8 strategic comments. 18 comments cumulative — First Wave.",
      source:"<b>SOURCE:</b> Gary Vee $1.80 Strategy + Comment Squad (7 agents).",
      steps:[
        "Run the full rant → thread → viral post flow — ship 2 pieces",
        "Find 8 BIG posts (1000+ likes) in your niche",
        "Activate Comment Squad on each → post each comment"
      ],
      type:"action", badge:"🎉 First Wave — Day 4", badge_key:"first_wave",
      subtasks: [ { id:"thread", label:"Viral thread shipped", goal:1 }, { id:"post", label:"Viral post shipped", goal:1 }, { id:"comments", label:"Comment Squad comments", goal:8 } ],
      devrantTool:{ route:"/laboratory", label:"Open Comment Squad" }
    },
    { day:5, title:"Full flow + 8 comments + first thinking task", time:"⏱ 40 min",
      why:"AI saved you hours today. Use one of those hours to study what is working.",
      source:"<b>SOURCE:</b> Cal Newport, Deep Work (2016) — saved time is the real prize.",
      steps:[
        "Ship 2 pieces of content (rant → thread + viral post)",
        "8 Comment Squad comments on big posts",
        "THINKING TASK: open the top 10 viral posts in your niche today. Write 1 line in Daily Spark about what they have in common."
      ],
      type:"action", badge:null,
      subtasks: [ { id:"thread", label:"Viral thread shipped", goal:1 }, { id:"post", label:"Viral post shipped", goal:1 }, { id:"comments", label:"Comment Squad comments", goal:8 }, { id:"thinking", label:"Thinking task: study top 10 viral posts", goal:1 } ],
      devrantTool:{ route:"/laboratory", label:"Open RANT Squad" }
    },
    { day:6, title:"Clip Maker — 3 clips + 10 Comment Squad comments", time:"⏱ 45 min",
      why:"You still do not need your face. Clip Maker agents find the viral moments inside long videos for you.",
      source:"<b>SOURCE:</b> Clip Maker (4 agents: The Scanner, The Viral Hunter, The Editor, The Scorer).",
      steps:[
        "Pick a 10+ min YouTube video from a creator in your niche",
        "Open Clip Maker → paste URL → activate 4 agents → 3 viral clips. Post the best",
        "10 Comment Squad comments + update profile photo + 1-line bio"
      ],
      type:"video", badge:null,
      subtasks: [ { id:"clip", label:"Clip Maker session", goal:1 }, { id:"profile", label:"Profile photo + 1-line bio", goal:1 }, { id:"comments", label:"Comment Squad comments", goal:10 } ],
      devrantTool:{ route:"/clip-maker", label:"Open Clip Maker" }
    },
    { day:7, title:"Pinned welcome + Clip Maker #2 + 14 comments (50 total — 🎉 Week 1 Done)", time:"⏱ 55 min",
      why:"End of Week 1. You just crossed 50 Comment Squad comments. Your profile sells you. Your daily content + comments habit is alive.",
      source:"<b>SOURCE:</b> Phillippa Lally, UCL European Journal of Social Psychology (2009).",
      steps:[
        "Copy the welcome post below → post → pin to top of your profile",
        "Clip Maker run #2 on a different long video → post the best clip",
        "14 Comment Squad comments on big posts (this push puts you at 50 cumulative)"
      ],
      type:"posting", badge:"🎉 Week 1 Done — Day 7", badge_key:"week_1_done",
      subtasks: [ { id:"welcome", label:"Pin the welcome post", goal:1 }, { id:"clip", label:"Clip Maker session #2", goal:1 }, { id:"comments", label:"Comment Squad comments", goal:14 } ],
      frameworkHint:"An HONEST WELCOME pinned post. Style: Dan Koe contrarian opener ('Most people scroll all day and remember nothing — I am trying something different'). Mention the member has been shipping content with AI agents for a week. End with an inviting question.",
      safetyNote:"✓ Honest — every Day 7 member has actually shipped 15+ pieces. Safe.",
      devrantTool:{ route:"/clip-maker", label:"Open Clip Maker" }
    },
    { day:8, title:"Two Clip Maker sessions + 10 comments + thinking (60 cumulative)", time:"⏱ 60 min",
      why:"You have a rhythm now. Volume + reflection beats either alone. Comments stay constant.",
      source:"<b>SOURCE:</b> Teresa Amabile, The Progress Principle (HBR Press, 2011).",
      steps:[
        "Morning Clip Maker (3 clips) — post one, schedule the others",
        "Evening Clip Maker on a different video (3 clips) + 10 Comment Squad comments",
        "THINKING TASK: write 1 line in Daily Spark — which hook style worked best for YOUR clips this week?"
      ],
      type:"video", badge:null,
      subtasks: [ { id:"clip1", label:"Morning Clip Maker session", goal:1 }, { id:"clip2", label:"Evening Clip Maker session", goal:1 }, { id:"comments", label:"Comment Squad comments", goal:10 }, { id:"thinking", label:"Thinking task: best hook style", goal:1 } ],
      devrantTool:{ route:"/clip-maker", label:"Open Clip Maker" }
    },
    { day:9, title:"FIRST Audio Rant + 8 Comment Squad comments", time:"⏱ 65 min",
      why:"Audio Rant needs no face, no avatar, no editing skill. Just your voice + a viral video.",
      source:"<b>SOURCE:</b> Mel Robbins early Instagram audio method + Audio Rant agents.",
      steps:[
        "Pick a viral video in your niche",
        "Open Audio Rant → paste URL → record your 60-sec audio reaction → download → post to Reels",
        "8 Comment Squad comments on big posts"
      ],
      type:"video", badge:null,
      subtasks: [ { id:"audio", label:"Audio Rant recorded + posted", goal:1 }, { id:"comments", label:"Comment Squad comments", goal:8 } ],
      devrantTool:{ route:"/audio-rant", label:"Open Audio Rant" }
    },
    { day:10, title:"Batch 2 Audio Rants + 8 comments + thinking", time:"⏱ 70 min",
      why:"One sitting = 2 days of audio content scheduled. This is how solo creators sustain volume.",
      source:"<b>SOURCE:</b> Dan Koe — batch creation principle (2-Hour Writer).",
      steps:[
        "Pick 2 viral videos → 2 Audio Rants in one sitting → schedule for tomorrow + day after",
        "8 Comment Squad comments on big posts",
        "THINKING TASK: what ONE niche pattern have you spotted this week? Write in Daily Spark."
      ],
      type:"video", badge:null,
      subtasks: [ { id:"audio1", label:"Audio Rant #1", goal:1 }, { id:"audio2", label:"Audio Rant #2", goal:1 }, { id:"comments", label:"Comment Squad comments", goal:8 }, { id:"thinking", label:"Thinking task: niche pattern this week", goal:1 } ],
      devrantTool:{ route:"/audio-rant", label:"Open Audio Rant" }
    },
    { day:11, title:"Editor → Single Reaction + 8 comments", time:"⏱ 80 min",
      why:"First reaction video with your face (or your HeyGen avatar). One source, one continuous reaction.",
      source:"<b>SOURCE:</b> Editor → Single Reaction tab.",
      steps:[
        "Open Editor → click SINGLE REACTION tab (2nd tab from left)",
        "Paste source video URL → record (face or HeyGen avatar) → export → post to Reels",
        "8 Comment Squad comments on big posts"
      ],
      type:"video", badge:null,
      subtasks: [ { id:"video", label:"Single Reaction video", goal:1 }, { id:"comments", label:"Comment Squad comments", goal:8 } ],
      devrantTool:{ route:"/video-editor", label:"Open Editor (Single Reaction)" }
    },
    { day:12, title:"Editor → Split React + 8 comments", time:"⏱ 80 min",
      why:"Split-screen format is polished and easy to follow. People stay longer.",
      source:"<b>SOURCE:</b> Editor → Split React tab.",
      steps:[
        "Open Editor → click SPLIT REACT tab (3rd tab from left)",
        "Pick layout (face big OR video big) → paste source video → record yourself watching → export → post",
        "8 Comment Squad comments on big posts"
      ],
      type:"video", badge:null,
      subtasks: [ { id:"video", label:"Split React video", goal:1 }, { id:"comments", label:"Comment Squad comments", goal:8 } ],
      devrantTool:{ route:"/video-editor", label:"Open Editor (Split React)" }
    },
    { day:13, title:"Editor → Multi-clip + 10 comments (🎉 100 crossed!) + thinking", time:"⏱ 85 min",
      why:"Stitch your best Clip Maker outputs with short reactions between. HeyGen-cost-saving move: 1 avatar video → many reaction videos via clipping. Today you also cross 100 Comment Squad comments shipped.",
      source:"<b>SOURCE:</b> Editor → Multi-clip tab.",
      steps:[
        "Open Editor → click MULTI-CLIP tab (1st tab from left)",
        "Import 3 of your best Clip Maker outputs → record short reactions between them → export → post",
        "10 Comment Squad comments (🎉 you crossed 100 total!) + THINKING TASK in Daily Spark: of everything you posted this week, what got the best response? Why?"
      ],
      type:"video", badge:null,
      subtasks: [ { id:"video", label:"Multi-clip reaction video", goal:1 }, { id:"comments", label:"Comment Squad comments", goal:10 }, { id:"thinking", label:"Thinking task: best response this week", goal:1 } ],
      devrantTool:{ route:"/video-editor", label:"Open Editor (Multi-clip)" }
    },
    { day:14, title:"⚡ Identity Shift — graduation post + 10 comments + Week 2 plan", time:"⏱ 80 min",
      why:"Day 14 is the quitter cliff. You crossed it with 50+ pieces of content shipped, 110+ strategic Comment Squad comments, and a working creator pipeline.",
      source:"<b>SOURCE:</b> Phillippa Lally (UCL, 2009) — Day 14 is the habit-formation inflection point.",
      steps:[
        "Run your honest 14-day reflection through RANT Squad → post it",
        "10 Comment Squad comments on big posts (final total: 112+)",
        "Look at your 14-day output — pick top 3 winners → write 1 line in Daily Spark: 'Week 2 I will do more of ___'"
      ],
      type:"posting", badge:"🎉 IDENTITY SHIFT — Day 14", badge_key:"identity_shift",
      subtasks: [ { id:"reflection", label:"Graduation reflection post", goal:1 }, { id:"comments", label:"Comment Squad comments", goal:10 }, { id:"week2", label:"Week 2 plan in Spark Log", goal:1 } ],
      frameworkHint:"AN HONEST 14-DAY REFLECTION. Member has shipped 50+ pieces of content using AI agents (RANT Squad, Comment Squad, Clip Maker, Audio Rant, Editor) and left 110+ strategic comments. The real win is the consistency. End with a question about what the reader would commit to.",
      safetyNote:"✓ Honest — every Day 14 member earned this.",
      devrantTool:{ route:"/laboratory", label:"Open RANT Squad" }
    }
  ];


  // ============================================================
  // VISUAL HELPERS — phase colors, day icons, progress trail
  // ============================================================
  const ICONS = {
    save:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>',
    comment: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    profile: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21v-2a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v2"/></svg>',
    pin:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20"/><circle cx="12" cy="9" r="6"/></svg>',
    pen:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>',
    crown:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 17h20l-2-9-4 4-4-7-4 7-4-4-2 9z"/></svg>',
    quill:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>'
  };

  function phaseForDay(day) {
    if (!day) return { name: 'foundation', label: 'TEXT' };
    if ([4, 7, 14].includes(day)) return { name: 'milestone', label: 'MILESTONE' };
    if (day <= 5)  return { name: 'foundation', label: 'TEXT' };
    if (day <= 8)  return { name: 'build',      label: 'CLIPS' };
    if (day <= 10) return { name: 'audio',      label: 'AUDIO' };
    return                  { name: 'create',     label: 'VIDEO' };
  }

  function iconForTask(task) {
    if (!task) return ICONS.save;
    const day = task.day;
    if (day === 14) return ICONS.crown;
    if (day === 1) return ICONS.save;
    if (day === 7) return ICONS.pin;
    if (day === 9 || day === 10) return ICONS.comment; // audio days — speech bubble icon
    if (task.type === 'video') return ICONS.quill;     // film icon for video Editor days
    if (task.type === 'posting') return ICONS.pen;
    return ICONS.profile; // text-output Days 2-5
  }

  function renderProgressTrail(currentDay) {
    const trail = document.getElementById('progressTrail');
    if (!trail) return;
    const milestones = [4, 7, 14];
    let html = '';
    for (let d = 1; d <= 14; d++) {
      let cls = 'trail-dot';
      if (milestones.includes(d)) cls += ' milestone';
      if (d < currentDay) cls += ' past';
      else if (d === currentDay) cls += ' current';
      html += `<div class="${cls}" title="Day ${d}${milestones.includes(d)?' • milestone':''}"></div>`;
    }
    trail.innerHTML = html;
  }

  // ============================================================
  // THEME — persisted in localStorage
  // ============================================================
  window.setTheme = function(theme) {
    if (theme !== 'light' && theme !== 'dark') theme = 'light';
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('uom_theme', theme); } catch(_) {}
    const lb = document.getElementById('themeLight');
    const db = document.getElementById('themeDark');
    if (lb) lb.classList.toggle('on', theme === 'light');
    if (db) db.classList.toggle('on', theme === 'dark');
  };
  function currentTheme() {
    return document.documentElement.getAttribute('data-theme') || 'light';
  }

  const TASKS = {
    bronze: BRONZE,
    silver: [{ title:"Post a quote image", time:"⏱ 30 min", why:"Image posts reach 3x more people.", source:"<b>SOURCE:</b> Meta's 2024 creator report.", steps:["Open Canva → search 'quote post'","Paste your last winning line into image","Download → post to Facebook"], type:"posting", ready:"[Open Canva, design 1080x1080 with your quote in white on dark background.]", safetyNote:"✓ Your own words. Safe to post." }],
    gold: [{ title:"Post a 5-line thread", time:"⏱ 45 min", why:"Threads keep people in your post longer.", source:"<b>SOURCE:</b> Format from Naval Ravikant on Twitter.", steps:["Write 1 hook + 4 lessons + 1 question","Post as one Facebook post","Pin to top of profile"], type:"posting", ready:"Hook: Most beginners quit at Day 14.\n\n1. They wait to feel ready.\n2. They compare to creators 5 years ahead.\n3. They post once, hear nothing, quit.\n4. They forget — early posts are reps, not rockets.\n\nWhat would YOU do differently?", safetyNote:"✓ Universal observations." }],
    platinum: [{ title:"Record a 60-sec voice video", time:"⏱ 60 min", why:"Voice videos let you practice talking. No face = no fear.", source:"<b>SOURCE:</b> Mel Robbins's early Instagram method.", steps:["Pick your most popular post","CapCut → record audio with emotion","White text on black background → export → Reels"], type:"posting", ready:"[Use your last winning post as the script.]", safetyNote:"✓ Your own voice. Safe to post." }],
    diamond: [{ title:"Record a 60-sec face or AI-avatar video", time:"⏱ 60 min", why:"Face videos build trust fastest. AI avatars work if camera-shy.", source:"<b>SOURCE:</b> Ali Abdaal's early YouTube. HeyGen for avatar.", steps:["Use your Platinum script","Record self or HeyGen avatar","Post to Reels + YouTube Shorts"], type:"posting", ready:"[Use your Platinum script.]", safetyNote:"✓ Your own script." }],
    crown: [{ title:"Log a real commission", time:"⏱ 5 min", why:"Crown is earned, not given.", source:"<b>SOURCE:</b> Your Warrior Plus or Systeme.io dashboard.", steps:["Open Warrior Plus → Reports","Screenshot earnings","Paste total below"], type:"posting", ready:"[Paste total earned. Each $100 = 1 win.]", safetyNote:"✓ Your real data." }]
  };

  const COMMENT_PROMPT = `You are my Facebook comment-writing coach.

I want to leave a comment that adds real value — not the empty "Great post!" kind. People should read my comment and want to know who I am.

I will paste a Facebook post at the bottom. Please do these 7 steps in order:

1. SUMMARY — Sum up the post in 2 plain sentences so I know what it's really saying.

2. POSTER PSYCHOLOGY — What does the poster want to feel after they post this? (Examples: validation, debate, "I am smart," empathy, "I am brave.") Keep it short — 1-2 sentences.

3. SHOULD I COMMENT? — Tell me yes or no and why, in 2 sentences. Say NO if the post is a fake-feel-good post, a sales pitch, or already has 200+ comments where mine would get buried. Say YES if the post is real and I can add something the other comments are missing.

4. QUICK RESEARCH — Give me 1 or 2 real facts, numbers, or named experts on this topic I can reference. Keep it true. If you do not know, say "I do not know — better not to claim."

5. DRAFT — Write a 2-4 line draft comment in plain 5th-grade English. No jargon. No emojis unless the post had them. No starting with "Great post" or "Love this." Sound like a real person who actually thought about this.

6. SELF-CRITIQUE — What is wrong with my draft? Does it sound preachy? Salesy? Off-topic? Too long? Pick the 1-2 biggest issues.

7. FINAL COMMENT — Fix the issues from step 6. Give me the EXACT comment I should post. Just the comment text, nothing else.

Hard rules for the final comment:
- 2-4 short lines maximum
- Adds a thought, a fact, or asks a useful question
- Sounds human, not marketing
- Never starts with "Great post" or "Love this"
- Never plugs my own work or links
- Never argues or insults

Here is the Facebook post:
[PASTE THE POST HERE]`;

  // ============================================================
  // STATE
  // ============================================================
  let state = {
    user: null, profile: null,
    checkin: { time:'', energy:'', mood:'' },
    todayDone: false, sparks: []
  };
  const todayStr = () => new Date().toISOString().slice(0,10);
  const yesterdayStr = () => { const d = new Date(); d.setDate(d.getDate()-1); return d.toISOString().slice(0,10); };

  // ============================================================
  // AUTH — magic link + password + signup
  // ============================================================
  let authMode = 'magic'; // 'magic' | 'login' | 'signup'

  window.switchAuthTab = function(mode) {
    authMode = mode;
    $('#tabMagic').classList.toggle('on', mode==='magic');
    $('#tabLogin').classList.toggle('on', mode==='login');
    $('#tabSignup').classList.toggle('on', mode==='signup');
    $('#nameInput').style.display     = mode==='signup' ? 'block' : 'none';
    $('#passwordInput').style.display = (mode==='login' || mode==='signup') ? 'block' : 'none';
    const labels = { magic:'Send magic link', login:'Sign In', signup:'Create Account' };
    $('#authBtn').textContent = labels[mode];
    const fr = $('#forgotRow'); if (fr) fr.style.display = 'block';
    const err = $('#err'); err.textContent = ''; err.style.color = 'var(--error)';
  };

  window.doAuth = async function() {
    const email = $('#emailInput').value.trim();
    const password = $('#passwordInput').value;
    const name = $('#nameInput').value.trim();
    const err = $('#err');
    err.textContent = ''; err.style.color = 'var(--error)';
    if (!email) { err.textContent = 'Email required.'; return; }

    $('#authBtn').disabled = true;
    const orig = $('#authBtn').textContent;
    $('#authBtn').textContent = '...';
    try {
      if (authMode === 'magic') {
        // Use our custom endpoint (Resend + UOM branding)
        const r = await fetch(C.magicLinkUrl || '/api/auth/magic-link', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || 'Could not send magic link');
        err.style.color = 'var(--sage)';
        err.textContent = 'Magic link sent. Check your email — click the link to sign in.';
      } else if (authMode === 'signup') {
        if (!name) { err.textContent = 'First name required.'; return; }
        if (!password || password.length < 6) { err.textContent = 'Password must be 6+ characters.'; return; }
        const r = await fetch(C.signupUrl || '/api/auth/signup', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, name })
        });
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || 'Could not create account');
        err.style.color = 'var(--sage)';
        err.textContent = 'Account created. Check your email — click the link to finish signing in.';
        switchAuthTab('login');
      } else { // login (password) — bulletproof: fetch tokens, write localStorage, reload
        if (!password) { err.textContent = 'Password required.'; return; }

        // Clear stale state aggressively (any old broken token)
        try { await sb.auth.signOut({ scope: 'local' }); } catch(_) {}

        // Direct call to Supabase token endpoint (350ms typical)
        const tokenResp = await withTimeout(
          fetch(C.supabaseUrl + '/auth/v1/token?grant_type=password', {
            method: 'POST',
            headers: { 'apikey': C.supabaseAnonKey, 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
          }),
          10000,
          'token-endpoint'
        );
        const tokenData = await tokenResp.json();
        if (!tokenResp.ok) {
          throw new Error(tokenData.error_description || tokenData.msg || 'Invalid email or password');
        }

        // Write session directly to localStorage in the format Supabase SDK reads on load.
        // This bypasses setSession() and onAuthStateChange entirely — no race conditions possible.
        const projectRefMatch = (C.supabaseUrl || '').match(/https?:\/\/([^.]+)\./);
        const projectRef = projectRefMatch ? projectRefMatch[1] : '';
        const storageKey = 'sb-' + projectRef + '-auth-token';
        const session = {
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_at: Math.floor(Date.now() / 1000) + (tokenData.expires_in || 3600),
          expires_in: tokenData.expires_in || 3600,
          token_type: 'bearer',
          user: tokenData.user
        };
        try { localStorage.setItem(storageKey, JSON.stringify(session)); } catch(_) {}

        // Show success, then reload so the SDK reads the fresh session cleanly
        err.style.color = 'var(--sage)';
        err.textContent = 'Signed in. Loading your app...';
        setTimeout(() => location.reload(), 400);
        return;
      }
    } catch (e) {
      err.textContent = e.message || 'Sign-in failed.';
    } finally {
      $('#authBtn').disabled = false;
      $('#authBtn').textContent = orig;
    }
  };

  // Forgot password — sends branded reset email via our endpoint
  window.forgotPassword = async function() {
    const email = $('#emailInput').value.trim();
    const err = $('#err');
    err.textContent = ''; err.style.color = 'var(--error)';
    if (!email) { err.textContent = 'Enter your email first, then tap Forgot password.'; return; }
    try {
      const r = await fetch(C.resetUrl || '/api/auth/reset', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await r.json().catch(() => ({}));
      err.style.color = 'var(--sage)';
      err.textContent = 'Reset link sent (if that email has an account). Check your inbox.';
    } catch (e) {
      err.textContent = 'Could not send reset email. Try again.';
    }
  };

  window.signOut = async function() {
    await sb.auth.signOut();
    location.reload();
  };

  // Handle magic link redirect — Supabase SDK auto-detects token in URL
  let inRecoveryFlow = false;
  sb.auth.onAuthStateChange(async (event, session) => {
    if (event === 'PASSWORD_RECOVERY') {
      inRecoveryFlow = true;
      // DO NOT clear hash — SDK needs it
      $('#loading').style.display = 'none';
      $('#login').style.display = 'none';
      $('#app').style.display = 'block';
      const nav = document.querySelector('.nav'); if (nav) nav.style.display = 'none';
      const header = document.querySelector('.header'); if (header) header.style.display = 'none';
      _switchScreen('recovery');
      return;
    }
    // Catch any sign-in style event with a real session
    const signInEvents = ['SIGNED_IN', 'INITIAL_SESSION', 'TOKEN_REFRESHED', 'USER_UPDATED'];
    if (signInEvents.includes(event) && session && session.user && !state.user && !inRecoveryFlow) {
      if (window.location.hash) history.replaceState(null, '', window.location.pathname);
      try { await onSignedIn(); }
      catch (e) { console.error('[UOM] onSignedIn (via event):', e); }
    }
  });

  window.completeRecovery = async function() {
    const pwd = $('#recNewPassword').value;
    const pwd2 = $('#recNewPasswordConfirm').value;
    const err = $('#recoveryErr');
    err.textContent = ''; err.style.color = 'var(--error)';
    if (!pwd || pwd.length < 6) { err.textContent = 'Password must be at least 6 characters.'; return; }
    if (pwd !== pwd2) { err.textContent = 'The two passwords do not match.'; return; }
    const btn = $('#recoverySaveBtn');
    btn.disabled = true; btn.textContent = 'Saving...';

    // Make sure we actually have a session before trying to update password
    let session = null;
    try {
      const r = await withTimeout(sb.auth.getSession(), 4000, 'session-check');
      session = r && r.data && r.data.session;
    } catch (e) {
      console.error('[UOM] session check failed:', e);
    }
    if (!session) {
      err.textContent = 'Your reset session expired. Click the reset link in your email again (or request a fresh one).';
      btn.disabled = false; btn.textContent = 'Set new password and sign in';
      return;
    }

    try {
      const result = await withTimeout(
        sb.auth.updateUser({ password: pwd }),
        8000,
        'updateUser'
      );
      if (result && result.error) throw result.error;
      // Password set — load the app
      inRecoveryFlow = false;
      const nav = document.querySelector('.nav'); if (nav) nav.style.display = '';
      const header = document.querySelector('.header'); if (header) header.style.display = '';
      try { await onSignedIn(); }
      catch (e) {
        // If app load fails, at least show success
        alert('Password saved. Please sign in.');
        location.reload();
      }
    } catch (e) {
      console.error('[UOM] updateUser failed:', e);
      err.textContent = (e && e.message) ? ('Could not save: ' + e.message) : 'Could not save password. Try again.';
      btn.disabled = false; btn.textContent = 'Set new password and sign in';
    }
  };

  async function onSignedIn() {
    try {
      const { data: { user } } = await sb.auth.getUser();
      if (!user) { showLogin(); return; }
      state.user = user;
      await loadProfile();
      await loadTodayState();
      await loadSparks();
      enterApp();
    } catch (e) {
      console.error('[UOM] onSignedIn failed:', e);
      $('#loading').style.display = 'none';
      $('#login').style.display = 'flex';
      const err = $('#err');
      err.style.color = 'var(--error)';
      err.textContent = 'Sign-in error: ' + (e.message || 'unknown') + ' — open console for details.';
      try { await sb.auth.signOut(); } catch(_) {}
    }
  }

  async function loadProfile() {
    const { data, error } = await sb.from('uom_profiles').select('*').eq('id', state.user.id).maybeSingle();
    if (error) console.error('[UOM] profile select error:', error);
    if (data) { state.profile = data; return; }
    // Fallback: profile row missing (trigger may not have fired). Create via UPSERT.
    const seed = {
      id: state.user.id,
      email: state.user.email,
      display_name: (state.user.user_metadata && state.user.user_metadata.display_name) || (state.user.email || 'friend').split('@')[0]
    };
    const { data: up, error: upErr } = await sb.from('uom_profiles').upsert(seed, { onConflict: 'id' }).select().single();
    if (upErr) {
      console.error('[UOM] profile upsert error:', upErr);
      throw new Error('Could not create profile: ' + upErr.message);
    }
    state.profile = up;
  }

  async function loadTodayState() {
    const today = todayStr();
    const { data } = await sb.from('uom_completions')
      .select('id, completed_at').eq('user_id', state.user.id)
      .gte('completed_at', today + 'T00:00:00').limit(1);
    state.todayDone = !!(data && data.length);
    const { data: ci } = await sb.from('uom_checkins')
      .select('time_avail, energy, mood').eq('user_id', state.user.id).eq('date', today).maybeSingle();
    state.checkin = ci ? { time: ci.time_avail || '', energy: ci.energy || '', mood: ci.mood || '' }
                       : { time:'', energy:'', mood:'' };
  }

  async function loadSparks() {
    const { data } = await sb.from('uom_sparks')
      .select('id, day, line, created_at').eq('user_id', state.user.id)
      .order('created_at', { ascending: false }).limit(60);
    state.sparks = data || [];
  }

  // ============================================================
  // ENTER / SHOW
  // ============================================================
  function showLogin() {
    $('#loading').style.display = 'none';
    $('#app').style.display = 'none';
    $('#login').style.display = 'flex';
    switchAuthTab('magic');
  }
  function enterApp() {
    $('#loading').style.display = 'none';
    $('#login').style.display = 'none';
    $('#app').style.display = 'block';
    $('#greetName').textContent = state.profile.display_name || 'friend';
    refreshUI();
    renderSparks();
    if (state.todayDone) showDone();
    else nav('checkin');
    if (state.checkin.time) preselectCheckin();
  }

  function preselectCheckin() {
    ['time','energy','mood'].forEach(q => {
      const v = state.checkin[q]; if (!v) return;
      const btn = document.querySelector(`.opt[data-q="${q}"][data-v="${v}"]`);
      if (btn) {
        btn.parentElement.querySelectorAll('.opt').forEach(b => b.classList.remove('on'));
        btn.classList.add('on');
      }
    });
    const ok = state.checkin.time && state.checkin.energy && state.checkin.mood;
    $('#goBtn').disabled = !ok;
  }

  function refreshUI() {
    const emailEl = document.getElementById('headerEmail');
    if (emailEl && state.user && state.user.email) emailEl.textContent = state.user.email;
    $('#streak').textContent = state.profile.streak || 0;
    const tier = TIERS.find(t => t.id === state.profile.current_tier) || TIERS[0];
    $('#tierChip').textContent = tier.name;
    const dayChip = $('#dayChip');
    if (tier.id === 'bronze') {
      dayChip.textContent = `Day ${state.profile.bronze_day}/14`;
      dayChip.style.display = 'flex';
    } else dayChip.style.display = 'none';
    renderTiers();
  }

  // ============================================================
  // CHECK-IN
  // ============================================================
  document.addEventListener('click', async (e) => {
    const b = e.target.closest('.opt');
    if (!b) return;
    const q = b.getAttribute('data-q');
    const v = b.getAttribute('data-v');
    state.checkin[q] = v;
    b.parentElement.querySelectorAll('.opt').forEach(s => s.classList.remove('on'));
    b.classList.add('on');
    const ok = state.checkin.time && state.checkin.energy && state.checkin.mood;
    $('#goBtn').disabled = !ok;
    if (ok && state.user) {
      await sb.from('uom_checkins').upsert({
        user_id: state.user.id, date: todayStr(),
        time_avail: state.checkin.time, energy: state.checkin.energy, mood: state.checkin.mood
      }, { onConflict: 'user_id,date' });
    }
  });

  // ============================================================
  // TASK RENDER
  // ============================================================
  function currentTier() { return TIERS.find(t => t.id === state.profile.current_tier) || TIERS[0]; }
  function currentTask() {
    const t = currentTier();
    const pool = TASKS[t.id] || [];
    if (t.id === 'bronze') return pool[Math.max(0, Math.min(state.profile.bronze_day - 1, pool.length - 1))];
    return pool[0];
  }



  // ============================================================
  // DEVRANT DEEP LINK — opens the right tool in a new tab
  // ============================================================
  function renderDevrantButton(task) {
    // Remove any existing button first
    const existing = document.getElementById('devrantBtn');
    if (existing) existing.remove();
    if (!task || !task.devrantTool) return;
    const devUrl = (C.devrantUrl || '').replace(/\/+$/, '');
    const route = task.devrantTool.route || '/laboratory';
    const label = task.devrantTool.label || 'Open in RANT Squad';
    const target = devUrl ? (devUrl + route) : null;

    const btn = document.createElement('a');
    btn.id = 'devrantBtn';
    btn.target = '_blank';
    btn.rel = 'noopener noreferrer';
    btn.className = 'devrant-btn';
    btn.innerHTML = '<span style="display:flex;align-items:center;justify-content:center;gap:8px;"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>' + escapeHtml(label) + ' &rarr;</span>';
    if (target) {
      btn.href = target;
    } else {
      btn.removeAttribute('href');
      btn.style.opacity = '0.55';
      btn.style.cursor = 'not-allowed';
      btn.title = 'Admin: set DEVRANT_URL env var to enable this button';
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        alert('RANT Squad URL not configured. Ask your admin to set DEVRANT_URL in Railway env vars.');
      });
    }
    // Insert at top of card, right after the badge banner
    const card = document.querySelector('#s-task .card');
    const badge = document.getElementById('badgeBanner');
    if (card && badge) card.insertBefore(btn, badge.nextSibling);
  }

  // ============================================================
  // PERSONAL POST GENERATION — every member, every time, unique
  // ============================================================
  let _genInFlight = false;
  async function generatePersonalPost(task, opts) {
    const readyEl = $('#readyPost');
    if (!readyEl) return;
    opts = opts || {};
    const force = !!opts.force;

    // Cache key: per-user, per-day, per-day-of-year (so it varies daily)
    const today = todayStr();
    const cacheKey = 'uom_post_' + (state.user && state.user.id) + '_d' + (task.day || 'x') + '_' + today;
    if (!force) {
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          renderGeneratedPost(cached, task);
          return;
        }
      } catch(_) {}
    }

    if (_genInFlight) return;
    _genInFlight = true;
    readyEl.innerHTML = '<div style="text-align:center;color:var(--muted);padding:24px 12px;"><div class="spinner" style="margin-bottom:12px;"></div><div style="font-size:13px;letter-spacing:0.3px;">Writing your unique post from your sparks...</div></div>';
    const wrap = readyEl.parentElement;
    // Hide the copy button while generating
    const copyBtn = wrap && wrap.querySelector('.big-copy'); if (copyBtn) copyBtn.style.display = 'none';

    const recentSparks = (state.sparks || []).slice(0, 10).map(s => s.line);

    try {
      const r = await fetch(C.personalPostUrl || '/api/personal-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          day: task.day,
          frameworkHint: task.frameworkHint,
          sparks: recentSparks,
          displayName: state.profile && state.profile.display_name,
          seed: Math.floor(Math.random() * 1000000)
        })
      });
      const data = await r.json();
      if (!r.ok || !data.post) {
        readyEl.textContent = 'Could not write your post. ' + (data.error || '') + ' Tap "Try another angle" below.';
        if (copyBtn) copyBtn.style.display = '';
        _ensureRegenBtn(task);
        return;
      }
      try { localStorage.setItem(cacheKey, data.post); } catch(_) {}
      renderGeneratedPost(data.post, task);
    } catch (e) {
      readyEl.textContent = 'Network error writing post. Tap "Try another angle" to retry.';
      if (copyBtn) copyBtn.style.display = '';
      _ensureRegenBtn(task);
    } finally {
      _genInFlight = false;
    }
  }

  function renderGeneratedPost(text, task) {
    const readyEl = $('#readyPost');
    readyEl.textContent = text;
    const wrap = readyEl.parentElement;
    const copyBtn = wrap && wrap.querySelector('.big-copy');
    if (copyBtn) copyBtn.style.display = '';
    _ensureRegenBtn(task);
  }

  function _ensureRegenBtn(task) {
    let btn = document.getElementById('regenBtn');
    if (!btn) {
      btn = document.createElement('button');
      btn.id = 'regenBtn';
      btn.type = 'button';
      btn.textContent = '↻ Try another angle';
      btn.style.cssText = 'width:100%;padding:11px;background:transparent;color:var(--gold);border:1px solid var(--gold-deep);border-radius:10px;font-size:12px;font-weight:600;cursor:pointer;letter-spacing:0.3px;margin-bottom:12px;';
      const copyBtn = document.querySelector('#path-a .big-copy');
      if (copyBtn && copyBtn.parentNode) copyBtn.parentNode.insertBefore(btn, copyBtn.nextSibling);
    }
    btn.onclick = async () => {
      btn.disabled = true; btn.textContent = '...';
      // Clear cache so we get a fresh generation
      const today = todayStr();
      const cacheKey = 'uom_post_' + (state.user && state.user.id) + '_d' + (task.day || 'x') + '_' + today;
      try { localStorage.removeItem(cacheKey); } catch(_) {}
      await generatePersonalPost(task, { force: true });
      btn.disabled = false; btn.textContent = '↻ Try another angle';
    };
  }


  // ============================================================
  // SUBTASK CHECKLIST — per-task progress counter, localStorage persisted
  // ============================================================
  function subtaskStorageKey(taskDay) {
    return 'uom_sub_' + ((state.user && state.user.id) || 'anon') + '_d' + (taskDay || 'x') + '_' + todayStr();
  }
  function loadSubtaskProgress(taskDay) {
    try { return JSON.parse(localStorage.getItem(subtaskStorageKey(taskDay)) || '{}'); }
    catch(_) { return {}; }
  }
  function saveSubtaskProgress(taskDay, data) {
    try { localStorage.setItem(subtaskStorageKey(taskDay), JSON.stringify(data)); } catch(_) {}
  }
  function renderSubtasks(task) {
    const card = document.getElementById('subtasksCard');
    const list = document.getElementById('subtasksList');
    if (!card || !list) return;
    const subs = (task && task.subtasks) || [];
    if (!subs.length) { card.style.display = 'none'; return; }
    card.style.display = 'block';
    const progress = loadSubtaskProgress(task.day);
    list.innerHTML = '';
    subs.forEach(sub => {
      const current = Math.min(progress[sub.id] || 0, sub.goal);
      const done = current >= sub.goal;
      const pct = Math.round((current / sub.goal) * 100);
      const row = document.createElement('div');
      row.className = 'subtask-row' + (done ? ' complete' : '');
      const header = document.createElement('div');
      header.style.cssText = 'display:flex;align-items:center;width:100%;';
      header.innerHTML =
        '<div class="subtask-label">' + escapeHtml(sub.label) + '</div>' +
        '<div class="subtask-count ' + (done ? 'done' : '') + '">' + current + ' / ' + sub.goal + (done ? ' &#x2713;' : '') + '</div>';
      row.appendChild(header);
      if (sub.goal <= 14) {
        const dots = document.createElement('div');
        dots.className = 'subtask-dots';
        for (let i = 0; i < sub.goal; i++) {
          const dot = document.createElement('div');
          dot.className = 'subtask-dot' + (i < current ? ' filled' : '');
          dot.title = i < current ? 'Tap again to undo' : 'Tap to mark one done';
          dot.addEventListener('click', () => {
            const p = loadSubtaskProgress(task.day);
            const cur = p[sub.id] || 0;
            const target = (i < cur) ? i : i + 1;
            p[sub.id] = target;
            saveSubtaskProgress(task.day, p);
            renderSubtasks(task);
            updateWinButtonState(task);
          });
          dots.appendChild(dot);
        }
        row.appendChild(dots);
      } else {
        const bar = document.createElement('div');
        bar.className = 'subtask-progress-bar';
        bar.innerHTML = '<div class="subtask-progress-fill" style="width:' + pct + '%;"></div>';
        row.appendChild(bar);
      }
      list.appendChild(row);
    });
  }


  // Win button is gated on subtask completion. No fudging.
  function allSubtasksComplete(task) {
    if (!task || !Array.isArray(task.subtasks) || task.subtasks.length === 0) return true;
    const progress = loadSubtaskProgress(task.day);
    return task.subtasks.every(s => (progress[s.id] || 0) >= s.goal);
  }
  function updateWinButtonState(task) {
    const btn = document.getElementById('winBtn');
    const note = document.getElementById('winNote');
    if (!btn) return;
    if (allSubtasksComplete(task)) {
      btn.disabled = false;
      btn.textContent = 'Another win for a creator';
      if (note) { note.textContent = ''; note.style.display = 'none'; }
    } else {
      btn.disabled = true;
      const subs = task.subtasks || [];
      const progress = loadSubtaskProgress(task.day);
      const remaining = subs.filter(s => (progress[s.id] || 0) < s.goal).length;
      const total = subs.length;
      const done = total - remaining;
      btn.textContent = 'Check the list above first (' + done + '/' + total + ' done)';
      if (note) {
        note.style.display = 'block';
        note.innerHTML = 'You still have <b>' + remaining + '</b> task' + (remaining===1?'':'s') + ' to mark off above before you can claim today as a win. No skipping.';
      }
    }
  }

  function _switchScreen(name) {
    ['checkin','task','done','sparks','tiers','lib','settings','explorer','recovery'].forEach(n => {
      const el = document.getElementById('s-' + n);
      if (el) el.classList.toggle('active', n === name);
    });
    $$('.nav button').forEach(b => b.classList.toggle('on', b.getAttribute('data-nav') === name));
    try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch(_) { window.scrollTo(0,0); }
  }

  window.showTask = function() {
    const t = currentTask();
    const tier = currentTier();
    const pill = $('#dayPill');
    // Phase-aware day pill
    pill.className = 'day-pill';
    if (tier.id === 'bronze' && t.day) {
      const phase = phaseForDay(t.day);
      pill.classList.add('phase-' + phase.name);
      pill.textContent = `DAY ${t.day}/14 — ${phase.label}`;
      renderProgressTrail(t.day);
      document.getElementById('progressTrail').style.display = 'flex';
    } else {
      pill.classList.add('phase-create');
      pill.textContent = tier.name.toUpperCase();
      document.getElementById('progressTrail').style.display = 'none';
    }
    // Task type icon
    const iconEl = document.getElementById('taskIcon');
    if (iconEl) iconEl.innerHTML = iconForTask(t);
    const bb = $('#badgeBanner');
    if (t.badge) { bb.textContent = t.badge; bb.classList.add('show'); } else bb.classList.remove('show');
    $('#tTitle').textContent = t.title;
    $('#tTime').textContent = t.time || '';
    $('#tWhy').textContent = t.why;
    $('#tSource').innerHTML = t.source;
    const ol = $('#tSteps'); ol.innerHTML = '';
    t.steps.forEach(s => { const li = document.createElement('li'); li.textContent = s; ol.appendChild(li); });
    renderSubtasks(t);
    updateWinButtonState(t);
    const pathTabs = $('#pathTabs');
    if (t.type === 'posting') {
      pathTabs.classList.add('show');
      $('#path-a').style.display = 'block'; $('#path-b').style.display = 'none';
      $('#safeBadge').textContent = t.safetyNote || 'Safe to post — written for you, no fake claim.';
      switchPath('a');
      generatePersonalPost(t);
    } else {
      pathTabs.classList.remove('show');
      $('#path-a').style.display = 'none'; $('#path-b').style.display = 'none';
    }
    // Render devrant deep-link button (applies to ANY task that names a devrant tool)
    renderDevrantButton(t);
    $('#sparkLine').value = ''; $('#sparkSaved').classList.remove('show');
    // Phase-aware Daily Spark prompt
    const sparkInput = $('#sparkLine');
    if (sparkInput && t.day) {
      let placeholder;
      if (t.day <= 5)       placeholder = 'What viral post stopped your scroll today? Why did it work?';
      else if (t.day <= 10) placeholder = 'What pattern is working in your niche this week?';
      else                  placeholder = 'What did YOU do that worked? What flopped? What will you change?';
      sparkInput.placeholder = placeholder;
    }
    const _refl = $('#sparkReflection'); if (_refl) _refl.style.display = 'none';
    const _refLoad = $('#reflectionLoading'); if (_refLoad) _refLoad.style.display = 'none';
    $('#tInput').value = ''; $('#tPolished').classList.remove('show');
    // Show Comment Helper only on tasks that involve commenting
    const stepsText = (t.steps || []).join(' ').toLowerCase();
    const showHelper = stepsText.includes('comment');
    const helper = $('#commentHelper');
    if (helper) {
      helper.style.display = showHelper ? 'block' : 'none';
      if (showHelper) $('#commentPrompt').textContent = COMMENT_PROMPT;
      $('#promptCopied').classList.remove('show');
    }
    _switchScreen('task');
  };

  window.switchPath = function(w) {
    $('#pathA').classList.toggle('on', w==='a');
    $('#pathB').classList.toggle('on', w==='b');
    $('#path-a').classList.toggle('on', w==='a');
    $('#path-b').classList.toggle('on', w==='b');
  };

  window.copyReady = function() {
    const text = $('#readyPost').textContent;
    copyString(text);
    alert('Copied. Now open Facebook → "What\'s on your mind?" → paste → Post.');
  };

  window.pasteFromClipboard = async function() {
    try { $('#tInput').value = await navigator.clipboard.readText(); }
    catch(_) { alert('Tap inside the box and press paste on your keyboard.'); }
  };

  window.polish = async function() {
    const text = $('#tInput').value.trim();
    const out = $('#tPolished');
    if (!text) { out.textContent = 'Paste something first.'; out.classList.add('show'); return; }
    $('#polishBtn').disabled = true;
    $('#polishBtn').textContent = 'Polishing...';
    try {
      const r = await fetch(C.polishUrl || '/api/polish', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      const data = await r.json();
      out.textContent = r.ok ? (data.polished || '') : ('AI: ' + (data.error || 'unknown'));
      out.classList.add('show');
    } catch (_) { out.textContent = 'Network error. Try again.'; out.classList.add('show'); }
    finally {
      $('#polishBtn').disabled = false;
      $('#polishBtn').textContent = 'Polish for me';
    }
  };

  function copyString(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
    } else fallbackCopy(text);
  }
  function fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text; document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch(_) {}
    document.body.removeChild(ta);
  }


  window.copyCommentPrompt = function() {
    copyString(COMMENT_PROMPT);
    $('#promptCopied').classList.add('show');
    setTimeout(() => $('#promptCopied').classList.remove('show'), 3000);
  };

  // ============================================================
  // SPARKS
  // ============================================================
  window.saveSpark = async function() {
    const line = $('#sparkLine').value.trim();
    if (!line) { alert('Write ONE line first.'); return; }
    const t = currentTask();
    const day = currentTier().id === 'bronze' && t.day ? t.day : null;
    const { data, error } = await sb.from('uom_sparks').insert({
      user_id: state.user.id, day, line
    }).select().single();
    if (error) { alert('Could not save: ' + error.message); return; }
    state.sparks.unshift(data);
    $('#sparkSaved').classList.add('show');
    renderSparks();

    // Get AI reflection (instant gratification)
    const reflEl = $('#sparkReflection');
    const reflBody = $('#reflectionBody');
    const reflLoading = $('#reflectionLoading');
    if (reflEl && reflBody) {
      reflEl.style.display = 'none';
      reflLoading.style.display = 'block';
      try {
        // Send the FULL spark history (most recent first, today's spark already at index 0)
        // so the AI Coach can detect alignment / divergence / scatter / pattern across days.
        const history = (state.sparks || []).slice(0, 30).map(s => ({
          line: s.line || '',
          day: s.day || null
        }));
        const r = await fetch(C.sparkReflectUrl || '/api/spark-reflect', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sparks: history, line })
        });
        const out = await r.json();
        if (r.ok && out.reflection) {
          reflBody.textContent = out.reflection;
          reflEl.style.display = 'block';
        }
      } catch (_) {}
      reflLoading.style.display = 'none';
    }
  };

  function renderSparks() {
    const list = $('#sparkList');
    if (!list) return;
    list.innerHTML = '';
    if (state.sparks.length === 0) {
      list.innerHTML = '<div class="empty-state">No sparks yet.<br/><br/>Do your task today — save your first spark from the Daily Spark box.</div>';
      return;
    }
    state.sparks.forEach(s => {
      const d = (s.created_at || '').slice(0,10);
      const label = s.day ? `Day ${s.day} · ${d}` : d;
      const item = document.createElement('div');
      item.className = 'spark-log-item';
      item.innerHTML =
        '<div class="day">⚡ ' + escapeHtml(label) + '</div>' +
        '<div class="line">' + escapeHtml(s.line) + '</div>' +
        '<button type="button" class="explore-btn" data-spark="' + encodeURIComponent(s.line) + '">⚡ Explore 40 ideas</button>';
      list.appendChild(item);
    });
    // Wire up explore buttons
    list.querySelectorAll('.explore-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const sparkLine = decodeURIComponent(btn.getAttribute('data-spark') || '');
        if (sparkLine) exploreSpark(sparkLine);
      });
    });
  }

  // ============================================================
  // SPARK EXPLORER
  // ============================================================
  window.exploreSpark = async function(sparkLine) {
    $('#explorerSparkText').textContent = sparkLine;
    $('#explorerResults').innerHTML = '';
    $('#explorerLoading').style.display = 'block';
    _switchScreen('explorer');

    try {
      const r = await fetch(C.sparkExploreUrl || '/api/spark-explore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spark: sparkLine })
      });
      const data = await r.json();
      $('#explorerLoading').style.display = 'none';

      if (!r.ok || !data.ideas) {
        $('#explorerResults').innerHTML = '<div class="empty-state">Could not load ideas. Try again.<br/><br/>' + escapeHtml(data.error || '') + '</div>';
        return;
      }
      renderIdeas(data.ideas, sparkLine);
    } catch (e) {
      $('#explorerLoading').style.display = 'none';
      $('#explorerResults').innerHTML = '<div class="empty-state">Network error. Try again.</div>';
    }
  };

  function renderIdeas(ideas, sparkLine) {
    const box = $('#explorerResults');
    const cats = [
      { key: 'quickWins',       title: '✦ Quick Wins',       desc: 'Post these today. No research needed. Universal truths.' },
      { key: 'researchAngles',  title: '⚡ Research Angles',  desc: '10-15 min of YouTube/Google research. How-to and what-is posts.' },
      { key: 'comparisons',     title: '⚖ Comparisons',       desc: 'X vs Y posts. Comparison content gets shared.' },
      { key: 'opinions',        title: '💬 Opinions',         desc: 'Bold takes that drive comments and debate.' }
    ];
    box.innerHTML = '';
    cats.forEach(cat => {
      const list = ideas[cat.key] || [];
      if (list.length === 0) return;
      const card = document.createElement('div');
      card.className = 'cat-card';
      let inner = '<div class="cat-head"><div class="cat-title">' + cat.title + '</div></div>' +
                  '<div class="cat-desc">' + cat.desc + '</div>';
      list.forEach((idea, i) => {
        const id = cat.key + '_' + i;
        inner +=
          '<div class="idea-row" id="row_' + id + '">' +
          '  <div class="idea-text">' + escapeHtml(idea) + '</div>' +
          '  <button type="button" class="idea-btn" data-idea="' + encodeURIComponent(idea) + '" data-id="' + id + '">Make post</button>' +
          '</div>' +
          '<div class="idea-draft" id="draft_' + id + '"></div>';
      });
      card.innerHTML = inner;
      box.appendChild(card);
    });
    box.querySelectorAll('.idea-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const idea = decodeURIComponent(btn.getAttribute('data-idea') || '');
        const id = btn.getAttribute('data-id');
        await ideaToPost(idea, id, btn);
      });
    });
  }

  async function ideaToPost(idea, id, btn) {
    const draft = document.getElementById('draft_' + id);
    btn.disabled = true; btn.textContent = '...';
    try {
      const r = await fetch(C.sparkToPostUrl || '/api/spark-to-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea })
      });
      const data = await r.json();
      if (!r.ok || !data.post) {
        draft.textContent = 'Could not draft post. ' + (data.error || 'Try again.');
        draft.classList.add('show');
        btn.disabled = false; btn.textContent = 'Make post';
        return;
      }
      const postText = data.post;
      draft.innerHTML =
        escapeHtml(postText).replace(/\n/g, '<br/>') +
        '<div class="draft-actions">' +
        '<button type="button" class="copy-this">Copy this post</button>' +
        '<button type="button" class="redo-this">Try again</button>' +
        '</div>';
      draft.classList.add('show');
      btn.classList.add('done');
      btn.textContent = '✓ Drafted';
      btn.disabled = false;
      draft.querySelector('.copy-this').addEventListener('click', () => {
        copyString(postText);
        alert('Copied. Open Facebook → "What\'s on your mind?" → paste → Post.');
      });
      draft.querySelector('.redo-this').addEventListener('click', async () => {
        draft.classList.remove('show');
        btn.classList.remove('done');
        btn.textContent = 'Make post';
        await ideaToPost(idea, id, btn);
      });
    } catch (e) {
      draft.textContent = 'Network error. Try again.';
      draft.classList.add('show');
      btn.disabled = false; btn.textContent = 'Make post';
    }
  }
  function escapeHtml(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  // ============================================================
  // COMPLETE TASK
  // ============================================================
  window.completeTask = async function() {
    const tier = currentTier();
    const t = currentTask();
    const today = todayStr();
    // Safety net: if subtasks are not complete, refuse
    if (!allSubtasksComplete(t)) {
      alert('Finish all checklist items above before claiming your win. No skipping ahead.');
      updateWinButtonState(t);
      return;
    }
    $('#winBtn').disabled = true;
    $('#winBtn').textContent = 'Saving...';
    try {
      await sb.from('uom_completions').insert({
        user_id: state.user.id, tier: tier.id, day: t.day || null
      });
      let newProfile = { ...state.profile };
      let leveledUp = false;
      if (tier.id === 'bronze') {
        if (newProfile.bronze_day >= 14) { newProfile.current_tier = 'silver'; leveledUp = true; }
        else newProfile.bronze_day = (newProfile.bronze_day || 1) + 1;
      }
      if (newProfile.last_win_date === yesterdayStr() || !newProfile.last_win_date) {
        newProfile.streak = (newProfile.streak || 0) + 1;
      } else if (newProfile.last_win_date !== today) newProfile.streak = 1;
      newProfile.last_win_date = today;
      await sb.from('uom_profiles').update({
        current_tier: newProfile.current_tier, bronze_day: newProfile.bronze_day,
        streak: newProfile.streak, last_win_date: newProfile.last_win_date
      }).eq('id', state.user.id);
      if (t.badge && t.badge_key) {
        await sb.from('uom_badges').upsert({
          user_id: state.user.id, badge_key: t.badge_key, badge_label: t.badge
        }, { onConflict: 'user_id,badge_key' });
      }
      state.profile = newProfile;
      state.todayDone = true;
      refreshUI();
      fireConfetti();
      if (leveledUp) showTierUp(); else showDone();
    } catch (e) { alert('Could not save: ' + e.message); }
    finally {
      $('#winBtn').disabled = false;
      $('#winBtn').textContent = 'Another win for a creator';
    }
  };

  function showDone() {
    _switchScreen('done');
    $('#dEmoji').textContent = '✦';
    $('#dTitle').textContent = 'Another win for a creator';
    $('#dMsg').textContent = currentTier().id === 'bronze'
      ? `You're on Day ${state.profile.bronze_day} of 14. Come back tomorrow.`
      : 'Keep going. Tomorrow brings the next task.';
  }
  function showTierUp() {
    _switchScreen('done');
    const t = currentTier();
    $('#dEmoji').textContent = t.icon;
    $('#dTitle').textContent = 'You unlocked ' + t.name + '!';
    $('#dMsg').textContent = 'New tier. New challenges. Keep going.';
  }

  window.goCheckin = function() { _switchScreen('checkin'); };

  function renderTiers() {
    const box = $('#tiersList');
    if (!box) return;
    box.innerHTML = '';
    TIERS.forEach((t, i) => {
      const currentIdx = TIERS.findIndex(x => x.id === state.profile.current_tier);
      let prog, goal, goalText;
      if (t.id === 'bronze') {
        prog = (i < currentIdx) ? 14 : (i === currentIdx ? Math.max(0, (state.profile.bronze_day||1) - 1) : 0);
        goal = 14; goalText = i < currentIdx ? 'Complete ✓' : `Day ${Math.min(state.profile.bronze_day||1, 14)} / 14`;
      } else if (t.id === 'crown') { prog = 0; goal = 1000; goalText = '$0 / $1,000'; }
      else { prog = 0; goal = 10; goalText = '0 / 10 wins'; }
      const pct = Math.min(100, (prog/goal)*100);
      const cls = 'tier-row' + (i <= currentIdx ? ' active' : ' locked');
      const lockIcon = i > currentIdx ? ' 🔒' : '';
      const row = document.createElement('div');
      row.className = cls;
      row.innerHTML =
        `<div class="tier-icon" style="background:${t.color};">${t.icon}</div>
         <div class="tier-info">
           <div class="tier-name">${t.name}${lockIcon}</div>
           <div class="tier-desc">${t.desc}</div>
           <div class="bar"><div class="bar-fill" style="width:${pct}%;"></div></div>
           <div class="bar-text">${goalText}</div>
         </div>`;
      box.appendChild(row);
    });
  }

  // ============================================================
  // SETTINGS
  // ============================================================
  function loadSettings() {
    setTheme(currentTheme());  // refresh toggle visual state
    $('#sEmail').textContent = state.user.email || '—';
    $('#sDisplayName').value = state.profile.display_name || '';
    $('#sNewPassword').value = '';
    const sc = $('#sNewPasswordConfirm'); if (sc) sc.value = '';
    $('#nameSaved').classList.remove('show');
    $('#passSaved').classList.remove('show');
    updatePasswordSectionCopy();
  }
  window.saveDisplayName = async function() {
    const name = $('#sDisplayName').value.trim();
    if (!name) { alert('Name cannot be empty.'); return; }
    const { error } = await sb.from('uom_profiles').update({ display_name: name }).eq('id', state.user.id);
    if (error) { alert('Could not save: ' + error.message); return; }
    state.profile.display_name = name;
    $('#greetName').textContent = name;
    $('#nameSaved').classList.add('show');
    setTimeout(() => $('#nameSaved').classList.remove('show'), 2500);
  };
  window.saveNewPassword = async function() {
    const pwd = $('#sNewPassword').value;
    const pwd2 = $('#sNewPasswordConfirm').value;
    if (!pwd || pwd.length < 6) { alert('Password must be at least 6 characters.'); return; }
    if (pwd !== pwd2) { alert('The two passwords do not match. Please retype.'); return; }
    const btn = $('#passwordSaveBtn');
    if (btn) { btn.disabled = true; btn.textContent = 'Saving...'; }
    const { error } = await sb.auth.updateUser({ password: pwd });
    if (btn) { btn.disabled = false; btn.textContent = 'Save password'; }
    if (error) { alert('Could not save password: ' + error.message); return; }
    $('#sNewPassword').value = '';
    $('#sNewPasswordConfirm').value = '';
    $('#passSaved').classList.add('show');
    // Mark profile that they have a password now so we can update copy next time
    state.profile.has_password = true;
    updatePasswordSectionCopy();
    setTimeout(() => $('#passSaved').classList.remove('show'), 3000);
  };

  // Update Settings copy to reflect whether user has set a password yet
  function updatePasswordSectionCopy() {
    const title = $('#passwordSectionTitle');
    const help = $('#passwordSectionHelp');
    const btn = $('#passwordSaveBtn');
    if (!title) return;
    // Heuristic: if any 'email' provider on user identities has been used to sign in with password,
    // assume they have a password. Otherwise show create-mode.
    const u = state.user || {};
    const hasPw = (state.profile && state.profile.has_password) ||
                  (u.identities && u.identities.some(i => i.provider === 'email' && i.identity_data && i.identity_data.email));
    if (hasPw) {
      title.textContent = 'Change your password';
      help.textContent  = 'Type your new password twice. You will still be able to sign in with magic link as well.';
      if (btn) btn.textContent = 'Save new password';
    } else {
      title.textContent = 'Create a password';
      help.textContent  = 'Set a password so you can sign in without waiting for a magic link email. Magic link will still work too.';
      if (btn) btn.textContent = 'Save password';
    }
  }

  window.nav = function(name) {
    if (name === 'settings') { loadSettings(); _switchScreen('settings'); return; }
    if (name === 'task') {
      if (!(state.checkin.time && state.checkin.energy && state.checkin.mood)) {
        alert('Finish your 3-tap check-in first.');
        _switchScreen('checkin');
        return;
      }
      showTask();
      return;
    }
    _switchScreen(name);
  };

  function fireConfetti() {
    const box = $('#confetti');
    const colors = ['#C9A961','#D4B896','#7BA88F','#F4EFE6','#C97B5C'];
    for (let i = 0; i < 36; i++) {
      const dot = document.createElement('div');
      dot.className = 'dot';
      dot.style.left = Math.random()*100 + '%';
      dot.style.top = '-20px';
      dot.style.background = colors[Math.floor(Math.random()*colors.length)];
      dot.style.animationDelay = (Math.random()*0.4) + 's';
      box.appendChild(dot);
    }
    setTimeout(() => { box.innerHTML = ''; }, 2500);
  }

  // ============================================================
  // INIT
  // ============================================================
  // Check URL hash for auth errors (e.g. otp_expired, access_denied)
  function checkUrlError() {
    const h = window.location.hash || '';
    if (!h.includes('error=')) return null;
    const params = new URLSearchParams(h.replace(/^#/, ''));
    const code = params.get('error_code') || params.get('error') || 'auth_error';
    const desc = params.get('error_description') || code;
    history.replaceState(null, '', window.location.pathname);
    return { code, desc: decodeURIComponent(desc).replace(/\+/g, ' ') };
  }

  // Show a visible error in place of the loading spinner if anything blows up
  function fatalError(msg) {
    const loading = document.getElementById('loading');
    if (!loading) return;
    loading.innerHTML = '<div style="text-align:center;color:#C56B5C;padding:20px;max-width:340px;"><div style="font-size:14px;font-weight:600;margin-bottom:8px;">Could not load</div><div style="font-size:12px;color:#8A8478;line-height:1.5;margin-bottom:14px;">' + msg + '</div><button onclick="location.reload()" style="padding:10px 20px;background:#C9A961;color:#0B0F14;border:none;border-radius:8px;font-weight:700;cursor:pointer;">Retry</button></div>';
  }

  // Race a promise against a timeout
  function withTimeout(promise, ms, label) {
    return Promise.race([
      promise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout: ' + label)), ms))
    ]);
  }

  // Detect recovery flow from URL hash BEFORE the SDK clears it
  function isRecoveryFlow() {
    const h = window.location.hash || '';
    return h.includes('type=recovery');
  }

  (async function init() {
    try {
      const urlErr = checkUrlError();

      // If user arrived from a password-recovery email, route straight to recovery screen.
      // DO NOT clear the URL hash — the Supabase SDK needs it to establish the session.
      // The SDK consumes it async and stores session in localStorage. We just wait.
      if (isRecoveryFlow()) {
        inRecoveryFlow = true;
        $('#loading').style.display = 'none';
        $('#login').style.display = 'none';
        $('#app').style.display = 'block';
        const nav = document.querySelector('.nav'); if (nav) nav.style.display = 'none';
        const header = document.querySelector('.header'); if (header) header.style.display = 'none';
        _switchScreen('recovery');

        // Poll for session up to 8 sec — SDK is processing hash in background
        const btn = $('#recoverySaveBtn');
        const err = $('#recoveryErr');
        if (btn) { btn.disabled = true; btn.textContent = 'Verifying reset link...'; }
        const start = Date.now();
        let sess = null;
        while (Date.now() - start < 8000) {
          try {
            const r = await sb.auth.getSession();
            if (r && r.data && r.data.session) { sess = r.data.session; break; }
          } catch(_) {}
          await new Promise(res => setTimeout(res, 250));
        }
        // Now safe to clean the URL
        if (window.location.hash) history.replaceState(null, '', window.location.pathname);

        if (sess) {
          if (btn) { btn.disabled = false; btn.textContent = 'Set new password and sign in'; }
        } else {
          if (btn) { btn.disabled = true; btn.textContent = 'Link expired'; }
          if (err) {
            err.style.color = 'var(--error)';
            err.textContent = 'This reset link is no longer valid. Please request a fresh one from the login screen.';
          }
        }
        return;
      }

      // Poll for session up to 6 sec — SDK processes URL hash async, so getSession()
      // can return null on first try even when a valid magic-link token is in the hash.
      let session = null;
      const start = Date.now();
      while (Date.now() - start < 6000) {
        try {
          const r = await sb.auth.getSession();
          if (r && r.data && r.data.session && r.data.session.user) {
            session = r.data.session;
            break;
          }
        } catch (e) { console.error('[UOM] getSession failed:', e); }
        // No session yet — wait 200ms and retry (SDK may still be parsing hash)
        await new Promise(res => setTimeout(res, 200));
        // If there's no hash AND we already polled twice, we're definitely logged out
        if (!window.location.hash && Date.now() - start > 400) break;
      }
      if (session) {
        try { await withTimeout(onSignedIn(), 8000, 'onSignedIn'); return; }
        catch (e) {
          console.error('[UOM] onSignedIn failed:', e);
          try { await sb.auth.signOut(); } catch(_) {}
        }
      }
      showLogin();
      if (urlErr) {
        const err = $('#err');
        if (err) {
          err.style.color = 'var(--error)';
          err.textContent = urlErr.code === 'otp_expired'
            ? 'That magic link expired or was already used. Tap Send magic link again.'
            : urlErr.desc;
        }
      }
    } catch (e) {
      console.error('[UOM] init fatal:', e);
      fatalError(e.message || 'Unknown error during sign-in.');
    }
  })();

  // Safety net: if loading screen is still visible after 7 seconds, force login screen
  setTimeout(() => {
    const loading = document.getElementById('loading');
    if (loading && loading.style.display !== 'none') {
      console.warn('[UOM] loading stuck — forcing login screen');
      showLogin();
    }
  }, 7000);
})();
