module.exports = (sequelize, DataTypes) => {
  const QuestionOption = sequelize.define('QuestionOption', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    questionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'questions',
        key: 'id'
      }
    },
    text: {
      type: DataTypes.STRING,
      allowNull: false
    },
    isDefault: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    order: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    timestamps: true,
    tableName: 'question_options'
  });

  QuestionOption.associate = function(models) {
    QuestionOption.belongsTo(models.Question, { foreignKey: 'questionId' });
    QuestionOption.hasMany(models.SelectedOption, { foreignKey: 'optionId', as: 'selections' });
  };

  return QuestionOption;
};
