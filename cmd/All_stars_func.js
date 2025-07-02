async function goal(ovl, ms_org, repondre, texte) {
    if (!texte.toLowerCase().startsWith("🔷⚽duel action de but🥅")) return;

    const tirMatch = texte.match(/🥅Tir\s*=\s*(\d+)/i);
    const gardienMatch = texte.match(/🥅Gardien\s*=\s*(\d+)/i);
    const zoneMatch = texte.match(/🥅Zone\s*=\s*([\w\s-]+)/i);
    const distanceMatch = texte.match(/🥅Distance\s*=\s*([\d.]+)/i);

    if (!tirMatch || !gardienMatch || !zoneMatch || !distanceMatch) {
        return repondre("⚠️ Format incorrect. Assure-toi que la fiche est bien remplie.");
    }

    const tirPuissance = parseInt(tirMatch[1], 10);
    const gardien = parseInt(gardienMatch[1], 10);
    const zone = zoneMatch[1].trim().toLowerCase().replace(/\s+/g, ' ');
    const distance = parseFloat(distanceMatch[1]);

    let resultat;

    if (distance <= 5) {
        resultat = tirPuissance > gardien ? "but" :
                   tirPuissance === gardien ? (Math.random() < 0.5 ? "but" : "arrêt") :
                   (Math.random() < 0.2 ? "but" : "arrêt");
    } else if (distance <= 10) {
        resultat = tirPuissance > gardien ? (Math.random() < 0.6 ? "but" : "arrêt") :
                   tirPuissance === gardien ? (Math.random() < 0.3 ? "but" : "arrêt") :
                   (Math.random() < 0.1 ? "but" : "arrêt");
    } else {
        resultat = tirPuissance > gardien ? "but" : "arrêt";
    }

    await zk.sendMessage(dest, { 
        video: { url: "https://files.catbox.moe/z64kuq.mp4" }, 
        caption: "",
        gifPlayback: true 
    });

if (resultat === "but") {
    let messageBut = "*🥅:✅GOOAAAAAL!!!⚽⚽⚽ ▱▱▱▱*\n";

    const commentaires = {
            "lucarne droite": [
                "*🎙️: COMME UN MISSILE GUIDÉ ! Le ballon se niche dans la lucarne droite - splendide !*",
                "*🎙️: UNE FRAPPE POUR L'HISTOIRE ! La lucarne droite explose sous l'effet de la frappe !*"
            ],
            "lucarne gauche": [
                "*🎙️: MAGNIFIQUE ! La lucarne gauche est pulvérisée par cette frappe !*",
                "*🎙️: UNE PRÉCISION D'ORFÈVRE ! Lucarne gauche touchée, le gardien impuissant !*"
            ],
            "lucarne milieu": [
                "*🎙️: JUSTE SOUS LA BARRE ! Une frappe centrée magistrale !*",
                "*🎙️: UNE FRAPPE POUR LES LIVRES D’HISTOIRE ! En pleine lucarne centrale !*"
            ],
            "mi-hauteur droite": [
                "*🎙️: UNE FRAPPE SÈCHE ET PRÉCISE ! Filets droits transpercés !*"
            ],
            "mi-hauteur gauche": [
                "*🎙️: PUISSANCE ET PRÉCISION ! Le ballon traverse la défense à gauche !*"
            ],
            "mi-hauteur centre": [
                "*🎙️: UNE FUSÉE AU CENTRE ! Le ballon frappe en plein milieu à mi-hauteur !*"
            ],
            "ras du sol droite": [
                "*🎙️: ENTRE LES JAMBES ! Le ballon glisse à ras du sol côté droit !*"
            ],
            "ras du sol gauche": [
                "*🎙️: UNE RACLÉE TECHNIQUE ! Le tir rase le sol à gauche et finit au fond !*"
            ],
            "ras du sol milieu": [
                "*🎙️: UNE FINALE DE CLASSE ! Le ballon fuse au sol, en plein centre !*"
            ]
        };

    if (!commentaires[zone]) {
    await repondre(`Zone inconnue : *${zone}*\nZones valides :\n- ${Object.keys(commentaires).join("\n- ")}`);
    return;
 }
    const optionsCommentaire = commentaires[zone] || ["*🎙️: QUEL TIR !*"];
    const commentaire = optionsCommentaire[Math.floor(Math.random() * optionsCommentaire.length)];

    const videosBute = [
        "https://files.catbox.moe/chcn2d.mp4",
        "https://files.catbox.moe/t04dmz.mp4",
        "https://files.catbox.moe/8t1eya.mp4"
    ];
    const videosBut = videosBute[Math.floor(Math.random() * videosBute.length)];

    await ovl.sendMessage(ms_org, { 
        video: { url: videosBut }, 
        caption: `${messageBut}${commentaire}`,
        gifPlayback: true 
    });
} else {
    await ovl.sendMessage(ms_org, { 
        video: { url: 'https://files.catbox.moe/88lylr.mp4' }, 
        caption: "*🥅:❌MISSED GOAL!!! ▱▱▱▱*", 
        gifPlayback: true 
    });
}
}

const activeCountdowns = {};

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

async function stopCountdown(ovl, ms_org) {
    if (activeCountdowns[ms_org]) {
        clearInterval(activeCountdowns[ms_org]);
        delete activeCountdowns[ms_org];
        await ovl.sendMessage(ms_org, { text: "⏹️ Décompte arrêté manuellement." });
    } else {
        await ovl.sendMessage(ms_org, { text: "⚠️ Aucun décompte actif à arrêter." });
    }
}

async function latence({ ovl, ms_org, texte }) {
    const neoTexte = texte.toLowerCase();
    const nextWords = ['next', 'nx', 'nxt'];

    if (neoTexte === "stop" || neoTexte.endsWith(`. 🔷blue lock neo🥅▱▱▱\n> ©2025 neo next game *launch*`)) {
        await stopCountdown(ovl, ms_org);
        return;
    }

    if (!(neoTexte.startsWith('@') && nextWords.some(word => neoTexte.endsWith(word)))) {
        return;
    }

    if (activeCountdowns[ms_org]) {
        await ovl.sendMessage(ms_org, { text: "⚠️ Un décompte est déjà actif ici." });
        return;
    }

    let countdownTime = 6 * 60;

    const userMatch = texte.match(/@(\d+)/);
    const user = userMatch?.[1] ? `${userMatch[1]}@lid` : null;

    const lienGif = 'https://files.catbox.moe/hqh4iz.mp4';

    await ovl.sendMessage(ms_org, {
        video: { url: lienGif },
        gifPlayback: true,
        caption: ""
    });

    activeCountdowns[ms_org] = setInterval(async () => {
        try {
            countdownTime--;

            if (countdownTime === 120 && user) {
                await ovl.sendMessage(ms_org, { text: `⚠️ @${userMatch[1]} il ne reste plus que 2 minutes.`, mentions: [user] });
            }

            if (countdownTime <= 0) {
                clearInterval(activeCountdowns[ms_org]);
                delete activeCountdowns[ms_org];
                await ovl.sendMessage(ms_org, { text: "⚠️ Latence Out" });
            }
        } catch (err) {
            console.error("❌ Erreur pendant le décompte :", err.message || err);
            clearInterval(activeCountdowns[ms_org]);
            delete activeCountdowns[ms_org];
        }
    }, 1000);
}

module.exports = { goal, latence };
