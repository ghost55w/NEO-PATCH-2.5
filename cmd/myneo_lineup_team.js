const { ovlcmd } = require('../lib/ovlcmd');
const { MyNeoFunctions, TeamFunctions, BlueLockFunctions } = require("../database/myneo_lineup_team");

// === 🪪 MYNEO 🔷 ===
ovlcmd(
  {
    nom_cmd: "myneo🔷",
    classe: "MyNeo🔷",
    react: "🪪",
    desc: "Afficher ou modifier les données NEO d'un joueur.",
  },
  async (ms_org, ovl, cmd_options) => {
    const { arg, auteurMessage, superUser, repondre } = cmd_options;
    let userId = auteurMessage;
    if (arg.length >= 1) {
      userId = (arg[0]?.includes("@") && `${arg[0].replace("@", "")}@lid`);
      if (!userId) return repondre("⚠️ Mentionne un utilisateur.");
    }

    try {
      let data = await MyNeoFunctions.getUserData(userId);
      if (!data) return repondre("⚠️ Aucune donnée trouvée pour cet utilisateur.");

      if (arg.length <= 1) {
        const myn = `*🎮NEOVERSE🔷 ACCOUNT🪪* ▔▔▔▔▔▔▔▔▔▔▔▔▔
👤User: ${data.users}
📳Téléphone: ${data.tel}
🎮Points de jeux: ${data.points_jeu}
🔷NEOcoins: ${data.nc}🔷
🔶NEOpoints: ${data.np}🔶
🎫Coupons: ${data.coupons}🎫
🎁Gift Box: ${data.gift_box}🎁
░░░░░░░
*🎮MY GAMES* ════════════
🌀All Stars: ${data.all_stars}
⚽Blue Lock: ${data.blue_lock}
💠Élysium: ${data.elysium}
░░░░░░░
🔷NEO🔷 ════════════`;

        return await ovl.sendMessage(ms_org, {
          image: { url: "https://files.catbox.moe/mgmrkp.jpg" },
          caption: myn
        }, { quoted: cmd_options.ms });
      }

      if (!superUser) return repondre("⚠️ Seuls les membres Premium peuvent actualiser un joueur.");

      const modifiables = [
        "users", "tel", "points_jeu", "nc", "np", "coupons", "gift_box",
        "all_stars", "blue_lock", "elysium"
      ];

      let updates = {};
      for (let i = 1; i < arg.length;) {
        const field = arg[i]?.toLowerCase();
        const op = arg[i + 1];
        if (!modifiables.includes(field) || !["=", "+", "-"].includes(op)) {
          i++;
          continue;
        }
        const isNumeric = ["points_jeu", "nc", "np", "coupons", "gift_box"].includes(field);
        let value;

        if (op === "=" && !isNumeric) {
          let valParts = [], j = i + 2;
          while (j < arg.length && !modifiables.includes(arg[j].toLowerCase())) valParts.push(arg[j++]);
          value = valParts.join(" "); i = j;
        } else {
          value = arg[i + 2]; i += 3;
        }

        if (value !== undefined) {
          if (isNumeric) {
            const val = parseInt(value);
            if (!isNaN(val)) {
              if (op === "=") updates[field] = val;
              else if (op === "+") updates[field] = data[field] + val;
              else if (op === "-") updates[field] = data[field] - val;
            }
          } else if (op === "=") updates[field] = value;
        }
      }

      if (Object.keys(updates).length > 0) {
        const message = await MyNeoFunctions.updateUser(userId, updates);
        return repondre(message);
      } else {
        return repondre("⚠️ Format incorrect ou champ non valide. Exemple : +myNeo @user nc + 200 user = Damian KÏNGS⚜️");
      }

    } catch (err) {
      console.error("❌ Erreur ligne myNeo:", err);
      return repondre("❌ Une erreur est survenue.");
    }
  }
);

