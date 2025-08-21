const { ovlcmd } = require('../lib/ovlcmd');

const joueurs = new Map();

ovlcmd({
  nom_cmd: 'exercice4',
  classe: 'BLUELOCK⚽',
  react: '⚽',
  desc: "Lance l'épreuve du loup"
}, async (ms_org, ovl, { repondre, auteur_Message }) => {
  try {
    const gif_debut = 'https://files.catbox.moe/z64kuq.mp4';
    await ovl.sendMessage(ms_org, {
      video: { url: gif_debut },
      gifPlayback: true,
      caption: ''
    });

    const image_debut = 'https://files.catbox.moe/xpwx9x.jpg';
    const texteDebut = `*🔷ÉPREUVE DE TIRS⚽🥅*▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔░▒▒▒▒░░▒░
⚠️Dans cet entraînement, l'objectif est de marquer 18 buts en 18 tirs max avant la fin des 20 mins⌛ face à un gardien Robot🩻 qui peut mémoriser vos tirs et bloquer le même tir ayant les même détails en zone (A1) donc 5m des buts. SI VOUS RATEZ UN TIR, FIN DE L'EXERCICE ❌. 

      ▔▔▔▔▔▔▔▔▔▔     ▔▔▔▔▔
                    *🔷BLUE LOCK⚽*
  ▔▔▔▔▔▔▔▔▔▔   ▔▔▔▔▔▔▔▔▔▔ 
🥇18 buts⚽ (100 pts) 
🥈12 buts⚽ (50 pts) 
🥉6 buts⚽  (25 pts)  

⚠️🎙️Souhaitez vous lancer l'exercice ? :
✅ \`Oui\`
❌ \`Non\`

*BLUE LOCK🔷Neoverse*`;

    await ovl.sendMessage(ms_org, {
      image: { url: image_debut },
      caption: texteDebut
    });

    const rep = await ovl.recup_msg({ auteur: auteur_Message, ms_org, temps: 60000 });
    const response = rep?.message?.extendedTextMessage?.text || rep?.message?.conversation;

    if (!response) return repondre("⏳Pas de réponse, épreuve annulée.");

    if (response.toLowerCase() === "non") {
      return repondre("❌ Lancement de l'exercice annulé...");
    }

    if (response.toLowerCase() === "oui") {
      await ovl.sendMessage(ms_org, {
        video: { url: "https://files.catbox.moe/zqm7et.mp4" }, 
        gifPlayback: true, 
        caption: `*⚽BLUE LOCK🔷:* Début de l'exercice ⌛ Durée : 20:00 mins`
      });

      const id = auteur_Message;
      if (!joueurs.has(id)) {
        joueurs.set(id, {
          id,
          tir_type: null,
          tir_zone: null,
          tir_info: [],
          but: 0
        });
      }
    }

  } catch (error) {
    if (error.message === 'Timeout') {
      repondre("⏳ Temps écoulé, épreuve annulée.");
    } else {
      repondre("❌ Une erreur est survenue.");
      console.error(error);
    }
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
