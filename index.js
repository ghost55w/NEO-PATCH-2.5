const fs = require('fs');
const path = require('path');
const pino = require("pino");
const axios = require('axios');

const {
  default: makeWASocket,
  makeCacheableSignalKeyStore,
  Browsers,
  fetchLatestBaileysVersion,
  delay
} = require("@whiskeysockets/baileys");

const get_session = require('./DataBase/session');
const { useSQLiteAuthState, WAAuth } = require('./lib/OvlAuth');
const { getMessage } = require('./lib/store');
const config = require("./set");

const {
  message_upsert,
  group_participants_update,
  connection_update,
  dl_save_media_ms,
  recup_msg
} = require('./Ovl_events');

async function startPrincipalSession() {
  const instanceId = "principale";
  const credsPath = path.join(__dirname, `./auth/${instanceId}_store.db`);

  if (!fs.existsSync(credsPath)) {
    try {
      const auth = await get_session(config.SESSION_ID);
      if (!auth) return;

      await WAAuth.upsert({ key: `creds--${instanceId}`, value: auth.creds || null });
      await WAAuth.upsert({ key: `keys--${instanceId}`, value: auth.keys || null });
    } catch (err) {
      console.log(`❌ Erreur récupération creds pour ${instanceId} :`, err.message);
      return;
    }
  }

  try {
    const { state, saveCreds } = await useSQLiteAuthState(instanceId);
    const { version } = await fetchLatestBaileysVersion();

    const ovl = makeWASocket({
      version,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }).child({ level: 'silent' }))
      },
      logger: pino({ level: 'silent' }),
      browser: Browsers.ubuntu('Chrome'),
      printQRInTerminal: false,
      keepAliveIntervalMs: 10000,
      markOnlineOnConnect: false,
      generateHighQualityLinkPreview: true,
      getMessage: async (key) => {
        const msg = getMessage(key.id);
        return msg?.message || undefined;
      }
    });

    ovl.ev.on("messages.upsert", async (m) => message_upsert(m, ovl));
    ovl.ev.on("group-participants.update", async (data) => group_participants_update(data, ovl));
    ovl.ev.on("connection.update", (update) => connection_update(update, ovl, startPrincipalSession));
    ovl.ev.on("creds.update", saveCreds);

    ovl.dl_save_media_ms = (msg, filename = '', attachExt = true, dir = './downloads') =>
      dl_save_media_ms(ovl, msg, filename, attachExt, dir);

    ovl.recup_msg = (params = {}) => recup_msg({ ovl, ...params });

    console.log("✅ Session principale démarrée");
  } catch (err) {
    console.error("❌ Erreur au lancement :", err.message || err);
  }
}

startPrincipalSession().catch((err) => {
  console.error("❌ Erreur inattendue :", err.message || err);
});

// Express web server pour les pings
const express = require('express');
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
  setupAutoPing(`http://localhost:${port}/`);
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
  console.log('Une erreur inattendue est survenue :', e.message);
});
