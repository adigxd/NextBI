module.exports = (sequelize, DataTypes) => {
  const Question = sequelize.define('Question', {
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
    text: {
      type: DataTypes.STRING,
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('single-choice', 'multiple-choice', 'rating', 'text', 'date', 'number'),
      allowNull: false
    },
    isRequired: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    hasOther: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    group: {
      type: DataTypes.STRING
    },
    description: {
      type: DataTypes.TEXT
    },
    order: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    timestamps: true,
    tableName: 'questions'
  });

  Question.associate = function(models) {
    Question.belongsTo(models.Survey, { foreignKey: 'surveyId' });
    Question.hasMany(models.QuestionOption, { foreignKey: 'questionId', as: 'options' });
    Question.hasMany(models.Answer, { foreignKey: 'questionId', as: 'answers' });
    Question.hasMany(models.SelectedOption, { foreignKey: 'questionId', as: 'selectedOptions' });
  };

  return Question;
};
