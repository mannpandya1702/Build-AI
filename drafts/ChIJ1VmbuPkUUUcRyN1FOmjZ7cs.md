# Outreach draft — Bridgewood Roofing
place_id: ChIJ1VmbuPkUUUcRyN1FOmjZ7cs | 70 reviews | 4.9 stars | demo: https://bridgewood-roofing-buildai.vercel.app

## Touch-1 email
> voice check: clean

```
From: mann@tradecraftsites.com
Subject: Built Bridgewood Roofing a new site (2 min look?)

Hey Bridgewood Roofing team,

Your site is not loading great on phones and your number is buried, which is where most of your customers are.

So I built you one. It's already live: https://bridgewood-roofing-buildai.vercel.app

Fast on phones, your number one tap away, your real reviews front and center.

Want me to put it on your domain this week?

Mann

TradeCraft Sites
14th Main Road, Sector 7, HSR Layout, Bengaluru, Karnataka 560102, India
Not interested? Reply "unsubscribe" and I will not email you again.
```

> Touch 1 sends PLAIN TEXT, no image (deliverability on a fresh domain + 2026 data: plain beats attachment-heavy). Save the hero screenshot (/home/user/Build-AI/demos/_screenshots/bridgewood-roofing.webp) for the follow-up nudge.
> [NEEDS: owner first name] check their GBP/Facebook before sending; a real first name in the greeting beats "team".

## Touch-2 call script
```
CALL SCRIPT — Bridgewood Roofing
[NEEDS: STUDIO_US_PHONE] call from your US number, never the +91 number

Opener:
"Hey there, it's Mann from TradeCraft Sites. I built Bridgewood Roofing a new website and emailed you the link. Did you get a chance to click it?"

If not opened: walk them to it live on the call.
Hook: "70 five-star reviews and your site doesn't show a single one. The new one puts them front and center."

Objections (CLAUDE.md §7):
- "How much?" -> "Setup's [X], then $99 to $149/mo for hosting and updates so you never touch it. You pay nothing until it's live and you're happy."
- "I already have a website." -> "I saw it. It's not loading great on phones and your number's buried. The one I built fixes both. Worth a 2-minute look?"
- "Where are you based?" -> "India. Here's the live demo and a few other local businesses I've built for. The work speaks for itself, click it."
- "I need to think about it." -> "Totally fair. It's already built and live, no rush, no cost to sit on it. Want me to leave the link up so you can show your partner?"
- "Not interested." -> one graceful line, leave the demo link, move to nurture. Never argue.

Close: ask for the next step. Point it at their domain this week.
```

Reminder: no cold SMS. SMS only if they reply or give a number (CLAUDE.md §0.4).

## CORRECTED ANGLE (use this, not the generated observation above)
The generated "site not loading great" line is imprecise. The verified facts:
- The website button on their Google listing points to http://bridgewoodroofing.com/ which serves
  a BROKEN empty page (no https redirect). Clicks from their 70-review listing can hit a dead end.
- Their real site (https) works but has NO tap-to-call links on mobile.

Corrected opener for the email (send to info@bridgewoodroofing.com; office@bridgewoodr.com is
their Google-Workspace domain, keep as backup):

```
Hey Bridgewood Roofing team,

The website button on your Google listing points to a broken link (the http
version of your site does not load). 70 five-star reviews, and clicks are
hitting a dead end. Your number also is not tappable on mobile.

So I built you a version where both are fixed. It is live:
https://bridgewood-roofing-buildai.vercel.app

Fast on phones, your number one tap away, your real reviews front and center.
Want me to put it on your domain this week?

Mann

TradeCraft Sites
14th Main Road, Sector 7, HSR Layout, Bengaluru, Karnataka 560102, India
Not interested? Reply "unsubscribe" and I will not email you again.
```
