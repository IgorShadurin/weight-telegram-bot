---
layout: default
title: Weight Goal Bot — Instructions
lang: en
description: Group accountability for weight goals with photo check-ins, reminders, progress charts, and achievements
---

# Weight Goal Bot instructions

[@my_weight_goal_bot](https://t.me/my_weight_goal_bot) helps one person or a whole chat stay accountable to weight goals. Photo check-ins let people in the chat see and verify progress, while the bot records each weight, builds the weekly trajectory, and sends reminders so nobody loses track or forgets to check in. Completed weekly milestones unlock playful capybara achievements.

## Get started

1. Add the bot to a group.
2. Send a current photo captioned `@my_weight_goal_bot 93.05 kg`.
3. Reply with the target weight, such as `80 kg`.
4. Reply with the target date, such as `31 Dec 2026`.
5. Review the details and press “Create”.

The bot sends a weekly plan with dates, target weights, and the grams to lose at each checkpoint.

## Weekly check-in

Send a new photo that mentions the bot and includes your current weight: `@my_weight_goal_bot 88.3 kg`. The bot records it, evaluates the weekly checkpoint, and sends a progress chart. You can check in at any time, but at least once a week is recommended.

## Commands

| Command | What it does |
|---|---|
| `/goal` | Create a new goal or replace the active one. The old goal remains in history. |
| `/status` | Show the goal, current weekly checkpoint, and progress chart. |
| `/schedule` | Show the corrected weekly plan again. |
| `/settings` | Choose a language. |
| `/help` | Show the short command list. |

In a group, mention the bot with the command or use `/command@my_weight_goal_bot`.

If a goal is already active, `/goal` first asks you to confirm the replacement with buttons. After confirming, send a new starting photo by mentioning the bot or replying to its prompt. Put the weight in the caption or send it separately when the bot asks. The old goal is archived only after the new one is created.

## Plans, charts, and achievements

- Full weeks are balanced as evenly as possible in 50 g steps; the first and last partial weeks may be smaller.
- The final target weight and date always remain exact.
- Graphic responses are limited to one image per user per minute.
- On Thursdays, the bot reminds you about the current checkpoint; on Sunday at 10:00, it reminds you again if the week has no check-in.
- Completed weeks unlock the capybara achievement sequence.
- Change the language at any time with `/settings` or the buttons in a private chat with the bot.

This is a motivational tool, not medical advice.

[Open the bot](https://t.me/my_weight_goal_bot) · [Source code](https://github.com/IgorShadurin/weight-telegram-bot)

---

[Русский](../ru/) · [English](../en/) · [中文](../zh/) · [Español](../es/) · [Português](../pt/) · [Deutsch](../de/) · [Français](../fr/) · [日本語](../ja/) · [Bahasa Indonesia](../id/)
