module.exports = (sequelize, DataTypes) => {
  const SurveyResponse = sequelize.define('SurveyResponse', {
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
    respondentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    // For responses, we'll store them as JSON
    responseData: {
      type: DataTypes.JSON,
      allowNull: false
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
    tableName: 'survey_responses'
  });

  SurveyResponse.associate = function(models) {
    SurveyResponse.belongsTo(models.Survey, { foreignKey: 'surveyId' });
    SurveyResponse.belongsTo(models.User, { foreignKey: 'respondentId', as: 'respondent' });
  };

  return SurveyResponse;
};
