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
    { day:1, title:"Save 1 post you liked", time:"⏱ 90 sec",
      why:"Tiny start. So small your brain can't resist. This is Day 1 of your creator life.",
      source:"<b>SOURCE:</b> BJ Fogg, Tiny Habits (Stanford Behavior Design Lab, 2019).",
      steps:["Open Facebook on your phone","Scroll for 90 seconds","Find ONE post that made you stop — tap 'Save'"],
      type:"action", badge:null },
    { day:2, title:"Save 1 + leave 1 real comment", time:"⏱ 5 min",
      why:"Real comments on big posts is how unknown people get found in Week 1.",
      source:"<b>SOURCE:</b> Gary Vee's $1.80 Strategy (Crushing It!, 2018).",
      steps:["Save 1 new post that made you pause","Find one BIG post (1000+ likes)","Comment ONE line that adds your thought"],
      type:"action", badge:null },
    { day:3, title:"Save 1 + leave 3 real comments", time:"⏱ 15 min",
      why:"Three days creates the first momentum. Your brain now expects this.",
      source:"<b>SOURCE:</b> BJ Fogg's Stanford lab (40,000-person study).",
      steps:["Save 1 post you liked","Find 3 BIG posts in your interest area","Leave 3 real comments — each adds a thought"],
      type:"action", badge:"🎉 First Wave — Day 3", badge_key:"first_wave" },
    { day:4, title:"Save 1 + leave 5 real comments", time:"⏱ 20 min",
      why:"Five comments a day = 35 a week. People click your profile.",
      source:"<b>SOURCE:</b> Justin Welsh — Engagement before content.",
      steps:["Save 1 post","Find 5 BIG posts in your interest area","Leave 5 real comments"],
      type:"action", badge:null },
    { day:5, title:"5 comments + write your 1-line bio", time:"⏱ 25 min",
      why:"You've shown up 4 days. NOW your profile gets a line.",
      source:"<b>SOURCE:</b> Justin Welsh — Profile-as-sales-page.",
      steps:["Leave 5 real comments","Facebook → About → write ONE line: 'I help ___ do ___'","Save"],
      type:"action", badge:null },
    { day:6, title:"5 comments + 3-line bio + clear profile photo", time:"⏱ 30 min",
      why:"Now your profile sells you. Posts coming next week will land on a real page.",
      source:"<b>SOURCE:</b> Justin Welsh — Profile-as-sales-page.",
      steps:["Leave 5 real comments","Update profile photo to a clear recent photo","Bio: WHO you help → with WHAT → the RESULT"],
      type:"action", badge:null },
    { day:7, title:"10 comments + pin a welcome post", time:"⏱ 45 min",
      why:"End of Week 1. Your profile is ready. Your daily habit is alive.",
      source:"<b>SOURCE:</b> Phillippa Lally, UCL (2009). Seven days = behavior starts to feel familiar.",
      steps:["Leave 10 real comments","Copy the welcome post → post to Facebook","Tap the 3 dots → 'Pin to top of profile'"],
      type:"posting", badge:"🎉 Week 1 Done — Day 7", badge_key:"week_1_done",
      ready:"Hi 👋\n\nI'm here to share what I'm learning every day.\n\nIf any of it helps you save time, money, or your sanity — let's stay connected.\n\nWhat's ONE thing you wish you knew sooner?",
      safetyNote:"✓ Honest welcome — no fake claim. Safe to post." },
    { day:8, title:"Your FIRST post (PEEL) + 10 comments", time:"⏱ 60 min",
      why:"Today you cross from consumer to creator. PEEL gives the post a beginning, middle, end.",
      source:"<b>SOURCE:</b> Justin Welsh's PEEL framework (Point, Evidence, Explain, Link).",
      steps:["Copy the post below","Facebook → 'What's on your mind?' → paste → Post","Leave 10 real comments"],
      type:"posting", badge:null,
      ready:"Most people are one skill away from doubling their income.\n\nThey just don't know which skill.\n\nThe internet has the map.\n\nFew read it.\n\nWhat skill would YOU bet on for the next 12 months?",
      safetyNote:"✓ Universal truth + question. Safe to post." },
    { day:9, title:"Post #2 (PEEL) + 10 comments", time:"⏱ 60 min",
      why:"Pick a different hook type from yesterday. Variety teaches the algorithm.",
      source:"<b>SOURCE:</b> Alex Hormozi — 5 Hook Types for daily content.",
      steps:["Copy the post below (different style than Day 8)","Post on Facebook","Leave 10 real comments"],
      type:"posting", badge:null,
      ready:"Quick question for you:\n\nIf money wasn't a worry today, what would you do?\n\nNow ask yourself:\n\nWhy aren't you doing it?",
      safetyNote:"✓ Pure question. Safe to post." },
    { day:10, title:"Post #3 (PEEL) + 10 comments", time:"⏱ 60 min",
      why:"Three posts in three days. People remember the regular ones.",
      source:"<b>SOURCE:</b> Dickie Bush + Nicolas Cole (Ship 30 for 30).",
      steps:["Copy the post below","Post on Facebook","Leave 10 real comments"],
      type:"posting", badge:null,
      ready:"Hard truth:\n\nYour job will replace you in 2 weeks if you quit.\n\nYour family won't.\n\nChoose where your time goes.",
      safetyNote:"✓ Universal truth. Safe to post." },
    { day:11, title:"Post #4 (PEEL) + 10 comments", time:"⏱ 75 min",
      why:"Your comments are getting return-likes by now. People know your name.",
      source:"<b>SOURCE:</b> Gary Vee — borrowed audience builds your own audience.",
      steps:["Copy the post below","Post on Facebook","Leave 10 real comments"],
      type:"posting", badge:null,
      ready:"The biggest reason people don't start:\n\nThey wait to feel ready.\n\nHere's what nobody tells you:\n\nYou never feel ready.\n\nStart anyway.",
      safetyNote:"✓ Universal observation. Safe to post." },
    { day:12, title:"Post #5 (PEEL) + 10 comments", time:"⏱ 75 min",
      why:"Five posts in. You now have data — which got likes? Which got comments?",
      source:"<b>SOURCE:</b> Alex Hormozi — Content Review Loop.",
      steps:["Copy the post below","Post on Facebook","Leave 10 real comments"],
      type:"posting", badge:null,
      ready:"Myth: You need money to make money.\n\nTruth: You need attention.\n\nGet attention first.\n\nThe money follows.",
      safetyNote:"✓ Universal truth. Safe to post." },
    { day:13, title:"Post #6 (PEEL) + 10 comments", time:"⏱ 75 min",
      why:"One day from Identity Shift. The behavior is becoming who you are.",
      source:"<b>SOURCE:</b> James Clear, Atomic Habits, Chapter 2.",
      steps:["Copy the post below","Post on Facebook","Leave 10 real comments"],
      type:"posting", badge:null,
      ready:"Most 'no' is just 'not yet.'\n\nThe people who win are the ones who keep going one round longer than the rest.\n\nWhich 'no' are you giving up on too early?",
      safetyNote:"✓ Universal truth + question. Safe to post." },
    { day:14, title:"Post #7 + Weekly Review", time:"⏱ 75 min",
      why:"Day 14 is the quitter's cliff. You're across it. You ARE a creator.",
      source:"<b>SOURCE:</b> Phillippa Lally (UCL, 2009).",
      steps:["Post #7 (the one below)","Look at all 7 posts — which got the most reactions?","Save to Spark Log: 'Next week I'll do more of ___'"],
      type:"posting", badge:"🎉 IDENTITY SHIFT — Day 14", badge_key:"identity_shift",
      ready:"Two weeks ago, I started showing up online every day.\n\nNothing huge happened.\nNo viral post. No flood of followers.\n\nJust this:\n\nI know now that I CAN be the person who shows up.\n\nThat is the win.",
      safetyNote:"✓ Honest reflection. Every UOM member who reaches Day 14 earned this." }
  ];

  const TASKS = {
    bronze: BRONZE,
    silver: [{ title:"Post a quote image", time:"⏱ 30 min", why:"Image posts reach 3x more people.", source:"<b>SOURCE:</b> Meta's 2024 creator report.", steps:["Open Canva → search 'quote post'","Paste your last winning line into image","Download → post to Facebook"], type:"posting", ready:"[Open Canva, design 1080x1080 with your quote in white on dark background.]", safetyNote:"✓ Your own words. Safe to post." }],
    gold: [{ title:"Post a 5-line thread", time:"⏱ 45 min", why:"Threads keep people in your post longer.", source:"<b>SOURCE:</b> Format from Naval Ravikant on Twitter.", steps:["Write 1 hook + 4 lessons + 1 question","Post as one Facebook post","Pin to top of profile"], type:"posting", ready:"Hook: Most beginners quit at Day 14.\n\n1. They wait to feel ready.\n2. They compare to creators 5 years ahead.\n3. They post once, hear nothing, quit.\n4. They forget — early posts are reps, not rockets.\n\nWhat would YOU do differently?", safetyNote:"✓ Universal observations." }],
    platinum: [{ title:"Record a 60-sec voice video", time:"⏱ 60 min", why:"Voice videos let you practice talking. No face = no fear.", source:"<b>SOURCE:</b> Mel Robbins's early Instagram method.", steps:["Pick your most popular post","CapCut → record audio with emotion","White text on black background → export → Reels"], type:"posting", ready:"[Use your last winning post as the script.]", safetyNote:"✓ Your own voice. Safe to post." }],
    diamond: [{ title:"Record a 60-sec face or AI-avatar video", time:"⏱ 60 min", why:"Face videos build trust fastest. AI avatars work if camera-shy.", source:"<b>SOURCE:</b> Ali Abdaal's early YouTube. HeyGen for avatar.", steps:["Use your Platinum script","Record self or HeyGen avatar","Post to Reels + YouTube Shorts"], type:"posting", ready:"[Use your Platinum script.]", safetyNote:"✓ Your own script." }],
    crown: [{ title:"Log a real commission", time:"⏱ 5 min", why:"Crown is earned, not given.", source:"<b>SOURCE:</b> Your Warrior Plus or Systeme.io dashboard.", steps:["Open Warrior Plus → Reports","Screenshot earnings","Paste total below"], type:"posting", ready:"[Paste total earned. Each $100 = 1 win.]", safetyNote:"✓ Your real data." }]
  };

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
    const fr = $('#forgotRow'); if (fr) fr.style.display = mode === 'login' ? 'block' : 'none';
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
      } else { // login (password)
        if (!password) { err.textContent = 'Password required.'; return; }
        const { error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await onSignedIn();
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
  sb.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session && !state.user) {
      // remove the hash params from URL
      if (window.location.hash) history.replaceState(null, '', window.location.pathname);
      await onSignedIn();
    }
  });

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

  function _switchScreen(name) {
    ['checkin','task','done','sparks','tiers','lib','settings'].forEach(n => {
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
    pill.textContent = (tier.id === 'bronze' && t.day) ? `DAY ${t.day} OF 14 — BRONZE` : tier.name.toUpperCase();
    const bb = $('#badgeBanner');
    if (t.badge) { bb.textContent = t.badge; bb.classList.add('show'); } else bb.classList.remove('show');
    $('#tTitle').textContent = t.title;
    $('#tTime').textContent = t.time || '';
    $('#tWhy').textContent = t.why;
    $('#tSource').innerHTML = t.source;
    const ol = $('#tSteps'); ol.innerHTML = '';
    t.steps.forEach(s => { const li = document.createElement('li'); li.textContent = s; ol.appendChild(li); });
    const pathTabs = $('#pathTabs');
    if (t.type === 'posting') {
      pathTabs.classList.add('show');
      $('#path-a').style.display = 'block'; $('#path-b').style.display = 'none';
      $('#readyPost').textContent = t.ready || '';
      $('#safeBadge').textContent = t.safetyNote || 'Safe to post — no personal claim.';
      switchPath('a');
    } else {
      pathTabs.classList.remove('show');
      $('#path-a').style.display = 'none'; $('#path-b').style.display = 'none';
    }
    $('#sparkLine').value = ''; $('#sparkSaved').classList.remove('show');
    $('#tInput').value = ''; $('#tPolished').classList.remove('show');
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
      item.innerHTML = '<div class="day">⚡ ' + escapeHtml(label) + '</div><div class="line">' + escapeHtml(s.line) + '</div>';
      list.appendChild(item);
    });
  }
  function escapeHtml(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  // ============================================================
  // COMPLETE TASK
  // ============================================================
  window.completeTask = async function() {
    const tier = currentTier();
    const t = currentTask();
    const today = todayStr();
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
    $('#sEmail').textContent = state.user.email || '—';
    $('#sDisplayName').value = state.profile.display_name || '';
    $('#sNewPassword').value = '';
    $('#nameSaved').classList.remove('show');
    $('#passSaved').classList.remove('show');
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
    if (!pwd || pwd.length < 6) { alert('Password must be 6+ characters.'); return; }
    const { error } = await sb.auth.updateUser({ password: pwd });
    if (error) { alert('Could not update: ' + error.message); return; }
    $('#sNewPassword').value = '';
    $('#passSaved').classList.add('show');
    setTimeout(() => $('#passSaved').classList.remove('show'), 2500);
  };

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
  (async function init() {
    try {
      const { data: { session } } = await sb.auth.getSession();
      if (session) await onSignedIn();
      else showLogin();
    } catch (_) { showLogin(); }
  })();
})();
