const database = require('../config/database');
const Sequelize = require('sequelize');
const fs = require('fs');
const path = require('path');

const db = {};

// Ensure sequelize is initialized before importing models
if (!database.sequelize) {
  database.connect();
}

// Import all models
fs.readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== 'index.js' &&
      file.slice(-3) === '.js'
    );
  })
  .forEach(file => {
    const modelPath = path.join(__dirname, file);
    const modelModule = require(modelPath);
    const model = modelModule(database.sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

// Associate models if they have associations
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = database.sequelize;
db.Sequelize = Sequelize;

module.exports = db;
