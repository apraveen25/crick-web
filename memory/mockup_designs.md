---
name: CrickScore mockup design reference
description: Location and structure of the Figma-like mockup files for CrickScore UI
type: reference
---

Mockup files at: `C:\Users\prave\Desktop\CrickScore\CrickScore Web\src\`

- `dashboard.jsx` — Dashboard layout: KPI row (4 cards), live matches list, quick actions, upcoming fixtures, activity feed
- `scoring.jsx` — Scoring console: big score strip, batters/bowler panel, "this over" ball chips, numpad (0–6), extras row (Wide/NB/Bye/LB), actions row (Wicket/Swap/Retire/New Bowler), undo bar, right rail with stats + commentary
- `setup.jsx` — New match wizard: 5 steps, format pills (T20/ODI/Test/Custom), toss section, preview card
- `shell.jsx` — Sidebar (240px) + topbar layout with breadcrumbs and search
- `styles/tokens.css` — Design tokens: `--accent` (pitch green oklch 58%), `--danger` (wicket red), `--warn` (amber for 6s/free hits), `--bg-elevated`, etc.

Live Scoring mockup image also at: `C:\Users\prave\Desktop\CrickScore\Live Scoring.png`
— Shows mobile-first design with large score (142/4 14.3), batsmen stats, ball-by-ball row, 0–6 numpad, Wide/No ball/Bye/Wicket bottom buttons.
