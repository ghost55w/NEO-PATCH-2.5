const { ovlcmd } = require('../lib/ovlcmd');
const axios = require('axios');
const joueurs = new Map();

const promptSystem = `
Tu es un assistant spécialisé dans l'analyse d'expressions textuelles décrivant un tir au football.

❌ Si l'utilisateur ne précise pas de zone de tir parmi :
[ras du sol gauche, ras du sol droite, mi-hauteur gauche, mi-hauteur droite, lucarne gauche, lucarne droite]
→ Répond immédiatement :
{
  "tir_type": "MISSED",
  "tir_zone": "AUCUNE"
}

Sinon, considère que le joueur peut écrire n'importe quelle phrase, tant que les mots-clés suivants sont présents, le tir est valide :
- tir direct, tir enroulé, tir trivela
- pointe du pied, cou du pied, intérieur du pied, extérieur du pied
- 60° décalé / corps décalé / courbe de 1m (pour les tirs enroulés et trivela)

⚠️ La zone de tir est **obligatoire**.

Extrais les valeurs exactes de tir_type et tir_zone parmi :
[tir direct de la pointe du pied droit, tir direct de la pointe du pied gauche, tir direct du cou du pied droit, tir direct du cou du pied gauche, tir direct de l'intérieur du pied droit, tir direct de l'intérieur du pied gauche, tir enroulé de l'intérieur du pied droit avec corps décalé à 60° sur le côté droit, courbe de tir de 1m ou < 1m, tir enroulé de l'intérieur du pied gauche avec corps décalé à 60° sur le côté gauche courbe de tir de 1m ou < 1m, tir trivela de l'extérieur du pied droit avec corps décalé à 60° sur le côté gauche, courbe de tir de 1m ou < 1m, tir trivela de l'extérieur du pied gauche avec corps décalé à 60° sur le côté droit courbe de tir de 1m ou < 1m]

Répond **toujours** au format JSON strict :
{
 "tir_type": "<valeur>",
 "tir_zone": "<valeur>"
}
`;

async function analyserTir(texte, repondre) {
  try {
    const fullText = `${promptSystem}\n"${texte}"`;
    const response = await axios.post(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyCtDv8matHBhGOQF_bN4zPO-J9-60vnwFE',
      {
        contents: [
          { parts: [{ text: fullText }] }
        ]
      },
      { headers: { 'Content-Type': 'application/json' } }
    );
    const data = response.data;
    if (data.candidates && data.candidates.length > 0) {
      const reponseTexte = data.candidates[0]?.content?.parts?.[0]?.text || "";
      console.log(JSON.parse(reponseTexte.replace(/```json|```/g, '').trim()));
      return JSON.parse(reponseTexte.replace(/```json|```/g, '').trim());
    }
  } catch (err) {
    console.error("Erreur Gemini :", err);
  }
  return null;
}


