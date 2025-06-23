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


//add_fiche('westvanitas👤', '1', 'https://files.catbox.moe/dueik1.jpg', 'WEST🦁🔵');
add_fiche('westnash👤', '2', 'https://files.catbox.moe/w4sso3.jpg','WEST🦁🔵');
add_fiche('westindra👤', '3', 'https://files.catbox.moe/dgkvph.jpg', 'WEST🦁🔵');
add_fiche('westaether👤', '4', 'https://files.catbox.moe/yjvd63.jpg', 'WEST🦁🔵');
//add_fiche('westsolomoe👤', '6', 'https://files.catbox.moe/xvbz5o.jpg', 'WEST🦁🔵');
add_fiche('westsept👤', '7', 'https://files.catbox.moe/uev2zx.jpg', 'WEST🦁🔵');
//add_fiche('westtempest👤', '8', 'https://files.catbox.moe/u1v994.jpg', 'WEST🦁🔵');
add_fiche('westinferno👤', '9', 'https://files.catbox.moe/dv23bc.jpg', 'WEST🦁🔵');
add_fiche('westhajime👤', '10', 'https://files.catbox.moe/4pxl7h.jpg', 'WEST🦁🔵');
//add_fiche('westregulus👤', '11', 'https://telegra.ph/file/ffb64bf678bb1107cca18.jpg', 'WEST🦁🔵');









add_fiche('northdamian👤', '1', 'https://files.catbox.moe/6ywtez.jpg', 'NORTH🐺🔴');
add_fiche('northlily👤', '2', 'https://files.catbox.moe/lnd2qg.jpg', 'NORTH🐺🔴');
//add_fiche('northadorieru👤', '3', 'https://telegra.ph/file/33d75752a2f4d645f836a.jpg', 'NORTH🐺🔴');
//add_fiche('norththanatos👤', '4', 'https://files.catbox.moe/i0zsrp.jpg', 'NORTH🐺🔴');
add_fiche('northkazuta👤', '5', 'https://files.catbox.moe/9fv70i.jpg', 'NORTH🐺🔴');
add_fiche('northomnimoh👤', '6', 'https://files.catbox.moe/lvs0ek.jpg', 'NORTH🐺🔴');
//add_fiche('northkanzen👤', '7', 'https://telegra.ph/file/e521acd5939414d8d12c5.jpg', 'NORTH🐺🔴');
add_fiche('northainz👤', '8', 'https://files.catbox.moe/69zjvs.jpg', 'NORTH🐺🔴');
//add_fiche('northrukia👤', '10', 'https://telegra.ph/file/1979a11043529f6ce2bc5.jpg', 'NORTH🐺🔴');
add_fiche('northaizen👤', '11', 'https://files.catbox.moe/5j00wn.jpg', 'NORTH🐺🔴');
add_fiche('northakashi👤', '12', 'https://files.catbox.moe/7l84zf.jpg', 'NORTH🐺🔴');
add_fiche('northeoza👤', '13', 'https://files.catbox.moe/dmzuki.jpg', 'NORTH🐺🔴');
add_fiche('northregulus👤', '14', 'https://files.catbox.moe/le0ws1.jpg', 'NORTH🐺🔴');





//add_fiche('centralabdiel👤', '1', 'https://i.ibb.co/d4vspyP/image.jpg', 'CENTRAL🐯🟠');
add_fiche('centraldabi👤', '2', 'https://files.catbox.moe/yb8xd8.jpg', 'CENTRAL🐯🟠');
add_fiche('centralyuan👤', '3', 'https://files.catbox.moe/jwpahj.jpg', 'CENTRAL🐯🟠');
add_fiche('centralirito👤', '4', 'https://files.catbox.moe/mptbqh.jpg', 'CENTRAL🐯🟠');
add_fiche('centralhakuji👤', '5', 'https://files.catbox.moe/mfs5sg.jpg', 'CENTRAL🐯🟠');
add_fiche('centralana👤', '6', 'https://files.catbox.moe/08se2s.jpg', 'CENTRAL🐯🟠');
//add_fiche('centralajax👤', '7', 'https://files.catbox.moe/avx1rl.jpg', 'CENTRAL🐯🟠');
//add_fiche('centralmakima👤', '8', 'https://telegra.ph/file/fdd73d041d1cd05d82aa2.jpg', 'CENTRAL🐯🟠');
add_fiche('centralarthur👤', '9', 'https://files.catbox.moe/houno9.jpg', 'CENTRAL🐯🟠');
add_fiche('centralrudeus👤', '10', 'https://files.catbox.moe/ycq62s.jpg', 'CENTRAL🐯🟠');



add_fiche('eastwhite👤', '1', 'https://files.catbox.moe/4qygb4.jpg', 'EAST🦅🟢');
//add_fiche('eastkemael👤', '2', 'https://telegra.ph/file/638f67854ccfaa1ee1a8a.jpg', 'EAST🦅🟢');
//add_fiche('eastaltheos👤', '3', 'https://telegra.ph/file/5ecddffc7c18e84861bf2.jpg', 'EAST🦅🟢');
add_fiche('eastgoldy👤', '4', 'https://files.catbox.moe/n8eopv.jpg', 'EAST🦅🟢');
//add_fiche('eastsofiane👤', '5', 'https://files.catbox.moe/prz9mc.jpg', 'EAST🦅🟢');
//add_fiche('eastatsushi👤', '6', 'https://files.catbox.moe/uzu7vu.jpg', 'EAST🦅🟢');
add_fiche('eastadam👤', '7', 'https://files.catbox.moe/xmr932.jpg', 'EAST🦅🟢');
add_fiche('easttoge👤', '8', 'https://files.catbox.moe/6bx3sl.jpg', 'EAST🦅🟢');
add_fiche('eastak👤', '9', 'https://files.catbox.moe/24pez0.jpg', 'EAST🦅🟢');
add_fiche('eastjuuzo👤', '10', 'https://files.catbox.moe/c5v7qp.jpg', 'EAST🦅🟢');



