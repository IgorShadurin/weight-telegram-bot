---
layout: default
title: Weight Goal Bot — Petunjuk
lang: id
description: Pantau target berat bersama lewat foto, pengingat, grafik progres, dan pencapaian di Telegram
---

# Petunjuk Weight Goal Bot

[@my_weight_goal_bot](https://t.me/my_weight_goal_bot) membantu satu orang atau beberapa anggota chat tetap saling bertanggung jawab dalam mengejar target berat masing-masing. Check-in dengan foto membuat progres bisa dilihat dan dikonfirmasi oleh orang-orang di grup; bot mencatat setiap berat, menyusun perjalanan mingguan, dan mengirim pengingat agar tidak keluar jalur atau lupa check-in. Setiap pos mingguan yang tercapai membuka pencapaian kapibara yang seru.

## Cara memulai

1. Tambahkan bot ke grup.
2. Kirim foto terbaru dengan caption `@my_weight_goal_bot 93,05 kg`.
3. Balas dengan target berat, misalnya `80 kg`.
4. Balas dengan tanggal akhir, misalnya `31 Desember 2026`.
5. Periksa datanya lalu tekan “Buat”.

Bot akan mengirim rencana mingguan berisi tanggal, target berat, dan jumlah gram untuk setiap pos.

## Check-in mingguan

Kirim foto baru, mention bot di caption, lalu tulis berat saat ini: `@my_weight_goal_bot 88,3 kg`. Bot menyimpan hasilnya, menilai target minggu ini, dan mengirim grafik progres. Check-in bisa kapan saja, tetapi disarankan setidaknya sekali seminggu.

## Perintah

| Perintah | Fungsi |
|---|---|
| `/goal` | Buat target baru atau ganti target aktif; target lama tetap ada di riwayat. |
| `/status` | Tampilkan target, pos minggu ini, dan grafik progres. |
| `/schedule` | Tampilkan lagi rencana mingguan yang sudah diperbaiki. |
| `/settings` | Pilih bahasa. |
| `/help` | Tampilkan daftar perintah singkat. |

Di grup, mention bot bersama perintah atau gunakan `/command@my_weight_goal_bot`.

Jika sudah ada target aktif, `/goal` akan meminta konfirmasi lewat tombol terlebih dahulu. Setelah dikonfirmasi, kirim foto awal baru beserta beratnya dengan mention bot atau membalas pesannya. Target lama baru diarsipkan setelah target baru selesai dibuat.

## Rencana, grafik, dan pencapaian

- Minggu penuh dibagi serata mungkin dalam langkah 50 g; minggu parsial pertama dan terakhir bisa lebih kecil.
- Target berat dan tanggal akhir selalu tetap tepat.
- Setiap pengguna dapat menerima satu gambar per menit.
- Pada hari Kamis, bot mengingatkan target minggu berjalan; hari Minggu pukul 10.00, bot mengingatkan lagi jika minggu itu belum punya check-in.
- Setiap minggu yang berhasil membuka pencapaian kapibara berikutnya.
- Ganti bahasa kapan saja lewat `/settings` atau tombol di chat pribadi dengan bot.

Bot ini adalah alat motivasi, bukan saran medis.

[Buka bot](https://t.me/my_weight_goal_bot) · [Kode sumber](https://github.com/IgorShadurin/weight-telegram-bot)

---

[Русский](../ru/) · [English](../en/) · [中文](../zh/) · [Español](../es/) · [Português](../pt/) · [Deutsch](../de/) · [Français](../fr/) · [日本語](../ja/) · [Bahasa Indonesia](../id/)
