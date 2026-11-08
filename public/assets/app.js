// UOM AI Coach — frontend logic with Supabase backend (v3: Google OAuth + email/password)
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
    { day:6, title:"Thread + profile refresh + 10 Comment Squad comments", time:"⏱ 35 min",
      why:"Words still win. On Facebook a text + image post gets 5.20% engagement against 4.84% for video (Buffer, 2026). Today your profile starts selling you.",
      source:"<b>SOURCE:</b> Buffer State of Social Media Engagement 2026 + Justin Welsh — profile as a sales page.",
      steps:[
        "RANT Squad → rant script → Viral Thread Publisher → post the thread",
        "Update your profile photo + write a 1-line bio",
        "10 Comment Squad comments on big posts",
        "VIDEO BONUS (optional — skip if you are not ready): Clip Maker on a 10+ min niche video → post the best clip"
      ],
      type:"action", badge:null,
      subtasks: [ { id:"thread", label:"Viral thread shipped", goal:1 }, { id:"profile", label:"Profile photo + 1-line bio", goal:1 }, { id:"comments", label:"Comment Squad comments", goal:10 }, { id:"clip", label:"🎬 Video bonus (optional): Clip Maker session", goal:1, optional:true } ],
      devrantTool:{ route:"/laboratory", label:"Open RANT Squad" }
    },
    { day:7, title:"Pinned Hook Pitch post + thread + 14 comments (50 total — 🎉 Week 1 Done)", time:"⏱ 45 min",
      why:"End of Week 1. You just crossed 50 Comment Squad comments. Your profile sells you. Your daily posting + comments habit is alive.",
      source:"<b>SOURCE:</b> Daniel Priestley, Key Person of Influence — the Hook Pitch (Name, Same, Fame, Pain, Aim, Game). Phillippa Lally, UCL European Journal of Social Psychology (2009) — habits.",
      steps:[
        "Answer the 6 Hook Pitch questions below (Daniel Priestley) → the AI writes your pinned post → post it → pin it to the top of your profile",
        "RANT Squad → Viral Thread Publisher → post a thread",
        "14 Comment Squad comments on big posts (this push puts you at 50 cumulative)",
        "VIDEO BONUS (optional): Clip Maker run #2 → post the best clip"
      ],
      type:"posting", badge:"🎉 Week 1 Done — Day 7", badge_key:"week_1_done",
      subtasks: [ { id:"welcome", label:"Hook Pitch post posted + pinned", goal:1 }, { id:"thread", label:"Viral thread shipped", goal:1 }, { id:"comments", label:"Comment Squad comments", goal:14 }, { id:"clip", label:"🎬 Video bonus (optional): Clip Maker session #2", goal:1, optional:true } ],
      frameworkHint:"An HONEST WELCOME pinned post. Style: Dan Koe contrarian opener ('Most people scroll all day and remember nothing — I am trying something different'). Mention the member has been shipping content with AI agents for a week. End with an inviting question.",
      intro:true,
      safetyNote:"✓ Honest — written only from your own answers. Nothing made up.",
      devrantTool:{ route:"/laboratory", label:"Open RANT Squad" }
    },
    { day:8, title:"Morning thread + evening viral post + 10 comments + thinking (60 cumulative)", time:"⏱ 45 min",
      why:"You have a rhythm now. Two pieces a day plus comments, and one minute of thinking about what works.",
      source:"<b>SOURCE:</b> Teresa Amabile, The Progress Principle (HBR Press, 2011).",
      steps:[
        "Morning: RANT Squad → Viral Thread Publisher → post",
        "Evening: Viral Post Creator → post + 10 Comment Squad comments",
        "THINKING TASK: write 1 line in Daily Spark — which hook got the most replies this week?",
        "VIDEO BONUS (optional): two Clip Maker sessions on two long videos"
      ],
      type:"action", badge:null,
      subtasks: [ { id:"thread", label:"Morning thread", goal:1 }, { id:"post", label:"Evening viral post", goal:1 }, { id:"comments", label:"Comment Squad comments", goal:10 }, { id:"thinking", label:"Thinking task: best hook", goal:1 }, { id:"clip", label:"🎬 Video bonus (optional): Clip Maker sessions", goal:2, optional:true } ],
      devrantTool:{ route:"/laboratory", label:"Open RANT Squad" }
    },
    { day:9, title:"Reply Day — answer every comment + thread + 8 comments", time:"⏱ 40 min",
      why:"Meta ranks posts by how many comments they get, how long they are and who talks to whom. Every reply you write makes Meta more likely to show that person your next post.",
      source:"<b>SOURCE:</b> Meta Transparency Center — how Facebook Feed ranking works (comment signals).",
      steps:[
        "Open your last 8 days of posts → reply to EVERY comment with a real answer or a question",
        "RANT Squad → Viral Thread Publisher → post a thread",
        "8 Comment Squad comments on big posts",
        "VIDEO BONUS (optional): your first Audio Rant — voice only, no face"
      ],
      type:"action", badge:null,
      subtasks: [ { id:"replies", label:"Replied to every comment on my posts", goal:1 }, { id:"thread", label:"Viral thread shipped", goal:1 }, { id:"comments", label:"Comment Squad comments", goal:8 }, { id:"audio", label:"🎬 Video bonus (optional): Audio Rant", goal:1, optional:true } ],
      devrantTool:{ route:"/laboratory", label:"Open RANT Squad" }
    },
    { day:10, title:"Batch 2 threads + 8 comments + thinking", time:"⏱ 40 min",
      why:"One sitting = 2 days of content scheduled. This is how solo creators keep going.",
      source:"<b>SOURCE:</b> Dan Koe — batch creation principle (2-Hour Writer).",
      steps:[
        "Write 2 threads in one sitting with RANT Squad → schedule them for tomorrow + the day after",
        "8 Comment Squad comments on big posts",
        "THINKING TASK: what ONE niche pattern have you spotted this week? Write in Daily Spark.",
        "VIDEO BONUS (optional): 2 Audio Rants in one sitting"
      ],
      type:"action", badge:null,
      subtasks: [ { id:"thread1", label:"Thread #1 scheduled", goal:1 }, { id:"thread2", label:"Thread #2 scheduled", goal:1 }, { id:"comments", label:"Comment Squad comments", goal:8 }, { id:"thinking", label:"Thinking task: niche pattern this week", goal:1 }, { id:"audio", label:"🎬 Video bonus (optional): Audio Rants", goal:2, optional:true } ],
      devrantTool:{ route:"/laboratory", label:"Open RANT Squad" }
    },
    { day:11, title:"Story post — your first 10 days (text + image) + 8 comments", time:"⏱ 35 min",
      why:"People follow people. A short, honest story of what you did in 10 days is the most human post you can make, and you need no camera for it.",
      source:"<b>SOURCE:</b> Buffer 2026 — text + image is the top Facebook format (5.20% median engagement).",
      steps:[
        "Write 5-8 lines: where you started, what you did for 10 days, one thing you learned. Ask a question at the end.",
        "Add a picture (screenshot of your posts, or an AI image) → post",
        "8 Comment Squad comments on big posts",
        "VIDEO BONUS (optional): Editor → Single Reaction video"
      ],
      type:"action", badge:null,
      subtasks: [ { id:"story", label:"Story post (text + image)", goal:1 }, { id:"comments", label:"Comment Squad comments", goal:8 }, { id:"video", label:"🎬 Video bonus (optional): Single Reaction video", goal:1, optional:true } ],
      devrantTool:{ route:"/laboratory", label:"Open RANT Squad" }
    },
    { day:12, title:"Thread + viral post + 8 comments", time:"⏱ 35 min",
      why:"Two pieces of your own every day is the habit. Today is a normal day — and normal days build the business.",
      source:"<b>SOURCE:</b> James Clear, Atomic Habits (2018) — show up, even on plain days.",
      steps:[
        "RANT Squad → Viral Thread Publisher → post",
        "Viral Post Creator → post",
        "8 Comment Squad comments on big posts",
        "VIDEO BONUS (optional): Editor → Split React video"
      ],
      type:"action", badge:null,
      subtasks: [ { id:"thread", label:"Viral thread shipped", goal:1 }, { id:"post", label:"Viral post shipped", goal:1 }, { id:"comments", label:"Comment Squad comments", goal:8 }, { id:"video", label:"🎬 Video bonus (optional): Split React video", goal:1, optional:true } ],
      devrantTool:{ route:"/laboratory", label:"Open RANT Squad" }
    },
    { day:13, title:"Remake your best post + 10 comments (🎉 100 crossed!) + thinking", time:"⏱ 40 min",
      why:"Your best post already proved the idea works. Say it again in a new way — new hook, new picture. Today you also cross 100 Comment Squad comments.",
      source:"<b>SOURCE:</b> Alex Hormozi — Content Review Loop (repeat what wins).",
      steps:[
        "Find your post with the most comments → write a new version with a new first line → post with a new picture",
        "10 Comment Squad comments (🎉 you crossed 100 total!)",
        "THINKING TASK in Daily Spark: of everything you posted, what got the best response? Why?",
        "VIDEO BONUS (optional): Editor → Multi-clip video"
      ],
      type:"action", badge:null,
      subtasks: [ { id:"remake", label:"Best post remade + posted", goal:1 }, { id:"comments", label:"Comment Squad comments", goal:10 }, { id:"thinking", label:"Thinking task: best response", goal:1 }, { id:"video", label:"🎬 Video bonus (optional): Multi-clip video", goal:1, optional:true } ],
      devrantTool:{ route:"/laboratory", label:"Open RANT Squad" }
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

  function phaseForDay(day, tierId) {
    if (tierId === 'silver') return { name: 'depth', label: 'DEPTH' };
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

  function renderProgressTrail(currentDay, totalDays, tierId) {
    const trail = document.getElementById('progressTrail');
    if (!trail) return;
    totalDays = totalDays || 14;
    // Bronze milestones at 4/7/14; Silver milestones (when built fully) might be different
    const milestonesByTier = { bronze: [4, 7, 14], silver: [3, 7, 14] };
    const milestones = milestonesByTier[tierId] || [];
    let html = '';
    for (let d = 1; d <= totalDays; d++) {
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
    // Update the header icon — sun shown in dark mode (so you tap to go light), moon in light mode
    const ti = document.getElementById('themeIcon');
    if (ti) ti.innerHTML = (theme === 'dark') ? '&#x2600;' : '&#x263E;';
  };

  // Quick toggle for the header chip
  window.toggleTheme = function() {
    const next = (currentTheme() === 'dark') ? 'light' : 'dark';
    setTheme(next);
  };

  // Sync icon on first paint
  try {
    const _t = document.documentElement.getAttribute('data-theme') || 'light';
    const _ti = document.getElementById('themeIcon');
    if (_ti) _ti.innerHTML = (_t === 'dark') ? '&#x2600;' : '&#x263E;';
  } catch(_) {}
  function currentTheme() {
    return document.documentElement.getAttribute('data-theme') || 'light';
  }

  const TASKS = {
    bronze: BRONZE,
    silver: [
      { day:1, title:"Same playbook, ONE niche only", time:"⏱ 40 min",
        why:"Bronze taught you to ship. Silver teaches you to stay in ONE lane. Same daily moves — but everything serves your niche from now on. That is how an expert is built.",
        source:"<b>SOURCE:</b> Dan Koe (One-Person Business) + BJ Fogg — depth before breadth.",
        steps:[
          "Pick a viral video FROM YOUR LOCKED NICHE → RANT Squad → rant script → Viral Thread Publisher → post",
          "Open Viral Post Creator → 5 agents → viral post → post",
          "Activate Comment Squad on 8 BIG posts IN YOUR NICHE"
        ],
        type:"action", badge:null,
        subtasks: [
          { id:"thread", label:"Viral thread shipped (in niche)", goal:1 },
          { id:"post", label:"Viral post shipped (in niche)", goal:1 },
          { id:"comments", label:"Comment Squad comments (in niche)", goal:8 }
        ],
        devrantTool:{ route:"/laboratory", label:"Open RANT Squad" }
      },
      { day:2, title:"Your words go deeper into your niche", time:"⏱ 40 min",
        why:"Comments warmed them. Posts informed them. Today you go deeper — two pieces inside your locked niche, plus replies to everyone who talked to you.",
        source:"<b>SOURCE:</b> Justin Welsh consistency principle + Meta Feed ranking (comment signals).",
        steps:[
          "Niche viral video → RANT Squad → Viral Thread Publisher → post",
          "Reply to every comment on your last 3 posts",
          "Activate Comment Squad on 10 big posts in your niche",
          "VIDEO BONUS (optional): Audio Rant on a niche video → post to Reels"
        ],
        type:"action", badge:null,
        subtasks: [
          { id:"thread", label:"Niche thread shipped", goal:1 },
          { id:"replies", label:"Replied to comments on my posts", goal:1 },
          { id:"comments", label:"Comment Squad comments", goal:10 },
          { id:"audio", label:"🎬 Video bonus (optional): Audio Rant in niche", goal:1, optional:true }
        ],
        devrantTool:{ route:"/laboratory", label:"Open RANT Squad" }
      },
      { day:3, title:"Text + image proof + first depth thinking", time:"⏱ 40 min",
        why:"Three days deep in one lane. Time to think like an analyst: what is working in YOUR niche, what is not?",
        source:"<b>SOURCE:</b> Teresa Amabile, The Progress Principle (HBR Press).",
        steps:[
          "Viral Post Creator → niche post → add a picture → post",
          "Activate Comment Squad on 10 big posts in your niche",
          "THINKING TASK: look at your top 3 posts so far. What did they have in common? Write 1 line in Daily Spark.",
          "VIDEO BONUS (optional): Clip Maker on a long niche video → post the best clip"
        ],
        type:"action", badge:null,
        subtasks: [
          { id:"post", label:"Niche text + image post", goal:1 },
          { id:"comments", label:"Comment Squad comments", goal:10 },
          { id:"thinking", label:"Thinking task in Daily Spark", goal:1 },
          { id:"clips", label:"🎬 Video bonus (optional): Clip Maker session", goal:1, optional:true }
        ],
        devrantTool:{ route:"/laboratory", label:"Open RANT Squad" }
      }
    ],
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
  // AUTH — Google OAuth + email/password (sign in or create)
  // ============================================================
  let authMode = 'login'; // 'login' | 'signup' — magic link removed; Google OAuth is separate path

  window.switchAuthTab = function(mode) {
    if (mode !== 'login' && mode !== 'signup') mode = 'login';
    authMode = mode;
    const tl = document.getElementById('tabLogin');
    const ts = document.getElementById('tabSignup');
    if (tl) tl.classList.toggle('on', mode==='login');
    if (ts) ts.classList.toggle('on', mode==='signup');
    $('#nameInput').style.display     = mode==='signup' ? 'block' : 'none';
    $('#passwordInput').style.display = 'block';
    const labels = { login:'Sign in', signup:'Create account' };
    $('#authBtn').textContent = labels[mode];
    const fr = $('#forgotRow'); if (fr) fr.style.display = mode==='login' ? 'block' : 'none';
    const err = $('#err'); err.textContent = ''; err.style.color = 'var(--error)';
  };

  // Continue with Google — Supabase OAuth flow
  window.signInWithGoogle = async function() {
    const err = $('#err');
    err.textContent = ''; err.style.color = 'var(--error)';
    const btn = document.getElementById('googleBtn');
    if (btn) { btn.disabled = true; btn.classList.add('loading'); }
    try {
      if (!sb || !sb.auth || !sb.auth.signInWithOAuth) {
        throw new Error('Auth not ready. Refresh and try again.');
      }
      const { data, error } = await sb.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/',
          queryParams: { prompt: 'select_account' }
        }
      });
      if (error) throw error;
      // Supabase returns a redirect URL — go to it. (SDK usually auto-redirects.)
      if (data && data.url) { window.location.href = data.url; }
    } catch (e) {
      err.textContent = e.message || 'Could not start Google sign in.';
      if (btn) { btn.disabled = false; btn.classList.remove('loading'); }
    }
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
      if (authMode === 'signup') {
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
      } else { // login (password) — ZERO SDK calls. Pure fetch + pure localStorage + reload.
        if (!password) { err.textContent = 'Password required.'; return; }

        // Compute Supabase localStorage key (the one the SDK reads on page load)
        const projectRefMatch = (C.supabaseUrl || '').match(/https?:\/\/([^.]+)\./);
        const projectRef = projectRefMatch ? projectRefMatch[1] : '';
        const storageKey = 'sb-' + projectRef + '-auth-token';

        // Clear ALL stale Supabase keys MANUALLY — no SDK call. Catches orphans from
        // previous broken attempts (different ref, code-verifier leftovers, etc).
        try {
          const toRemove = [];
          for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && k.startsWith('sb-')) toRemove.push(k);
          }
          toRemove.forEach(k => localStorage.removeItem(k));
        } catch(_) {}

        // Direct fetch to Supabase token endpoint (verified ~350ms via curl)
        let tokenResp, tokenData;
        try {
          tokenResp = await withTimeout(
            fetch(C.supabaseUrl + '/auth/v1/token?grant_type=password', {
              method: 'POST',
              headers: { 'apikey': C.supabaseAnonKey, 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, password })
            }),
            8000,
            'token-fetch'
          );
        } catch (e) {
          throw new Error('Network problem — please try again. (' + (e.message || 'timeout') + ')');
        }
        tokenData = await tokenResp.json();
        if (!tokenResp.ok) {
          const why = tokenData.error_description || tokenData.msg || '';
          if (/invalid login credentials/i.test(why)) {
            throw new Error('Wrong password, or there is no account with this email yet. Tap "Forgot your password?" below, or "Create account" above if you are new.');
          }
          throw new Error(why || 'Invalid email or password');
        }

        // Write session directly to localStorage (no SDK)
        const session = {
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_at: Math.floor(Date.now() / 1000) + (tokenData.expires_in || 3600),
          expires_in: tokenData.expires_in || 3600,
          token_type: 'bearer',
          user: tokenData.user
        };
        try { localStorage.setItem(storageKey, JSON.stringify(session)); } catch(_) {}

        err.style.color = 'var(--sage)';
        err.textContent = 'Signed in. Loading your app...';
        // Reload — SDK reads the fresh token from localStorage and we land in the app
        setTimeout(() => location.reload(), 300);
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
      if (data.noAccount) {
        err.textContent = 'There is no account with ' + email + ' yet. Tap "Create account" above to make one (or check the email for a typo).';
        return;
      }
      err.style.color = 'var(--sage)';
      err.textContent = 'Reset link sent to ' + email + '. Check your inbox and your Junk folder.';
    } catch (e) {
      err.textContent = 'Could not send reset email. Try again.';
    }
  };

  window.signOut = async function() {
    await sb.auth.signOut();
    location.reload();
  };

  // Handle OAuth / recovery redirect — Supabase SDK auto-detects token in URL
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

  // Read the Supabase session straight from localStorage. NO SDK call.
  // We can do this because we wrote it ourselves at sign-in time and the SDK
  // also reads from this exact key on page load.
  function readLocalSession() {
    try {
      const projectRefMatch = (window.UOM_CONFIG && window.UOM_CONFIG.supabaseUrl || '').match(/https?:\/\/([^.]+)\./);
      const projectRef = projectRefMatch ? projectRefMatch[1] : '';
      const storageKey = 'sb-' + projectRef + '-auth-token';
      const raw = localStorage.getItem(storageKey);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (_) { return null; }
  }

  async function onSignedIn() {
    try {
      console.log('[UOM] onSignedIn step 1: read user from localStorage');
      // BYPASS sb.auth.getUser() — that SDK call has been hanging.
      // The session is in localStorage (we wrote it; SDK also reads from there).
      const localSession = readLocalSession();
      const user = localSession && localSession.user;
      if (!user || !user.id) {
        console.warn('[UOM] onSignedIn: no user in localStorage');
        showLogin();
        return;
      }
      state.user = user;
      console.log('[UOM] onSignedIn step 2: loadProfile for', user.email);
      await loadProfile();
      console.log('[UOM] onSignedIn step 3: loadTodayState');
      await loadTodayState();
      console.log('[UOM] onSignedIn step 4: loadSparks');
      await loadSparks();
      console.log('[UOM] onSignedIn step 5: enterApp');
      enterApp();
    } catch (e) {
      console.error('[UOM] onSignedIn failed:', e);
      $('#loading').style.display = 'none';
      $('#login').style.display = 'flex';
      const err = $('#err');
      err.style.color = 'var(--error)';
      err.textContent = 'Sign-in error: ' + (e.message || 'unknown');
      // Do NOT call signOut here — that triggers SDK calls that may hang.
      // Just leave the user on the login screen with the error visible.
    }
  }

  // Access tokens die after 1 hour. A long task (Clip Maker renders, 10 comments)
  // easily runs past that, so renew the token ourselves before it runs out.
  async function freshSession() {
    const sess = readLocalSession();
    if (!sess || !sess.refresh_token) return sess;
    if ((sess.expires_at || 0) - Math.floor(Date.now() / 1000) > 120) return sess;
    try {
      const r = await withTimeout(
        fetch(C.supabaseUrl + '/auth/v1/token?grant_type=refresh_token', {
          method: 'POST',
          headers: { 'apikey': C.supabaseAnonKey, 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: sess.refresh_token })
        }),
        8000,
        'token-refresh'
      );
      const d = await r.json();
      if (!r.ok || !d.access_token) return sess;
      const next = Object.assign({}, sess, {
        access_token: d.access_token,
        refresh_token: d.refresh_token || sess.refresh_token,
        expires_at: Math.floor(Date.now() / 1000) + (d.expires_in || 3600),
        expires_in: d.expires_in || 3600,
        user: d.user || sess.user
      });
      const projectRefMatch = (C.supabaseUrl || '').match(/https?:\/\/([^.]+)\./);
      try { localStorage.setItem('sb-' + (projectRefMatch ? projectRefMatch[1] : '') + '-auth-token', JSON.stringify(next)); } catch(_) {}
      return next;
    } catch (_) { return sess; }
  }

  // ===== Direct REST fetch (no SDK) — used during load path to avoid SDK hangs
  async function restFetch(path, options) {
    options = options || {};
    const sess = await freshSession();
    const accessToken = sess && sess.access_token;
    if (!accessToken) throw new Error('No access token in localStorage');
    const r = await withTimeout(
      fetch(C.supabaseUrl + '/rest/v1/' + path, Object.assign({}, options, {
        headers: Object.assign({
          'apikey': C.supabaseAnonKey,
          'Authorization': 'Bearer ' + accessToken,
          'Content-Type': 'application/json'
        }, options.headers || {})
      })),
      6000,
      'restFetch ' + path
    );
    if (!r.ok) {
      const text = await r.text().catch(() => '');
      throw new Error('REST ' + r.status + ': ' + text.slice(0, 200));
    }
    if (r.status === 204) return null;
    return r.json();
  }

  // AI routes on our server only answer signed-in members, so send the token along.
  async function aiFetch(url, options) {
    const sess = await freshSession();
    const headers = Object.assign({}, options.headers || {}, { 'Authorization': 'Bearer ' + (sess && sess.access_token) });
    return fetch(url, Object.assign({}, options, { headers }));
  }

  async function loadProfile() {
    const userId = state.user.id;
    const rows = await restFetch('uom_profiles?id=eq.' + encodeURIComponent(userId) + '&select=*');
    if (Array.isArray(rows) && rows.length > 0) {
      state.profile = rows[0];
      return;
    }
    // Profile missing — create it via direct POST
    const seed = {
      id: state.user.id,
      email: state.user.email,
      display_name: (state.user.user_metadata && state.user.user_metadata.display_name) || (state.user.email || 'friend').split('@')[0]
    };
    const created = await restFetch('uom_profiles', {
      method: 'POST',
      headers: { 'Prefer': 'return=representation' },
      body: JSON.stringify(seed)
    });
    state.profile = Array.isArray(created) ? created[0] : created;
  }

  async function loadTodayState() {
    const today = todayStr();
    const userId = state.user.id;
    const cycleStart = (state.profile && state.profile.cycle_started_at) || '1970-01-01T00:00:00Z';
    // Today done: only count completions IN the current cycle AND from today
    const completions = await restFetch('uom_completions?user_id=eq.' + encodeURIComponent(userId) +
      '&completed_at=gte.' + today + 'T00:00:00' +
      '&completed_at=gte.' + encodeURIComponent(cycleStart) +
      '&select=id,completed_at&limit=1');
    // A win only counts once the profile moved on too. If that save failed, the member
    // must be able to claim the day again instead of seeing "come back tomorrow".
    state.todayDone = !!(completions && completions.length) && state.profile.last_win_date === today;
    const checkins = await restFetch('uom_checkins?user_id=eq.' + encodeURIComponent(userId) +
      '&date=eq.' + today + '&select=time_avail,energy,mood&limit=1');
    if (Array.isArray(checkins) && checkins.length > 0) {
      const ci = checkins[0];
      state.checkin = { time: ci.time_avail || '', energy: ci.energy || '', mood: ci.mood || '' };
    } else {
      state.checkin = { time: '', energy: '', mood: '' };
    }
  }

  async function loadSparks() {
    const userId = state.user.id;
    const cycleStart = (state.profile && state.profile.cycle_started_at) || '1970-01-01T00:00:00Z';
    // Only show sparks from current cycle. Try the rich select first; fall back to
    // the legacy column set if the coach_reflection/coach_mode columns are not yet
    // present in the DB (i.e. admin has not run the SQL migration).
    let rows;
    try {
      rows = await restFetch('uom_sparks?user_id=eq.' + encodeURIComponent(userId) +
        '&created_at=gte.' + encodeURIComponent(cycleStart) +
        '&select=id,day,line,coach_reflection,coach_mode,created_at&order=created_at.desc&limit=60');
    } catch (e) {
      console.warn('[UOM] new spark columns not present — falling back to legacy select');
      rows = await restFetch('uom_sparks?user_id=eq.' + encodeURIComponent(userId) +
        '&created_at=gte.' + encodeURIComponent(cycleStart) +
        '&select=id,day,line,created_at&order=created_at.desc&limit=60');
    }
    state.sparks = Array.isArray(rows) ? rows : [];
  }

  // ============================================================
  // ENTER / SHOW
  // ============================================================
  function showLogin() {
    $('#loading').style.display = 'none';
    $('#app').style.display = 'none';
    $('#login').style.display = 'flex';
    switchAuthTab('login');
  }
  function enterApp() {
    $('#loading').style.display = 'none';
    $('#login').style.display = 'none';
    $('#app').style.display = 'block';
    $('#greetName').textContent = state.profile.display_name || 'friend';
    refreshUI();
    renderSparks();
    renderAdminPreview();
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
    if (tier.id === 'bronze' || tier.id === 'silver') {
      const totalDays = (TASKS[tier.id] || []).length || 14;
      dayChip.textContent = `Day ${state.profile.bronze_day}/${totalDays}`;
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
  function currentTier() {
    if (state.preview) return TIERS.find(t => t.id === state.preview.tier) || TIERS[0];
    return TIERS.find(t => t.id === state.profile.current_tier) || TIERS[0];
  }
  function currentTask() {
    const t = currentTier();
    if (state.preview) { const pool = TASKS[t.id] || []; return pool[Math.max(0, Math.min(state.preview.day - 1, pool.length - 1))]; }
    const pool = TASKS[t.id] || [];
    // Silver has days too. It used to always show Silver Day 1, so members repeated it forever.
    if (t.id === 'bronze' || t.id === 'silver') return pool[Math.max(0, Math.min((state.profile.bronze_day || 1) - 1, pool.length - 1))];
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
    // Insert right after the badge banner, inside the badge's own card. This used to take
    // the first '#s-task .card', which became the posts card on 26Sep26, and the crash
    // left every member on Day 2+ stuck on the check-in screen.
    const badge = document.getElementById('badgeBanner');
    if (badge && badge.parentNode) badge.parentNode.insertBefore(btn, badge.nextSibling);
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
    const copyBtn = document.getElementById('copyReadyBtn'); if (copyBtn) copyBtn.style.display = 'none';

    const recentSparks = (state.sparks || []).slice(0, 10).map(s => s.line);

    try {
      const r = await aiFetch(C.personalPostUrl || '/api/personal-post', {
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
    const copyBtn = document.getElementById('copyReadyBtn');
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
      const copyBtn = document.getElementById('copyReadyBtn');
      if (copyBtn && copyBtn.parentNode) copyBtn.parentNode.insertBefore(btn, copyBtn.nextSibling);
    }
    btn.style.display = '';
    btn.onclick = async () => {
      btn.disabled = true; btn.textContent = '...';
      // Clear cache so we get a fresh generation
      const today = todayStr();
      const cacheKey = 'uom_post_' + (state.user && state.user.id) + '_d' + (task.day || 'x') + '_' + today;
      try { localStorage.removeItem(cacheKey); } catch(_) {}
      if (task.intro) await writeIntroPost(); else await generatePersonalPost(task, { force: true });
      btn.disabled = false; btn.textContent = '↻ Try another angle';
    };
  }


  // ============================================================
  // INTRO POST (Day 7) — a few questions → the member's own pinned intro post
  // ============================================================
  const INTRO_FIELDS = ['name', 'same', 'fame', 'pain', 'aim', 'game'];
  const INTRO_PROMPT = `You are helping me write my pinned post for my Facebook profile, using Daniel Priestley's Hook Pitch (from his book Key Person of Influence): Name, Same, Fame, Pain, Aim, Game. People who see my comments will tap my name and read this post first. It must make the RIGHT people think "this page is for me" and follow.

Ask me these 6 questions ONE AT A TIME. Wait for my answer before you ask the next one. Give one short example with each question. If I answer in Bangla (or any other language), switch to that language.
1. NAME: Your name, who you help, and with what.
2. SAME: What is it like that people already know? (e.g. "like a free sales assistant, right inside Facebook")
3. FAME: Why should these people trust you on this problem? One TRUE thing. (I can skip this if I have nothing yet.)
4. PAIN: What hurts your audience? Say it the way they would say it.
5. AIM: What will they get from your page? What you post, and how it helps them.
6. GAME: What change do you want to help them make?

If one of my answers drifts away from my audience and their pain, ask me one short follow-up question to bring it back.

THE GOLDEN RULE: the whole post is about my audience. Fame proves I understand their problem, Aim says exactly what they get from my page, Game is the change I want to help them make. All of it points at their pain.

Write my pinned post in the hook shape (start high, dip into the pain, rise to the benefit):
- Name: my name + who I help + with what. The first line must stop a stranger scrolling.
- Same: what it is like, so people get it in one second.
- Fame: one true reason they can trust me. If I skipped it, leave it out. Never invent one.
- Pain: their pain in their own words, the most vivid part.
- Aim: what they get from following my page and how it helps them.
- Game: the change I want to help them make (a mission, never a guarantee).
- Last line: ONE thing only. Either invite the right people to follow for that benefit, or ask one question they can answer in one word. Not both. No hype words (transform, boost, skyrocket).

Make it FLOW like a pitch I would say out loud, not a form read back: polish my words and join the parts with natural links ("That's why…", "So here's what you'll get…", "My dream?").

Rules:
- Use ONLY what I told you. Never invent a job, a place, numbers, money, results or a story.
- No income claims and no promises or guarantees to the reader.
- Write in the same language I answered in.
- 8 to 12 short lines with a blank line between them. Simple words. A real person talking, not an ad. Do not print the labels (Name, Same, Fame...) in the post.
- At most 2 emojis. No hashtags. No links.

Then give me 2 more versions with different first lines so I can pick the one I like.

Start now with question 1.`;

  function introKey(suffix) { return 'uom_intro_' + ((state.user && state.user.id) || 'anon') + '_' + suffix; }
  function readIntroAnswers() {
    const a = {};
    INTRO_FIELDS.forEach(f => { const el = document.getElementById('iq-' + f); a[f] = el ? el.value.trim() : ''; });
    return a;
  }
  function showIntroQuestions(task) {
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem(introKey('answers')) || '{}'); } catch(_) {}
    if (!saved.name && state.profile && state.profile.display_name) saved.name = state.profile.display_name;
    INTRO_FIELDS.forEach(f => {
      const el = document.getElementById('iq-' + f);
      if (!el) return;
      el.value = saved[f] || '';
      el.oninput = () => { try { localStorage.setItem(introKey('answers'), JSON.stringify(readIntroAnswers())); } catch(_) {} };
    });
    const c = $('#introPromptCopied'); if (c) c.classList.remove('show');
    let post = '';
    try { post = localStorage.getItem(introKey('post')) || ''; } catch(_) {}
    if (post) { renderGeneratedPost(post, task); $('#introWriteBtn').textContent = '✍️ Write it again'; return; }
    const readyEl = $('#readyPost');
    readyEl.innerHTML = '<div style="text-align:center;color:var(--muted);padding:18px 12px;font-size:13px;">Your pinned post appears here after you tap <b>Write my pinned post</b>.</div>';
    const copyBtn = document.getElementById('copyReadyBtn');
    if (copyBtn) copyBtn.style.display = 'none';
    const regen = document.getElementById('regenBtn'); if (regen) regen.style.display = 'none';
    $('#introWriteBtn').textContent = '✍️ Write my pinned post';
  }
  window.writeIntroPost = async function() {
    if (_genInFlight) return;
    const answers = readIntroAnswers();
    if (!answers.pain && !answers.aim) {
      alert('Answer at least Pain (question 4) or Aim (question 5). That is the heart of your pitch.');
      return;
    }
    try { localStorage.setItem(introKey('answers'), JSON.stringify(answers)); } catch(_) {}
    const task = currentTask();
    const readyEl = $('#readyPost');
    const btn = $('#introWriteBtn');
    _genInFlight = true; btn.disabled = true;
    readyEl.innerHTML = '<div style="text-align:center;color:var(--muted);padding:24px 12px;"><div class="spinner" style="margin-bottom:12px;"></div><div style="font-size:13px;">Writing your pinned post from your Hook Pitch...</div></div>';
    readyEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    try {
      const r = await aiFetch(C.introPostUrl || '/api/intro-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers, displayName: state.profile && state.profile.display_name, seed: Math.floor(Math.random() * 1000000) })
      });
      const data = await r.json();
      if (!r.ok || !data.post) { readyEl.textContent = 'Could not write your post. ' + (data.error || '') + ' Tap the button to try again.'; return; }
      try { localStorage.setItem(introKey('post'), data.post); } catch(_) {}
      renderGeneratedPost(data.post, task || { intro: true });
      const regen = document.getElementById('regenBtn'); if (regen) regen.style.display = '';
      btn.textContent = '✍️ Write it again';
    } catch (e) {
      readyEl.textContent = 'Network error. Tap the button to try again.';
    } finally {
      _genInFlight = false; btn.disabled = false;
    }
  };
  window.copyIntroPrompt = function() {
    copyString(INTRO_PROMPT);
    const c = $('#introPromptCopied'); if (c) { c.classList.add('show'); setTimeout(() => c.classList.remove('show'), 3000); }
  };

  // ============================================================
  // SUBTASK CHECKLIST — per-task progress counter, localStorage persisted
  // ============================================================
  // Ticks are kept per task (and per journey), NOT per calendar day. A long task
  // like Day 6 spread over two sittings used to lose every tick at midnight UTC
  // (6am in Bangladesh), so the member could never fill the list in one go.
  function subtaskStorageKey(taskDay) {
    const tier = (state.profile && state.profile.current_tier) || 'bronze';
    const cycle = (state.profile && state.profile.cycle_started_at) || '';
    if (state.preview) return 'uom_prev_sub_' + state.preview.tier + '_d' + (taskDay || 'x');
    return 'uom_sub_' + ((state.user && state.user.id) || 'anon') + '_' + tier + '_d' + (taskDay || 'x') + '_' + cycle.slice(0, 19);
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
    return task.subtasks.every(s => s.optional || (progress[s.id] || 0) >= s.goal);
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
      const subs = (task.subtasks || []).filter(s => !s.optional);
      const progress = loadSubtaskProgress(task.day);
      const remaining = subs.filter(s => (progress[s.id] || 0) < s.goal).length;
      const total = subs.length;
      const done = total - remaining;
      btn.textContent = 'Tap the circles in "Your progress today" first (' + done + '/' + total + ' done)';
      if (note) {
        note.style.display = 'block';
        note.innerHTML = 'You still have <b>' + remaining + '</b> task' + (remaining===1?'':'s') + ' to mark off. Scroll up to <b>Your progress today</b> and tap one circle for each thing you did. Then this button opens.';
      }
    }
  }

  function _switchScreen(name) {
    ['checkin','task','done','sparks','tiers','lib','settings','explorer','recovery','history'].forEach(n => {
      const el = document.getElementById('s-' + n);
      if (el) el.classList.toggle('active', n === name);
    });
    $$('.nav button').forEach(b => b.classList.toggle('on', b.getAttribute('data-nav') === name));
    try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch(_) { window.scrollTo(0,0); }
  }

  // ============================================================
  // TEXT + IMAGE POSTS — every day from Day 1 (Get Transcript button)
  // ============================================================
  // The server works out today's number (1,1,2,2,3,3,5,5, then 7) and counts
  // what the member's Get Transcript button made today.
  async function renderPostsCard() {
    const card = document.getElementById('postsCard');
    if (!card) return;
    let d;
    try {
      const sess = await freshSession();
      const r = await fetch((C.postsTodayUrl || '/api/posts-today') + '?tz=' + (-new Date().getTimezoneOffset()), {
        headers: { 'Authorization': 'Bearer ' + (sess && sess.access_token) }
      });
      d = await r.json();
      if (!r.ok) throw new Error(d.error || 'failed');
    } catch (e) {
      console.warn('[UOM] posts card:', e.message);
      return;   // leave the rest of the screen alone
    }
    // Posts made without the Get Transcript button can't be seen by the server, so the
    // member adds them here. Before this, a member who posted by hand saw 0 / 1 forever.
    const handKey = 'uom_handposts_' + ((state.user && state.user.id) || 'anon') + '_' + todayStr();
    let byHand = 0;
    try { byHand = parseInt(localStorage.getItem(handKey) || '0', 10) || 0; } catch(_) {}
    d.made = (d.made || 0) + byHand;
    const made = Math.min(d.made, d.goal);
    const done = d.made >= d.goal;
    const pct = Math.round((made / d.goal) * 100);
    const n = (k) => k === 1 ? '1 post' : k + ' posts';
    // Same button on both phones: the link opens the Android version on Android.
    const android = /Android/i.test(navigator.userAgent);
    const phone = android ? 'phone' : 'iPhone';
    card.innerHTML = `
      <div class="posts-head">
        <div class="posts-label">📝 Text + image posts${d.day ? ' · Day ' + d.day : ''}</div>
        <div class="posts-count"><b>${d.made}</b> / ${d.goal}</div>
      </div>
      <div class="posts-bar"><span style="width:${pct}%"></span></div>
      <div class="posts-msg">${done
        ? '✓ Done for today! You posted ' + n(d.made) + '. Tomorrow: ' + n(d.tomorrow) + '.'
        : 'Today: <b>' + n(d.goal) + '</b> on Facebook. About 3 minutes each.'}</div>
      ${d.ever === 0 ? `
        <div class="posts-first">
          <div class="posts-first-t">First time? Add the button to your ${phone} (1 minute)</div>
          <a class="go posts-install" href="${d.installUrl}" target="_blank" rel="noopener">📲 Add Get Transcript to my ${phone}</a>
          <div class="hint">Open this on your phone (iPhone or Android). ${android ? 'In Chrome, add it to your Home screen.' : 'Your code is copied for you.'} The 2 post prompts are already inside.</div>
        </div>` : ''}
      <ol class="posts-steps">
        <li>On any video (Facebook, YouTube, Instagram, TikTok), tap <b>Share → Get Transcript</b>.</li>
        <li>${android ? 'Tap <b>🎯 FB post + audience check</b>, then pick <b>ChatGPT</b>.' : 'Tap <b>Ask ChatGPT</b>, then <b>🎯 FB post + audience check</b>.'}</li>
        <li>Happy with it? In that <b>same ChatGPT chat</b>, paste the picture prompt:</li>
      </ol>
      <button type="button" class="big-copy" id="copyImagePrompt">Copy picture prompt</button>
      <ol class="posts-steps" start="4">
        <li>Post the words + the picture on Facebook. Done: that's 1.</li>
      </ol>
      ${done ? '' : '<button type="button" class="go posts-byhand" id="postsByHand">✓ I posted one on Facebook</button>'}
      <button type="button" class="posts-refresh" id="postsRefresh">↻ Update my count</button>
      <div class="hint">Posts from the Get Transcript button count by themselves. Posted another way? Tap "I posted one".</div>
      <div class="posts-note">This is an extra goal. It does not lock your day. Your Day ${d.day || ''} checklist and win button are further down ↓</div>`;
    card.style.display = 'block';
    document.getElementById('copyImagePrompt').onclick = async (ev) => {
      try { await navigator.clipboard.writeText(d.imagePrompt); ev.target.textContent = '✓ Copied. Paste it in ChatGPT'; }
      catch (_) { ev.target.textContent = 'Press and hold to copy'; }
      setTimeout(() => { ev.target.textContent = 'Copy picture prompt'; }, 2500);
    };
    document.getElementById('postsRefresh').onclick = () => renderPostsCard();
    const byHandBtn = document.getElementById('postsByHand');
    if (byHandBtn) byHandBtn.onclick = () => {
      try { localStorage.setItem(handKey, String(byHand + 1)); } catch(_) {}
      renderPostsCard();
    };
  }
  // Coming back from the iPhone's Share button: refresh the count.
  document.addEventListener('visibilitychange', () => {
    const task = document.getElementById('s-task');
    if (document.visibilityState === 'visible' && task && task.classList.contains('active')) renderPostsCard();
  });

  window.showTask = function() {
    renderPostsCard();
    renderPreviewBanner();
    const t = currentTask();
    const tier = currentTier();
    const pill = $('#dayPill');
    // Phase-aware day pill
    pill.className = 'day-pill';
    if (tier.id === 'bronze' && t.day) {
      const phase = phaseForDay(t.day, tier.id);
      pill.classList.add('phase-' + phase.name);
      pill.textContent = `DAY ${t.day}/14 — ${phase.label}`;
      renderProgressTrail(t.day);
      document.getElementById('progressTrail').style.display = 'flex';
    } else if (tier.id === 'silver' && t.day) {
      const total = (TASKS.silver || []).length;
      pill.classList.add('phase-depth');
      pill.textContent = `SILVER · DAY ${t.day}/${total}`;
      renderProgressTrail(t.day, total, 'silver');
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
      const iq = $('#introQs');
      if (iq) iq.style.display = t.intro ? 'block' : 'none';
      if (t.intro) showIntroQuestions(t); else generatePersonalPost(t);
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
    const t = currentTask();
    if (t && t.intro) alert('Copied. Open Facebook → "What\'s on your mind?" → paste → Post. Then tap the 3 dots (…) on your new post → "Pin post" so it stays at the top of your profile.');
    else alert('Copied. Now open Facebook → "What\'s on your mind?" → paste → Post.');
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
      const r = await aiFetch(C.polishUrl || '/api/polish', {
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
    const tier = currentTier();
    // Record day for ANY tier that has a day field (Bronze + Silver + future tiers)
    const day = (t && t.day) ? t.day : null;
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
        const r = await aiFetch(C.sparkReflectUrl || '/api/spark-reflect', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sparks: history, line, spark_id: data && data.id })
        });
        const out = await r.json();
        if (r.ok && out.reflection) {
          reflBody.textContent = out.reflection;
          reflEl.style.display = 'block';
          // Cache reflection on the local spark so it shows in Journey + Sparks log without reload
          if (data && state.sparks && state.sparks.length) {
            const inState = state.sparks.find(s => s.id === data.id);
            if (inState) {
              inState.coach_reflection = out.reflection;
              inState.coach_mode = (out.debug && out.debug.mode) || null;
            }
          }
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
      const r = await aiFetch(C.sparkExploreUrl || '/api/spark-explore', {
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
      const r = await aiFetch(C.sparkToPostUrl || '/api/spark-to-post', {
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
    if (state.preview) {
      fireConfetti();
      _switchScreen('done');
      $('#dEmoji').textContent = '🛠';
      $('#dTitle').textContent = 'Preview: this is the win screen';
      $('#dMsg').textContent = 'A member would see this after ' + currentTier().name + ' Day ' + (t.day || 1) + '. Nothing was saved. Use the 🛠 button to open another day.';
      try { localStorage.removeItem(subtaskStorageKey(t.day)); } catch(_) {}
      return;
    }
    $('#winBtn').disabled = true;
    $('#winBtn').textContent = 'Saving...';
    try {
      // Saved through restFetch (fresh token, real errors). The SDK calls used here
      // before ignored failures, so a member saw confetti while nothing was saved.
      const saveHeaders = { 'Prefer': 'return=representation' };
      await restFetch('uom_completions', {
        method: 'POST', headers: saveHeaders,
        body: JSON.stringify({ user_id: state.user.id, tier: tier.id, day: t.day || null })
      });
      let newProfile = { ...state.profile };
      let leveledUp = false;
      // Tier-aware day increment. bronze_day field is reused as "day within current tier".
      // When a member tiers up, reset to 1 so the new tier starts at Day 1.
      const TIER_LADDER_SIZE = 14; // every tier currently has its own 14-day ladder
      if (tier.id === 'bronze') {
        if (newProfile.bronze_day >= TIER_LADDER_SIZE) {
          newProfile.current_tier = 'silver';
          newProfile.bronze_day = 1;
          leveledUp = true;
        } else newProfile.bronze_day = (newProfile.bronze_day || 1) + 1;
      } else if (tier.id === 'silver') {
        const silverPool = TASKS.silver || [];
        if (newProfile.bronze_day >= silverPool.length) {
          // End of the Silver days built so far. Gold is not built yet, so go round
          // the Silver days again (holding on the last day left members stuck on it).
          newProfile.bronze_day = 1;
        } else newProfile.bronze_day = (newProfile.bronze_day || 1) + 1;
      }
      if (newProfile.last_win_date === yesterdayStr() || !newProfile.last_win_date) {
        newProfile.streak = (newProfile.streak || 0) + 1;
      } else if (newProfile.last_win_date !== today) newProfile.streak = 1;
      newProfile.last_win_date = today;
      const saved = await restFetch('uom_profiles?id=eq.' + encodeURIComponent(state.user.id), {
        method: 'PATCH', headers: saveHeaders,
        body: JSON.stringify({
          current_tier: newProfile.current_tier, bronze_day: newProfile.bronze_day,
          streak: newProfile.streak, last_win_date: newProfile.last_win_date
        })
      });
      if (!Array.isArray(saved) || !saved.length) throw new Error('your progress did not save. Please sign out, sign in again and tap the button once more.');
      if (t.badge && t.badge_key) {
        try {
          await restFetch('uom_badges?on_conflict=user_id,badge_key', {
            method: 'POST', headers: { 'Prefer': 'return=representation,resolution=merge-duplicates' },
            body: JSON.stringify({ user_id: state.user.id, badge_key: t.badge_key, badge_label: t.badge })
          });
        } catch (e) { console.warn('[UOM] badge save:', e.message); }
      }
      // Ticks for this task are no longer needed.
      try { localStorage.removeItem(subtaskStorageKey(t.day)); } catch(_) {}
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
      : currentTier().id === 'silver'
        ? `Tomorrow: Silver Day ${state.profile.bronze_day} of ${(TASKS.silver || []).length}.`
        : 'Keep going. Tomorrow brings the next task.';
  }
  function showTierUp() {
    _switchScreen('done');
    const t = currentTier();
    $('#dEmoji').textContent = t.icon;
    $('#dTitle').textContent = 'You unlocked ' + t.name + '!';
    $('#dMsg').textContent = 'New tier. New challenges. Keep going.';
  }

  // ============================================================
  // ADMIN PREVIEW — the admin can open ANY level + day to see what members see.
  // Display only: nothing is saved, the admin's own progress is untouched.
  // ============================================================
  function isAdmin() {
    if (state.profile && state.profile.is_admin) return true;
    const e = (state.user && state.user.email || '').toLowerCase();
    return !!e && e === String(C.adminEmail || '').toLowerCase();
  }
  function previewTiers() { return TIERS.filter(t => (TASKS[t.id] || []).length); }
  function renderPreviewBanner() {
    let b = document.getElementById('previewBanner');
    if (!state.preview) { if (b) b.remove(); return; }
    if (!b) {
      b = document.createElement('div');
      b.id = 'previewBanner';
      b.className = 'preview-banner';
      const scr = document.getElementById('s-task');
      if (scr) scr.insertBefore(b, scr.firstChild);
    }
    const t = currentTier();
    b.innerHTML = '🛠 <b>Admin preview</b> · ' + escapeHtml(t.name) + ' Day ' + state.preview.day + ' · nothing is saved';
  }
  function renderAdminPreview() {
    if (!isAdmin() || document.getElementById('adminFab')) return;
    const fab = document.createElement('button');
    fab.id = 'adminFab'; fab.type = 'button'; fab.className = 'admin-fab';
    fab.textContent = '🛠'; fab.title = 'Admin: preview any day';
    const panel = document.createElement('div');
    panel.id = 'adminPanel'; panel.className = 'admin-panel';
    panel.innerHTML =
      '<div class="ap-h">🛠 Admin preview</div>' +
      '<div class="ap-sub">See any day exactly as members see it. Nothing is saved and your own progress does not change.</div>' +
      '<label>Level</label><select id="apTier"></select>' +
      '<label>Day</label><select id="apDay"></select>' +
      '<div class="ap-row"><button type="button" id="apPrev">← Day before</button><button type="button" id="apNext">Next day →</button></div>' +
      '<button type="button" class="ap-go" id="apGo">Open this day</button>' +
      '<div class="ap-row"><button type="button" id="apCheckin">Check-in screen</button><button type="button" id="apWin">Win screen</button></div>' +
      '<button type="button" class="ap-exit" id="apExit">Back to my real day</button>';
    document.body.appendChild(fab); document.body.appendChild(panel);
    const tierSel = panel.querySelector('#apTier'), daySel = panel.querySelector('#apDay');
    previewTiers().forEach(t => { const o = document.createElement('option'); o.value = t.id; o.textContent = t.icon + ' ' + t.name + ' (' + TASKS[t.id].length + (TASKS[t.id].length === 1 ? ' day)' : ' days)'); tierSel.appendChild(o); });
    function fillDays(keep) {
      const pool = TASKS[tierSel.value] || [];
      daySel.innerHTML = '';
      pool.forEach((task, i) => { const o = document.createElement('option'); o.value = i + 1; o.textContent = 'Day ' + (i + 1) + ' — ' + (task.title || '').slice(0, 48); daySel.appendChild(o); });
      if (keep) daySel.value = String(Math.min(keep, pool.length));
    }
    function open(tier, day) {
      state.preview = { tier, day: parseInt(day, 10) || 1 };
      tierSel.value = tier; fillDays(state.preview.day);
      panel.classList.remove('open');
      showTask();
    }
    tierSel.onchange = () => fillDays(1);
    panel.querySelector('#apGo').onclick = () => open(tierSel.value, daySel.value);
    panel.querySelector('#apPrev').onclick = () => { const d = parseInt(daySel.value, 10); if (d > 1) open(tierSel.value, d - 1); };
    panel.querySelector('#apNext').onclick = () => { const d = parseInt(daySel.value, 10); if (d < (TASKS[tierSel.value] || []).length) open(tierSel.value, d + 1); };
    panel.querySelector('#apCheckin').onclick = () => { panel.classList.remove('open'); _switchScreen('checkin'); };
    panel.querySelector('#apWin').onclick = () => { panel.classList.remove('open'); showDone(); };
    panel.querySelector('#apExit').onclick = () => { state.preview = null; renderPreviewBanner(); panel.classList.remove('open'); refreshUI(); if (state.todayDone) showDone(); else nav('checkin'); };
    fab.onclick = () => {
      if (!panel.classList.contains('open')) {
        const tier = state.preview ? state.preview.tier : (state.profile.current_tier || 'bronze');
        tierSel.value = previewTiers().some(t => t.id === tier) ? tier : 'bronze';
        fillDays(state.preview ? state.preview.day : (state.profile.bronze_day || 1));
      }
      panel.classList.toggle('open');
    };
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
  // RESTART JOURNEY — visible reset, admin still sees full history
  // ============================================================
  window.restartJourney = async function() {
    const confirmInput = document.getElementById('restartConfirm');
    const note = document.getElementById('restartNote');
    if (!confirmInput) return;
    const typed = (confirmInput.value || '').trim();
    if (typed !== 'ERASE') {
      if (note) { note.style.display = 'block'; note.textContent = 'You must type ERASE in capital letters to confirm.'; }
      return;
    }
    const btn = document.getElementById('restartBtn');
    if (btn) { btn.disabled = true; btn.textContent = 'Resetting...'; }
    try {
      const sess = readLocalSession();
      const r = await fetch(C.restartUrl || '/api/restart-journey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (sess && sess.access_token) }
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Reset failed');
      // Clear all client-side subtask progress + cached personal-post drafts
      try {
        const toRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && (k.startsWith('uom_sub_') || k.startsWith('uom_post_'))) toRemove.push(k);
        }
        toRemove.forEach(k => localStorage.removeItem(k));
      } catch(_) {}
      // Reload — fresh state from DB
      location.reload();
    } catch (e) {
      if (note) { note.style.display = 'block'; note.textContent = 'Could not reset: ' + (e.message || 'unknown'); }
      if (btn) { btn.disabled = false; btn.textContent = 'Restart journey now'; }
    }
  };

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
      help.textContent  = 'Type your new password twice. Use it next time to sign in.';
      if (btn) btn.textContent = 'Save new password';
    } else {
      title.textContent = 'Create a password';
      help.textContent  = 'Set a password so you can sign in with email and password.';
      if (btn) btn.textContent = 'Save password';
    }
  }


  // ============================================================
  // JOURNEY — browse all past days + their sparks
  // ============================================================
  async function renderJourney() {
    const list = document.getElementById('historyList');
    if (!list) return;
    list.innerHTML = '<div class="empty-state">Loading your journey...</div>';

    const currentTierObj = currentTier();
    const currentTierIdx = TIERS.findIndex(t => t.id === currentTierObj.id);
    const currentDayInTier = state.profile.bronze_day || 1;
    const userId = state.user.id;
    const cycleStart = (state.profile && state.profile.cycle_started_at) || '1970-01-01T00:00:00Z';

    // Pull ALL completions in current cycle (across all tiers)
    let completions = [];
    try {
      completions = await restFetch('uom_completions?user_id=eq.' + encodeURIComponent(userId) +
        '&completed_at=gte.' + encodeURIComponent(cycleStart) +
        '&select=tier,day,completed_at&order=completed_at.asc');
    } catch (e) {
      console.error('[UOM] history completions error:', e);
    }
    const doneMap = {}; // key = tier:day, value = completed_at
    (completions || []).forEach(c => { if (c.tier && c.day) doneMap[c.tier + ':' + c.day] = c.completed_at; });

    // Map sparks by tier:day. Sparks only have 'day' field, not tier — infer tier from completed_at proximity
    // Simpler approach: bucket sparks by day number and try to attribute to most-recent matching tier
    const sparksByDay = {};
    (state.sparks || []).forEach(s => {
      if (s.day) {
        const k = s.day; // we will attempt to attribute later
        if (!sparksByDay[k]) sparksByDay[k] = [];
        sparksByDay[k].push(s);
      }
    });

    list.innerHTML = '';

    // Loop through tiers up to (and including) current tier — skip later tiers
    for (let ti = 0; ti <= currentTierIdx; ti++) {
      const tier = TIERS[ti];
      const pool = TASKS[tier.id] || [];
      if (pool.length === 0) continue;

      // Tier header — clickable bar that toggles the days container
      const isCurrentTier = (ti === currentTierIdx);
      const header = document.createElement('div');
      header.className = 'journey-tier-header collapsible' + (isCurrentTier ? ' expanded' : '');
      const tierStatus = ti < currentTierIdx ? 'COMPLETE' : 'IN PROGRESS';
      const containerId = 'journey-tier-' + tier.id;
      header.innerHTML =
        '<span class="journey-tier-icon">' + (tier.icon || '') + '</span>' +
        '<span class="journey-tier-name">' + tier.name.toUpperCase() + '</span>' +
        '<span class="journey-tier-status">' + tierStatus + '</span>' +
        '<span class="journey-tier-chevron">&#x25BC;</span>';
      header.addEventListener('click', () => {
        header.classList.toggle('expanded');
        const cont = document.getElementById(containerId);
        if (cont) cont.classList.toggle('open');
      });
      list.appendChild(header);

      // Container for all days in this tier
      const daysContainer = document.createElement('div');
      daysContainer.id = containerId;
      daysContainer.className = 'journey-tier-days' + (isCurrentTier ? ' open' : '');
      list.appendChild(daysContainer);

      // Each day
      for (let d = 1; d <= pool.length; d++) {
        const task = pool[d - 1] || {};
        let status, statusCls, isFuture = false;

        if (ti < currentTierIdx) {
          // Past tier — every day is done (they tiered up past it)
          status = '✓ Done';
          statusCls = 'done';
        } else if (ti === currentTierIdx) {
          if (d < currentDayInTier) { status = '✓ Done'; statusCls = 'done'; }
          else if (d === currentDayInTier) { status = 'Today'; statusCls = 'now'; }
          else { status = 'Locked'; statusCls = 'next'; isFuture = true; }
        }

        const completedAt = doneMap[tier.id + ':' + d];
        const sparks = sparksByDay[d] || [];
        const detailsId = 'journey-' + tier.id + '-d' + d;

        let cls = 'journey-day';
        if (statusCls === 'done') cls += ' completed';
        else if (statusCls === 'now') cls += ' today';
        if (isFuture) cls += ' future';

        // Build accomplishment summary
        const isDoneRow = statusCls === 'done';
        const subtaskList = task.subtasks || [];
        let summaryHtml = '';
        if (isDoneRow && subtaskList.length > 0) {
          summaryHtml = '<div class="journey-summary-label">WHAT YOU ACCOMPLISHED</div>' +
            '<ul class="journey-summary-list">' +
            subtaskList.map(s => '<li>&#x2713; ' + escapeHtml(s.label) + ' <span class="journey-sub-count">(' + s.goal + ')</span></li>').join('') +
            '</ul>';
        } else if (statusCls === 'now' && subtaskList.length > 0) {
          // For today's row, show the GOALS so member sees what is asked
          summaryHtml = '<div class="journey-summary-label">YOUR GOALS TODAY</div>' +
            '<ul class="journey-summary-list" style="opacity:0.85;">' +
            subtaskList.map(s => '<li>&#x25CB; ' + escapeHtml(s.label) + ' <span class="journey-sub-count">(' + s.goal + ')</span></li>').join('') +
            '</ul>';
        }

        const row = document.createElement('div');
        row.className = cls;
        row.innerHTML =
          '<div class="journey-day-head">' +
            '<div>' +
              '<div class="journey-day-num">DAY ' + d + ' / ' + pool.length + ' &middot; ' + tier.name.toUpperCase() + '</div>' +
              '<div class="journey-day-title">' + escapeHtml(task.title || 'Day ' + d) + '</div>' +
            '</div>' +
            '<div class="journey-day-status ' + statusCls + '">' + status + '</div>' +
          '</div>' +
          '<div class="journey-day-details" id="' + detailsId + '">' +
            (completedAt ? '<div class="journey-meta">Completed: ' + new Date(completedAt).toLocaleString() + '</div>' : '') +
            summaryHtml +
            (sparks.length ?
              '<div class="journey-summary-label" style="margin-top:14px;">YOUR SPARK</div>' +
              sparks.map(function(s) {
                let h = '<div class="journey-spark-quote">' + escapeHtml(s.line) + '</div>';
                if (s.coach_reflection) {
                  h += '<div class="journey-coach-label">YOUR COACH REPLIED</div>' +
                       '<div class="journey-coach-reply">' + escapeHtml(s.coach_reflection) + '</div>';
                } else {
                  // Honest record: AI Coach save-to-DB shipped 2026-05-25T07:00Z.
                  // Sparks created before that have no saved reply. We never invent one.
                  const SAVE_LAUNCH = new Date('2026-05-25T07:00:00Z').getTime();
                  const sparkTime = s.created_at ? new Date(s.created_at).getTime() : 0;
                  if (sparkTime && sparkTime < SAVE_LAUNCH) {
                    h += '<div class="journey-coach-missing">(No Coach reply was saved for this spark \u2014 the save feature was added later.)</div>';
                  }
                }
                return h;
              }).join('') :
              (isDoneRow ? '<div class="journey-meta" style="margin-top:6px;">No spark saved this day.</div>' : '')) +
            (task.why ? '<div class="journey-why">' + escapeHtml(task.why) + '</div>' : '') +
          '</div>';

        if (!isFuture) {
          row.addEventListener('click', () => {
            const d2 = document.getElementById(detailsId);
            if (d2) d2.classList.toggle('show');
          });
        }
        daysContainer.appendChild(row);
      }
    }
  }

  window.nav = function(name) {
    if (name === 'settings') { loadSettings(); _switchScreen('settings'); return; }
    if (name === 'history') { renderJourney(); _switchScreen('history'); return; }
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
      // can return null on first try even when a valid OAuth token is in the hash.
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
          // Show the actual error on the login screen instead of silently signing out.
          // This way we can SEE what's wrong instead of getting a mysterious bounce.
          showLogin();
          const err = $('#err');
          if (err) {
            err.style.color = 'var(--error)';
            err.textContent = 'Could not load your app: ' + (e.message || 'unknown') + ' — open browser console for details.';
          }
          return;
        }
      }
      showLogin();
      if (urlErr) {
        const err = $('#err');
        if (err) {
          err.style.color = 'var(--error)';
          err.textContent = urlErr.code === 'otp_expired'
            ? 'That sign-in link expired or was already used. Try signing in again.'
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
