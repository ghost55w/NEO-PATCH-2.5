const { ovlcmd } = require('ovlcmd');
const axios = require('axios');
const joueurs = new Map();

//---------------- PROMPT GEMINI ----------------
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
//---------------- FONCTION GEMINI ----------------
async function analyserTir(texte) {
  try {
    const fullText = `${promptSystem}\n"${texte}"`;
    const response = await axios.post(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=YOUR_API_KEY',
      { contents: [{ parts: [{ text: fullText }] }] },
      { headers: { 'Content-Type': 'application/json' } }
    );

    const raw = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());

    return {
      tir_type: parsed.tir_type || "MISSED",
      tir_zone: parsed.tir_zone || "AUCUNE",
      tir_pied: parsed.tir_pied || "AUCUN",
      courbe: parsed.courbe || null,
      angle_corps: parsed.angle_corps || null
    };
  } catch (err) {
    console.error("Erreur Gemini :", err);
    return null;
  }
}

//---------------- PROBABILITE DE GOAL ----------------
function calcChanceGoal(tir) {
  if (tir.tir_type === "tir direct") return 0.9;
  if (tir.tir_type === "tir enroulé") {
    let chance = 0.7;
    if (tir.courbe) chance = 0.85;
    if (tir.angle_corps) {
      if (tir.angle_corps === 60) chance = Math.max(chance, 0.85);
      else if (tir.angle_corps === 50) chance = Math.max(chance, 0.75);
      else if (tir.angle_corps === 40) chance = Math.max(chance, 0.5);
    }
    return chance;
  }
  if (tir.tir_type === "tir trivela") {
    let chance = 0.7;
    if (tir.courbe) chance = 0.8;
    if (tir.angle_corps) {
      if (tir.angle_corps === 60) chance = Math.max(chance, 0.8);
      else if (tir.angle_corps === 50) chance = Math.max(chance, 0.7);
      else if (tir.angle_corps === 40) chance = Math.max(chance, 0.5);
    }
    return chance;
  }
  return 0; // MISSED
}

