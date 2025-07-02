const { ovlcmd } = require("../lib/ovlcmd");

ovlcmd(
  {
    nom_cmd: "menuneo🔷",
    classe: "Other",
    react: "📘",
    desc: "Affiche le menu NEO",
  },
  async (ms_org, ovl, { arg, ms }) => {
    if (!arg || arg.length === 0) {
      const lien = "https://files.catbox.moe/1ve4m6.jpg";
      const msg = "";
      await ovl.sendMessage(ms_org, { image: { url: lien }, caption: msg }, { quoted: ms });
    }
  }
);

ovlcmd(
  {
    nom_cmd: "gamepass🎮",
    classe: "Other",
    react: "🎮",
    desc: "Affiche les passes de jeu",
  },
  async (ms_org, ovl, { arg, ms }) => {
    if (!arg || arg.length === 0) {
      const lien = "https://files.catbox.moe/17sok6.jpg";
      const msg = "";
      await ovl.sendMessage(ms_org, { image: { url: lien }, caption: msg }, { quoted: ms });
    }
  }
);

ovlcmd(
  {
    nom_cmd: "guide",
    classe: "Other",
    react: "📘",
    desc: "Affiche le guide complet",
  },
  async (ms_org, ovl, { arg, ms }) => {
    if (!arg || arg.length === 0) {
      const liens = [
        "https://files.catbox.moe/mld35g.jpg",
        "https://files.catbox.moe/agapcu.jpg",
        "https://files.catbox.moe/nlp2ww.jpg",
        "https://files.catbox.moe/qkcxtr.jpg",
      ];
      const msg = "";
      for (const lien of liens) {
        await ovl.sendMessage(ms_org, { image: { url: lien }, caption: msg }, { quoted: ms });
      }
    }
  }
);

ovlcmd(
  {
    nom_cmd: "allstars🌀",
    classe: "Other",
    react: "🌟",
    desc: "Affiche l’image Allstars",
  },
  async (ms_org, ovl, { arg, ms }) => {
    if (!arg || arg.length === 0) {
      const lien = "https://files.catbox.moe/l8p3xn.jpg";
      const msg = "";
      await ovl.sendMessage(ms_org, { image: { url: lien }, caption: msg }, { quoted: ms });
    }
  }
);
