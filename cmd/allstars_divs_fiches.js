const { ovlcmd } = require("../lib/ovlcmd");
const { getData, setfiche, getAllFiches, add_id, del_fiche } = require('../DataBase/allstars_divs_fiches');

const registeredFiches = new Set();

function normalizeText(text) {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function add_fiche(nom_joueur, jid, image_oc, joueur_div) {
  if (registeredFiches.has(nom_joueur)) return;
  registeredFiches.add(nom_joueur);

  ovlcmd({
    nom_cmd: nom_joueur,
    classe: joueur_div,
    react: "✅"
  },
  async (ms_org, ovl, cmd_options) => {
    const { repondre, ms, arg, prenium_id } = cmd_options;

    try {
      const data = await getData({ id: jid });

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
◇ *Golds🧭*: ${data.golds} ©🧭
◇ *Fans👥*: ${data.fans} 👥
◇ *Archetype ⚖️*: ${data.archetype}
◇ *Commentaire*: ${data.commentaire}
░▒░░ PALMARÈS🏆
▔▔▔▔▔▔▔▔▔▔▔░▒▒▒▒░░▒░
✅ Victoires: ${data.victoires} - ❌ Défaites: ${data.defaites}
*◇🏆Championnats*: ${data.championnants}
*◇🏆NEO cup💫*: ${data.neo_cup}
*◇🏆EVO💠*: ${data.evo}
*◇🏆GrandSlam🅰️*: ${data.grandslam}
*◇🌟TOS*: ${data.tos}
*◇👑The BEST🏆*: ${data.the_best}
*◇🗿Sigma🏆*: ${data.sigma}
*◇🎖️Neo Globes*: ${data.neo_globes}
*◇🏵️Golden Rookie🏆*: ${data.golden_boy}
▔▔▔▔▔▔▔▔▔▔▔░▒▒▒▒░░▒░
✅ Cleans: ${data.cleans}
❌ Erreurs: ${data.erreurs}
📈 Note: ${data.note}/100
░▒░▒░ STATS 📊
▔▔▔▔▔▔▔▔▔▔▔░▒▒▒▒░░▒░
⌬ *Talent⭐ :*         ▱▱▱▱▬▬▬ ${data.talent}
⌬ *Intelligence🧠:* ▱▱▱▱▬▬▬ ${data.intelligence}
⌬ *Speed💬 :*         ▱▱▱▱▬▬▬  ${data.speed}
⌬ *Close fight👊🏻:*  ▱▱▱▱▬▬▬ ${data.close_fight}
⌬ *Attaques🌀:*     ▱▱▱▱▬▬▬ ${data.attaques}
░▒░▒░ CARDS 🎴: ${data.total_cards}
▔▔▔▔▔▔▔▔▔▔▔░▒▒▒▒░░▒░
᪣ ${data.cards}
▱▱▱▱ ▱▱▱▱ 
*⌬𝗡SLPro🏆*
> NEO SUPER LEAGUE ESPORTS™`;

        await ovl.sendMessage(ms_org, {
          video: { url: 'https://files.catbox.moe/w37yae.mp4' },
          gifPlayback: true,
          caption: ""
        }, { quoted: ms });

        return ovl.sendMessage(ms_org, {
          image: { url: data.oc_url },
          caption: fiche
        }, { quoted: ms });
      }

      if (!prenium_id) return await repondre("⛔ Accès refusé ! Seuls les membres de la NS peuvent faire ça.");

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
  const data = await getData({ id: jid });
  let i = 0;

  while (i < args.length) {
    const object = args[i++];
    const signe = args[i++];
    const valeur = args[i++];
    const texte = valeur !== undefined ? [valeur] : [];

    while (i < args.length && !['+', '-', '=', 'add', 'supp'].includes(args[i])) {
      texte.push(args[i++]);
    }

    if (!Object.keys(data.dataValues).includes(object)) {
      throw new Error(`❌ La colonne '${object}' n'existe pas.`);
    }

    const oldValue = data[object];
    let newValue;

    if (signe === '+' || signe === '-') {
      const n1 = Number(oldValue) || 0;
      const n2 = Number(valeur) || 0;
      newValue = signe === '+' ? n1 + n2 : n1 - n2;
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

async function initFichesAuto() {
  try {
    const all = await getAllFiches();

    for (const player of all) {
      if (!player.code_fiche || player.code_fiche == "pas de fiche" || !player.division || !player.oc_url || !player.id) continue;

      const nom = player.code_fiche;
      const id = player.id.toString();
      const image = player.oc_url;
      const division = player.division.replace(/\*/g, '');

      add_fiche(nom, id, image, division);
    }
  } catch (e) {
    console.error("Erreur d'initFichesAuto:", e);
  }
}

initFichesAuto();

ovlcmd({
  nom_cmd: "add_fiche",
  alias: [],
  classe: "Other",
  react: "➕",
}, async (ms_org, ovl, { repondre, arg, prenium_id }) => {
  if (!prenium_id) return await repondre("⛔ Accès refusé !");
  if (arg.length < 3) return await repondre("❌ Syntaxe : add_fiche <jid> <code_fiche> <division>");

  const jid = arg[0];
  const code_fiche = arg[1];
  const division = arg.slice(2).join(" ");

  try {
    await add_id(jid, { code_fiche, division });
    await initFichesAuto();

    await repondre(
      `✅ Nouvelle fiche enregistrée :\n` +
      `• *JID* : \`${jid}\`\n` +
      `• *Code Fiche* : \`${code_fiche}\`\n` +
      `• *Division* : \`${division}\``
    );
  } catch (err) {
    console.error("❌ Erreur lors de l'ajout de la fiche :", err);
    await repondre("❌ Erreur lors de l'ajout de la fiche. Vérifie la console pour plus de détails.");
  }
});

ovlcmd({
  nom_cmd: "del_fiche",
  classe: "Other",
  react: "🗑️",
}, async (ms_org, ovl, { repondre, arg, prenium_id }) => {
  if (!prenium_id) return await repondre("⛔ Accès refusé !");
  if (!arg.length) return await repondre("❌ Syntaxe : del_fiche <code_fiche>");

  const code_fiche = arg.join(' ');
  try {
    const deleted = await del_fiche(code_fiche);
    if (deleted === 0) return await repondre("❌ Aucune fiche trouvée.");
    registeredFiches.delete(code_fiche);
    await repondre(`✅ Fiche supprimée : \`${code_fiche}\``);
  } catch (err) {
    console.error(err);
    await repondre("❌ Erreur lors de la suppression de la fiche.");
  }
});
