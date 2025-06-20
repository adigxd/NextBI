const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');

class Database {
  constructor() {
    this.sequelize = null;
    this.models = {};
  }

  async connect() {
    try {
      // Standard SQL connection using Sequelize
      if (this.sequelize) return this.sequelize;

      this.sequelize = new Sequelize({
        dialect: process.env.DB_DIALECT || 'mysql', // You can also use 'postgres', 'sqlite', or 'mariadb'
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        database: process.env.DB_NAME || 'surveyrock',
        username: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        pool: {
          max: 5,
          min: 0,
          acquire: 30000,
          idle: 10000
        },
        logging: process.env.NODE_ENV === 'production' ? false : console.log
      });

      // Test the connection
      await this.sequelize.authenticate();
      console.log('Database connection established successfully.');
      
      return this.sequelize;
    } catch (error) {
      console.error('Unable to connect to the database:', error);
      throw error;
    }
  }

  async sync() {
    try {
      // Import models
      const modelsDir = path.join(__dirname, '../models');
      const db = require('../models');
      
      // Store models in this instance
      this.models = db;
      
      // Check if we're in development mode and need to force sync
      const syncOptions = { alter: false };
      
      // Only use force: true in development with explicit env variable
      if (process.env.NODE_ENV === 'development' && process.env.DB_FORCE_SYNC === 'true') {
        syncOptions.force = true;
        console.log('WARNING: Forcing database sync - all data will be lost!');
      }
      
      // Sync all models
      await this.sequelize.sync(syncOptions);
      console.log('Database synchronized successfully.');
    } catch (error) {
      console.error('Unable to sync the database:', error);
      throw error;
    }
  }
}

module.exports = new Database();
