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

// --- Tirage Blue Lock ---
ovlcmd({
  nom_cmd: "tirageBL",
  react: "⚽",
  classe: "NEO_GAMES🎰",
  desc: "Lance un tirage Blue Lock"
}, async (ms_org, ovl, { ms, auteur_Message, repondre }) => {

  try {
    const autorises = [
      '120363049564083813@g.us',
      '120363307444088356@g.us',
      '120363403433342575@g.us',
      '22651463203@s.whatsapp.net',
      '22605463559@s.whatsapp.net',
    ];
    if (!autorises.includes(ms_org)) return;

    // --- IMAGE DE DÉBUT ---
    await ovl.sendMessage(ms_org, {
      image: { url: 'https://files.catbox.moe/swbsgf.jpg' },
      caption: '🎊 Bienvenue dans le Tirage Blue Lock ⚽\nChoisissez votre type de tirage : Deluxe, Super ou Ultra'
    }, { quoted: ms });

    // --- DEMANDE TYPE DE TIRAGE ---
    const demanderType = async (tentative = 1) => {
      if (tentative > 3) throw new Error("MaxAttempts");
      try {
        const rep = await ovl.recup_msg({ auteur: auteur_Message, ms_org, temps: 60000 });
        const texte = rep?.message?.extendedTextMessage?.text || rep?.message?.conversation || "";
        const choix = texte.toLowerCase().trim();
        if (["deluxe"].includes(choix)) return "deluxe";
        if (["super"].includes(choix)) return "super";
        if (["ultra"].includes(choix)) return "ultra";
        await repondre("Choix invalide. Réponds par *Deluxe*, *Super* ou *Ultra*.");
        return await demanderType(tentative + 1);
      } catch {
        throw new Error("Timeout");
      }
    };

    const typeTirage = await demanderType();

    // --- Récupération fiche MyNeo ---
    const ficheNeo = await MyNeoFunctions.getUserData(auteur_Message);
    if (!ficheNeo) return repondre(`❌ Aucun joueur trouvé avec l'id : ${auteur_Message}`);

    // --- Déduction NC ---
    const prixNC = { deluxe: 20, super: 40, ultra: 60 }[typeTirage];
    if ((ficheNeo.nc || 0) < prixNC) return repondre(`❌ Tu n’as pas assez de NC 🔷 (il te faut ${prixNC})`);
    await MyNeoFunctions.updateUser(auteur_Message, { nc: (ficheNeo.nc || 0) - prixNC });
    await repondre(`🔷 *${prixNC} NC* retirés de ta fiche. Nouveau solde : *${(ficheNeo.nc || 0) - prixNC} NC*`);

    // --- Vidéo Tirage ---
    const videoLinks = {
      deluxe: 'https://files.catbox.moe/amtfgl.mp4',
      super: 'https://files.catbox.moe/kodcj4.mp4',
      ultra: 'https://files.catbox.moe/3x9cvk.mp4'
    };
    await envoyerVideo(ms_org, ovl, videoLinks[typeTirage]);

    // --- Probabilités par tirage ---
    let probasGrade;
    switch (typeTirage) {
      case 'deluxe':
        probasGrade = [
          { value: "B", probability: 80 },
          { value: "A", probability: 50 },
          { value: "S", probability: 5 }
        ];
        break;
      case 'super':
        probasGrade = [
          { value: "A", probability: 50 },
          { value: "S", probability: 30 },
          { value: "S+95", probability: 10 },
          { value: "SS", probability: 1 }
        ];
        break;
      case 'ultra':
        probasGrade = [
          { value: "A", probability: 50 },
          { value: "S", probability: 50 },
          { value: "S+95", probability: 30 },
          { value: "SS", probability: 20 },
          { value: "SS+105", probability: 5 }
        ];
        break;
    }

    // --- Récupération fiche Blue Lock & lineup ---
    const ficheBL = await getData({ jid: auteur_Message });
    if (!ficheBL) return repondre("❌ Fiche Blue Lock introuvable pour ce joueur.");
    const lineup = ficheBL.lineup ? ficheBL.lineup.split(",") : [];
    const placesLibres = [];
    for (let i = 1; i <= 5; i++) if (!lineup[i - 1] || lineup[i - 1] === "") placesLibres.push(i);
    if (placesLibres.length === 0) return repondre("❌ Plus de place libre dans ton lineup (j1 à j5).");

    // --- Tirage carte ---
    const cardTiree = tirerParProbabilite(probasGrade);

    // --- Demande placement ---
    await repondre(`🎯 Vous avez tiré une carte de grade *${cardTiree}* !\nChoisis la place libre dans ton lineup : ${placesLibres.map(p => `j${p}`).join(", ")}`);

    const demanderPlacement = async (tentative = 1) => {
      if (tentative > 3) throw new Error("MaxAttempts");
      try {
        const rep = await ovl.recup_msg({ auteur: auteur_Message, ms_org, temps: 60000 });
        const texte = rep?.message?.extendedTextMessage?.text || rep?.message?.conversation || "";
        const num = parseInt(texte.replace("j", ""));
        if (placesLibres.includes(num)) return num;
        await repondre(`❌ Choix invalide. Choisis parmi les places libres : ${placesLibres.map(p => `j${p}`).join(", ")}`);
        return await demanderPlacement(tentative + 1);
      } catch {
        throw new Error("Timeout");
      }
    };

    const placeChoisie = await demanderPlacement();

    // --- Mise à jour lineup + NS ---
    lineup[placeChoisie - 1] = cardTiree;
    await setfiche("lineup", lineup.join(","), auteur_Message);
    const newNS = (parseInt(ficheNeo.ns) || 0) + 5;
    await MyNeoFunctions.updateUser(auteur_Message, { ns: newNS });

    await repondre(`🎉 Carte ajoutée en j${placeChoisie} : ${cardTiree}\n🎊 +5👑 Royalities ajoutés à ta fiche !`);

  } catch (e) {
    if (e.message === "Timeout") return repondre("*⏱️ Temps écoulé sans réponse.*");
    if (e.message === "MaxAttempts") return repondre("*❌ Trop de tentatives échouées.*");
    console.error(e);
    repondre("❌ Une erreur est survenue lors du tirage Blue Lock.");
  }
});
