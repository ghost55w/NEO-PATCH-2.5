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
◇ *Golds🧭*: ${data.golds} ©🧭
◇ *Fans👥*: ${data.fans} 👥
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


add_fiche('westsept👤', '1', 'https://files.catbox.moe/7l5qrc.jpg', 'WEST🦁🔵');
add_fiche('westinferno👤', '3', 'https://files.catbox.moe/ovsazs.jpg', 'WEST🦁🔵');
add_fiche('westnash👤', '5', 'https://files.catbox.moe/8yq7hw.jpg', 'WEST🦁🔵');
add_fiche('westvanitas👤', '6', 'https://files.catbox.moe/w7icme.jpg', 'WEST🦁🔵');
add_fiche('westsolomoe👤', '7', 'https://files.catbox.moe/heuwc0.jpg', 'WEST🦁🔵');
add_fiche('westindra👤', '8', 'https://files.catbox.moe/1wux4s.jpg', 'WEST🦁🔵');
add_fiche('westaether👤', '9', 'https://files.catbox.moe/cvm2cp.jpg', 'WEST🦁🔵');
add_fiche('westhajime👤', '10', 'https://files.catbox.moe/kov9hu.jpg', 'WEST🦁🔵');


add_fiche('northkiller👤', '2', 'https://files.catbox.moe/zn55pc.jpg', 'NORTH🐺🔴');
add_fiche('northregulus👤', '11', 'https://files.catbox.moe/log52q.jpg', 'NORTH🐺🔴');
add_fiche('northeoza👤', '12', 'https://files.catbox.moe/zcmhoo.jpg', 'NORTH🐺🔴');
add_fiche('northomnimoh👤', '13', 'https://files.catbox.moe/spk4fw.jpg', 'NORTH🐺🔴');
add_fiche('norththanatos👤', '14', 'https://files.catbox.moe/c3gpr4.jpg', 'NORTH🐺🔴');
add_fiche('northlily👤', '15', 'https://files.catbox.moe/k7s0nu.jpg', 'NORTH🐺🔴');
add_fiche('northaizen👤', '16', 'https://files.catbox.moe/feylzj.jpg', 'NORTH🐺🔴');
add_fiche('northkazuta👤', '17', 'https://files.catbox.moe/f0fgga.jpg', 'NORTH🐺🔴');
add_fiche('northakashi👤', '18', 'https://files.catbox.moe/2oftco.jpg', 'NORTH🐺🔴');
add_fiche('northainz👤', '19', 'https://files.catbox.moe/69zjvs.jpg', 'NORTH🐺🔴');
add_fiche('northdamian👤', '37', 'https://files.catbox.moe/dndmbe.jpg', 'NORTH🐺🔴');


add_fiche('centralhazlay👤', '20', 'https://files.catbox.moe/nsnj8e.jpg', 'CENTRAL🐯🟠');
add_fiche('centraldabi👤', '21', 'https://files.catbox.moe/rsykzr.jpg', 'CENTRAL🐯🟠');
add_fiche('centralyuan👤', '22', 'https://files.catbox.moe/8w855m.jpg', 'CENTRAL🐯🟠');
add_fiche('centralrudeus👤', '23', 'https://files.catbox.moe/4qaqn1.jpg', 'CENTRAL🐯🟠');
add_fiche('centralhakuji👤', '24', 'https://files.catbox.moe/lmcqrp.jpg', 'CENTRAL🐯🟠');
add_fiche('centralirito👤', '25', 'https://files.catbox.moe/zr2536.jpg', 'CENTRAL🐯🟠');
add_fiche('centralarthur👤', '26', 'https://files.catbox.moe/jci0bz.jpg', 'CENTRAL🐯🟠');




add_fiche('eastgoldy👤', '27', 'https://files.catbox.moe/eyy6gq.jpg', 'EAST🦅🟢');
add_fiche('eastjuuzo👤', '28', 'https://files.catbox.moe/u2h38m.jpg', 'EAST🦅🟢');
add_fiche('eastatsushi👤', '29', 'https://files.catbox.moe/ja7yo3.jpg', 'EAST🦅🟢');
add_fiche('eastadam👤', '30', 'https://files.catbox.moe/04wn4f.jpg', 'EAST🦅🟢');
//add_fiche('eastkemael👤', '31', 'https://telegra.ph/file/638f67854ccfaa1ee1a8a.jpg', 'EAST🦅🟢');
//add_fiche('eastaltheos👤', '32', 'https://telegra.ph/file/5ecddffc7c18e84861bf2.jpg', 'EAST🦅🟢');
//add_fiche('eastwhite👤', '33', 'https://files.catbox.moe/4qygb4.jpg', 'EAST🦅🟢');
add_fiche('eastak👤', '34', 'https://files.catbox.moe/foskr5.jpg', 'EAST🦅🟢');
//add_fiche('easttoge👤', '35', 'https://files.catbox.moe/6bx3sl.jpg', 'EAST🦅🟢');
add_fiche('eastserena👤', '36', 'https://files.catbox.moe/hzgfkw.jpg', 'EAST🦅🟢');



