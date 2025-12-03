const { Sequelize, DataTypes } = require('sequelize');
const config = require('../set');
const db = config.DATABASE;

let sequelize;

if (!db) {
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './database.db',
    logging: false,
  });
} else {
  sequelize = new Sequelize(db, {
    dialect: 'postgres',
    ssl: true,
    protocol: 'postgres',
    dialectOptions: {
      native: true,
      ssl: { require: true, rejectUnauthorized: false },
    },
    logging: false,
  });
}

const AllStarsDivsFiche = sequelize.define('AllStarsDivsFiche', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  pseudo: { type: DataTypes.STRING, defaultValue: 'aucun' },
  classement: { type: DataTypes.STRING, defaultValue: 'aucun' },
  niveu_xp: { type: DataTypes.INTEGER, defaultValue: 1 },
  division: { type: DataTypes.STRING, defaultValue: 'aucun' },
  rang: { type: DataTypes.STRING, defaultValue: 'aucun' },
  classe: { type: DataTypes.STRING, defaultValue: 'aucun' },
  saison_pro: { type: DataTypes.INTEGER, defaultValue: 0 },
  golds: { type: DataTypes.INTEGER, defaultValue: 0 },
  fans: { type: DataTypes.INTEGER, defaultValue: 0 },
  archetype: { type: DataTypes.STRING, defaultValue: 'aucun' },
  commentaire: { type: DataTypes.TEXT, defaultValue: 'aucun' },
  victoires: { type: DataTypes.INTEGER, defaultValue: 0 },
  defaites: { type: DataTypes.INTEGER, defaultValue: 0 },
  championnants: { type: DataTypes.INTEGER, defaultValue: 0 },
  neo_cup: { type: DataTypes.INTEGER, defaultValue: 0 },
  evo: { type: DataTypes.INTEGER, defaultValue: 0 },
  grandslam: { type: DataTypes.INTEGER, defaultValue: 0 },
  tos: { type: DataTypes.INTEGER, defaultValue: 0 },
  the_best: { type: DataTypes.INTEGER, defaultValue: 0 },
  laureat: { type: DataTypes.INTEGER, defaultValue: 0 },
  sigma: { type: DataTypes.INTEGER, defaultValue: 0 },
  neo_globes: { type: DataTypes.INTEGER, defaultValue: 0 },
  golden_boy: { type: DataTypes.INTEGER, defaultValue: 0 },
  cleans: { type: DataTypes.INTEGER, defaultValue: 0 },
  erreurs: { type: DataTypes.INTEGER, defaultValue: 0 },
  note: { type: DataTypes.INTEGER, defaultValue: 0 },
  talent: { type: DataTypes.INTEGER, defaultValue: 0 },
  intelligence: { type: DataTypes.INTEGER, defaultValue: 0 },
  speed: { type: DataTypes.INTEGER, defaultValue: 0 },
  close_fight: { type: DataTypes.INTEGER, defaultValue: 0 },
  attaques: { type: DataTypes.INTEGER, defaultValue: 0 },
  total_cards: { type: DataTypes.INTEGER, defaultValue: 0 },
  cards: { type: DataTypes.TEXT, defaultValue: 'aucune' },
  source: { type: DataTypes.STRING, defaultValue: 'inconnu' },

  // 🔥 valeur par défaut changée : "aucun"
  jid: { type: DataTypes.STRING, defaultValue: 'aucun' },

  oc_url: { type: DataTypes.STRING, defaultValue: 'https://files.catbox.moe/4quw3r.jpg' },
  code_fiche: { type: DataTypes.STRING, defaultValue: 'aucun' },
  
}, {
  tableName: 'allstars_divs_fiches',
  timestamps: false,
});

(async () => {
  await AllStarsDivsFiche.sync();
  console.log("✅ Table 'allstars_divs_fiches' synchronisée avec succès.");
})();

/* -------------------------- DÉJÀ EXISTANT ----------------------------- */

async function getAllFiches() {
  return await AllStarsDivsFiche.findAll();
}

async function getData(where = {}) {
  const [fiche, created] = await AllStarsDivsFiche.findOrCreate({
    where,
    defaults: {}
  });

  if (created) {
    console.log(`✅ Nouvelle fiche créée pour :`, where);
  }

  return fiche;
}

async function setfiche(colonne, valeur, jid) {
  const updateData = {};
  updateData[colonne] = valeur;

  const [updatedCount] = await AllStarsDivsFiche.update(updateData, {
    where: { jid },
  });

  if (updatedCount === 0) {
    throw new Error(`❌ Aucun joueur trouvé avec l'id : ${jid}`);
  }

  console.log(`✅ ${colonne} mis à jour à '${valeur}' pour le joueur id ${jid}`);
}

async function add_id(jid, data = {}) {
  if (!jid) throw new Error("JID requis");

  const existing = await AllStarsDivsFiche.findOne({ where: { jid } });
  if (existing) return null;

  const fiches = await AllStarsDivsFiche.findAll({
    attributes: ['id'],
    order: [['id', 'ASC']]
  });

  const ids = fiches.map(f => f.id);
  let newId = 1;
  for (let i = 0; i < ids.length; i++) {
    if (ids[i] !== i + 1) {
      newId = i + 1;
      break;
    }
    newId = ids.length + 1;
  }

  const fiche = await AllStarsDivsFiche.create({
    id: newId,
    jid,
    ...data
  });

  return fiche;
}

async function del_fiche(code_fiche) {
  return await AllStarsDivsFiche.destroy({
    where: { code_fiche }
  });
}

/* ---------------------- 🔥 NOUVELLES FONCTIONS ------------------------ */

/**
 * 🔥 Supprimer toutes les fiches où le JID est null ou "null"
 */
async function deleteNullJid() {
  const deleted = await AllStarsDivsFiche.destroy({
    where: {
      jid: ['null', null, '']
    }
  });

  console.log(`🗑️ ${deleted} fiches supprimées (jid null).`);
  return deleted;
}

/**
 * 🔥 Fixer les IDs pour que ce soit vraiment clean
 * Recalcule les IDs en continu (1,2,3,...)
 */
async function fixPrimaryKeys() {
  const fiches = await AllStarsDivsFiche.findAll({ order: [['id', 'ASC']] });

  let newId = 1;
  for (const fiche of fiches) {
    if (fiche.id !== newId) {
      await fiche.update({ id: newId });
    }
    newId++;
  }

  console.log("🔧 IDs réorganisés proprement et réassignés.");
}

module.exports = { 
  getAllFiches, 
  setfiche, 
  getData, 
  add_id, 
  del_fiche,
  deleteNullJid,   // 🔥 ajouté
  fixPrimaryKeys   // 🔥 ajouté
};
