module.exports = (sequelize, DataTypes) => {
  const Response = sequelize.define('Response', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    surveyId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'surveys',
        key: 'id'
      }
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    respondentEmail: {
      type: DataTypes.STRING,
      allowNull: true
    },
    submittedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    ipAddress: {
      type: DataTypes.STRING
    },
    userAgent: {
      type: DataTypes.STRING
    }
  }, {
    timestamps: true,
    tableName: 'responses'
  });

  Response.associate = function(models) {
    Response.belongsTo(models.Survey, { foreignKey: 'surveyId', as: 'survey' });
    Response.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    Response.hasMany(models.Answer, { foreignKey: 'responseId', as: 'answers' });
    Response.hasMany(models.SelectedOption, { foreignKey: 'responseId', as: 'selectedOptions' });
  };

  return Response;
};
