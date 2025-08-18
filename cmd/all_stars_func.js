const { ovlcmd } = require("../lib/ovlcmd");

ovlcmd({
    nom: "goal",
    isfunc: true
}, async (ms_org, ovl, { texte, repondre }) => {
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

    await ovl.sendMessage(ms_org, {
        video: { url: "https://files.catbox.moe/z64kuq.mp4" },
        caption: "",
        gifPlayback: true
    });

    if (resultat === "but") {
        const commentaires = {
            "lucarne droite": ["*🎙️: COMME UN MISSILE GUIDÉ ! Le ballon se niche dans la lucarne droite - splendide !*", "*🎙️: UNE FRAPPE POUR L'HISTOIRE ! La lucarne droite explose sous l'effet de la frappe !*"],
            "lucarne gauche": ["*🎙️: MAGNIFIQUE ! La lucarne gauche est pulvérisée par cette frappe !*", "*🎙️: UNE PRÉCISION D'ORFÈVRE ! Lucarne gauche touchée, le gardien impuissant !*"],
            "lucarne milieu": ["*🎙️: JUSTE SOUS LA BARRE ! Une frappe centrée magistrale !*", "*🎙️: UNE FUSÉE POUR LES LIVRES D’HISTOIRE ! En pleine lucarne centrale !*"],
            "mi-hauteur droite": ["*🎙️: UNE FRAPPE SÈCHE ET PRÉCISE ! Filets droits transpercés !*"],
            "mi-hauteur gauche": ["*🎙️: PUISSANCE ET PRÉCISION ! Le ballon traverse la défense à gauche !*"],
            "mi-hauteur centre": ["*🎙️: UNE FUSÉE AU CENTRE ! Le ballon frappe en plein milieu à mi-hauteur !*"],
            "ras du sol droite": ["*🎙️: ENTRE LES JAMBES ! Le ballon glisse à ras du sol côté droit !*"],
            "ras du sol gauche": ["*🎙️: UNE RACLÉE TECHNIQUE ! Le tir rase le sol à gauche et finit au fond !*"],
            "ras du sol milieu": ["*🎙️: UNE FINALE DE CLASSE ! Le ballon fuse au sol, en plein centre !*"]
        };

        if (!commentaires[zone]) {
            await repondre(`Zone inconnue : *${zone}*\nZones valides :\n- ${Object.keys(commentaires).join("\n- ")}`);
            return;
        }

        const commentaire = commentaires[zone][Math.floor(Math.random() * commentaires[zone].length)];
        const video = [
            "https://files.catbox.moe/chcn2d.mp4",
            "https://files.catbox.moe/t04dmz.mp4",
            "https://files.catbox.moe/8t1eya.mp4"
        ][Math.floor(Math.random() * 3)];

        await ovl.sendMessage(ms_org, {
            video: { url: video },
            caption: `*🥅:✅GOOAAAAAL!!!⚽⚽⚽ ▱▱▱▱*\n${commentaire}`,
            gifPlayback: true
        });
    } else {
        await ovl.sendMessage(ms_org, {
            video: { url: 'https://files.catbox.moe/88lylr.mp4' },
            caption: "*🥅:❌MISSED GOAL!!! ▱▱▱▱*",
            gifPlayback: true
        });
    }
});

const activeCountdowns = {};
const pausedCountdowns = {};

ovlcmd({
    nom: "latence go/next",
    isfunc: true
}, async (ms_org, ovl, { texte, getJid }) => {
    if (!texte) return;
    const mots = texte.trim().toLowerCase().split(/\s+/);
    const neoTexte = mots.join(" ");

    let user = null;
    let userW = null;

    if (mots[0].startsWith("@")) {
        userW = mots[0].slice(1);
        if (userW.endsWith("lid")) {
            user = await getJid(userW, ms_org, ovl);
        }
    }

    const stopCountdown = async () => {
        if (activeCountdowns[ms_org]) clearInterval(activeCountdowns[ms_org].interval);
        delete activeCountdowns[ms_org];
        delete pausedCountdowns[ms_org];
        await ovl.sendMessage(ms_org, { text: "🛑 Décompte arrêté." });
    };

    if (neoTexte === "stop") return stopCountdown();

    if (neoTexte === "pause" && activeCountdowns[ms_org]) {
        clearInterval(activeCountdowns[ms_org].interval);
        pausedCountdowns[ms_org] = activeCountdowns[ms_org];
        delete activeCountdowns[ms_org];
        return ovl.sendMessage(ms_org, { text: "⏸️ Décompte en pause." });
    }

    if (["resume", "continue", "go"].includes(neoTexte) && pausedCountdowns[ms_org]) {
        const { remaining, userW, user } = pausedCountdowns[ms_org];
        let time = remaining;
        const interval = setInterval(async () => {
            time--;
            pausedCountdowns[ms_org].remaining = time;
            if (time === 120 && user) {
                await ovl.sendMessage(ms_org, { text: `⚠️ @${userW} il ne reste plus que 2 minutes.`, mentions: [user] });
            }
            if (time <= 0) {
                clearInterval(interval);
                delete activeCountdowns[ms_org];
                delete pausedCountdowns[ms_org];
                await ovl.sendMessage(ms_org, { text: "⚠️ Latence Out" });
            }
        }, 1000);
        activeCountdowns[ms_org] = { interval, remaining: time, userW, user };
        delete pausedCountdowns[ms_org];
        return ovl.sendMessage(ms_org, { text: "▶️ Décompte repris." });
    }

    let countdownTime = null;
    let isGo = false;
    if (mots[0].startsWith('@') && /(next|nx|nxt)$/.test(mots[1])) {
        countdownTime = 5 * 60;
    } else if (mots[0].startsWith('@') && /go$/.test(mots[1])) {
        countdownTime = 6 * 60;
        isGo = true;
    } else return;

    if (activeCountdowns[ms_org] || pausedCountdowns[ms_org]) {
        return ovl.sendMessage(ms_org, { text: "⚠️ Un décompte est déjà en cours ou en pause." });
    }

    await ovl.sendMessage(ms_org, {
        video: { url: isGo ? "https://files.catbox.moe/kzimc0.mp4" : "https://files.catbox.moe/hqh4iz.mp4" },
        gifPlayback: true
    });

    const interval = setInterval(async () => {
        countdownTime--;
        if (countdownTime === 120 && user) {
            await ovl.sendMessage(ms_org, { text: `⚠️ @${userW} il ne reste plus que 2 minutes.`, mentions: [user] });
        }
        if (countdownTime <= 0) {
            clearInterval(interval);
            delete activeCountdowns[ms_org];
            await ovl.sendMessage(ms_org, { text: "⚠️ Latence Out" });
        }
    }, 1000);

    activeCountdowns[ms_org] = { interval, remaining: countdownTime, userW, user };
});

/*ovlcmd({
    nom: "negs_vic",
    isfunc: true
}, async (ms_org, ovl, { texte, getJid }) => {
    const lowerText = texte.toLowerCase();
    const userW = lowerText[0].slice(1);
    let user;
    if (userW.endsWith('lid')) {
        user = await getJid(userW, ms_org, ovl);
    }

    if (
        user &&
        lowerText.includes("victoire") &&
        lowerText.includes("negs diff")
    ) {
        const victoryVids = [
            "https://files.catbox.moe/ydrzja.mp4",
            "https://files.catbox.moe/laargl.mp4"
        ];
        const randomVid = victoryVids[Math.floor(Math.random() * victoryVids.length)];

        await ovl.sendMessage(ms_org, {
            video: { url: randomVid },
            gifPlayback: true
        });
    }
});
*/
