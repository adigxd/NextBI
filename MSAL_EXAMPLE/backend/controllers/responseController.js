const { Response, Survey, User, Question, Answer, QuestionOption, SelectedOption, AnonymousSurveyResponse } = require('../models');
const { Op } = require('sequelize');

exports.createResponse = async (req, res) => {
    try {
        const { surveyId, answers } = req.body;
        
        // Ensure surveyId is a number
        const surveyIdValue = typeof surveyId === 'object' ? surveyId.id : parseInt(surveyId);
        console.log('Processing surveyId:', surveyIdValue);
        
        // Check if survey exists
        const survey = await Survey.findByPk(surveyIdValue, {
            include: [{ 
                model: Question, 
                as: 'questions',
                include: [{ model: QuestionOption, as: 'options' }]
            }]
        });
        
        if (!survey) {
            return res.status(404).json({ message: 'Survey not found' });
        }
        
        // Check if the user has already submitted a response for this survey
        if (req.user) {
            // For public and anonymous surveys, allow multiple submissions
            if (survey.isPublic && survey.isAnonymous) {
                console.log('Public and anonymous survey - allowing multiple submissions');
                // No need to check for existing responses, allow multiple submissions
            } else if (survey.isAnonymous) {
                // For anonymous surveys that are not public, check the AnonymousSurveyResponse table
                const existingResponse = await AnonymousSurveyResponse.findOne({
                    where: {
                        surveyId: surveyIdValue,
                        userId: req.user.id
                    }
                });
                
                if (existingResponse) {
                    return res.status(400).json({ message: 'You have already submitted a response for this survey' });
                }
            } else {
                // For non-anonymous surveys, check the Response table
                const existingResponse = await Response.findOne({
                    where: {
                        surveyId: surveyIdValue,
                        userId: req.user.id
                    }
                });
                
                if (existingResponse) {
                    return res.status(400).json({ message: 'You have already submitted a response for this survey' });
                }
            }
        } else if (survey.isAnonymous) {
            // For anonymous surveys with non-authenticated users, we can't check for duplicates
            // so we'll allow the submission to proceed
            console.log('Anonymous user submitting to anonymous survey');
        } else {
            // Non-authenticated users can't submit to non-anonymous surveys
            return res.status(401).json({ message: 'Authentication required to submit responses to this survey' });
        }
        
        // Check if survey is published
        const now = new Date();
        if (!survey.isPublished) {
            return res.status(400).json({ message: 'This survey is not currently active' });
        }
        
        // Check if survey is archived (if that field exists)
        if (survey.isArchived) {
            return res.status(400).json({ message: 'This survey has been archived' });
        }
        
        if (survey.startDateTime && new Date(survey.startDateTime) > now) {
            return res.status(400).json({ message: 'This survey has not started yet' });
        }
        
        if (survey.endDateTime && new Date(survey.endDateTime) < now) {
            return res.status(400).json({ message: 'This survey has already ended' });
        }
        
        // Check for required questions
        const requiredQuestions = survey.questions.filter(q => q.isRequired);
        for (const question of requiredQuestions) {
            const answer = answers.find(a => a.questionId === question.id);
            if (!answer || !answer.value) {
                return res.status(400).json({ 
                    message: `Question '${question.text}' is required` 
                });
            }
        }
        
        // Define response variable outside the if/else blocks for proper scope
        let response;
        
        // Handle differently based on whether the survey is anonymous
        if (survey.isAnonymous) {
            // For anonymous surveys with authenticated users, record that they completed it
            if (req.user) {
                try {
                    // Check if this is a public survey that allows multiple submissions
                    if (!survey.isPublic) {
                        // For non-public anonymous surveys, we need to record the completion
                        // but we already checked for duplicates above, so this should only happen
                        // if the duplicate check was bypassed
                        await AnonymousSurveyResponse.create({
                            surveyId: surveyIdValue,
                            userId: req.user.id,
                            submittedAt: new Date()
                        });
                    }
                    // For public anonymous surveys, we don't need to record who completed it
                    // since multiple submissions are allowed
                } catch (error) {
                    // If it's a duplicate entry, we can ignore it and continue
                    if (error.name === 'SequelizeUniqueConstraintError') {
                        console.log('User already recorded as having completed this survey, continuing...');
                    } else {
                        throw error; // Re-throw if it's a different error
                    }
                }
            }
            
            // Create completely anonymous response
            const responseData = {
                surveyId: surveyIdValue,
                submittedAt: new Date(),
                ipAddress: null, // Don't store IP for anonymous surveys
                userAgent: null // Don't store user agent for anonymous surveys
            };
            
            response = await Response.create(responseData);
        } else {
            // For standard surveys, create the response with user ID (must be authenticated)
            if (!req.user) {
                return res.status(401).json({ message: 'Authentication required to submit responses to this survey' });
            }
            
            const responseData = {
                surveyId: surveyIdValue,
                userId: req.user.id,
                respondentEmail: req.user.email, // Add respondentEmail for non-anonymous surveys
                submittedAt: new Date(),
                ipAddress: req.ip || null,
                userAgent: req.headers['user-agent'] || null
            };
            
            response = await Response.create(responseData);
        }
        
        // Create answers for each question
        for (const answer of answers) {
            try {
                // Make sure we have a valid questionId and value is not null/undefined
                if (!answer.questionId || isNaN(parseInt(answer.questionId))) {
                    console.warn(`Skipping answer with invalid questionId: ${answer.questionId}`);
                    continue;
                }
                
                // Ensure value is never null or undefined
                const value = answer.value || '';
                
                await Answer.create({
                    responseId: response.id,
                    questionId: parseInt(answer.questionId),
                    value: value
                });
            } catch (error) {
                console.error(`Error creating answer for question ${answer.questionId}:`, error);
                // Don't throw the error, continue with other answers
            }
        }
        
        // For choice questions, also store selected options for easier querying
        for (const answer of answers) {
            const question = survey.questions.find(q => q.id === answer.questionId);
            
            if (question && (question.type === 'single-choice' || 
                             question.type === 'multiple-choice' || 
                             question.type === 'multiple_choice' || 
                             question.type === 'dropdown')) {
                
                // Handle comma-separated values for multiple choice
                const selectedValues = answer.value.split(',').map(val => val.trim());
                
                for (const value of selectedValues) {
                    // Skip processing any 'OTHER:' values for selected_options table
                    if (value && !value.startsWith('OTHER:')) {
                        try {
                            // Validate that this is a numeric ID that can be parsed
                            const optionId = parseInt(value);
                            if (!isNaN(optionId)) {
                                // Check if this option actually exists for this question
                                const optionExists = question.options.some(opt => opt.id === optionId);
                                if (optionExists) {
                                    await SelectedOption.create({
                                        responseId: response.id,
                                        questionId: question.id,
                                        optionId: optionId
                                    });
                                } else {
                                    console.warn(`Option ID ${optionId} not found for question ${question.id}`);
                                }
                            } else {
                                console.warn(`Invalid option ID format: ${value}`);
                            }
                        } catch (error) {
                            console.warn(`Error processing option value: ${value}`, error);
                            // Continue with the next value, don't fail the whole submission
                        }
                    }
                }
            }
        }
        
        // Return the complete response with answers
        const completeResponse = await Response.findByPk(response.id, {
            include: [{ model: Answer, as: 'answers' }]
        });
        
        res.status(201).json(completeResponse);
    } catch (err) {
        console.error('Error creating response:', err);
        console.error('Error details:', JSON.stringify(err, null, 2));
        console.error('Request body:', JSON.stringify(req.body, null, 2));
        res.status(400).json({ error: err.message, details: err.errors ? err.errors.map(e => e.message) : null });
    }
};

