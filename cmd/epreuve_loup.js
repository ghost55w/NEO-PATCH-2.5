const { ovlcmd } = require('../lib/ovlcmd');

const epreuvesLoup = new Map(); // Stocke les épreuves actives par chatId

// --- Lancement de l'épreuve ---
ovlcmd({
  nom_cmd: 'exercice4',
  classe: 'BLUELOCK⚽',
  react: '⚽',
  desc: "Lance l'épreuve du loup"
}, async (ms_org, ovl, { repondre, auteur_Message }) => {
  try {
    const texteDebut = `🔷 *ÉPREUVE DU LOUP*🐺❌⚽
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔░▒▒▒▒░░▒░

                   *🔷⚽RÈGLES:*
Dans cette épreuve l'objectif est de toucher un autre joueur avec le ballon⚽ en lui tirant dessus avant la fin du temps imparti 20 mins❗⌛, Après 20 mins le joueur qui sera le loup est éliminé❌.
⚠️Le jeu se déroule dans une pièce carré de 10m où au début de l'épreuve le joueur avec le rang le plus faible est le loup. Vous ne pouvez que faire deux actions, courir et esquiver pour les cibles et conduire la balle puis tirer pour le loup, courir vous permets de vous éloigner du loup et augmenter vos chances d'esquiver le tir, mais tous les joueurs ne peuvent que parcourir 5m maximum, les joueurs ne peuvent que courir 1 tour sur 2,après une esquive le ballon rebondit sur le mur et roule sur le loup. Pour tirer il suffit de faire: \`Tir direct en précisant l'endroit du corps visé puis taguer le joueur que vous viser @tag\`. Au début tous les joueurs feront des pavés mais dans le tour où le loup tir sur un joueur seul le joueur visé fera le pavé d'esquive les autres observent. 

▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▱▱▱▔▔

⚽ Voulez vous lancer l'épreuve ?⌛ 
✅ \`Oui\` @${auteur_Message.split('@')[0]}  
❌ \`Non\`

                       *⚽BLUE🔷LOCK*`;

    // Envoi du pavé avec la photo
    await ovl.sendMessage(ms_org, {
      image: { url: 'https://files.catbox.moe/k87s8y.png' },
      caption: texteDebut
    });

    const rep = await ovl.recup_msg({ auteur: auteur_Message, ms_org, temps: 60000 });
    const response = rep?.message?.extendedTextMessage?.text || rep?.message?.conversation;
    if (!response) return repondre("⏳Pas de réponse, épreuve annulée.");
    if (response.toLowerCase() === "non") return repondre("❌ Lancement de l'exercice annulé...");

    if (response.toLowerCase() === "oui") {
      const id = ms_org;
      const timerTotal = 25 * 60 * 1000;

      const timer = setTimeout(async () => {
        const epreuve = epreuvesLoup.get(id);
        if (!epreuve) return;
        await ovl.sendMessage(ms_org, {
          text: `⏰ **Épreuve terminée !**\n❌ Joueur éliminé : ${epreuve.loup}`
        });
        epreuvesLoup.delete(id);
      }, timerTotal);

      epreuvesLoup.set(id, {
        loup: `@${auteur_Message.split('@')[0]}`,
        joueurs: [],        // stocke tous les joueurs avec positions, actions
        timer,
        tempsRestant: timerTotal,
        tourCourant: 0      // pour gérer 1 tour sur 2
      });

      await ovl.sendMessage(ms_org, {
        video: { url: 'https://files.catbox.moe/4xgo63.mp4' },
        gifPlayback: true,
        caption: `*⚽BLUE LOCK🔷:* Début de l'exercice ⌛ Durée : 25:00 mins\n@${auteur_Message.split('@')[0]} tu es Le loup`
      });
    }
  } catch (err) {
    console.error(err);
    repondre("❌ Une erreur est survenue lors du lancement de l'épreuve.");
  }
});

// --- Analyse pavé modérateur / actions joueurs ---
ovlcmd({
  nom_cmd: 'epreuve_loup',
  isfunc: true
}, async (ms_org, ovl, { texte }) => {
  const epreuve = epreuvesLoup.get(ms_org);
  if (!epreuve) return;

  if (!texte.includes("🔷⚽ÉPREUVE DU LOUP")) return;

  // Extraire infos Loup / Cible / Distance
  const loupLine = texte.match(/\*⚽Loup\*=(.*)/i)?.[1]?.trim() || "";
  const cibleLine = texte.match(/\*⚽Cible\*=(.*)/i)?.[1]?.trim() || "";
  const distance = parseInt(texte.match(/\*⚽Distance\*=(\d+)/i)?.[1] || "5");

  const loupFail = loupLine.endsWith("❌");
  const cibleFail = cibleLine.endsWith("❌");

  const tempsRestantSec = Math.floor(epreuve.tempsRestant / 1000);
  const tempsRestantText = `${Math.floor(tempsRestantSec/60)}:${(tempsRestantSec%60).toString().padStart(2,'0')}`;

  // Tir raté / touché automatique
  if (loupFail) {
    await ovl.sendMessage(ms_org, {
      video: ["https://files.catbox.moe/obqo0d.mp4","https://files.catbox.moe/m00580.mp4"][Math.floor(Math.random()*2)],
      gifPlayback: true,
      caption: `❌ **RATÉ !** Loup a mal réalisé son tir.\n⏱️ Temps restant : ${tempsRestantText}\n${texte}`
    });
    return;
  }

  if (cibleFail) {
    await ovl.sendMessage(ms_org, {
      video: "https://files.catbox.moe/eckrvo.mp4",
      gifPlayback: true,
      caption: `✅ **TOUCHÉ !** La cible n'a pas réagi correctement.\n⏱️ Temps restant : ${tempsRestantText}\n${texte}`
    });
    epreuve.loup = cibleLine.replace("❌","").trim();
    return;
  }

  // --- Probabilité normale selon distance et rang ---
  let chance = 50;
  const rangLoup = 5; // exemple statique
  const rangCible = 5;

  if (rangLoup > rangCible) {
    chance = distance <= 5 ? 95 : 75;
  } else if (rangLoup === rangCible) {
    chance = distance <= 5 ? 60 : 50;
  } else if (rangLoup < rangCible) {
    chance = distance <= 5 ? 25 : 15;
  }

  const hit = Math.random()*100 <= chance;

  if (hit) {
    await ovl.sendMessage(ms_org, {
      video: "https://files.catbox.moe/eckrvo.mp4",
      gifPlayback: true,
      caption: `✅ **TOUCHÉ !**\n⏱️ Temps restant : ${tempsRestantText}\n${texte}`
    });
    epreuve.loup = cibleLine.trim();
  } else {
    await ovl.sendMessage(ms_org, {
      video: ["https://files.catbox.moe/obqo0d.mp4","https://files.catbox.moe/m00580.mp4"][Math.floor(Math.random()*2)],
      gifPlayback: true,
      caption: `❌ RATÉ !\n⏱️ Temps restant : ${tempsRestantText}\n${texte}`
    });
  }

  // --- Gestion tour / actions des joueurs ---
  epreuve.tourCourant++;
});
