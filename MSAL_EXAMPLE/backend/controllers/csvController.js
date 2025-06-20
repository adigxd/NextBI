const { Survey, Question, QuestionOption } = require('../models');
const { Parser } = require('json2csv');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const { Readable } = require('stream');

// Export survey questions and options to CSV
exports.exportSurveyToCSV = async (req, res) => {
  try {
    const { surveyId } = req.params;
    
    // Check if survey exists and user has access
    const survey = await Survey.findByPk(surveyId, {
      include: [
        {
          model: Question,
          include: [QuestionOption]
        }
      ]
    });
    
    if (!survey) {
      return res.status(404).json({ message: 'Survey not found' });
    }
    
    // Check if user is authorized (either admin or survey owner)
    if (survey.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to export this survey' });
    }
    
    // Format data for CSV
    const csvData = [];
    
    survey.Questions.forEach(question => {
      // Use the backend question type directly in the CSV
      // This ensures consistency when reimporting
      const questionData = {
        questionText: question.text,
        questionType: question.type,
        options: question.QuestionOptions.map(opt => opt.text).join('|'),
        isRequired: question.isRequired ? 'true' : 'false'
      };
      
      csvData.push(questionData);
    });
    
    // Convert to CSV
    const fields = ['questionText', 'questionType', 'options', 'isRequired'];
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(csvData);
    
    // Set headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=survey-${surveyId}.csv`);
    
    // Send CSV data
    res.status(200).send(csv);
  } catch (error) {
    console.error('Error exporting survey to CSV:', error);
    res.status(500).json({ message: 'Failed to export survey', error: error.message });
  }
};

// Import survey from CSV
exports.importSurveyFromCSV = async (req, res) => {
  try {
    // Check if file exists
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    // Check if file is CSV
    const fileExtension = path.extname(req.file.originalname).toLowerCase();
    if (fileExtension !== '.csv') {
      return res.status(400).json({ message: 'Only CSV files are allowed' });
    }
    
    // Parse CSV file
    const results = [];
    const stream = Readable.from(req.file.buffer);
    
    await new Promise((resolve, reject) => {
      stream
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', resolve)
        .on('error', (error) => {
          reject(new Error('Invalid CSV format'));
        });
    }).catch(error => {
      return res.status(400).json({ message: error.message });
    });
    
    // Validate CSV structure
    if (results.length === 0) {
      return res.status(400).json({ message: 'CSV file is empty or invalid' });
    }
    
    // Check if required columns exist
    const requiredColumns = ['questionText', 'questionType'];
    const firstRow = results[0];
    
    for (const column of requiredColumns) {
      if (!(column in firstRow)) {
        return res.status(400).json({ 
          message: `Invalid CSV format: missing '${column}' column` 
        });
      }
    }
    
    // Create survey with data from request body
    const { title, description, isAnonymous, isPublic } = req.body;
    
    if (!title) {
      return res.status(400).json({ message: 'Survey title is required' });
    }
    
    const survey = await Survey.create({
      title,
      description: description || '',
      isAnonymous: isAnonymous === 'true' || isAnonymous === true,
      isPublic: isPublic === 'true' || isPublic === true,
      isPublished: false,
      userId: req.user.id
    });
    
    // Process questions from CSV
    const questions = [];
    
    for (const row of results) {
      // Validate question type
      const validTypes = ['single-choice', 'multiple-choice', 'text'];
      
      // Handle frontend to backend mapping if needed
      let backendType = row.questionType;
      if (row.questionType === 'multiple_choice') {
        backendType = 'single-choice';
      } else if (row.questionType === 'multi_select') {
        backendType = 'multiple-choice';
      } else if (row.questionType === 'free_text') {
        backendType = 'text';
      }
      
      if (!validTypes.includes(backendType)) {
        return res.status(400).json({ 
          message: `Invalid question type: ${row.questionType}. Valid types are: single-choice, multiple-choice, text` 
        });
      }
      
      const question = {
        text: row.questionText,
        type: backendType,
        surveyId: survey.id,
        isRequired: row.isRequired === 'true' || row.isRequired === true,
        options: []
      };
      
      // Process options for choice questions
      if (backendType === 'single-choice' || backendType === 'multiple-choice') {
        if (!row.options) {
          return res.status(400).json({ 
            message: `Options are required for ${row.questionType} questions` 
          });
        }
        
        const options = row.options.split('|');
        if (options.length < 2) {
          return res.status(400).json({ 
            message: `At least 2 options are required for ${row.questionType} questions` 
          });
        }
        
        question.options = options;
      }
      
      questions.push(question);
    }
    
    // Save questions and options to database
    for (const questionData of questions) {
      const { options, ...questionFields } = questionData;
      
      const question = await Question.create(questionFields);
      
      if (options && options.length > 0) {
        await Promise.all(options.map(async (optionText, index) => {
          await QuestionOption.create({
            text: optionText,
            questionId: question.id,
            order: index
          });
        }));
      }
    }
    
    res.status(201).json({ 
      message: 'Survey imported successfully', 
      surveyId: survey.id,
      questionsImported: questions.length
    });
  } catch (error) {
    console.error('Error importing survey from CSV:', error);
    res.status(500).json({ message: 'Failed to import survey', error: error.message });
  }
};
