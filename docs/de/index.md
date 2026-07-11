---
layout: default
title: Weight Goal Bot — Anleitung
lang: de
description: Wöchentliche Gewichtsziele, Check-ins, Fortschrittskurven und Erinnerungen in Telegram-Gruppen
---

# Anleitung für Weight Goal Bot

[@my_weight_goal_bot](https://t.me/my_weight_goal_bot) begleitet dein Gewichtsziel in einer Telegram-Gruppe. Im Privat-Chat kannst du diese Anleitung öffnen und die Sprache ändern; Ziele und Check-ins funktionieren nur in Gruppen.

## So geht es los

1. Füge den Bot einer Gruppe hinzu.
2. Sende ein aktuelles Foto mit der Bildunterschrift `@my_weight_goal_bot 93,05 kg`.
3. Antworte mit dem Zielgewicht, zum Beispiel `80 kg`.
4. Antworte mit dem Zieldatum, zum Beispiel `31. Dezember 2026`.
5. Prüfe die Angaben und tippe auf „Erstellen“.

Der Bot sendet einen Wochenplan mit Terminen, Zielgewichten und den Gramm pro Etappe.

## Wöchentlicher Check-in

Sende ein neues Foto, erwähne den Bot in der Bildunterschrift und ergänze dein aktuelles Gewicht: `@my_weight_goal_bot 88,3 kg`. Der Bot speichert den Wert, bewertet die Wochenetappe und sendet die Fortschrittskurve. Check-ins sind jederzeit möglich, empfohlen ist mindestens einmal pro Woche.

## Befehle

| Befehl | Funktion |
|---|---|
| `/goal` | Neues Ziel erstellen oder das aktive ersetzen; das alte bleibt im Verlauf. |
| `/status` | Ziel, aktuelle Wochenetappe und Fortschrittskurve anzeigen. |
| `/schedule` | Den korrigierten Wochenplan erneut anzeigen. |
| `/settings` | Sprache auswählen. |
| `/help` | Kurze Befehlsübersicht anzeigen. |

Erwähne den Bot in der Gruppe zusammen mit dem Befehl oder nutze `/command@my_weight_goal_bot`.

## Plan, Diagramme und Erfolge

- Volle Wochen werden in 50-g-Schritten möglichst gleichmäßig verteilt; die erste und letzte Teilwoche dürfen kleiner sein.
- Endgewicht und Zieldatum bleiben immer exakt.
- Pro Nutzer wird höchstens ein Bild pro Minute erzeugt.
- Donnerstags erinnert der Bot an eine noch offene Wochenetappe.
- Abgeschlossene Wochen schalten nacheinander die Capybara-Erfolge frei.
- Die Sprache lässt sich jederzeit mit `/settings` oder über die Schaltflächen im Privat-Chat mit dem Bot ändern.

Dieses Tool dient der Motivation und ersetzt keine medizinische Beratung.

[Bot öffnen](https://t.me/my_weight_goal_bot) · [Quellcode](https://github.com/IgorShadurin/weight-telegram-bot)

---

[Русский](../ru/) · [English](../en/) · [中文](../zh/) · [Español](../es/) · [Português](../pt/) · [Deutsch](../de/) · [Français](../fr/) · [日本語](../ja/) · [Bahasa Indonesia](../id/)
