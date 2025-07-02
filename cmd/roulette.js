const { ovlcmd } = require('../framework/ovlcmd');
const fs = require('fs');
const users = require('../Id_ext/northdiv');
const s = require("../set");
const dbUrl = s.DB;

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
}, async (ms_org, ovl, { repondre, auteurMessage }) => {
  const origineMessage = ms_org.chat;
  try {
    const authorizedChats = [
      '120363024647909493@g.us',
      '120363307444088356@g.us',
      '22651463203@s.whatsapp.net',
      '22605463559@s.whatsapp.net'
    ];
    if (!authorizedChats.includes(origineMessage)) return repondre("Commande non autorisée pour ce chat.");

    const user = users.find(item => item.id === auteurMessage);
    if (!user) return repondre("Votre identifiant n'existe pas");

    const { Pool } = require('pg');
    const client = await new Pool({
      connectionString: dbUrl,
      ssl: { rejectUnauthorized: false }
    }).connect();

    const [np, nc, golds, coupons] = await Promise.all([
      client.query(user.get_np),
      client.query(user.get_neocoins),
      client.query(user.get_golds),
      client.query(user.get_coupons)
    ]);

    let valeur_nc = parseInt(nc.rows[0][user.cln_neocoins]);
    let valeur_golds = parseInt(golds.rows[0][user.cln_golds]);
    let valeur_coupons = parseInt(coupons.rows[0][user.cln_coupons]);
    let numbers = generateRandomNumbers(0, 50, 50);
    let winningNumbers = generateRandomNumbers(0, 50, 3);
    let rewards = generateRewards();

    let msga = `*🎰𝗧𝗘𝗡𝗧𝗘𝗭 𝗩𝗢𝗧𝗥𝗘 𝗖𝗛𝗔𝗡𝗖𝗘🥳 !!*🎉🎉\n...\n*🎊Voulez-vous tenter votre chance ?* (1min)\n✅: \\`Oui\\`\n❌: \\`Non\\``;

    await ovl.sendMessage(origineMessage, { video: { url: 'https://files.catbox.moe/amtfgl.mp4' }, caption: msga, gifPlayback: true }, { quoted: ms_org });

    const getConfirmation = async (attempt = 1) => {
      if (attempt > 3) throw new Error('TooManyAttempts');
      const rep = await ovl.awaitForMessage({ sender: auteurMessage, chatJid: origineMessage, timeout: 60000 });
      const response = rep?.message?.extendedTextMessage?.text || rep?.message?.conversation;
      if (response.toLowerCase() === 'oui') return true;
      if (response.toLowerCase() === 'non') throw new Error('GameCancelledByUser');
      await repondre('Veuillez répondre par Oui ou Non.');
      return await getConfirmation(attempt + 1);
    };

    await getConfirmation();

    const getChosenNumber = async (isSecond = false, attempt = 1) => {
      if (attempt > 3) throw new Error('TooManyAttempts');
      await ovl.sendMessage(origineMessage, { video: { url: 'https://files.catbox.moe/amtfgl.mp4' }, caption: isSecond ? 'Deuxième chance !' : 'Choisissez un numéro.', gifPlayback: true }, { quoted: ms_org });
      const rep = await ovl.awaitForMessage({ sender: auteurMessage, chatJid: origineMessage, timeout: 60000 });
      const number = parseInt(rep?.message?.extendedTextMessage?.text || rep?.message?.conversation);
      if (isNaN(number) || number < 0 || number > 50) {
        await repondre('Numéro invalide.');
        return await getChosenNumber(isSecond, attempt + 1);
      }
      return number;
    };

    const checkNumber = async (num, isSecond = false) => {
      if (winningNumbers.includes(num)) {
        let reward = rewards[winningNumbers.indexOf(num)];
        switch (reward) {
          case '5🔷': await client.query(user.upd_neocoins, [valeur_nc + 5]); break;
          case '10.000 G🧭': await client.query(user.upd_golds, [valeur_golds + 10000]); break;
          case '5🎟': await client.query(user.upd_coupons, [valeur_coupons + 5]); break;
        }
        await ovl.sendMessage(origineMessage, { video: { url: 'https://files.catbox.moe/vfv2hk.mp4' }, caption: `🎉 Vous avez gagné ${reward} !`, gifPlayback: true }, { quoted: ms_org });
        return true;
      } else if (isSecond) {
        await ovl.sendMessage(origineMessage, { video: { url: 'https://files.catbox.moe/hmhs29.mp4' }, caption: `❌ Mauvais numéro. Fin du jeu.`, gifPlayback: true }, { quoted: ms_org });
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
  }
});
