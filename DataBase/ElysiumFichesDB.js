const { Sequelize, DataTypes } = require("sequelize");
const config = require("../set");

const db = config.DATABASE;
const sequelize = db
  ? new Sequelize(db, {
      dialect: "postgres",
      ssl: true,
      protocol: "postgres",
      dialectOptions: {
        native: true,
        ssl: { require: true, rejectUnauthorized: false },
      },
      logging: false,
    })
  : new Sequelize({
      dialect: "sqlite",
      storage: "./database.db",
      logging: false,
    });

const Player = sequelize.define(
  "Player",
  {
    id: { type: DataTypes.STRING, primaryKey: true },
    pseudo: { type: DataTypes.STRING, defaultValue: "Anonymous" },
    user: { type: DataTypes.STRING, defaultValue: "aucun" },
    exp: { type: DataTypes.INTEGER, defaultValue: 0 },
    niveau: { type: DataTypes.INTEGER, defaultValue: 1 },
    rang: { type: DataTypes.STRING, defaultValue: "Novice🥉" },

    ecash: { type: DataTypes.INTEGER, defaultValue: 50000 },
    lifestyle: { type: DataTypes.INTEGER, defaultValue: 0 },
    charisme: { type: DataTypes.INTEGER, defaultValue: 0 },
    reputation: { type: DataTypes.INTEGER, defaultValue: 0 },

    interfaceMe: { type: DataTypes.STRING, defaultValue: "+Me💠" },
    inventaire: { type: DataTypes.STRING, defaultValue: "+Inventaire💠" },

    cyberwares: { type: DataTypes.STRING, defaultValue: "aucun" },

    missions: { type: DataTypes.INTEGER, defaultValue: 0 },
    gameover: { type: DataTypes.INTEGER, defaultValue: 0 },
    pvp: { type: DataTypes.INTEGER, defaultValue: 0 },

    points_combat: { type: DataTypes.INTEGER, defaultValue: 0 },
    points_chasse: { type: DataTypes.INTEGER, defaultValue: 0 },
    points_recoltes: { type: DataTypes.INTEGER, defaultValue: 0 },
    points_hacking: { type: DataTypes.INTEGER, defaultValue: 0 },
    points_conduite: { type: DataTypes.INTEGER, defaultValue: 0 },
    points_exploration: { type: DataTypes.INTEGER, defaultValue: 0 },

    trophies: { type: DataTypes.INTEGER, defaultValue: 0 },
  },
  {
    tableName: "player",
    timestamps: false,
  }
);

// Synchronisation
(async () => {
  await sequelize.sync();
  console.log("✅ Table Player synchronisée avec succès.");
})();

// Fonctions CRUD
const PlayerFunctions = {
  async getPlayer(id) {
    return await Player.findByPk(id);
  },

  async savePlayer(id, data = {}) {
    const exists = await Player.findByPk(id);
    if (exists) return "⚠️ Ce joueur existe déjà.";
    await Player.create({ id, ...data });
    return "✅ Joueur enregistré.";
  },

  async updatePlayer(id, updates) {
    const record = await Player.findByPk(id);
    if (!record) return "⚠️ Joueur introuvable.";
    await record.update(updates);
    return `✅ Mises à jour effectuées pour ${record.pseudo}`;
  },

  async deletePlayer(id) {
    const deleted = await Player.destroy({ where: { id } });
    return deleted ? "✅ Joueur supprimé." : "⚠️ Joueur introuvable.";
  },

  async resetPoints(id) {
    const record = await Player.findByPk(id);
    if (!record) return "⚠️ Joueur introuvable.";
    await record.update({
      exp: 0,
      points_combat: 0,
      points_chasse: 0,
      points_recoltes: 0,
      points_hacking: 0,
      points_conduite: 0,
      points_exploration: 0,
    });
    return `✅ Points remis à zéro pour ${record.pseudo}`;
  },
};

module.exports = {
  PlayerFunctions,
};