ovlcmd({
  nom_cmd: 'exercice1',
  classe: 'BLUELOCK⚽',
  react: '⚽',
  desc: "Lance l'épreuve du loup"
}, async (ms_org, ovl, { repondre, auteur_Message }) => {
  try {
    await ovl.sendMessage(ms_org, {
      video: { url: 'https://files.catbox.moe/z64kuq.mp4' },
      gifPlayback: true,
      caption: ''
    });

    const texteDebut = `*🔷ÉPREUVE DE TIRS⚽🥅*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔░▒▒▒▒░░▒░

                   🔷⚽RÈGLES:
Dans cet exercice l'objectif est de marquer 18 buts en 18 tirs max dans le temps imparti ❗20 mins⌛ face à un gardien Robot qui  mémorise vos tirs pour bloquer le même tir de suite. ⚠Vous devez marquer au moins 6 buts sinon vous êtes éliminé ❌. 

⚠SI VOUS RATEZ UN TIR, FIN DE L'EXERCICE ❌.

▔▔▔▔▔▔▔ 🔷RANKING🏆 ▔▔▔▔▔▔▔  
                       
🥉Novice: 5 buts⚽ (25 pts) 
🥈Pro: 10 buts⚽ (50 pts) 
🥇Classe mondiale: 15 buts⚽🏆(100 pts) 

▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔░ ░                         

Souhaitez-vous lancer l'exercice ? :
✅ Oui
❌ Non

                         ⚽BLUE🔷LOCK`;

    await ovl.sendMessage(ms_org, {
      image: { url: 'https://files.catbox.moe/09rll9.jpg' },
      caption: texteDebut
    });

    const rep = await ovl.recup_msg({ auteur: auteur_Message, ms_org, temps: 60000 });
    const response = rep?.message?.extendedTextMessage?.text || rep?.message?.conversation;
    if (!response) return repondre("⏳Pas de réponse, épreuve annulée.");
    if (response.toLowerCase() === "non") return repondre("❌ Lancement de l'exercice annulé...");

    if (response.toLowerCase() === "oui") {
      const id = auteur_Message;
      const timer = setTimeout(() => {
        if (joueurs.has(id)) {
          joueurs.get(id).en_cours = false;
          envoyerResultats(ms_org, ovl, joueurs.get(id));
        }
      }, 20 * 60 * 1000);

      joueurs.set(id, {
        id,
        tir_type: null,
        tir_zone: null,
        tir_info: [],
        but: 0,
        tirs_total: 0,
        en_cours: true,
        timer,
        paused: false,
        remainingTime: 20 * 60 * 1000,
        pauseTimestamp: null
      });

      await ovl.sendMessage(ms_org, {
        video: { url: "https://files.catbox.moe/zqm7et.mp4" },
        gifPlayback: true,
        caption: `*⚽BLUE LOCK🔷:* Début de l'exercice ⌛ Durée : 20:00 mins`
      });
    }
  } catch (error) {
    repondre("❌ Une erreur est survenue.");
    console.error(error);
  }
});



