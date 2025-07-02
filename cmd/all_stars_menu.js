const { ovlcmd } = require("../lib/ovlcmd");

const gifIntro = 'https://files.catbox.moe/7033mc.mp4';

ovlcmd(
  {
    nom_cmd: "menuneo🔷",
    classe: "Other",
    react: "📘",
    desc: "Affiche le menu NEO",
  },
  async (ms_org, ovl, { arg, ms }) => {
    if (!arg || arg.length === 0) {
      await ovl.sendMessage(ms_org, {
        video: { url: gifIntro },
        gifPlayback: true,
        caption: ""
      }, { quoted: ms });

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
      await ovl.sendMessage(ms_org, {
        video: { url: gifIntro },
        gifPlayback: true,
        caption: ""
      }, { quoted: ms });

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
      await ovl.sendMessage(ms_org, {
        video: { url: gifIntro },
        gifPlayback: true,
        caption: ""
      }, { quoted: ms });

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
      await ovl.sendMessage(ms_org, {
        video: { url: gifIntro },
        gifPlayback: true,
        caption: ""
      }, { quoted: ms });

      const lien = "https://files.catbox.moe/l8p3xn.jpg";
      const msg = "";
      await ovl.sendMessage(ms_org, { image: { url: lien }, caption: msg }, { quoted: ms });
    }
  }
);

ovlcmd(
  {
    nom_cmd: "pave",
    classe: "Other",
    react: "🎮",
    desc: "Affiche le controller pave",
  },
  async (ms_org, ovl, { ms }) => {
    await ovl.sendMessage(ms_org, {
      video: { url: gifIntro },
      gifPlayback: true,
      caption: ""
    }, { quoted: ms });

    const texte = `░▒░ *🎮CONTROLLER📱*░▒░
                          ▔▔▔▔▔▔▔                                     
🎧 \`𝗖𝗵𝗮𝘁\`: 
  ▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔    
🎮 *\`Actions\`*:

🌀👊🏽 
 
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔                                     
🌀 *ALL STARS⭐BATTLE ARENA🎮*   
> NEOverse🔷 Text Gaming Esports Roleplay`;

    await ovl.sendMessage(ms_org, { text: texte }, { quoted: ms });
  }
);
