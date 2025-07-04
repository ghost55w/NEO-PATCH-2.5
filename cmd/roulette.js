const { ovlcmd } = require('../lib/ovlcmd');
const fs = require('fs');
const s = require("../set");
const dbUrl = s.DB;
const { MyNeoFunctions } = require("../myNeo_team_lineup");
const { getData, setfiche } = require("../allstars_divs_fiches");

const generateRandomNumbers = (min, max, count) => {
  const numbers = new Set();
  while (numbers.size < count) {
    numbers.add(Math.floor(Math.random() * (max - min + 1)) + min);
  }
  return Array.from(numbers);
};

const generateRewards = () => {
  const rewards = ['5🔷', '10.000 G🧭', '5🎟'];
  return rewards.sort(() => 0.5 - Math.random()).slice(0, 3);
};

ovlcmd({
  nom_cmd: 'roulette',
  classe: 'NEO_GAMES🎰',
  react: '🎰',
  desc: 'Lance une roulette aléatoire avec récompenses.'
}, async (ms_org, ovl, { repondre, auteur_Message }) => {
  try {
    const authorizedChats = [
      '120363024647909493@g.us',
      '120363307444088356@g.us',
      '22651463203@s.whatsapp.net',
      '22605463559@s.whatsapp.net'
    ];
    if (!authorizedChats.includes(ms_org)) return repondre("Commande non autorisée pour ce chat.");

    const userData = await MyNeoFunctions.getUserData(auteur_Message);
    if (!userData) return repondre("❌ Joueur introuvable dans MyNeo.");

    const fiche = await getData(auteur_Message);

    let valeur_nc = parseInt(userData.nc) || 0;
    let valeur_np = parseInt(userData.np) || 0;
    let valeur_coupons = parseInt(userData.coupons) || 0;
    let valeur_golds = parseInt(fiche.golds) || 0;

    const numbers = generateRandomNumbers(0, 50, 50);
    const winningNumbers = generateRandomNumbers(0, 50, 3);
    const rewards = generateRewards();

    let msga = `*🎰𝗧𝗘𝗡𝗧𝗘𝗭 𝗩𝗢𝗧𝗥𝗘 𝗖𝗛𝗔𝗡𝗖𝗘🥳 !!*🎉🎉\n...\n*🎊Voulez-vous tenter votre chance ?* (1min)\n✅: \`Oui\`\n❌: \`Non\``;

    await ovl.sendMessage(ms_org, {
      video: { url: 'https://files.catbox.moe/amtfgl.mp4' },
      caption: msga,
      gifPlayback: true
    }, { quoted: ms });

    const getConfirmation = async (attempt = 1) => {
      if (attempt > 3) throw new Error('TooManyAttempts');
      const rep = await ovl.recup_msg({ auteur: auteur_Message, ms_org, temps: 60000 });
      const response = rep?.message?.extendedTextMessage?.text || rep?.message?.conversation;
      if (response?.toLowerCase() === 'oui') return true;
      if (response?.toLowerCase() === 'non') throw new Error('GameCancelledByUser');
      await repondre('❓ Veuillez répondre par Oui ou Non.');
      return await getConfirmation(attempt + 1);
    };

    await getConfirmation();

    const getChosenNumber = async (isSecond = false, attempt = 1) => {
      if (attempt > 3) throw new Error('TooManyAttempts');
      await ovl.sendMessage(ms_org, {
        video: { url: 'https://files.catbox.moe/amtfgl.mp4' },
        caption: isSecond ? '🎯 Deuxième chance !' : '🎯 Choisissez un numéro entre 0 et 50.',
        gifPlayback: true
      }, { quoted: ms });
      const rep = await ovl.recup_msg({ auteur: auteur_Message, ms_org, temps: 60000 });
      const number = parseInt(rep?.message?.extendedTextMessage?.text || rep?.message?.conversation);
      if (isNaN(number) || number < 0 || number > 50) {
        await repondre('❌ Numéro invalide.');
        return await getChosenNumber(isSecond, attempt + 1);
      }
      return number;
    };

    const checkNumber = async (num, isSecond = false) => {
      if (winningNumbers.includes(num)) {
        let reward = rewards[winningNumbers.indexOf(num)];
        switch (reward) {
          case '5🔷':
            valeur_nc += 5;
            await MyNeoFunctions.updateUser(auteur_Message, { nc: valeur_nc });
            break;
          case '10.000 G🧭':
            valeur_golds += 10000;
            await setfiche("golds", valeur_golds, auteurMessage);
            break;
          case '5🎟':
            valeur_coupons += 5;
            await MyNeoFunctions.updateUser(auteur_Message, { coupons: valeur_coupons });
            break;
        }
        await ovl.sendMessage(ms_org, {
          video: { url: 'https://files.catbox.moe/vfv2hk.mp4' },
          caption: `🎉 Vous avez gagné ${reward} !`,
          gifPlayback: true
        }, { quoted: ms });
        return true;
      } else if (isSecond) {
        await ovl.sendMessage(ms_org, {
          video: { url: 'https://files.catbox.moe/hmhs29.mp4' },
          caption: `❌ Mauvais numéro. Fin du jeu.`,
          gifPlayback: true
        }, { quoted: ms });
      }
      return false;
    };

    const chosen1 = await getChosenNumber();
    const win1 = await checkNumber(chosen1);
    if (!win1) {
      const chosen2 = await getChosenNumber(true);
      await checkNumber(chosen2, true);
    }

  } catch (e) {
    console.error('Erreur roulette:', e.message);
    repondre("❌ Une erreur est survenue.");
  }
});
