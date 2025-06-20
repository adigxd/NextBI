module.exports = (sequelize, DataTypes) => {
  const AnonymousSurveyResponse = sequelize.define('AnonymousSurveyResponse', {
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
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    submittedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    timestamps: true,
    tableName: 'anonymous_survey_responses',
    indexes: [
      {
        unique: true,
        fields: ['surveyId', 'userId']
      }
    ]
  });

  AnonymousSurveyResponse.associate = function(models) {
    AnonymousSurveyResponse.belongsTo(models.Survey, { foreignKey: 'surveyId' });
    AnonymousSurveyResponse.belongsTo(models.User, { foreignKey: 'userId' });
  };

  return AnonymousSurveyResponse;
};
