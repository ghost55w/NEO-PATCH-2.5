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

🎯 ZONES AUTORISÉES :
- Pied droit → droite uniquement
- Pied gauche → gauche uniquement

❌ MISSED si :
- pied ≠ intérieur
- corps non décalé ou mauvais côté
- angle < 40° ou > 60°
- courbe absente
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

❌ MISSED si :
- intérieur ou pointe du pied
- mauvais côté de décalage
- angle invalide
- courbe absente

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
      { contents: [{ parts: [{ text: fullText }] }] },
      { headers: { 'Content-Type': 'application/json' } }
    );

    const data = response.data;
    if (data?.candidates?.length > 0) {
      const raw = data.candidates[0]?.content?.parts?.[0]?.text || "";
      const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());

      return {
        tir_type: parsed.tir_type || "MISSED",
        tir_zone: parsed.tir_zone || "AUCUNE",
        tir_pied: parsed.tir_pied || "AUCUN"
      };
    }
  } catch (err) {
    console.error("Erreur Gemini :", err);
  }
  return null;
}

// --- DÉBUT DE L'ÉPREUVE ---
ovlcmd({
  nom_cmd: 'exercice1',
  classe: 'BLUELOCK⚽',
  react: '⚽',
  desc: "Lance l'épreuve du loup"
}, async (ms_org, ovl, { repondre, auteur_Message }) => {
  try {
    // Défi aléatoire
    const typesTir = ["tir direct", "tir enroulé", "tir trivela"];
    const tirDefi = typesTir[Math.floor(Math.random() * typesTir.length)];

    const texteDebut = `*🔷ÉPREUVE DE TIRS⚽🥅*
Défi aléatoire : ${tirDefi.toUpperCase()} ✅

Objectif : Marquer 18 buts max en 20 minutes ⌛
Face à un gardien robot ⚠️
Si vous ratez un tir, fin de l'exercice ❌`;

    await ovl.sendMessage(ms_org, {
      video: { url: 'https://files.catbox.moe/z64kuq.mp4' },
      gifPlayback: true,
      caption: texteDebut
    });

    const rep = await ovl.recup_msg({ auteur: auteur_Message, ms_org, temps: 60000 });
    const response = rep?.message?.extendedTextMessage?.text || rep?.message?.conversation;
    if (!response) return repondre("⏳Pas de réponse, épreuve annulée.");

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
      caption: `*⚽BLUE LOCK🔷:* Début de l'exercice ⌛ Durée : 20:00 mins\nDéfi : ${tirDefi.toUpperCase()}`
    });
  } catch (error) {
    repondre("❌ Une erreur est survenue.");
    console.error(error);
  }
});

// --- ÉPREUVE DU TIR ---
ovlcmd({
  nom_cmd: 'epreuve du tir',
  isfunc: true
}, async (ms_org, ovl, { repondre, auteur_Message, texte }) => {

  if (!texte.toLowerCase().endsWith("*⚽blue🔷lock🥅*")) return;
  const id = auteur_Message;
  const joueur = joueurs.get(id);
  if (!joueur || !joueur.en_cours) return;

  function detectMissLocal(text) {
    const t = (text || "").toLowerCase().trim();

    const motsClesTir = ["tir direct", "tir enroulé", "tir trivela"];
    const contientTir = motsClesTir.some(m => t.includes(m));

    const zones = ["ras du sol gauche","ras du sol droite","mi-hauteur gauche","mi-hauteur droite","lucarne gauche","lucarne droite"];
    const contientZone = zones.some(z => t.includes(z));

    const pieds = [
      "intérieur du pied droit","intérieur du pied gauche",
      "pointe de pied droit","pointe de pied gauche",
      "cou de pied droit","cou de pied gauche",
      "extérieur du pied droit","extérieur du pied gauche"
    ];
    const contientPied = pieds.some(p => t.includes(p));

    if (!contientTir || !contientZone || !contientPied) {
      return { tir_type: "MISSED", tir_zone: "AUCUNE", tir_pied: "AUCUN" };
    }
    return null;
  }

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

  let analyse = detectMissLocal(texte);

  if (analyse && analyse.tir_type === "MISSED") {
    clearTimeout(joueur.timer);
    joueur.en_cours = false;
    await ovl.sendMessage(ms_org, {
      video: { url: "https://files.catbox.moe/9k5b3v.mp4" },
      gifPlayback: true,
      caption: "❌ MISSED : tir invalide (zone ou pied non précisé)."
    });
    return envoyerResultats(ms_org, ovl, joueur);
  }

  if (!analyse) analyse = await analyserTir(texte, repondre);

  if (!analyse || analyse.tir_type === "MISSED") {
    clearTimeout(joueur.timer);
    joueur.en_cours = false;
    await ovl.sendMessage(ms_org, {
      video: { url: "https://files.catbox.moe/9k5b3v.mp4" },
      gifPlayback: true,
      caption: "❌ MISSED : tir non conforme aux règles."
    });
    return envoyerResultats(ms_org, ovl, joueur);
  }

  const tir_courant = { tir_type: analyse.tir_type, tir_zone: analyse.tir_zone };

  const tir_repeté = estTirRepeté(joueur.tir_info, tir_courant);
  if (tir_repeté) {
    clearTimeout(joueur.timer);
    joueur.en_cours = false;
    await ovl.sendMessage(ms_org, {
      video: { url: "https://files.catbox.moe/9k5b3v.mp4" },
      gifPlayback: true,
      caption: "❌ MISSED : Tir manqué fin de l'exercice."
    });
    return envoyerResultats(ms_org, ovl, joueur);
  }

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
}, async (ms_org, ovl, { repondre, arg, auteur_Message }) => {
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
