---
layout: default
title: Weight Goal Bot — 使用说明
lang: zh
description: 多语言 Telegram 体重目标机器人的使用说明与命令
---

# Weight Goal Bot 使用说明

[@my_weight_goal_bot](https://t.me/my_weight_goal_bot) 用来在 Telegram 群聊中管理体重目标。私聊可查看说明和切换语言；创建目标与体重打卡只在群聊中进行。

## 开始使用

1. 把机器人添加到一个群聊。
2. 发送一张当前照片，配文写 `@my_weight_goal_bot 93.05 公斤`。
3. 回复目标体重，例如 `80 公斤`。
4. 回复截止日期，例如 `2026年12月31日`。
5. 检查信息后点击“就这么定”。

机器人会发送每周计划，列出日期、目标体重和每个阶段需要减掉的克数。

## 每周打卡

发送一张新照片，在配文中 @机器人并写上当前体重，例如 `@my_weight_goal_bot 88.3 公斤`。机器人会记录结果、判断本周目标并发送进度图。随时都能打卡，建议至少每周一次。

## 命令

| 命令 | 功能 |
|---|---|
| `/goal` | 新建目标或替换当前目标；旧目标会保留在历史中。 |
| `/status` | 查看目标、本周关卡和进度图。 |
| `/schedule` | 再次查看修正后的每周计划。 |
| `/settings` | 选择语言。 |
| `/help` | 查看简短命令列表。 |

在群里请同时 @机器人，或使用 `/command@my_weight_goal_bot`。

## 计划、图表与成就

- 完整周按 50 克为单位尽量均匀分配；首尾不足一周的阶段可以更少。
- 最终目标体重和日期始终保持精确。
- 每位用户每分钟最多生成一次图片。
- 如果本周目标尚未完成，机器人会在周四提醒。
- 完成每周目标可依次解锁水豚成就。

本机器人用于激励和记录，不构成医疗建议。

[打开机器人](https://t.me/my_weight_goal_bot) · [源代码](https://github.com/IgorShadurin/weight-telegram-bot)

---

[Русский](../ru/) · [English](../en/) · [中文](../zh/) · [Español](../es/) · [Português](../pt/) · [Deutsch](../de/) · [Français](../fr/) · [日本語](../ja/) · [Bahasa Indonesia](../id/)
