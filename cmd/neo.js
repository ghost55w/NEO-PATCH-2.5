// Import du client Baileys
const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys");

// Import éventuel de ton système de commande
const { ovlcmd } = require("../lib/ovlcmd");

// Le lien de ton GIF intro
const gifIntro = 'https://files.catbox.moe/yimc4o.mp4';

// Exemple : si ton fichier principal crée déjà le client ailleurs, ne refais pas makeWASocket ici.
// Sinon tu peux initialiser Baileys comme ceci :
async function createConnection() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth_info');
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: true
  });

  sock.ev.on('creds.update', saveCreds);
  return sock;
}

// Remplacement des ovl.sendMessage() → sock.sendMessage()

ovlcmd(
  {
    nom_cmd: "menuneo🔷",
    classe: "Neomenu🔷",
    react: "👾",
    desc: "Affiche le menu NEO",
  },
  async (ms_org, sock, { arg, ms }) => {
    if (!arg || arg.length === 0) {
      const lien = "https://files.catbox.moe/x1shw4.jpg";
      const msg = `Bienvenue à NEOverse🔷, votre communauté de jeux text gaming RPTG🎮 sur whatsapp🪀par sa Majesté NEO KÏNGS⚜. Veuillez tapez les commandes pour être introduit à notre NE🌀Galaxy:
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔░▒▒░
+Gamepass🎮 (pour voir nos jeux)
+NSL🏆(pour voir les infos de la ligue
+Neoawards💫 ( remise des prix).


🔷NEOVERSE🎮`;
      await sock.sendMessage(ms_org, { image: { url: lien }, caption: msg }, { quoted: ms });
    }
  }
);

ovlcmd(
  {
    nom_cmd: "gamepass🎮",
    classe: "Neomenu🔷",
    react: "👾",
    desc: "Affiche les passes de jeu",
  },
  async (ms_org, sock, { arg, ms }) => {
    if (!arg || arg.length === 0) {
      await sock.sendMessage(
        ms_org,
        {
          video: { url: "https://files.catbox.moe/yimc4o.mp4" },
          gifPlayback: true,
          caption: ""
        },
        { quoted: ms }
      );

      const lien = "https://files.catbox.moe/o2acuc.jpg";
      const msg = `;🎮GAMEPASS🔷NEOVERSE
𝖡𝗂𝖾𝗇𝗏𝖾𝗇𝗎𝖾 𝖽𝖺𝗇𝗌 𝗅𝖾 𝖦𝖠𝖬𝖤𝖯𝖠𝖲𝖲,𝖯𝖫𝖠𝖸🎮 𝖺 𝗍𝖾𝗌 𝗃𝖾𝗎𝗑 𝖺𝗎 𝗆êm𝖾 𝖾𝗇𝖽𝗋𝗈𝗂𝗍🪀:
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔░▒▒░
+Allstars🌀 +Bluelock⚽  +Elysium💠


🔷NEOVERSE🎮
`;

      await sock.sendMessage(ms_org, { image: { url: lien }, caption: msg }, { quoted: ms });
    }
  }
);



//commande pour afficher le neoawards
ovlcmd(
  {
    nom_cmd: "neoawards💫",
    classe: "Neomenu🔷",
    react: "💫",
  },
  async (ms_org, sock, { arg, ms }) => {
    if (!arg || arg.length === 0) {
      await sock.sendMessage(ms_org, {
        video: { url: "https://files.catbox.moe/n0v33m.mp4" },
        gifPlayback: true,
        caption: ""
      }, { quoted: ms });

      const liens = [
        "https://files.catbox.moe/1x8l2t.jpg",
        "https://files.catbox.moe/223y4n.jpg",
      ];
      const msg = "";
      for (const lien of liens) {
        await sock.sendMessage(ms_org, { image: { url: lien }, caption: msg }, { quoted: ms });
      }
    }
  }
);