ovlcmd({
  nom_cmd: 'epreuve du tir',
  isfunc: true
}, async (ms_org, ovl, { repondre, auteur_Message, texte }) => {

  if (!texte.toLowerCase().endsWith("*⚽blue🔷lock🥅*")) return;
  const id = auteur_Message;
  const joueur = joueurs.get(id);
  if (!joueur || !joueur.en_cours) return;

  // --- DÉTECTION LOCALE ULTRA-TOLÉRANTE ---
  function detectMissLocal(text) {
    const t = (text || "").toLowerCase().trim();

    const motsClesTir = ["tir", "tire", "frappe", "direct", "enroul", "enroulé", "trivela"];
    const contientTir = motsClesTir.some(m => t.includes(m));

    const zones = ["ras du sol gauche", "ras du sol droite", "mi-hauteur gauche", "mi-hauteur droite", "lucarne gauche", "lucarne droite"];
    const contientZone = zones.some(z => t.includes(z));

    if (!contientZone || !contientTir) return { tir_type: "MISSED", tir_zone: "AUCUNE" };

    return null;
  }

  // --- Fonction pour gérer la répétition après 3 tirs différents ---
  function estTirRepeté(tir_info, tir_courant) {
    const indexDernierIdentique = [...tir_info].reverse().findIndex(
      t => t.tir_type === tir_courant.tir_type && t.tir_zone === tir_courant.tir_zone
    );
    if (indexDernierIdentique === -1) return false;
    const derniersTirs = tir_info.slice(-(indexDernierIdentique));
    const tirsDifferents = derniersTirs.filter(
      t => t.tir_type !== tir_courant.tir_type || t.tir_zone !== tir_courant.tir_zone
    );
    return tirsDifferents.length < 3;
  }

  // --- Étape 1 : Vérification locale ---
  let analyse = detectMissLocal(texte);

  if (analyse && analyse.tir_type === "MISSED") {
    clearTimeout(joueur.timer);
    joueur.en_cours = false;
    await ovl.sendMessage(ms_org, {
      video: { url: "https://files.catbox.moe/9k5b3v.mp4" },
      gifPlayback: true,
      caption: "❌MISSED! : Tir manqué, vous avez échoué à l'exercice. Fermeture de la session..."
    });
    return envoyerResultats(ms_org, ovl, joueur);
  }

  // --- Étape 2 : analyse Gemini si pas de MISS local ---
  if (!analyse) {
    analyse = await analyserTir(texte, repondre);
  }

  if (!analyse || !analyse.tir_type || !analyse.tir_zone) return;

  if (analyse.tir_type === "MISSED") {
    clearTimeout(joueur.timer);
    joueur.en_cours = false;
    await ovl.sendMessage(ms_org, {
      video: { url: "https://files.catbox.moe/9k5b3v.mp4" },
      gifPlayback: true,
      caption: "❌MISSED! : Tir manqué, vous avez échoué à l'exercice. Fermeture de la session..."
    });
    return envoyerResultats(ms_org, ovl, joueur);
  }

  // --- Étape 3 : Vérification répétition ---
  const tir_courant = { tir_type: analyse.tir_type, tir_zone: analyse.tir_zone };
  const tir_repeté = estTirRepeté(joueur.tir_info, tir_courant);

  if (tir_repeté) {
    clearTimeout(joueur.timer);
    joueur.en_cours = false;
    await ovl.sendMessage(ms_org, {
      video: { url: "https://files.catbox.moe/9k5b3v.mp4" },
      gifPlayback: true,
      caption: "❌MISSED! : Tir manqué, vous avez échoué à l'exercice . Fermeture de la session❌"
    });    
return envoyerResultats(ms_org, ovl, joueur);
  }

  // Tir valide (pas répétition)
  joueur.tir_info.push(tir_courant);
  joueur.tirs_total++;
  joueur.but++;

  const restants = 15 - joueur.but;
  await ovl.sendMessage(ms_org, {
    video: { url: "https://files.catbox.moe/pad98d.mp4" },
    gifPlayback: true,
    caption: `✅⚽GOAL : ${joueur.but} but${joueur.but > 1 ? 's' : ''} 🎯\n⚠️ Il vous reste ${restants} tirs ⌛`
  });

  if (joueur.but >= 15) {
    clearTimeout(joueur.timer);
    joueur.en_cours = false;
    return envoyerResultats(ms_org, ovl, joueur);
  }

});    


    
ovlcmd({
  nom_cmd: 'stop_exercice',
  react: '⚽'  
}, async (ms_org, ovl, { repondre, arg, auteur_Message, texte }) => {
  const action = arg[0]?.toLowerCase();
  const targetId = arg[1] + "@s.whatsapp.net";
  const joueur = joueurs.get(targetId);

  if (!joueur) return repondre("❌ Joueur non trouvé.");

  if (action === "pause" && !joueur.paused) {
    clearTimeout(joueur.timer);
    joueur.paused = true;
    joueur.pauseTimestamp = Date.now();
    joueur.remainingTime -= (Date.now() - (joueur.pauseTimestamp || Date.now()));
    return repondre(`⏸️ Épreuve mise en pause.`);
  }

  if (action === "resume" && joueur.paused) {
    joueur.paused = false;
    joueur.timer = setTimeout(() => {
      joueur.en_cours = false;
      //envoyerResultats(ms_org, ovl, joueur);
    }, joueur.remainingTime);
    return repondre(`▶️ Épreuve reprise.`);
  }

  if (action === "stop") {
    clearTimeout(joueur.timer);
    joueur.en_cours = false;
    joueurs.delete(targetId);
    return repondre(`⏹️ Épreuve stoppée.`);
  }

  return repondre("❌ Commande invalide. Utilisez : pause / resume / stop @pseudo");
});

async function envoyerResultats(ms_org, ovl, joueur) {
  const tag = `@${joueur.id.split('@')[0]}`;
  let rank = "❌";
  if (joueur.but >= 15) rank = "SS🥇";
  else if (joueur.but >= 10) rank = "S🥈";
  else if (joueur.but >= 5) rank = "A🥉";

  const result = `▔▔▔▔▔▔▔▔▔▔     ▔▔▔▔▔
                    *🔷BLUE LOCK⚽*
  ▔▔▔▔▔▔▔▔▔▔   ▔▔▔▔▔▔▔▔▔▔
    🔷RESULTATS DE L'ÉVALUATION📊

*🥅Exercice:* Épreuve de tirs
*👤Joueur:* ${tag}
*⚽Buts:* ${joueur.but}
*📊Rank:* ${rank}
`;

  await ovl.sendMessage(ms_org, {
    image: { url: "https://files.catbox.moe/1xnoc6.jpg" },
    caption: result,
    mentions: [joueur.id]
  });

  joueurs.delete(joueur.id);
}
