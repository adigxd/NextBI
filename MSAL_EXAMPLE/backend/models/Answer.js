module.exports = (sequelize, DataTypes) => {
  const Answer = sequelize.define('Answer', {
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
    value: {
      type: DataTypes.TEXT,
      allowNull: false
    }
  }, {
    timestamps: true,
    tableName: 'answers'
  });

  Answer.associate = function(models) {
    Answer.belongsTo(models.Response, { foreignKey: 'responseId' });
    Answer.belongsTo(models.Question, { foreignKey: 'questionId' });
  };

  return Answer;
};