//---------------- DETECTION LOCAL DU TIR ----------------
function detectMissLocal(text) {
  if (!text) return { tir_type: "MISSED", tir_zone: "AUCUNE", tir_pied: "AUCUN" };

  // Normalisation
  let t = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, '');
  t = t.replace(/['’`]/g, '');
  t = t.replace(/\s+/g, ' ').trim();

  //---------------- MOTS-CLÉS PAR TYPE ----------------
  const tirDirect = ["tir direct","pointe du pied","interieur du pied","cou de pied","ras du sol","mi-hauteur","lucarne"];
  const tirEnroule = ["tir enroule","interieur du pied","corps decale","angle 40","angle 50","angle 60","courbe","gauche","droite","lucarne","mi-hauteur","ras du sol"];
  const tirTrivela = ["tir trivela","exterieur du pied","corps decale","angle 40","angle 50","angle 60","courbe","gauche","droite","lucarne","mi-hauteur","ras du sol"];

  function checkTir(requiredKeywords) {
    return requiredKeywords.every(k => t.includes(k));
  }

  if (checkTir(tirDirect)) return null;
  if (checkTir(tirEnroule)) return null;
  if (checkTir(tirTrivela)) return null;

  return { tir_type: "MISSED", tir_zone: "AUCUNE", tir_pied: "AUCUN" };
}

//---------------- COMMANDE DEBUT EXERCICE ----------------
ovlcmd({
  nom_cmd: 'exercice1',
  classe: 'BLUELOCK⚽',
  react: '⚽',
  desc: "Lance l'épreuve du loup"
}, async (ms_org, ovl, { repondre, auteur_Message }) => {
  try {
    const texteDebut = `*🔷ÉPREUVE DE TIRS⚽🥅*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔░▒▒▒▒░░▒░

                   🔷⚽RÈGLES:
Dans cet exercice l'objectif est de marquer 18 buts en 18 tirs max dans le temps imparti ❗20 mins⌛ face à un gardien Robot qui mémorise vos tirs pour bloquer le même tir de suite. ⚠Vous devez marquer au moins 6 buts sinon vous êtes éliminé ❌. 

⚠SI VOUS RATEZ UN TIR, FIN DE L'EXERCICE ❌.
 
          ▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔ 
                       🔷RANKING🏆 
 
           ▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔                        
🥉Novice: 5 buts⚽ (25 pts) 
🥈Pro: 10 buts⚽ (50 pts) 
🥇Classe mondiale: 15 buts⚽🏆(100 pts) 

▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔░ ░                         

Souhaitez-vous lancer l'exercice ? :
✅ Oui
❌ Non
╰───────────────────
                      *⚽BLUE🔷LOCK*`;
    await ovl.sendMessage(ms_org, { image: { url: 'https://files.catbox.moe/09rll9.jpg' }, caption: texteDebut });
    const rep = await ovl.recup_msg({ auteur: auteur_Message, ms_org, temps: 60000 });
    const response = rep?.message?.extendedTextMessage?.text || rep?.message?.conversation;
    if (!response) return repondre("⏳Pas de réponse, épreuve annulée.");
    if (response.toLowerCase() === "non") return repondre("❌ Lancement de l'exercice annulé...");

    const id = auteur_Message;
    const timer = setTimeout(() => {
      if (joueurs.has(id)) {
        joueurs.get(id).en_cours = false;
        envoyerResultats(ms_org, ovl, joueurs.get(id));
      }
    }, 20 * 60 * 1000);

    joueurs.set(id, { id, tir_info: [], but: 0, tirs_total: 0, en_cours: true, timer, paused: false, remainingTime: 20*60*1000, pauseTimestamp: null, prochainDefi: Math.floor(Math.random()*2)+2, tirDefiEnCours: false, typeDefi: null });

    await ovl.sendMessage(ms_org, { video: { url: "https://files.catbox.moe/zqm7et.mp4" }, gifPlayback: true, caption: `*⚽BLUE LOCK🔷:* Début de l'exercice ⌛ Durée : 20:00 mins` });
  } catch (error) { repondre("❌ Une erreur est survenue."); console.error(error); }
});

//---------------- ÉPREUVE DU TIR ----------------
ovlcmd({
  nom_cmd: 'epreuve du tir',
  isfunc: true
}, async (ms_org, ovl, { repondre, auteur_Message, texte }) => {
  if (!texte.toLowerCase().endsWith("*⚽blue🔷lock🥅*")) return;
  const joueur = joueurs.get(auteur_Message);
  if (!joueur || !joueur.en_cours) return;

  let analyse = detectMissLocal(texte);
  if (!analyse) analyse = await analyserTir(texte);
  if (!analyse || analyse.tir_type === "MISSED") {
    clearTimeout(joueur.timer);
    joueur.en_cours = false;
    await ovl.sendMessage(ms_org, { video: { url: "https://files.catbox.moe/9k5b3v.mp4" }, gifPlayback: true, caption: "❌MISSED : Tir manqué fin de l'exercice !" });
    return envoyerResultats(ms_org, ovl, joueur);
  }

  const chance = calcChanceGoal(analyse);
  const goalReussi = Math.random() <= chance;

  if (!goalReussi) {
    clearTimeout(joueur.timer);
    joueur.en_cours = false;
    await ovl.sendMessage(ms_org, { video: { url: "https://files.catbox.moe/9k5b3v.mp4" }, gifPlayback: true, caption: "❌MISSED : Tir manqué fin de l'exercice !" });
    return envoyerResultats(ms_org, ovl, joueur);
  }

  joueur.tir_info.push(analyse);
  joueur.tirs_total++;
  joueur.but++;
  const restants = 15 - joueur.but;
  await ovl.sendMessage(ms_org, { video: { url: "https://files.catbox.moe/pad98d.mp4" }, gifPlayback: true, caption: `✅⚽GOAL : ${joueur.but} but${joueur.but>1?'s':''} 🎯\n⚠️ Il vous reste ${restants} tirs ⌛` });

  if (joueur.but >= 15) {
    clearTimeout(joueur.timer);
    joueur.en_cours = false;
    return envoyerResultats(ms_org, ovl, joueur);
  }
});

//---------------- RESULTATS ----------------
async function envoyerResultats(ms_org, ovl, joueur) {
  const tag = `@${joueur.id.split('@')[0]}`;
  let rank = "❌";
  if (joueur.but >= 15) rank = "SS🥇";
  else if (joueur.but >= 10) rank = "S🥈";
  else if (joueur.but >= 5) rank = "A🥉";

  const result = `
🔷RESULTATS DE L'ÉVALUATION📊


*🥅Exercice:* Épreuve de tirs
*👤Joueur:* ${tag}
*⚽Buts:* ${joueur.but}
*📊Rank:* ${rank}

╰───────────────────
                      *🔷BLUELOCK⚽*`;

  await ovl.sendMessage(ms_org, { image: { url: "https://files.catbox.moe/1xnoc6.jpg" }, caption: result, mentions: [joueur.id] });
  joueurs.delete(joueur.id);
    }
