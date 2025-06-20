module.exports = (sequelize, DataTypes) => {
  const SelectedOption = sequelize.define('SelectedOption', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    responseId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'responses',
        key: 'id'
      }
    },
    questionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'questions',
        key: 'id'
      }
    },
    optionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'question_options',
        key: 'id'
      }
    }
  }, {
    timestamps: true,
    tableName: 'selected_options'
  });

  SelectedOption.associate = function(models) {
    SelectedOption.belongsTo(models.Response, { foreignKey: 'responseId' });
    SelectedOption.belongsTo(models.Question, { foreignKey: 'questionId' });
    SelectedOption.belongsTo(models.QuestionOption, { foreignKey: 'optionId', as: 'option' });
  };

  return SelectedOption;
};
