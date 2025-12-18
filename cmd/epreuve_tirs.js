const { ovlcmd } = require('../lib/ovlcmd');
const joueurs = new Map();

//---------------- ZONES ET PIEDS ----------------
const ZONES = ["ras du sol gauche","ras du sol droite","mi-hauteur gauche","mi-hauteur droite","lucarne gauche","lucarne droite"];
const PIEDS = ["interieur du pied droit","interieur du pied gauche","pointe du pied droit","pointe du pied gauche","cou de pied droit","cou de pied gauche","exterieur du pied droit","exterieur du pied gauche"];

//---------------- MODÈLES DE TIRS ----------------
const MODELES_TIRS = [
  {
    texte: "Isagi fait un tir enroulé de l'intérieur du pied droit le corps décalé de 60° sur la droite avec une courbe de 1m visant la lucarne droite",
    tir_type: "tir enroulé",
    tir_pied: "interieur du pied droit",
    angle_corps: 60,
    corps: "droite",
    courbe: "1m",
    tir_zone: "lucarne droite"
  },
  {
  texte: "Rin fait un tir trivela de l'extérieur du pied droit le corps décalé de 60° sur la gauche avec une courbe de 1m visant la lucarne droite",
  tir_type: "tir trivela",
  tir_pied: "exterieur du pied droit",
  angle_corps: 60,
  corps: "gauche",
  courbe: "1m",
  tir_zone: "lucarne droite"
  }, 
  {
    texte: "Rin fait un tir direct de la pointe du pied gauche visant la lucarne gauche",
    tir_type: "tir direct",
    tir_pied: "pointe du pied gauche",
    angle_corps: null,
    corps: null,
    courbe: null,
    tir_zone: "lucarne gauche"
  }
  // Ajouter tous tes modèles préétablis ici
];

//---------------- DÉTECTION PAR MODÈLE ----------------
function detectTirParModel(text) {
  const t = text.toLowerCase().trim();
  for (const model of MODELES_TIRS) {
    const m = model.texte.toLowerCase();
    const similarity = getSimilarity(t, m);
    if (similarity >= 0.7) {
      return { ...model };
    }
  }
  return { tir_type:"MISSED", tir_pied:"AUCUN", tir_zone:"AUCUNE", angle_corps:null, corps:null, courbe:null };
}

//---------------- FONCTION SIMILARITÉ SIMPLE ----------------
function getSimilarity(a, b) {
  const wordsA = a.split(/\s+/);
  const wordsB = b.split(/\s+/);
  const intersection = wordsA.filter(w => wordsB.includes(w)).length;
  const union = Math.max(wordsA.length, wordsB.length);
  return intersection / union;
}

//---------------- PROBABILITE DE GOAL ----------------
function calcChanceGoal(tir) {
  if (tir.tir_type === "tir direct") return 0.9;
  if (tir.tir_type === "tir enroulé" || tir.tir_type === "tir trivela") {
    let chance = 0.7;
    if(tir.courbe) chance = 0.85;
    if(tir.angle_corps) {
      if(tir.angle_corps === 60) chance = Math.max(chance,0.85);
      else if(tir.angle_corps === 50) chance = Math.max(chance,0.75);
      else if(tir.angle_corps === 40) chance = Math.max(chance,0.5);
    }
    return chance;
  }
  return 0;
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
      if(joueurs.has(id)) {
        joueurs.get(id).en_cours = false;
        envoyerResultats(ms_org, ovl, joueurs.get(id));
      }
    }, 20*60*1000);

    joueurs.set(id, { 
      id, tir_info: [], but:0, tirs_total:0, en_cours:true, timer, paused:false, remainingTime:20*60*1000, pauseTimestamp:null, 
      prochainDefi:2, tirDefiEnCours:false, typeDefi:null 
    });

    await ovl.sendMessage(ms_org, { video: { url: "https://files.catbox.moe/zqm7et.mp4" }, gifPlayback:true, caption: `*⚽BLUE LOCK🔷:* Début de l'exercice ⌛ Durée : 20:00 mins` });
  } catch (error) { repondre("❌ Une erreur est survenue."); console.error(error); }
});

//---------------- ÉPREUVE DU TIR ----------------
ovlcmd({
  nom_cmd: 'epreuve du tir',
  isfunc: true
}, async (ms_org, ovl, { repondre, auteur_Message, texte }) => {
  if(!texte.toLowerCase().endsWith("*⚽blue🔷lock🥅*")) return;
  const joueur = joueurs.get(auteur_Message);
  if(!joueur || !joueur.en_cours) return;

  // Détection par modèle
  const analyse = detectTirParModel(texte);

  if(!analyse || analyse.tir_type === "MISSED") {
    clearTimeout(joueur.timer);
    joueur.en_cours = false;
    await ovl.sendMessage(ms_org, {
      video:{ url:"https://files.catbox.moe/9k5b3v.mp4" },
      gifPlayback:true,
      caption:"❌MISSED : Tir manqué fin de l'exercice !"
    });
    return envoyerResultats(ms_org, ovl, joueur);
  }

  const chance = calcChanceGoal(analyse);
  const goalReussi = Math.random() <= chance;

  if(goalReussi) {
    joueur.tir_info.push(analyse);
    joueur.tirs_total++;
    joueur.but++;
    const restants = 15 - joueur.but;

    await ovl.sendMessage(ms_org, {
      video:{ url:"https://files.catbox.moe/pad98d.mp4" },
      gifPlayback:true,
      caption:`✅⚽GOAL : ${joueur.but} but${joueur.but>1?'s':''} 🎯\n⚠️ Il vous reste ${restants} tirs ⌛`
    });

    // Vérifier si défi à lancer
    if(joueur.but >= joueur.prochainDefi && !joueur.tirDefiEnCours) {
      joueur.tirDefiEnCours = true;
      // Exemple simple de défi
      joueur.typeDefi = Math.random() < 0.5 ? "tir spécial" : "tir rapide";
      await ovl.sendMessage(ms_org, { caption: `⚠️ Défi activé : ${joueur.typeDefi.toUpperCase()} !` });
      joueur.prochainDefi += Math.floor(Math.random()*2)+2; // prochain défi après 2-3 tirs réussis
    }

    if(joueur.but >= 15) {
      clearTimeout(joueur.timer);
      joueur.en_cours = false;
      return envoyerResultats(ms_org, ovl, joueur);
    }

  } else {
    clearTimeout(joueur.timer);
    joueur.en_cours = false;
    await ovl.sendMessage(ms_org, {
      video:{ url:"https://files.catbox.moe/9k5b3v.mp4" },
      gifPlayback:true,
      caption:"❌MISSED : Tir manqué fin de l'exercice !"
    });
    return envoyerResultats(ms_org, ovl, joueur);
  }
});

//---------------- RESULTATS ----------------
async function envoyerResultats(ms_org, ovl, joueur) {
  const tag = `@${joueur.id.split('@')[0]}`;
  let rank = "❌";
  if(joueur.but >= 15) rank = "SS🥇";
  else if(joueur.but >= 10) rank = "S🥈";
  else if(joueur.but >= 5) rank = "A🥉";

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
