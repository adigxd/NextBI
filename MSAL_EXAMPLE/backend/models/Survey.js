module.exports = (sequelize, DataTypes) => {
  const Survey = sequelize.define('Survey', {
    // Basic Info
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT
    },
    
    // User relationship
    userId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    
    // Publication status
    isPublished: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    
    // Anonymous survey setting
    isAnonymous: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    
    // Public survey setting - available to all users without assignment
    isPublic: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    timestamps: true,
    tableName: 'surveys'
  });

  Survey.associate = function(models) {
    // Define associations
    Survey.belongsTo(models.User, { foreignKey: 'userId', as: 'creator' });
    Survey.hasMany(models.Question, { foreignKey: 'surveyId', as: 'questions' });
    Survey.hasMany(models.Reminder, { foreignKey: 'surveyId', as: 'reminders' });
    Survey.hasMany(models.SurveyAssignment, { foreignKey: 'surveyId', as: 'assignments' });
    Survey.belongsToMany(models.User, { 
      through: models.SurveyAssignment,
      foreignKey: 'surveyId',
      otherKey: 'userId',
      as: 'assignedUsers'
    });
  };

  return Survey;
};
