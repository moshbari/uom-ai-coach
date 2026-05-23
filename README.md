# UOM AI Coach

The phone-first guided-action app for Ultimate Online Mastery members.

One small win every day. Climb from Bronze to Crown.

## What this is

A multi-user web app that replaces the old UOM Straight Line PDF with a daily, behavior-research-backed action ladder. Members open the app, take a 3-tap check-in, get ONE task for the day, hit "Another win for a creator," and build a streak.

Built on the 14-day Bronze ladder (Save 1 post on Day 1 → first PEEL post on Day 8 → Identity Shift badge on Day 14), with a Daily Spark stacked on every day for niche discovery.

## Stack

- **Frontend:** vanilla HTML/CSS/JS, single-page. No build step.
- **Backend:** Supabase (auth + Postgres + Row Level Security)
- **Hosting:** Railway
- **AI:** OpenAI API (for the "Polish for me" rewrite button)

## Project structure

```
uom-ai-coach/
├── public/
│   ├── index.html       Member app
│   ├── admin.html       Admin dashboard (Mosh only)
│   └── assets/          CSS, JS, images
├── supabase/
│   ├── schema.sql       Database tables
│   └── policies.sql     Row Level Security rules
├── docs/
│   ├── architecture.md  How the pieces fit
│   └── deployment.md    Railway + Supabase setup
└── README.md
```

## Sources behind every task

Every task in the app cites a real public framework. The full source list is in `docs/sources.md`. We do not invent frameworks. Ever.

Key sources powering the 14-day ladder:
- BJ Fogg — Tiny Habits (Stanford, 2019)
- James Clear — Atomic Habits (Avery, 2018)
- Justin Welsh — PEEL framework + Profile-as-sales-page
- Gary Vee — $1.80 Strategy (Crushing It!, 2018)
- Dickie Bush + Nicolas Cole — Ship 30 for 30
- Alex Hormozi — Hook Library + Content Review Loop
- Phillippa Lally — UCL habit formation research (2009)
- Daniel Kahneman + Amos Tversky — Prospect Theory (1979)
- Dan Koe — Idea Vault + Curiosity Flywheel
