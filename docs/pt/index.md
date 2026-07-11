---
layout: default
title: Weight Goal Bot — Instruções
lang: pt
description: Metas semanais de peso, check-ins, gráficos de progresso e lembretes em grupos do Telegram
---

# Instruções do Weight Goal Bot

O [@my_weight_goal_bot](https://t.me/my_weight_goal_bot) acompanha sua meta de peso dentro de um grupo do Telegram. No privado, use `/status` para ver a meta e o gráfico, `/schedule` para o plano semanal ou troque o idioma. A criação de metas e os check-ins com foto funcionam somente em grupos.

## Como começar

1. Adicione o bot a um grupo.
2. Envie uma foto atual com a legenda `@my_weight_goal_bot 93,05 kg`.
3. Responda com o peso-alvo, por exemplo `80 kg`.
4. Responda com a data final, por exemplo `31 de dezembro de 2026`.
5. Confira os dados e toque em “Criar”.

O bot enviará um plano semana a semana com datas, pesos-alvo e a quantidade de gramas de cada checkpoint.

## Check-in semanal

Envie uma foto nova, marque o bot na legenda e informe o peso atual: `@my_weight_goal_bot 88,3 kg`. O bot salva o resultado, avalia o checkpoint da semana e envia o gráfico. Você pode fazer check-in quando quiser, mas o ideal é pelo menos uma vez por semana.

## Comandos

| Comando | O que faz |
|---|---|
| `/goal` | Criar uma meta ou substituir a ativa; a anterior fica no histórico. |
| `/status` | Mostrar a meta, o checkpoint semanal e o gráfico. |
| `/schedule` | Mostrar novamente o plano semanal corrigido. |
| `/settings` | Escolher o idioma. |
| `/help` | Mostrar a lista curta de comandos. |

No grupo, marque o bot junto com o comando ou use `/command@my_weight_goal_bot`.

## Plano, gráficos e conquistas

- As semanas completas são equilibradas em passos de 50 g; a primeira e a última semana parcial podem ser menores.
- O peso final e a data permanecem exatos.
- Cada usuário pode receber uma imagem por minuto.
- Às quintas-feiras, o bot lembra o checkpoint se ele ainda estiver pendente.
- Cada semana concluída libera a próxima conquista da capivara.
- Troque o idioma quando quiser com `/settings` ou pelos botões do chat privado com o bot.

Esta é uma ferramenta de motivação, não uma orientação médica.

[Abrir o bot](https://t.me/my_weight_goal_bot) · [Código-fonte](https://github.com/IgorShadurin/weight-telegram-bot)

---

[Русский](../ru/) · [English](../en/) · [中文](../zh/) · [Español](../es/) · [Português](../pt/) · [Deutsch](../de/) · [Français](../fr/) · [日本語](../ja/) · [Bahasa Indonesia](../id/)
