const { Sequelize, DataTypes } = require("sequelize");
const bcrypt = require("bcrypt");

const saltRounds = process.env.BCRYPT_SALTROUNDS;

const {
  DB_HOST,
  DB_USERNAME,
  DB_PASSWORD,
  DB_NAME,
  POOL_MAX,
  POOL_MIN,
  POOL_ACQUIRE,
  POOL_IDLE,
} = process.env;

const sequelize = new Sequelize(DB_NAME, DB_USERNAME, DB_PASSWORD, {
  host: DB_HOST,
  logging: false,
  dialect: "mysql",
  operatorsAliases: false,
  pool: {
    max: parseInt(POOL_MAX),
    min: parseInt(POOL_MIN),
    acquire: POOL_ACQUIRE,
    idle: POOL_IDLE,
  },
});

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

// ----------------------Tables----------------------------
db.User = require("../models/user.model")(sequelize, DataTypes);
db.Template = require("../models/template.model")(sequelize, DataTypes);



// -----------------------------------------Associations---------------------------------------------
// db.User.hasOne(db.Doctor, { foreignKey: "userId" });
// db.Doctor.belongsTo(db.User, { foreignKey: "userId" });

// db.User.hasOne(db.Patient, { foreignKey: "userId" });
// db.Patient.belongsTo(db.User, { foreignKey: "userId" });


// ----------------------------------------End of Associations--------------------------------------

// Sync Models
sequelize
  .sync({ alter: true })
  .then(() => {
    console.log("Database & tables synced successfully.");
  })
  .catch((error) => {
    console.error("Error syncing database:", error);
  });

module.exports = { sequelize, db };
