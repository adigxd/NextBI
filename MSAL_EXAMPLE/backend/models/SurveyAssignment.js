module.exports = (sequelize, DataTypes) => {
  const SurveyAssignment = sequelize.define('SurveyAssignment', {
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
    assignedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    assignedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    isRemoved: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    removedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    removedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    timestamps: true,
    tableName: 'survey_assignments',
    indexes: [
      {
        unique: true,
        fields: ['surveyId', 'userId'],
        where: {
          isRemoved: false
        }
      }
    ]
  });

  SurveyAssignment.associate = function(models) {
    SurveyAssignment.belongsTo(models.Survey, { foreignKey: 'surveyId', as: 'survey' });
    SurveyAssignment.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    SurveyAssignment.belongsTo(models.User, { foreignKey: 'assignedBy', as: 'assigner' });
    SurveyAssignment.belongsTo(models.User, { foreignKey: 'removedBy', as: 'remover' });
  };

  return SurveyAssignment;
};
