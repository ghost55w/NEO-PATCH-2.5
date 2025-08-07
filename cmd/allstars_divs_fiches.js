const { ovlcmd } = require("../lib/ovlcmd");
const { getData, setfiche, getAllFiches, add_id, del_fiche } = require('../DataBase/allstars_divs_fiches');

const ms_badge = {
  key: {
    fromMe: false,
    participant: '0@s.whatsapp.net',
    remoteJid: '0@s.whatsapp.net',
  },
  message: {
    extendedTextMessage: {
      text: 'ɴᴇᴏ-ʙᴏᴛ-ᴍᴅ ʙʏ ᴀɪɴᴢ',
      contextInfo: {
        mentionedJid: [],
      },
    },
  }
};

/*function normalizeText(text) {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function add_fiche(nom_joueur, jid, image_oc, joueur_div) {
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
⌬ *Close fight👊🏻:*  ▱▱▱▱▬▬▬ ${data.close_figth}
⌬ *Attaques🌀:*     ▱▱▱▱▬▬▬ ${data.attaques}
░▒░▒░ CARDS 🎴: ${data.total_cards}
▔▔▔▔▔▔▔▔▔▔▔░▒▒▒▒░░▒░
᪣ ${data.cards}
▱▱▱▱ ▱▱▱▱ 
*⌬𝗡SLPro🏆*
> NEO SUPER LEAGUE ESPORTS™`;

        await ovl.sendMessage(ms_org, {
          video: { url: 'https://files.catbox.moe/nxk0r2.mp4' },
          gifPlayback: true,
          caption: ""
        }, { quoted: ms_badge });

        return ovl.sendMessage(ms_org, {
          image: { url: data.oc_url },
          caption: fiche
        }, { quoted: ms_badge });
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

async function initFichesAuto() {
  try {
    const all = await getAllFiches();

    for (const player of all) {
      if (!player.code_fiche || !player.division || !player.oc_url || !player.id) continue;

      const nom = player.code_fiche;
      const id = player.id.toString();
      const image = player.oc_url;
      //

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
  classe: "Gestion",
  react: "➕",
}, async (ms_org, ovl, { repondre, arg, prenium_id }) => {
  if (!prenium_id) return await repondre("⛔ Accès refusé !");
  if (arg.length < 2) return await repondre("❌ Syntaxe : add_fiche <code_fiche> <division>");

  const id = ms_org.sender;
  const code_fiche = arg[0];
  const division = arg.slice(1).join(' ');

  try {
    await add_id(id, { code_fiche, division });
    await repondre(`✅ Fiche ajoutée : \`${code_fiche}\` (${division})`);
  } catch (err) {
    console.error(err);
    await repondre("❌ Erreur lors de l'ajout de la fiche.");
  }
});

ovlcmd({
  nom_cmd: "del_fiche",
  alias: [],
  classe: "Gestion",
  react: "🗑️",
}, async (ms_org, ovl, { repondre, arg, prenium_id }) => {
  if (!prenium_id) return await repondre("⛔ Accès refusé !");
  if (!arg.length) return await repondre("❌ Syntaxe : del_fiche <code_fiche>");

  const code_fiche = arg.join(' ');
  try {
    const deleted = await del_fiche(code_fiche);
    if (deleted === 0) return await repondre("❌ Aucune fiche trouvée.");
    await repondre(`✅ Fiche supprimée : \`${code_fiche}\``);
  } catch (err) {
    console.error(err);
    await repondre("❌ Erreur lors de la suppression de la fiche.");
  }
});

*/
  
async function injectFicheDataEnBase() {
  const fiches = [
    ['westsept👤', '1', 'https://files.catbox.moe/7l5qrc.jpg'],
    ['westinferno👤', '3', 'https://files.catbox.moe/ovsazs.jpg'],
    ['westnash👤', '5', 'https://files.catbox.moe/8yq7hw.jpg'],
    ['westvanitas👤', '6', 'https://files.catbox.moe/w7icme.jpg'],
    ['westsolomoe👤', '7', 'https://files.catbox.moe/heuwc0.jpg'],
    ['westindra👤', '8', 'https://files.catbox.moe/1wux4s.jpg'],
    ['westaether👤', '9', 'https://files.catbox.moe/cvm2cp.jpg'],
    ['westhajime👤', '10', 'https://files.catbox.moe/kov9hu.jpg'],

    ['northkiller👤', '38', 'https://files.catbox.moe/zn55pc.jpg'],
    ['northregulus👤', '11', 'https://files.catbox.moe/log52q.jpg'],
    ['northeoza👤', '12', 'https://files.catbox.moe/zcmhoo.jpg'],
    ['northomnimoh👤', '13', 'https://files.catbox.moe/spk4fw.jpg'],
    ['norththanatos👤', '14', 'https://files.catbox.moe/c3gpr4.jpg'],
    ['northlily👤', '15', 'https://files.catbox.moe/k7s0nu.jpg'],
    ['northaizen👤', '16', 'https://files.catbox.moe/feylzj.jpg'],
    ['northkazuta👤', '17', 'https://files.catbox.moe/f0fgga.jpg'],
    ['northakashi👤', '18', 'https://files.catbox.moe/2oftco.jpg'],
    ['northainz👤', '19', 'https://files.catbox.moe/69zjvs.jpg'],
    ['northdamian👤', '37', 'https://files.catbox.moe/dndmbe.jpg'],

    ['centralhazlay👤', '20', 'https://files.catbox.moe/nsnj8e.jpg'],
    ['centraldabi👤', '21', 'https://files.catbox.moe/rsykzr.jpg'],
    ['centralyuan👤', '22', 'https://files.catbox.moe/8w855m.jpg'],
    ['centralrudeus👤', '23', 'https://files.catbox.moe/4qaqn1.jpg'],
    ['centralhakuji👤', '24', 'https://files.catbox.moe/lmcqrp.jpg'],
    ['centralirito👤', '25', 'https://files.catbox.moe/zr2536.jpg'],
    ['centralarthur👤', '26', 'https://files.catbox.moe/jci0bz.jpg'],

    ['eastgoldy👤', '27', 'https://files.catbox.moe/eyy6gq.jpg'],
    ['eastjuuzo👤', '28', 'https://files.catbox.moe/u2h38m.jpg'],
    ['eastatsushi👤', '29', 'https://files.catbox.moe/ja7yo3.jpg'],
    ['eastadam👤', '30', 'https://files.catbox.moe/04wn4f.jpg'],
    ['eastak👤', '34', 'https://files.catbox.moe/foskr5.jpg'],
    ['eastserena👤', '36', 'https://files.catbox.moe/hzgfkw.jpg']
  ];

  for (const [code_fiche, id, oc_url] of fiches) {
    try {
      await setfiche('code_fiche', code_fiche, id);
      await setfiche('oc_url', oc_url, id);
      console.log(`✅ Fiche injectée pour ID ${id} (${code_fiche})`);
    } catch (err) {
      console.error(`❌ Erreur sur ID ${id} :`, err);
    }
  }

  console.log('✅ Injection des données terminée.');
}

injectFicheDataEnBase();