// === ⚽ TEAM ===
ovlcmd(
  {
    nom_cmd: "team⚽",
    classe: "MyNeo🔷",
    react: "⚽",
    desc: "Afficher ou modifier la team d’un joueur.",
  },
  async (ms_org, ovl, cmd_options) => {
    const { arg, auteurMessage, superUser, repondre } = cmd_options;
    let userId = auteurMessage;
    if (arg.length >= 1) {
      userId = (arg[0]?.includes("@") && `${arg[0].replace("@", "")}@lid`);
      if (!userId) return repondre("⚠️ Mentionne un utilisateur.");
    }

    try {
      let data = await TeamFunctions.getUserData(userId);
      if (!data) return repondre("⚠️ Aucune donnée trouvée pour cet utilisateur.");

      if (arg.length <= 1) {
        const fiche = `░░ *👤PLAYER🥅⚽*: ${data.users}
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*🛡️Team:* ${data.team}
*⬆️Points de jeu:* ${data.points_jeu} XP
*🎖️Rang:* ${data.rank}
*💰Argent:* ${data.argent} 💶
*🏆Puissance d'équipe:* ${data.puissance}⏫
*🎖️Classement d'équipe:* ${data.classement}

░░ *📊RECORDS⚽🥅*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
⚽Wins: ${data.wins}   ❌Loss: ${data.loss}   🫱🏼‍🫲🏽Draws: ${data.draws}
🏆Championnats: ${data.championnats}    🏆NEL: ${data.nel}

🥅 +Lineup⚽: ⚠️pour voir la formation
🌍+player⚽: ⚠️pour voir son Hero
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔ 
         ⚽🔷 *BLUE LOCK NEO🥅*▱▱▱`;

        return await ovl.sendMessage(ms_org, {
          image: { url: "https://files.catbox.moe/2patx3.jpg" },
          caption: fiche,
        }, { quoted: cmd_options.ms });
      }

      if (!superUser) return repondre("⚠️ Seuls les membres de la NS peuvent actualiser une team.");

      const modifiables = [
        "users", "team", "points_jeu", "rank",
        "argent", "puissance", "classement", "wins", "loss", "draws", "championnats", "nel"
      ];

      let updates = {};
      for (let i = 1; i < arg.length;) {
        const field = arg[i]?.toLowerCase();
        const op = arg[i + 1];
        if (!modifiables.includes(field) || !["=", "+", "-"].includes(op)) { i++; continue; }

        const isNumeric = [
          "points_jeu", "argent", "puissance",
          "wins", "loss", "draws", "championnats", "nel"
        ].includes(field);

        let value;
        if (op === "=" && !isNumeric) {
          let valParts = [], j = i + 2;
          while (j < arg.length && !modifiables.includes(arg[j].toLowerCase())) valParts.push(arg[j++]);
          value = valParts.join(" "); i = j;
        } else {
          value = arg[i + 2]; i += 3;
        }

        if (value !== undefined) {
          if (isNumeric) {
            const val = parseInt(value);
            if (!isNaN(val)) {
              if (op === "=") updates[field] = val;
              else if (op === "+") updates[field] = data[field] + val;
              else if (op === "-") updates[field] = data[field] - val;
            }
          } else if (op === "=") updates[field] = value;
        }
      }

      if (Object.keys(updates).length > 0) {
        const message = await TeamFunctions.updateUser(userId, updates);
        return repondre(message);
      } else {
        return repondre("⚠️ Format incorrect ou champ non valide. Exemple : +team @user wins + 2 team = BlueLock Elite");
      }

    } catch (err) {
      console.error("❌ Erreur ligne team:", err);
      return repondre("❌ Une erreur est survenue.");
    }
  }
);

// === 📋 LINEUP ===
ovlcmd(
  {
    nom_cmd: "lineup⚽",
    classe: "MyNeo🔷",
    react: "📋",
    desc: "Afficher ou modifier l'équipe du joueur.",
  },
  async (ms_org, ovl, cmd_options) => {
    const { arg, repondre, auteurMessage } = cmd_options;
    const userId = (arg[0]?.includes("@") && `${arg[0].replace("@", "")}@lid`) || auteurMessage;

    const data = await BlueLockFunctions.getUserData(userId);
    if (!data) return repondre("⚠️ Joueur introuvable.");

    if (arg.length <= 1) {
      await ovl.sendMessage(ms_org, {
        video: { url: "https://files.catbox.moe/z64kuq.mp4" },
        caption: "",
        gifPlayback: true
      }, { quoted: cmd_options.ms });

      const lineup = `░░ *👥SQUAD⚽🥅*: ${data.nom}
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▱▱▱▱
1  👤(AG) ${data.joueur1} : ${data.stat1}%🫀
2  👤(AC) ${data.joueur2} : ${data.stat2}%🫀
3  👤(AD) ${data.joueur3} : ${data.stat3}%🫀
4  👤(MG) ${data.joueur4} : ${data.stat4}%🫀
5  👤(MC) ${data.joueur5} : ${data.stat5}%🫀
6  👤(MD) ${data.joueur6} : ${data.stat6}%🫀
7  👤(DG) ${data.joueur7} : ${data.stat7}%🫀
8  👤(DC) ${data.joueur8} : ${data.stat8}%🫀
9  👤(DD) ${data.joueur9} : ${data.stat9}%🫀
10 👤(GB) ${data.joueur10} : ${data.stat10}%🫀
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▱▱▱▱
*🔷BENCH🥅*:
11 👤${data.joueur11}
12 👤${data.joueur12}
13 👤${data.joueur13}
14 👤${data.joueur14}
15 👤${data.joueur15}

⚽🔷*BLUE LOCK NEO🥅*▱▱▱`;

      return await ovl.sendMessage(ms_org, {
        image: { url: "https://files.catbox.moe/p94q3m.jpg" },
        caption: lineup
      }, { quoted: cmd_options.ms });
    }

    const updates = {};
    for (let i = 0; i < arg.length; i += 3) {
      if (/^j\d+$/.test(arg[i]) && arg[i + 1] === "=") {
        const index = parseInt(arg[i].slice(1));
        if (index >= 1 && index <= 15) {
          updates[`joueur${index}`] = arg[i + 2];
        }
      }
    }

    if (Object.keys(updates).length > 0) {
      const message = await BlueLockFunctions.updatePlayers(userId, updates);
      return repondre(message);
    } else {
      return repondre("⚠️ Format incorrect. Utilise: +lineup j1 = Nom j2 = Nom...");
    }
  }
);
