---
layout: default
title: Weight Goal Bot — Instruções
lang: pt
description: Acompanhamento coletivo de metas de peso com fotos, lembretes, gráficos e conquistas no Telegram
---

# Instruções do Weight Goal Bot

O [@my_weight_goal_bot](https://t.me/my_weight_goal_bot) ajuda uma pessoa ou vários participantes do chat a prestar contas e avançar nas próprias metas de peso. Os check-ins com foto permitem que o grupo veja e confirme o progresso; o bot registra cada peso, organiza a trajetória semanal e envia lembretes para ninguém perder o ritmo nem esquecer de se pesar. Cada etapa semanal concluída libera uma conquista divertida da capivara.

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

Se já houver uma meta ativa, `/goal` primeiro pedirá a confirmação da troca por botões. Depois, envie uma nova foto inicial com o peso, marcando o bot ou respondendo à mensagem dele. A meta anterior só será arquivada quando a nova for criada.

## Plano, gráficos e conquistas

- As semanas completas são equilibradas em passos de 50 g; a primeira e a última semana parcial podem ser menores.
- O peso final e a data permanecem exatos.
- Cada usuário pode receber uma imagem por minuto.
- Às quintas-feiras, o bot lembra o checkpoint; no domingo às 10:00, envia outro aviso se a semana ainda não tiver check-in.
- Cada semana concluída libera a próxima conquista da capivara.
- Troque o idioma quando quiser com `/settings` ou pelos botões do chat privado com o bot.

Esta é uma ferramenta de motivação, não uma orientação médica.

[Abrir o bot](https://t.me/my_weight_goal_bot) · [Código-fonte](https://github.com/IgorShadurin/weight-telegram-bot)

---

[Русский](../ru/) · [English](../en/) · [中文](../zh/) · [Español](../es/) · [Português](../pt/) · [Deutsch](../de/) · [Français](../fr/) · [日本語](../ja/) · [Bahasa Indonesia](../id/)
