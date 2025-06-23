const { ovlcmd } = require("../lib/ovlcmd");
const { getData, setfiche } = require('../DataBase/allstars_divs_fiches');

function normalizeText(text) {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function add_fiche(nom_joueur, jid, image_oc, joueur_div) {
  ovlcmd({
    nom_cmd: nom_joueur,
    classe: joueur_div,
    react: "✅"
  },
  async (ms_org, ovl, cmd_options) => {
    const { repondre, ms, arg, superUser } = cmd_options;

    try {
      const data = await getData(jid);

      if (!arg.length) {
        const fiche = `░▒▒░░▒░ *👤N E O P L A Y E R 🎮*
▔▔▔▔▔▔▔▔▔▔▔▔▔░▒▒▒▒░░▒░
◇ *Pseudo👤*: ${data.pseudo}
◇ *Classement continental🌍:* ${data.classement}
◇ *Niveau XP⏫*: ${data.niveu_xp} ⏫
◇ *Division🛡️*: ${data.division}
◇ *Rank 🎖️*: ${data.rang}
◇ *Classe🎖️*: ${data.classe}
◇ *Saisons Pro🏆*: ${data.saison_pro}
▔▔▔▔▔▔▔▔▔▔▔░▒▒▒▒░░▒░
◇ *Golds🧭*: ${data.golds}
◇ *Fans👥*: ${data.fans}
◇ *Archetype ⚖️*: ${data.archetype}
◇ *Commentaire*: ${data.commentaire}
░▒░░ PALMARÈS🏆
▔▔▔▔▔▔▔▔▔▔▔░▒▒▒▒░░▒░
✅ Victoires: ${data.victoires} - ❌ Défaites: ${data.defaites}
◇ 🏆 Championnats: ${data.championnants}
◇ 💫 NEO Cup: ${data.neo_cup}
◇ 💠 EVO: ${data.evo}
◇ 🅰️ GrandSlam: ${data.grandslam}
◇ 🌟 TOS: ${data.tos}
◇ 👑 The BEST: ${data.the_best}
◇ 🎗 Laureat: ${data.laureat}
◇ 🗿 Sigma: ${data.sigma}
◇ 🎖 Neo Globes: ${data.neo_globes}
◇ 🏵 Golden Boy: ${data.golden_boy}
▔▔▔▔▔▔▔▔▔▔▔░▒▒▒▒░░▒░
✅ Cleans: ${data.cleans}
❌ Erreurs: ${data.erreurs}
📈 Note: ${data.note}/100
░▒░▒░ CITATION 🫵🏻
▔▔▔▔▔▔▔▔▔▔▔░▒▒▒▒░░▒░
> << ${data.citation} >>

░▒░▒░ STATS 📊
▔▔▔▔▔▔▔▔▔▔▔░▒▒▒▒░░▒░
⌬ Talent🧠: ${data.talent}
⌬ Puissance🏆: ${data.puissance}
⌬ Speed💬: ${data.speed}
⌬ Close combat👊🏻: ${data.close_combat}
⌬ Attaques🌀: ${data.attaques}
░▒░▒░ CARDS 🎴: ${data.total_cards}
▔▔▔▔▔▔▔▔▔▔▔░▒▒▒▒░░▒░
᪣ ${data.cards}
▱▱▱▱ ▱▱▱▱
*⌬𝗡SL🏆*
> NEO SUPER LEAGUE ESPORTS ROLEPLAY™`;

        return ovl.sendMessage(ms_org, { image: { url: image_oc }, caption: fiche }, { quoted: ms });
      }

      if (!superUser) return await repondre("⛔ Accès refusé ! Seuls les membres de la NS peuvent faire ça 😎");

      const updates = await processUpdates(arg, jid);
      await updatePlayerData(updates, jid);

      const message = updates.map(u =>
        `🛠️ *${u.colonne}* modifié : \`${u.oldValue}\` ➤ \`${u.newValue}\``
      ).join('\n');

      await repondre("✅ Fiche mise à jour avec succès !\n\n" + message);

    } catch (err) {
      console.error("Erreur:", err);
      await repondre("❌ Une erreur est survenue. Vérifie les paramètres.");
    }
  });
}

async function processUpdates(args, jid) {
  const updates = [];
  const data = await getData(jid);
  let i = 0;

  while (i < args.length) {
    const object = args[i++];
    const signe = args[i++];
    const valeur = args[i++];
    const texte = [];

    while (i < args.length && !['+', '-', '=', 'add', 'supp'].includes(args[i])) {
      texte.push(args[i++]);
    }

    if (!Object.keys(data.dataValues).includes(object)) {
      throw new Error(`❌ La colonne '${object}' n'existe pas.`);
    }

    const oldValue = data[object];
    let newValue;

    if (signe === '+' || signe === '-') {
      newValue = eval(`${oldValue} ${signe} ${valeur}`);
    } else if (signe === '=') {
      newValue = texte.join(' ');
    } else if (signe === 'add') {
      newValue = (oldValue + ' ' + texte.join(' ')).trim();
    } else if (signe === 'supp') {
      const regex = new RegExp(`\\b${normalizeText(texte.join(' '))}\\b`, 'gi');
      newValue = oldValue.replace(regex, '').trim();
    } else {
      throw new Error(`❌ Signe non reconnu : ${signe}`);
    }

    updates.push({ colonne: object, oldValue, newValue });
  }

  return updates;
}

async function updatePlayerData(updates, jid) {
  for (const update of updates) {
    await setfiche(update.colonne, update.newValue, jid);
  }
}

// Ajout des joueurs
add_fiche('westnash👤', '2', 'https://files.catbox.moe/w4sso3.jpg');
add_fiche('westindra👤', '3', 'https://files.catbox.moe/dgkvph.jpg');
add_fiche('westaether👤', '4', 'https://files.catbox.moe/yjvd63.jpg');
add_fiche('westsept👤', '7', 'https://files.catbox.moe/uev2zx.jpg');
add_fiche('westinferno👤', '9', 'https://files.catbox.moe/dv23bc.jpg');
add_fiche('westhajime👤', '10', 'https://files.catbox.moe/4pxl7h.jpg');
