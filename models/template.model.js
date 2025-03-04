const { Model } = require("sequelize");

class Template extends Model {}

module.exports = (sequelize, DataTypes) => {
  Template.init(
    {
      uuid: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      templateType: {
        type: DataTypes.ENUM("email", "sms", "notification"),
        allowNull: false,
      },
      slug: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      status: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "Template",
      tableName: "templates",
      timestamps: true,
    }
  );

  return Template;
};
