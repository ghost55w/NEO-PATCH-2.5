const { ovlcmd } = require('../lib/ovlcmd');
const { MyNeoFunctions } = require("../DataBase/myneo_lineup_team");
const { getData, setfiche } = require("../DataBase/allstars_divs_fiches");

// --- Helpers TirageBL ---
async function envoyerVideo(dest, ovl, videoUrl) {
  await ovl.sendMessage(dest, { video: { url: videoUrl }, gifPlayback: true });
}

function tirerParProbabilite(table) {
  const rand = Math.random() * 100;
  let cumul = 0;
  for (const item of table) {
    cumul += item.probability;
    if (rand < cumul) return item.value;
  }
  return table[table.length - 1].value;
}

// --- Tirage Blue Lock avec GIF et choix d'emplacement ---
ovlcmd({
  nom_cmd: "tirageBL",
  react: "🔷",
  classe: "BLUE_LOCK🔷",
  desc: "Lance un tirage Blue Lock (Deluxe, Super ou Ultra)"
}, async (ms_org, ovl, { ms, auteur_Message, repondre }) => {

  try {
    // --------------- Vérification fiche MyNeo ---------------
    const ficheNeo = await MyNeoFunctions.getUserData(auteur_Message);
    if (!ficheNeo) return repondre(`❌ Aucun joueur trouvé avec l'id : ${auteur_Message}`);
    const lineup = ficheNeo.lineup || Array(15).fill(null); // 15 emplacements

    // --------------- Envoi GIF de tirage ---------------
    const gifTirage = "https://files.catbox.moe/gaksn8.webp"; 
    await ovl.sendMessage(ms_org, { video: { url: gifTirage }, caption: "🎲 Prépare-toi pour le tirage..." }, { quoted: ms });

    // --------------- Envoi des 3 images des tirages ---------------
    const tirages = [
      { type: "Deluxe", nc: 30, image: "https://files.catbox.moe/2bszsx.jpg", caption: "💠 Tirage Deluxe - 30 NC 🔷\nProbabilités: B 85%, A 60% (>=5 buts)" },
      { type: "Super", nc: 50, image: "https://files.catbox.moe/4ekp2h.jpg", caption: "💎 Tirage Super - 50 NC 🔷\nProbabilités: A 80%, S 50% (>=10 buts, niv10, OVR>=95 10%)" },
      { type: "Ultra", nc: 70, image: "https://files.catbox.moe/s1jdub.png", caption: "🏆 Tirage Ultra - 70 NC 🔷\nProbabilités: A 80%, S 65% (>=10 buts, niv10, OVR>=95 20%), SS 30% (>=20 buts, niv20, OVR>=105 10%)" },
    ];

    for (const t of tirages) {
      await ovl.sendMessage(ms_org, { image: { url: t.image }, caption: t.caption }, { quoted: ms });
    }

    // --------------- Demande du type de tirage ---------------
    const demanderType = async (tentative = 1) => {
      if (tentative > 3) throw new Error("MaxAttempts");
      const rep = await ovl.recup_msg({ auteur: auteur_Message, ms_org, temps: 60000 });
      const texte = rep.message?.extendedTextMessage?.text || rep.message?.conversation || "";
      const r = texte.toLowerCase();
      if (["deluxe", "super", "ultra"].includes(r)) return r;
      await repondre("⚠️ Choix invalide. Réponds par *Deluxe*, *Super* ou *Ultra*.");
      return await demanderType(tentative + 1);
    };

    const typeTirage = await demanderType();
    const tirageChoisi = tirages.find(t => t.type.toLowerCase() === typeTirage);

    // --------------- Vérification NC ---------------
    if ((ficheNeo.nc || 0) < tirageChoisi.nc) return repondre(`❌ Tu n’as pas assez de NC 🔷 (il te faut ${tirageChoisi.nc})`);
    await MyNeoFunctions.updateUser(auteur_Message, { nc: (ficheNeo.nc || 0) - tirageChoisi.nc });
    await repondre(`🔷 *${tirageChoisi.nc} NC* retirés. Nouveau solde : *${(ficheNeo.nc || 0) - tirageChoisi.nc} NC*`);

    // --------------- Fonction de tirage d'une carte ---------------
    function tirerCarte(type) {
      const cartes = Object.values(cardsBlueLock);
      let filtres = cartes.filter(c => {
        if (type === "deluxe") {
          if (c.rank === "B") return Math.random() <= 0.85;
          if (c.rank === "A") return (ficheNeo.buts >= 5) && Math.random() <= 0.60;
        }
        if (type === "super") {
          if (c.rank === "A") return Math.random() <= 0.80;
          if (c.rank === "S") return (ficheNeo.buts >= 10 && ficheNeo.niveau >= 10) && (c.ovr >= 95 ? Math.random() <= 0.10 : Math.random() <= 0.50);
        }
        if (type === "ultra") {
          if (c.rank === "A") return Math.random() <= 0.80;
          if (c.rank === "S") return (ficheNeo.buts >= 10 && ficheNeo.niveau >= 10) && (c.ovr >= 95 ? Math.random() <= 0.20 : Math.random() <= 0.65);
          if (c.rank === "SS") return (ficheNeo.buts >= 20 && ficheNeo.niveau >= 20) && (c.ovr >= 105 ? Math.random() <= 0.10 : Math.random() <= 0.30);
        }
        return false;
      });
      if (filtres.length === 0) filtres = cartes; // fallback
      return filtres[Math.floor(Math.random() * filtres.length)];
    }

    const cartesTirees = [tirerCarte(typeTirage), tirerCarte(typeTirage)];

    // --------------- Envoi GIF + demande d'emplacement pour chaque carte ---------------
    await ovl.sendMessage(ms_org, { video: { url: gifTirage }, caption: "🎲 Tirage en cours..." }, { quoted: ms });

    for (let i = 0; i < cartesTirees.length; i++) {
      const carte = cartesTirees[i];

      // Demande l'emplacement
      await repondre(`📌 Où veux-tu placer la carte *${carte.name}* (${carte.ovr}) ? Réponds par J1 à J15`);
      let emplacement;
      const demanderEmplacement = async (tentative = 1) => {
        if (tentative > 3) throw new Error("MaxAttempts");
        const rep = await ovl.recup_msg({ auteur: auteur_Message, ms_org, temps: 60000 });
        const txt = rep.message?.extendedTextMessage?.text || rep.message?.conversation || "";
        const em = txt.toUpperCase();
        const index = parseInt(em.replace("J", "")) - 1;
        if (index >= 0 && index < 15) {
          if (lineup[index]) {
            await repondre("❌ Emplacement déjà occupé. Choisis un autre J1-J15.");
            return demanderEmplacement(tentative + 1);
          } else return index;
        }
        await repondre("⚠️ Réponse invalide. Choisis un emplacement entre J1 et J15.");
        return demanderEmplacement(tentative + 1);
      };
      emplacement = await demanderEmplacement();
      lineup[emplacement] = `${carte.name} (${carte.ovr}) 🇯🇵`;

      await ovl.sendMessage(ms_org, { image: { url: carte.image }, caption: `*${carte.name}* (${carte.ovr}) 🇯🇵 placé en ${"J" + (emplacement + 1)}` }, { quoted: ms });
    }

    // --------------- Mise à jour de la fiche ---------------
    await MyNeoFunctions.updateUser(auteur_Message, { lineup });

  } catch (e) {
    if (e.message === "Timeout") return repondre("⏱️ Temps écoulé sans réponse.");
    if (e.message === "MaxAttempts") return repondre("❌ Trop de tentatives échouées.");
    console.error(e);
    return repondre("❌ Erreur lors du tirage : " + e.message);
  }
});
