module.exports = (sequelize, DataTypes) => {
  const Reminder = sequelize.define('Reminder', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    surveyId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('email', 'teams'),
      allowNull: false
    },
    sendAt: {
      type: DataTypes.DATE,
      allowNull: false
    },
    sent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    timestamps: true,
    tableName: 'reminders',
    // Define the foreign key constraint at the table level
    indexes: [
      {
        fields: ['surveyId']
      }
    ]
  });

  Reminder.associate = function(models) {
    // Use the correct table name reference (lowercase 'surveys')
    Reminder.belongsTo(models.Survey, { 
      foreignKey: 'surveyId',
      as: 'survey',
      onDelete: 'NO ACTION',
      onUpdate: 'CASCADE',
      targetKey: 'id',
      constraints: false // Disable constraint creation during association
    });
  };

  return Reminder;
};
