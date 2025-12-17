const { ovlcmd } = require('../lib/ovlcmd');
const axios = require('axios');
const joueurs = new Map();

const promptSystem = `
Tu es un assistant spécialisé dans l'analyse d'expressions textuelles décrivant un tir au football.
Tu dois analyser le texte et déterminer précisément le type de tir, le pied utilisé et la zone visée.

❌ RÈGLE PRIORITAIRE :
Si l'utilisateur ne précise PAS une zone de tir valide parmi :
[ras du sol gauche, ras du sol droite, mi-hauteur gauche, mi-hauteur droite, lucarne gauche, lucarne droite]

→ Réponds IMMÉDIATEMENT en JSON :
{
  "tir_type": "MISSED",
  "tir_pied": "AUCUN",
  "tir_zone": "AUCUNE"
}

--------------------------------------------------
⚽ TIR DIRECT
--------------------------------------------------
Conditions OBLIGATOIRES :
- Le texte doit contenir explicitement "tir direct"
- Le tir doit être effectué avec :
  • la pointe du pied
  • l'intérieur du pied
  • le cou du pied UNIQUEMENT si le ballon est à 50cm de hauteur (50cmh)

Exemples valides :
Rin "tir direct" de "la pointe du pied droit" visant la "lucarne gauche"
Rin "tir direct" de "l'intérieur du pied gauche" vers la "mi-hauteur droite"

⚠️ Le cou de pied est VALIDE UNIQUEMENT si la hauteur du ballon = 50cm ou 50cmh

❌ MISSED si :
- "tir direct" sans pied précisé
- pied précisé mais sans zone visée
- cou de pied sans mention explicite des 50cm / 50cmh
- "Rin tire" sans "tir direct"

--------------------------------------------------
⚽ TIR ENROULÉ
--------------------------------------------------
Conditions OBLIGATOIRES :
- Mot-clé exact : "tir enroulé"
- UNIQUEMENT avec l'intérieur du pied
- Corps décalé du MÊME côté que le pied utilisé
- Angle du corps : 40°, 50° ou 60° (obligatoire)
- Courbe OBLIGATOIRE

📏 COURBE AUTORISÉE :
A1 (≤ 5m du but) :
- courbe ≥ 0.5m (50cm)
- courbe ≤ 1m

A2 (> 5m et ≤ 10m du but) :
- courbe ≥ 1.5m (150cm)
- courbe ≤ 2m

🎯 ZONES AUTORISÉES :
- Pied droit → droite uniquement (lucarne droite, mi-hauteur droite, ras du sol droite)
- Pied gauche → gauche uniquement

❌ MISSED si :
- pied ≠ intérieur
- corps non décalé ou mauvais côté
- angle < 40° ou > 60°
- courbe absente
- courbe hors limites A1 / A2
- zone opposée au pied utilisé

--------------------------------------------------
⚽ TIR TRIVELA
--------------------------------------------------
Conditions OBLIGATOIRES :
- Mot-clé exact : "tir trivela"
- UNIQUEMENT avec l'extérieur du pied
- Corps décalé du côté OPPOSÉ au pied utilisé
- Angle du corps : 40°, 50° ou 60°
- Courbe OBLIGATOIRE

📏 COURBE :
A1 :
- ≥ 0.5m (50cm)
- ≤ 1m

A2 :
- ≥ 1.5m (150cm)
- ≤ 2m

🎯 PARTICULARITÉ TRIVELA :
- Trivela pied droit → peut viser lucarne gauche
  • lucarne gauche : courbe < 1m (A1)
  • lucarne droite : ≤ 1m (A1)
- Trivela pied gauche → règles inversées
  • lucarne gauche : ≤ 2m (A2)
  • lucarne droite : ≤ 2m (A2)

❌ MISSED si :
- intérieur ou pointe du pied
- mauvais côté de décalage
- angle invalide
- courbe absente ou hors limites

--------------------------------------------------
⚽ TIR DE LA TÊTE
--------------------------------------------------
Conditions :
- Mot-clé exact : "tir direct de la tête"
- Zone visée obligatoire
- Distance < 4m des buts
- UNIQUEMENT en A1

--------------------------------------------------
🦶 tir_pied (OBLIGATOIRE SI TIR VALIDE)
--------------------------------------------------
Valeurs possibles EXACTES :
- intérieur du pied droit
- intérieur du pied gauche
- pointe du pied droit
- pointe du pied gauche
- cou de pied droit
- cou de pied gauche
- extérieur du pied droit
- extérieur du pied gauche

--------------------------------------------------
🎯 EXTRACTION FINALE
--------------------------------------------------
Tu dois extraire STRICTEMENT :

tir_type parmi :
[
 tir direct,
 tir enroulé,
 tir trivela,
 tir de la tête,
 MISSED
]

tir_pied parmi la liste officielle ci-dessus  
tir_zone parmi les zones officielles

--------------------------------------------------
📤 FORMAT DE RÉPONSE (JSON STRICT UNIQUEMENT)
--------------------------------------------------
{
  "tir_type": "<valeur>",
  "tir_pied": "<valeur>",
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
    if (!data.candidates || data.candidates.length === 0) return null;

    let texteReponse = data.candidates[0]?.content?.parts?.[0]?.text || "";

    // Nettoyage markdown Gemini
    texteReponse = texteReponse.replace(/```json|```/g, '').trim();

    let parsed;
    try {
      parsed = JSON.parse(texteReponse);
    } catch (e) {
      console.error("❌ JSON invalide Gemini :", texteReponse);
      return null;
    }

    // --- SÉCURISATION DES CHAMPS ---
    if (!parsed.tir_type) parsed.tir_type = "MISSED";
    if (!parsed.tir_zone) parsed.tir_zone = "AUCUNE";
    if (!parsed.tir_pied) parsed.tir_pied = "AUCUN";

    // Normalisation MISSED
    if (parsed.tir_type === "MISSED") {
      parsed.tir_zone = "AUCUNE";
      parsed.tir_pied = "AUCUN";
    }

    console.log("🎯 Analyse tir :", parsed);
    return {
      tir_type: parsed.tir_type,
      tir_zone: parsed.tir_zone,
      tir_pied: parsed.tir_pied
    };

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
