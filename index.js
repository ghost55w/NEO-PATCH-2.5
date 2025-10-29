const fs = require('fs');
const path = require('path');
const pino = require("pino");
const axios = require('axios');
const express = require('express');
const {
  default: makeWASocket,
  makeCacheableSignalKeyStore,
  Browsers,
  useMultiFileAuthState
} = require("@whiskeysockets/baileys");
const { get_session, restaureAuth } = require('./DataBase/session');
const config = require('./set');
const {
  message_upsert,
  group_participants_update,
  connection_update,
  dl_save_media_ms,
  recup_msg
} = require('./Ovl_events');

async function main() {
  try {
    const instanceId = "principale";
    const sessionData = await get_session(config.SESSION_ID);
    await restaureAuth(instanceId, sessionData.creds, sessionData.keys);
    const { state, saveCreds } = await useMultiFileAuthState(`./auth/${instanceId}`);
    const ovl = makeWASocket({
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(
          state.keys,
          pino({ level: 'silent' }).child({ level: 'silent' })
        )
      },
      logger: pino({ level: 'silent' }),
      browser: Browsers.ubuntu('Chrome'),
      markOnlineOnConnect: false,
      generateHighQualityLinkPreview: true
    });
    ovl.ev.on("messages.upsert", async (m) => message_upsert(m, ovl));
    ovl.ev.on("group-participants.update", async (data) => group_participants_update(data, ovl));
    ovl.ev.on("connection.update", (update) => connection_update(update, ovl));
    ovl.ev.on("creds.update", saveCreds);
    ovl.dl_save_media_ms = (msg, filename = '', attachExt = true, dir = './downloads') =>
      dl_save_media_ms(ovl, msg, filename, attachExt, dir);
    ovl.recup_msg = (params = {}) => recup_msg({ ovl, ...params });
    console.log("✅ Session principale démarrée");
  } catch (err) {
    console.error("❌ Erreur au lancement :", err.message || err);
  }
}

main().catch((err) => {
  console.error("❌ Erreur inattendue :", err);
});

const app = express();
const port = process.env.PORT || 3000;
let dernierPingRecu = Date.now();

app.get('/', (req, res) => {
  dernierPingRecu = Date.now();
  res.send(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>OVL-Bot Web Page</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      background-color: #121212;
      font-family: Arial, sans-serif;
      color: #fff;
      overflow: hidden;
    }
    .content {
      text-align: center;
      padding: 30px;
      background-color: #1e1e1e;
      border-radius: 12px;
      box-shadow: 0 8px 20px rgba(255,255,255,0.1);
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }
    .content:hover {
      transform: translateY(-5px);
      box-shadow: 0 12px 30px rgba(255,255,255,0.15);
    }
    h1 {
      font-size: 2em;
      color: #f0f0f0;
      margin-bottom: 15px;
      letter-spacing: 1px;
    }
    p {
      font-size: 1.1em;
      color: #d3d3d3;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="content">
    <h1>Bienvenue sur NEO-BOT</h1>
    <p>Votre assistant WhatsApp</p>
  </div>
</body>
</html>`);
});

app.listen(port, () => {
  console.log("Listening on port: " + port);
  let publicURL;
  if (process.env.RENDER_EXTERNAL_URL) publicURL = process.env.RENDER_EXTERNAL_URL;
  else if (process.env.KOYEB_PUBLIC_DOMAIN) publicURL = `https://${process.env.KOYEB_PUBLIC_DOMAIN}`;
  else publicURL = `http://localhost:${port}`;
  setupAutoPing(publicURL);
});

function setupAutoPing(url) {
  setInterval(async () => {
    try {
      const res = await axios.get(url);
      if (res.data) {
        console.log(`Ping: OVL-MD-V2✅`);
      }
    } catch (err) {
      console.error('Erreur lors du ping', err.message);
    }
  }, 30000);
}

process.on('uncaughtException', async (e) => {
  console.error('Une erreur inattendue est survenue :', e);
});
// ==============================
// NEO-BOT-MD — Version Render 24h
// ==============================

import makeWASocket, { useMultiFileAuthState, DisconnectReason } from "@whiskeysockets/baileys";
import pino from "pino";
import express from "express";
import fetch from "node-fetch";

// === 1️⃣ Initialisation Express pour garder le bot actif ===
const app = express();
app.get("/", (req, res) => res.send("🤖 NEO-BOT-MD est en ligne et actif 24h/24 !"));
app.listen(process.env.PORT || 3000, () => console.log("🌐 Serveur Keep-Alive actif sur Render"));

// === 2️⃣ Fonction principale du bot ===
async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("./session"); // dossier session
  const sock = makeWASocket({
    printQRInTerminal: true,
    logger: pino({ level: "silent" }),
    auth: state,
    browser: ["RenderBot", "Chrome", "1.0"],
  });

  // Sauvegarde automatique des credentials
  sock.ev.on("creds.update", saveCreds);

  // Gestion des mises à jour de connexion
  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === "close") {
      const reason = lastDisconnect?.error?.output?.statusCode;
      console.log("⚠️ Déconnexion détectée :", reason);

      if (reason !== DisconnectReason.loggedOut) {
        console.log("🔄 Tentative de reconnexion...");
        startBot(); // relance auto
      } else {
        console.log("❌ Session expirée. Supprime le dossier 'session' et rescanner le QR.");
      }
    } else if (connection === "open") {
      console.log("✅ Connecté à WhatsApp !");
    }
  });

  // Exemple de réponse automatique
  sock.ev.on("messages.upsert", async (msg) => {
    try {
      const m = msg.messages[0];
      if (!m.message || m.key.fromMe) return;
      const from = m.key.remoteJid;
      const text = m.message.conversation || m.message.extendedTextMessage?.text || "";

      if (text.toLowerCase() === "ping") {
        await sock.sendMessage(from, { text: "🏓 Pong ! Le bot est en ligne." });
      }
    } catch (err) {
      console.error("Erreur message :", err);
    }
  });
}

startBot();

// === 3️⃣ Keep Alive — Ping automatique vers ton lien Render ===
// ⚠️ Remplace ci-dessous ton lien Render EXACT :
const RENDER_URL = "https://ton-lien-render.onrender.com";

setInterval(() => {
  fetch(RENDER_URL)
    .then(() => console.log("⏱️ Ping envoyé pour garder le bot actif"))
    .catch((err) => console.error("Erreur ping :", err));
}, 5 * 60 * 1000); // toutes les 5 minutes

// ==============================
// Fin du code
// ==============================
