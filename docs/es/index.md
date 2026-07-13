---
layout: default
title: Weight Goal Bot — Instrucciones
lang: es
description: Seguimiento compartido de metas de peso con fotos, recordatorios, gráficas y logros en Telegram
---

# Instrucciones de Weight Goal Bot

[@my_weight_goal_bot](https://t.me/my_weight_goal_bot) ayuda a una persona o a varios miembros del chat a rendir cuentas y avanzar hacia sus metas de peso. Los registros con foto permiten que las personas del grupo vean y comprueben el progreso; el bot guarda cada peso, organiza la trayectoria semanal y envía recordatorios para que nadie pierda el ritmo ni olvide registrarse. Cada hito semanal desbloquea un logro divertido de la capibara.

## Cómo empezar

1. Añade el bot a un grupo.
2. Envía una foto actual con el texto `@my_weight_goal_bot 93,05 kg`.
3. Responde con el peso objetivo, por ejemplo `80 kg`.
4. Responde con la fecha límite, por ejemplo `31 de diciembre de 2026`.
5. Revisa los datos y pulsa «Crear».

El bot enviará un plan semana a semana con fechas, pesos objetivo y los gramos que corresponden a cada punto de control.

## Registro semanal

Envía una foto nueva, menciona al bot en el pie de foto y añade el peso actual: `@my_weight_goal_bot 88,3 kg`. El bot guardará el resultado, comprobará el objetivo semanal y enviará la gráfica. Puedes registrar el peso cuando quieras, aunque se recomienda hacerlo al menos una vez por semana.

## Comandos

| Comando | Función |
|---|---|
| `/goal` | Crear una meta o sustituir la activa; la anterior permanece en el historial. |
| `/status` | Ver la meta, el punto semanal y la gráfica. |
| `/schedule` | Volver a mostrar el plan semanal corregido. |
| `/settings` | Elegir idioma. |
| `/help` | Mostrar la lista breve de comandos. |

En el grupo, menciona al bot junto al comando o usa `/command@my_weight_goal_bot`.

Si ya hay una meta activa, `/goal` primero pedirá confirmar el cambio con botones. Después, envía una nueva foto inicial con el peso, mencionando al bot o respondiendo a su mensaje. La meta anterior se archivará solo cuando se cree la nueva.

## Plan, gráficas y logros

- Las semanas completas se equilibran en pasos de 50 g; la primera y la última semana parcial pueden ser menores.
- El peso final y la fecha siempre se mantienen exactos.
- Cada usuario puede recibir una imagen por minuto.
- Los jueves, el bot recuerda el punto semanal; el domingo a las 10:00 vuelve a avisar si aún no hay ningún registro esa semana.
- Cada semana superada desbloquea el siguiente logro de la capibara.
- Cambia el idioma cuando quieras con `/settings` o con los botones del chat privado con el bot.

Es una herramienta de motivación, no un consejo médico.

[Abrir el bot](https://t.me/my_weight_goal_bot) · [Código fuente](https://github.com/IgorShadurin/weight-telegram-bot)

---

[Русский](../ru/) · [English](../en/) · [中文](../zh/) · [Español](../es/) · [Português](../pt/) · [Deutsch](../de/) · [Français](../fr/) · [日本語](../ja/) · [Bahasa Indonesia](../id/)
