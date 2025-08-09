const { ovlcmd } = require('../lib/ovlcmd');

const duree_epreuve = 20 * 60 * 1000;
const intervalle_rappel = 5 * 60 * 1000;

let epreuveActive = false;
let loupJid = null;
let historiqueLoups = [];
let timerId = null;
let rappelInterval = null;

function waitForResponse(ovl, chatId, filter, timeout = 60000) {
  return new Promise((resolve) => {
    const onMessage = async (msg) => {
      if (filter(msg)) {
        ovl.off('message', onMessage);
        resolve(msg);
      }
    };
    ovl.on('message', onMessage);
    setTimeout(() => {
      ovl.off('message', onMessage);
      resolve(null);
    }, timeout);
  });
}

ovlcmd({
  nom_cmd: 'exercice4',
  classe: 'BLUELOCK⚽',
  react: '⚽',
  desc: "Lance l'épreuve du loup"
}, async (ms_org, ovl, { repondre }) => {
  try {
    if (epreuveActive) return repondre("⛔ Une épreuve est déjà en cours.");

    const gif_debut = 'https://files.catbox.moe/z64kuq.mp4';
    await ovl.sendMessage(ms_org, {
      video: { url: gif_debut },
      gifPlayback: true,
      caption: ''
    });

    const image_debut = 'https://files.catbox.moe/xpwx9x.jpg';
    const texteDebut = `🔷⚽ÉPREUVE DU LOUP🥅
▔▔▔▔▔▔▔▔▔▔▔▔▔░▒▒▒▒░░▒░
Dans cette épreuve l'objectif est de toucher un autre joueur avec le ballon⚽ en lui tirant dessus ! Après 20 mins le joueur qui sera le loup est éliminé❌.
⚠Au départ le loup est au milieu et les joueurs sont à 3m, le loup doit juste taguer le joueur qu'il vise ! le joueur le plus faible dans la pièce commence comme étant le loup, les joueurs n'ont que deux actions: esquiver le ballon et courir pour s'écarter du loup de 5m max et le loup ne peut que conduire la balle pour se rapprocher et tirer sur un joueur(juste taguer vers qui on avance et tirer sur lui, la cible doit juste dire s'il court quand le loup avance où s'il réagit au tir en esquivant juste, le loup n'a donc pas besoin de faire des pivots) . Vous ne pouvez que courir une fois sur deux tirs, donc si vous courez deux fois de suite❌ vous êtes le nouveau loup. Le loup a plus de chances de toucher un joueur dans à moins de 5m, toucher un joueur ayant un Ranking trop élevé que vous est difficile il est donc plus facile de toucher un joueur ayant un Ranking plus faible où proche de vous, le Ranking de base est défini par le niveau de puissance⏫.

⚽ Voulez vous lancer l'épreuve ?⌛ 
✅ Oui
❌ Non

▔▔▔▔▔▔▔▔▔▔▔▔▔▔▱▱▱▔▔
     ⚽BLUE🔷LOCK`;

    await ovl.sendMessage(ms_org, {
      image: { url: image_debut },
      caption: texteDebut
    });

    // Filtre réponse oui/non
    const filtreOuiNon = (msg) => {
      if (msg.key.remoteJid !== ms_org) return false;
      const texte = msg.message?.conversation?.toLowerCase() || '';
      return texte === 'oui' || texte === 'non';
    };

    const reponseOuiNon = await waitForResponse(ovl, ms_org, filtreOuiNon, 60000);
    if (!reponseOuiNon) return repondre('⏳Temps écoulé, épreuve annulée.');

    if (reponseOuiNon.message.conversation.toLowerCase() === 'non') {
      return ovl.sendMessage(ms_org, {
        text: `🔷⚽ÉPREUVE DU LOUP🥅
▔▔▔▔▔▔▔▔▔▔▔▔▔░▒▒▒▒░░▒░

❌Lancement de l'épreuve annulé
       
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▱▱▱▔▔
     ⚽BLUE🔷LOCK`
      });
    }

    epreuveActive = true;
    historiqueLoups = [];

    await ovl.sendMessage(ms_org, {
      text: `🔷 ⚽ÉPREUVE DU LOUP🥅
▔▔▔▔▔▔▔▔▔▔▔▔▔░▒▒▒▒░░▒░

✅SUCCÈS: Veuillez taguer le loup pour lancer la partie

▔▔▔▔▔▔▔▔▔▔▔▔▔▔▱▱▱▔▔
     ⚽BLUE🔷LOCK`
    });

    const filtreTagLoup = (msg) => {
      if (msg.key.remoteJid !== ms_org) return false;
      if (!msg.message?.extendedTextMessage) return false;
      const mentions = msg.message.extendedTextMessage.contextInfo?.mentionedJid || [];
      return mentions.length === 1;
    };

    const msgTagLoup = await waitForResponse(ovl, ms_org, filtreTagLoup, 120000);
    if (!msgTagLoup) {
      epreuveActive = false;
      return ovl.sendMessage(ms_org, { text: "⏳Temps écoulé, épreuve annulée." });
    }

    loupJid = msgTagLoup.message.extendedTextMessage.contextInfo.mentionedJid[0];
    historiqueLoups.push(loupJid);

    const gif_start = 'https://files.catbox.moe/g2f0r0.mp4';
    await ovl.sendMessage(ms_org, {
      video: { url: gif_start },
      gifPlayback: true,
      caption: ''
    });

    await ovl.sendMessage(ms_org, {
      text: `🔷⚽ÉPREUVE DU LOUP🥅
▔▔▔▔▔▔▔▔▔▔▔▔▔░▒▒▒▒░░▒░

⚽DÉBUT DE L'ÉPREUVE
> <@${loupJid}> vous êtes désormais le loup, vous avez 20min avant de vous faire éliminer. Passer le titre de loup à un autre joueur pour réussir l'épreuve. BONNE CHANCE !

▔▔▔▔▔▔▔▔▔▔▔▔▔▔▱▱▱▔▔
     ⚽BLUE🔷LOCK`,
      mentions: [loupJid]
    });

    timerId = setTimeout(async () => {
      epreuveActive = false;
      if (rappelInterval) clearInterval(rappelInterval);
      rappelInterval = null;
      timerId = null;

      const gif_fin = 'https://files.catbox.moe/g2f0r0.mp4';
      await ovl.sendMessage(ms_org, {
        video: { url: gif_fin },
        gifPlayback: true,
        caption: ''
      });

      await ovl.sendMessage(ms_org, {
        text: `🔷⚽ÉPREUVE DU LOUP🥅
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔░▒▒▒▒░░▒░

⚽FIN DE L'ÉPREUVE
> Joueur <@${loupJid}> tu es éliminé❌
       
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▱▱▱▔▔
     ⚽BLUE🔷LOCK`,
        mentions: [loupJid]
      });

      loupJid = null;
      historiqueLoups = [];
    }, DUREE_EPREUVE);

    rappelInterval = setInterval(async () => {
      if (!epreuveActive) return clearInterval(rappelInterval);
      const resteMin = Math.floor((duree_epreuve - (Date.now() - (timerId._idleStart || Date.now()))) / 60000);
      await ovl.sendMessage(ms_org, {
        text: ⚠Rappel : Il reste environ ${resteMin} minutes avant la fin de l'épreuve.
      });
    }, intervalle_rappel);

  } catch (err) {
    console.error(err);
    repondre("❌Une erreur est survenue.");
  }
});

ovlcmd({
  nom_cmd: 'arrete_epreuve',
  alias: ['arret_epreuve', 'stop_epreuve'],
  react: '🛑',
  desc: "Arrête l'épreuve du loup"
}, async (ms_org, ovl, { repondre }) => {
  if (!epreuveActive) return repondre("⛔ Aucune épreuve en cours.");

  if (timerId) clearTimeout(timerId);
  if (rappelInterval) clearInterval(rappelInterval);

  epreuveActive = false;
  timerId = null;
  rappelInterval = null;
  loupJid = null;
  historiqueLoups = [];

  await ovl.sendMessage(ms_org, {
    text: `🔷⚽ÉPREUVE DU LOUP🥅
▔▔▔▔▔▔▔▔▔▔▔▔▔░▒▒▒▒░░▒░

❌Épreuve arrêtée manuellement.
       
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▱▱▱▔▔
     ⚽BLUE🔷LOCK`
  });
});
