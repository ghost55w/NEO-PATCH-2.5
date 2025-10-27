const { ovlcmd } = require("../lib/ovlcmd");

const gifIntro = 'https://files.catbox.moe/7033mc.mp4';

ovlcmd(
  {
    nom_cmd: "menuneo🔷",
    classe: "AllStars🔷",
    react: "📘",
    desc: "Affiche le menu NEO",
  },
  async (ms_org, ovl, { arg, ms }) => {
    if (!arg || arg.length === 0) {
      /*  await ovl.sendMessage(ms_org, {
          video: { url: gifIntro },
          gifPlayback: true,
          caption: ""
        }, { quoted: ms });
  */
      const lien = "https://files.catbox.moe/x1shw4.jpg";
      const msg = `Bienvenue à NEOverse🔷, votre communauté de jeux text gaming RPTG🎮 sur whatsapp🪀par sa Majesté NEO KÏNGS⚜. Veuillez tapez les commandes pour être introduit à notre NE🌀Galaxy:
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔░▒▒░
+Gamepass🎮 (pour voir nos jeux)
+NSLpro🏆 (infos de la ligue) 
+Neoawards💫 (remise des prix).


🔷NEOVERSE🎮 `;
      await ovl.sendMessage(ms_org, { image: { url: lien }, caption: msg }, { quoted: ms });
    }
  }
);

ovlcmd(
  {
    nom_cmd: "gamepass🎮",
    classe: "AllStars🔷",
    react: "🎮",
    desc: "Affiche les passes de jeu",
  },
  async (ms_org, ovl, { arg, ms }) => {
    if (!arg || arg.length === 0) {
      await ovl.sendMessage(ms_org, {
        video: { url: "https://files.catbox.moe/yimc4o.mp4" },
        gifPlayback: true,
        caption: ""
      }, { quoted: ms });

      const lien = "https://files.catbox.moe/o2acuc.jpg";
      const msg = `*🎮GAMEPASS🔷NEOVERSE*
𝖡𝗂𝖾𝗇𝗏𝖾𝗇𝗎𝖾 𝖽𝖺𝗇𝗌 𝗅𝖾 𝖦𝖠𝖬𝖤𝖯𝖠𝖲𝖲,𝖯𝖫𝖠𝖸🎮 𝖺 𝗍𝖾𝗌 𝗃𝖾𝗎𝗑 𝖺𝗎 𝗆êm𝖾 𝖾𝗇𝖽𝗋𝗈𝗂𝗍🪀:
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔░▒▒░
+Allstars🌀 +Bluelock⚽  +Elysium💠

🔷NEOVERSE🎮`;
      await ovl.sendMessage(ms_org, { image: { url: lien }, caption: msg }, { quoted: ms });
    }
  }
);

// commande pour afficher le menu allstars
ovlcmd(
  {
    nom_cmd: "allstars🌀",
    classe: "AllStars🌀",
    react: "🎮",
    desc: "Affiche l'image Allstars + le guide complet",
  },
  async (ms_org, ovl, { arg, ms }) => {
    if (!arg || arg.length === 0) {
      await ovl.sendMessage(
        ms_org,
        {
          video: { url: "https://files.catbox.moe/c4n64y.mp4" },
          gifPlayback: true,
          caption: "",
        },
        { quoted: ms }
      );

      const liens = [
        "https://files.catbox.moe/ghkdx6.jpg",
        "https://files.catbox.moe/lutca9.jpg",
        "https://files.catbox.moe/nlp2ww.jpg",
        "https://files.catbox.moe/qkcxtr.jpg",
      ];

      const msg = ""; // texte de légende optionnel
      for (const lien of liens) {
        await ovl.sendMessage(
          ms_org,
          { image: { url: lien }, caption: msg },
          { quoted: ms }
        );
      }
    }
  }
);

// commande pour envoyer le pave
ovlcmd(
  {
    nom_cmd: "pave",
    classe: "AllStars🌀",
    react: "🎮",
    desc: "Affiche le controller pave",
  },
  async (ms_org, ovl, { ms }) => {
    // Si tu veux envoyer un GIF d'intro, décommente les lignes ci-dessous :
    /*
    const gifIntro = "https://files.catbox.moe/yimc4o.mp4";
    await sock.sendMessage(
      ms_org,
      {
        video: { url: gifIntro },
        gifPlayback: true,
        caption: "",
      },
      { quoted: ms }
    );
    */

    const texte = `
░▒░ 🎮 CONTROLLER 🪀📱 ░▒░
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
🎧 Chat:
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
🎮 Actions:

🌀👊🏽 

▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
            *🔆ALL STARS JUMP🌀*;

    await ovl.sendMessage(ms_org, { text: texte }, { quoted: ms });
  }
);

// commande nslpro
ovlcmd(
  {
    nom_cmd: "nslpro🏆",
    classe: "AllStars🔷",
    react: "🏆",
    desc: "Affiche la présentation NSL Pro",
  },
  async (ms_org, ovl, { arg, ms }) => {
    if (!arg || arg.length === 0) {
      await ovl.sendMessage(
        ms_org,
        {
          video: { url: "https://files.catbox.moe/jy3r7a.mp4" },
          gifPlayback: true,
          caption: "",
        },
        { quoted: ms }
      );

      const liens = [
        "https://files.catbox.moe/afvfo8.jpg",
        "https://files.catbox.moe/mvlx23.jpg",
      ];

      const msg = "";
      for (const lien of liens) {
        await ovl.sendMessage(
          ms_org,
          { image: { url: lien }, caption: msg },
          { quoted: ms }
        );
      }
    }
  }
);
