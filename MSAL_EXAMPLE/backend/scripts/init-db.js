const path = require('path');
const fs = require('fs');

// Try to load .env file from different possible locations
const possibleEnvPaths = [
  path.resolve(__dirname, '../../.env'),  // Project root
  path.resolve(__dirname, '../.env'),     // Backend folder
  path.resolve(process.cwd(), '.env')     // Current working directory
];

let envLoaded = false;
for (const envPath of possibleEnvPaths) {
  if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
    console.log(`Loaded environment variables from ${envPath}`);
    envLoaded = true;
    break;
  }
}

if (!envLoaded) {
  console.warn('Warning: No .env file found. Using default or system environment variables.');
}

// Verify database connection parameters
console.log('Database connection parameters:');
console.log(`- Host: ${process.env.DB_HOST || 'localhost'}`);
console.log(`- Port: ${process.env.DB_PORT || '3306'}`);
console.log(`- Database: ${process.env.DB_NAME || 'surveyrock'}`);
console.log(`- User: ${process.env.DB_USER || '[NOT SET]'}`);
console.log('- Password: [HIDDEN]');
const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

// Database configuration
const sequelize = new Sequelize({
  dialect: process.env.DB_DIALECT || 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  logging: console.log
});

// Define all models
// User model
const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  firstName: DataTypes.STRING,
  lastName: DataTypes.STRING,
  role: {
    type: DataTypes.ENUM('admin', 'user'),
    defaultValue: 'user'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'users'
});

// Survey model
const Survey = sequelize.define('Survey', {
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
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  isPublished: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isAnonymous: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
}, {
  tableName: 'surveys'
});

const Question = sequelize.define('Question', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  surveyId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  text: {
    type: DataTypes.STRING,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM(
      'single-choice', 
      'multiple-choice', 
      'rating', 
      'text', 
      'date', 
      'number'
    ),
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
  questionGroup: {
    type: DataTypes.STRING,
    field: 'group'
  },
  description: DataTypes.TEXT,
  questionOrder: {
    type: DataTypes.INTEGER,
    field: 'order',
    defaultValue: 0
  }
}, {
  tableName: 'questions'
});

const QuestionOption = sequelize.define('QuestionOption', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  questionId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  text: {
    type: DataTypes.STRING,
    allowNull: false
  },
  isDefault: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  optionOrder: {
    type: DataTypes.INTEGER,
    field: 'order',
    defaultValue: 0
  }
}, {
  tableName: 'question_options'
});

// Define SurveyAssignment model
// Survey Assignment model
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

// Response model
const Response = sequelize.define('Response', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  surveyId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  respondentEmail: {
    type: DataTypes.STRING,
    allowNull: true
  },
  submittedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  ipAddress: DataTypes.STRING,
  userAgent: DataTypes.STRING
}, {
  tableName: 'responses'
});

// Answer model
const Answer = sequelize.define('Answer', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  responseId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  questionId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  value: {
    type: DataTypes.TEXT,
    allowNull: false
  }
}, {
  tableName: 'answers'
});

// SelectedOption model
const SelectedOption = sequelize.define('SelectedOption', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  responseId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  questionId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  optionId: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'selected_options'
});

// SurveyResponse model (if used in the application)
const SurveyResponse = sequelize.define('SurveyResponse', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  surveyId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  respondentId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  submittedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  ipAddress: DataTypes.STRING,
  userAgent: DataTypes.STRING
}, {
  tableName: 'survey_responses'
});

// AuditLog model
const AuditLog = sequelize.define('AuditLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  action: {
    type: DataTypes.STRING,
    allowNull: false
  },
  entityType: {
    type: DataTypes.STRING,
    allowNull: false
  },
  entityId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  details: {
    type: DataTypes.JSON,
    allowNull: true
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: true
  },
  userAgent: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'audit_logs'
});

// AnonymousSurveyResponse model
const AnonymousSurveyResponse = sequelize.define('AnonymousSurveyResponse', {
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
  submittedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'anonymous_survey_responses',
  indexes: [
    {
      unique: true,
      fields: ['surveyId', 'userId']
    }
  ]
});

// Reminder model
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
  tableName: 'reminders'
});

// Define associations
User.hasMany(Survey, { foreignKey: 'userId', onDelete: 'SET NULL' });
Survey.belongsTo(User, { foreignKey: 'userId' });

Survey.hasMany(Question, { foreignKey: 'surveyId', onDelete: 'CASCADE' });
Question.belongsTo(Survey, { foreignKey: 'surveyId' });

Question.hasMany(QuestionOption, { foreignKey: 'questionId', onDelete: 'CASCADE', as: 'options' });
QuestionOption.belongsTo(Question, { foreignKey: 'questionId' });

// Survey Assignment associations
Survey.hasMany(SurveyAssignment, { foreignKey: 'surveyId', as: 'assignments', onDelete: 'CASCADE' });
SurveyAssignment.belongsTo(Survey, { foreignKey: 'surveyId', as: 'survey' });

User.hasMany(SurveyAssignment, { foreignKey: 'userId', as: 'surveyAssignments', onDelete: 'CASCADE' });
SurveyAssignment.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(SurveyAssignment, { foreignKey: 'assignedBy', as: 'assignedSurveys', onDelete: 'SET NULL' });
SurveyAssignment.belongsTo(User, { foreignKey: 'assignedBy', as: 'assigner' });

User.hasMany(SurveyAssignment, { foreignKey: 'removedBy', as: 'removedSurveys', onDelete: 'SET NULL' });
SurveyAssignment.belongsTo(User, { foreignKey: 'removedBy', as: 'remover' });

