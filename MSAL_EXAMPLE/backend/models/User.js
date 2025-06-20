const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    username: { 
      type: DataTypes.STRING, 
      allowNull: false, 
      unique: true, 
      validate: {
        notEmpty: true
      }
    },
    email: { 
      type: DataTypes.STRING, 
      allowNull: false, 
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: { 
      type: DataTypes.STRING, 
      allowNull: false 
    },
    firstName: { 
      type: DataTypes.STRING 
    },
    lastName: { 
      type: DataTypes.STRING 
    },
    role: { 
      type: DataTypes.STRING, 
      defaultValue: 'user',
      validate: {
        isIn: [['admin', 'user']]
      }
    },
    // department field removed temporarily
    // department: { 
    //   type: DataTypes.STRING 
    // },
    // office field removed temporarily
    // office: { 
    //   type: DataTypes.STRING 
    // },
    isActive: { 
      type: DataTypes.BOOLEAN, 
      defaultValue: true 
    },
    // lastLogin field removed temporarily
    // lastLogin: { 
    //   type: DataTypes.DATE 
    // }
  }, {
    timestamps: true,
    tableName: 'users',
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          user.password = await bcrypt.hash(user.password, 10);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          user.password = await bcrypt.hash(user.password, 10);
        }
      }
    }
  });

  // Instance method to check password
  User.prototype.comparePassword = function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
  };

  User.associate = function(models) {
    User.hasMany(models.Survey, { foreignKey: 'userId', as: 'surveys' });
    User.hasMany(models.Response, { foreignKey: 'userId', as: 'responses' });
    User.hasMany(models.SurveyAssignment, { foreignKey: 'userId', as: 'surveyAssignments' });
    User.belongsToMany(models.Survey, { 
      through: models.SurveyAssignment,
      foreignKey: 'userId',
      otherKey: 'surveyId',
      as: 'assignedSurveys'
    });
  };

  return User;
};
