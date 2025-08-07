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
  jid: { type: DataTypes.STRING, defaultValue: 'null' },
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

async function setfiche(colonne, valeur, id) {
  const updateData = {};
  updateData[colonne] = valeur;

  const [updatedCount] = await AllStarsDivsFiche.update(updateData, {
    where: { id },
  });

  if (updatedCount === 0) {
    throw new Error(`❌ Aucun joueur trouvé avec l'id : ${id}`);
  }

  console.log(`✅ ${colonne} mis à jour à '${valeur}' pour le joueur id ${id}`);
}

async function add_id(id, data = {}) {
  if (!id) throw new Error("ID requis");
  const defaults = { id, ...data };
  const [fiche, created] = await AllStarsDivsFiche.findOrCreate({
    where: { id },
    defaults
  });
  if (!created) return null;
  return fiche;
}

module.exports = { setfiche, getData, add_id };