// Response associations
Survey.hasMany(Response, { foreignKey: 'surveyId', onDelete: 'CASCADE' });
Response.belongsTo(Survey, { foreignKey: 'surveyId', as: 'survey' });
User.hasMany(Response, { foreignKey: 'userId', onDelete: 'SET NULL' });
Response.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Answer associations
Response.hasMany(Answer, { foreignKey: 'responseId', onDelete: 'CASCADE', as: 'answers' });
Answer.belongsTo(Response, { foreignKey: 'responseId' });
Question.hasMany(Answer, { foreignKey: 'questionId', onDelete: 'CASCADE' });
Answer.belongsTo(Question, { foreignKey: 'questionId' });

// SelectedOption associations
Response.hasMany(SelectedOption, { foreignKey: 'responseId', onDelete: 'CASCADE', as: 'selectedOptions' });
SelectedOption.belongsTo(Response, { foreignKey: 'responseId' });
Question.hasMany(SelectedOption, { foreignKey: 'questionId', onDelete: 'CASCADE' });
SelectedOption.belongsTo(Question, { foreignKey: 'questionId' });
QuestionOption.hasMany(SelectedOption, { foreignKey: 'optionId', onDelete: 'CASCADE' });
SelectedOption.belongsTo(QuestionOption, { foreignKey: 'optionId', as: 'option' });

// SurveyResponse associations (if used)
Survey.hasMany(SurveyResponse, { foreignKey: 'surveyId', onDelete: 'CASCADE' });
SurveyResponse.belongsTo(Survey, { foreignKey: 'surveyId' });

// AnonymousSurveyResponse associations
Survey.hasMany(AnonymousSurveyResponse, { foreignKey: 'surveyId', onDelete: 'CASCADE' });
AnonymousSurveyResponse.belongsTo(Survey, { foreignKey: 'surveyId' });
User.hasMany(AnonymousSurveyResponse, { foreignKey: 'userId', onDelete: 'CASCADE' });
AnonymousSurveyResponse.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(SurveyResponse, { foreignKey: 'respondentId', as: 'surveyResponses', onDelete: 'SET NULL' });
SurveyResponse.belongsTo(User, { foreignKey: 'respondentId', as: 'respondent' });

// AuditLog associations
User.hasMany(AuditLog, { foreignKey: 'userId', onDelete: 'CASCADE' });
AuditLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Reminder associations
Survey.hasMany(Reminder, { foreignKey: 'surveyId', onDelete: 'CASCADE' });
Reminder.belongsTo(Survey, { foreignKey: 'surveyId', as: 'survey' });

// Initialization function
async function initializeDatabase() {
  try {
    console.log('Connecting to database...');
    
    // Disable foreign key checks
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    
    // Drop tables in reverse order to avoid foreign key constraints
    await User.drop({ cascade: true });
    await Survey.drop({ cascade: true });
    await Question.drop({ cascade: true });
    await QuestionOption.drop({ cascade: true });
    await SurveyAssignment.drop({ cascade: true });
    await Response.drop({ cascade: true });
    await Answer.drop({ cascade: true });
    await SelectedOption.drop({ cascade: true });
    await SurveyResponse.drop({ cascade: true });
    await AnonymousSurveyResponse.drop({ cascade: true });
    await AuditLog.drop({ cascade: true });
    await Reminder.drop({ cascade: true });
    
    // Additional safety: directly drop any tables that might not be covered
    try {
      console.log('Ensuring all tables are dropped...');
      await sequelize.query('DROP TABLE IF EXISTS responses CASCADE');
      await sequelize.query('DROP TABLE IF EXISTS answers CASCADE');
      await sequelize.query('DROP TABLE IF EXISTS selected_options CASCADE');
      await sequelize.query('DROP TABLE IF EXISTS survey_responses CASCADE');
    } catch (err) {
      console.warn('Warning during additional table drops:', err.message);
    }
    
    // Sync models (create tables)
    await sequelize.sync({ force: true });
    
    // Re-enable foreign key checks
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    
    // Create admin user
    console.log('Creating admin user...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await User.create({
      username: 'admin',
      email: 'admin@example.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      isActive: true
    });
    
    // Verify all tables are empty (except for the admin user we just created)
    console.log('\nVerifying all tables are empty except for admin user...');
    
    // List of all tables to check
    const tables = [
      'users',
      'surveys',
      'questions',
      'question_options',
      'survey_assignments',
      'responses',
      'answers',
      'selected_options',
      'survey_responses',
      'audit_logs',
      'reminders'
    ];
    
    // Check each table
    for (const table of tables) {
      try {
        const [results] = await sequelize.query(`SELECT COUNT(*) as count FROM ${table}`);
        const count = results[0].count;
        
        // For users table, we expect 1 record (the admin)
        if (table === 'users') {
          if (count === 1) {
            console.log(`✓ ${table}: ${count} record (admin user) - OK`);
          } else {
            console.error(`✗ ${table}: Expected 1 record, found ${count}`);
          }
        } else {
          // For all other tables, we expect 0 records
          if (count === 0) {
            console.log(`✓ ${table}: ${count} records - OK`);
          } else {
            console.error(`✗ ${table}: Expected 0 records, found ${count}`);
          }
        }
      } catch (err) {
        console.warn(`⚠ Could not verify table ${table}: ${err.message}`);
      }
    }
    
    console.log('\nDatabase initialization complete.');
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  } finally {
    // Close the connection
    await sequelize.close();
  }
}

// Run initialization
initializeDatabase().catch(console.error);