exports.getResponsesBySurveyId = async (req, res) => {
    try {
        const { surveyId } = req.params;
        
        // Check if survey exists
        const survey = await Survey.findByPk(surveyId);
        if (!survey) {
            return res.status(404).json({ message: 'Survey not found' });
        }

        // Check if user is authorized (should be admin or survey creator)
        if (req.user && (req.user.role !== 'admin' && req.user.id !== survey.userId)) {
            return res.status(403).json({ message: 'Not authorized to access these responses' });
        }

        const responses = await Response.findAll({
            where: { surveyId },
            include: [{ model: Answer, as: 'answers' }]
        });

        res.json(responses);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getResponseById = async (req, res) => {
    try {
        const response = await Response.findByPk(req.params.id, {
            include: [{ model: Answer, as: 'answers' }]
        });
        
        if (!response) {
            return res.status(404).json({ message: 'Response not found' });
        }

        // If user is authenticated, check if they're authorized
        if (req.user) {
            const survey = await Survey.findByPk(response.surveyId);
            if (req.user.role !== 'admin' && req.user.id !== survey.userId) {
                return res.status(403).json({ message: 'Not authorized to access this response' });
            }
        }

        res.json(response);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getUserResponses = async (req, res) => {
    try {
        // Get responses where the userId matches the current user's ID or email matches
        const responses = await Response.findAll({
            where: {
                [Op.or]: [
                    { userId: req.user.id },
                    { respondentEmail: req.user.email }
                ]
            },
            include: [
                { model: Answer, as: 'answers' },
                { model: Survey, as: 'survey' }
            ]
        });

        res.json(responses);
    } catch (err) {
        console.error('Error getting user responses:', err);
        res.status(500).json({ error: err.message });
    }
};
