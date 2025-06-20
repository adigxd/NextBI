const { Survey, Question, QuestionOption, Response, Answer, SelectedOption, SurveyAssignment, Sequelize } = require('../models');
const { Op } = Sequelize;
const sequelize = require('../config/database').sequelize;

exports.createSurvey = async (req, res) => {
    let transaction;
    
    try {
        transaction = await sequelize.transaction();
        const { questions, ...surveyData } = req.body;
        
        // 1. Create the survey
        const survey = await Survey.create(
            {
                title: surveyData.title,
                description: surveyData.description,
                userId: req.user.id,
                isPublished: surveyData.isPublished || false,
                isAnonymous: surveyData.isAnonymous || false,
                isPublic: surveyData.isPublic || false
            },
            { transaction }
        );
        
        // 2. Create questions and options
        if (questions && questions.length > 0) {
            for (const questionData of questions) {
                // Create question
                const question = await Question.create({
                    surveyId: survey.id,
                    text: questionData.text,
                    type: questionData.type,
                    isRequired: questionData.isRequired || false,
                    hasOther: questionData.hasOther || false,
                    order: questionData.order || 0
                }, { transaction });
                
                // Create options for choice questions
                if (questionData.options && questionData.options.length > 0) {
                    for (let i = 0; i < questionData.options.length; i++) {
                        const optionData = questionData.options[i];
                        await QuestionOption.create({
                            questionId: question.id,
                            text: typeof optionData === 'object' ? optionData.text : optionData,
                            order: i,
                            isDefault: false
                        }, { transaction });
                    }
                }
            }
        }
        
        // Commit the transaction before doing any operations that might fail
        await transaction.commit();
        transaction = null; // Set to null so we don't try to roll it back later
        
        // Auto-assign to all users with 'user' role if survey is published and public
        if (surveyData.isPublished && surveyData.isPublic) {
            try {
                const users = await sequelize.models.User.findAll({
                    where: {
                        role: 'user',
                        isActive: true
                    }
                });
                
                for (const user of users) {
                    await sequelize.models.SurveyAssignment.create({
                        surveyId: survey.id,
                        userId: user.id,
                        assignedBy: req.user ? req.user.id : null
                    });
                }
                
                console.log(`Auto-assigned public survey ${survey.id} to ${users.length} users`);
            } catch (err) {
                console.error('Error auto-assigning public survey to users:', err);
                // Don't fail the request if auto-assignment fails
            }
        }
        
        // Fetch the complete survey with all relations
        const completeSurvey = await Survey.findByPk(survey.id, {
            include: [{ 
                model: Question, 
                as: 'questions',
                include: [{ model: QuestionOption, as: 'options' }]
            }]
        });
        
        res.status(201).json(completeSurvey);
    } catch (err) {
        // Only roll back the transaction if it exists and hasn't been committed
        if (transaction) await transaction.rollback();
        console.error('Error creating survey:', err);
        res.status(400).json({ error: err.message });
    }
};

exports.getSurveys = async (req, res) => {
    console.log('In getSurveys, req.user:', req.user);
    if (req.user) console.log('req.user.id:', req.user.id);
    console.log('Query params:', req.query);
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const showPublishedOnly = req.query.showPublishedOnly === 'true';
        console.log('showPublishedOnly:', showPublishedOnly);

        // Build the where clause
        const whereClause = { userId: req.user.id };
        
        // If showing published only, filter by isPublished
        if (showPublishedOnly) {
            whereClause.isPublished = true;
            console.log('Filtering for published surveys only');
        }
        
        console.log('Where clause:', whereClause);

        const { count, rows } = await Survey.findAndCountAll({
            where: whereClause,
            limit,
            offset,
            order: [['createdAt', 'DESC']],
            include: [
                { model: Question, as: 'questions' }
                // Note: We don't need to include the User model here as we're filtering by userId
                // If we did need to include it, we would use: { model: User, as: 'creator' }
            ]
        });

        res.json({
            total: count,
            page,
            limit,
            surveys: rows
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getSurveyById = async (req, res) => {
    try {
        const survey = await Survey.findByPk(req.params.id, {
            include: [{ 
                model: Question, 
                as: 'questions',
                include: [{ model: QuestionOption, as: 'options' }]
            }]
        });
        
        if (!survey) return res.status(404).json({ message: 'Survey not found' });
        
        // Check if survey is anonymous or if user is authenticated
        if (!survey.isAnonymous && !req.user) {
            // For non-anonymous surveys, check if user is authenticated
            return res.status(401).json({ message: 'Authentication required to view this survey' });
        }
        
        // If user is authenticated, check if they have access to the survey
        if (req.user && req.user.role === 'user' && !survey.isAnonymous) {
            // Check if the user is assigned to this survey
            const isAssigned = await SurveyAssignment.findOne({
                where: {
                    surveyId: survey.id,
                    userId: req.user.id,
                    isRemoved: false
                }
            });
            
            if (!isAssigned) {
                return res.status(403).json({ message: 'You do not have access to this survey' });
            }
        }
        
        res.json(survey);
    } catch (err) {
        console.error('Error getting survey by ID:', err);
        res.status(500).json({ error: err.message });
    }
};

exports.updateSurvey = async (req, res) => {
    let transaction;
    
    try {
        transaction = await sequelize.transaction();
        const surveyId = req.params.id;
        const { questions, ...surveyData } = req.body;
        
        // 1. Find the survey
        const survey = await Survey.findByPk(surveyId);
        
        if (!survey) {
            if (transaction) await transaction.rollback();
            return res.status(404).json({ message: 'Survey not found' });
        }
        
        // 2. Update survey basic info
        const wasPublic = survey.isPublic;
        const wasPublished = survey.isPublished;
        
        await survey.update({
            title: surveyData.title,
            isAnonymous: surveyData.isAnonymous,
            description: surveyData.description,
            isPublished: surveyData.isPublished || survey.isPublished,
            isPublic: surveyData.isPublic !== undefined ? surveyData.isPublic : survey.isPublic
        }, { transaction });
        
        // 3. If questions are provided, update them
        if (questions && questions.length > 0) {
            // Get existing questions
            const existingQuestions = await Question.findAll({
                where: { surveyId: surveyId },
                include: [{ model: QuestionOption, as: 'options' }],
                transaction
            });
            
            // Delete questions that are no longer in the updated survey
            const updatedQuestionIds = questions.filter(q => q.id).map(q => q.id);
            const questionsToDelete = existingQuestions.filter(
                q => !updatedQuestionIds.includes(q.id)
            );
            
            // Delete questions that are no longer needed
            for (const question of questionsToDelete) {
                // Delete options first
                await QuestionOption.destroy({
                    where: { questionId: question.id },
                    transaction
                });
                
                // Then delete the question
                await question.destroy({ transaction });
            }
            
            // Update or create questions
            for (const questionData of questions) {
                if (questionData.id) {
                    // Update existing question
                    const question = await Question.findByPk(questionData.id, { transaction });
                    if (question) {
                        await question.update({
                            text: questionData.text,
                            type: questionData.type,
                            isRequired: questionData.isRequired || false,
                            hasOther: questionData.hasOther || false,
                            order: questionData.order || 0
                        }, { transaction });
                        
                        // Handle options for this question
                        if (questionData.options && questionData.options.length > 0) {
                            // Delete existing options
                            await QuestionOption.destroy({
                                where: { questionId: question.id },
                                transaction
                            });
                            
                            // Create new options
                            for (let i = 0; i < questionData.options.length; i++) {
                                const optionData = questionData.options[i];
                                await QuestionOption.create({
                                    questionId: question.id,
                                    text: typeof optionData === 'object' ? optionData.text : optionData,
                                    order: i,
                                    isDefault: false
                                }, { transaction });
                            }
                        }
                    }
                } else {
                    // Create new question
                    const newQuestion = await Question.create({
                        surveyId: surveyId,
                        text: questionData.text,
                        type: questionData.type,
                        isRequired: questionData.isRequired || false,
                        hasOther: questionData.hasOther || false,
                        order: questionData.order || 0
                    }, { transaction });
                    
                    // Create options for this question
                    if (questionData.options && questionData.options.length > 0) {
                        for (let i = 0; i < questionData.options.length; i++) {
                            const optionData = questionData.options[i];
                            await QuestionOption.create({
                                questionId: newQuestion.id,
                                text: typeof optionData === 'object' ? optionData.text : optionData,
                                order: i,
                                isDefault: false
                            }, { transaction });
                        }
                    }
                }
            }
        }
        
        await transaction.commit();
        transaction = null; // Set to null so we don't try to roll it back later
        
        // Auto-assign to all users with 'user' role if survey is published and public
        // and either it just became public or it just became published
        if (survey.isPublished && survey.isPublic && (!wasPublic || !wasPublished)) {
            try {
                const users = await sequelize.models.User.findAll({
                    where: {
                        role: 'user',
                        isActive: true
                    }
                });
                
                for (const user of users) {
                    // Check if assignment already exists
                    const existingAssignment = await sequelize.models.SurveyAssignment.findOne({
                        where: {
                            surveyId: survey.id,
                            userId: user.id
                        }
                    });
                    
                    if (existingAssignment) {
                        if (existingAssignment.isRemoved) {
                            // Reactivate the assignment
                            await existingAssignment.update({
                                isRemoved: false,
                                removedAt: null,
                                removedBy: null,
                                assignedBy: req.user ? req.user.id : null,
                                assignedAt: new Date()
                            });
                        }
                        // Skip if already assigned and active
                    } else {
                        // Create new assignment
                        await sequelize.models.SurveyAssignment.create({
                            surveyId: survey.id,
                            userId: user.id,
                            assignedBy: req.user ? req.user.id : null
                        });
                    }
                }
                
                console.log(`Auto-assigned public survey ${survey.id} to ${users.length} users on update`);
            } catch (err) {
                console.error('Error auto-assigning public survey to users on update:', err);
                // Don't fail the request if auto-assignment fails
            }
        }
        
        // Fetch the updated survey with all relations
        const updatedSurvey = await Survey.findByPk(surveyId, {
            include: [{ 
                model: Question, 
                as: 'questions',
                include: [{ model: QuestionOption, as: 'options' }]
            }]
        });
        
        res.json(updatedSurvey);
    } catch (err) {
        if (transaction) await transaction.rollback();
        console.error('Error updating survey:', err);
        res.status(500).json({ error: err.message });
    }
};

exports.deleteSurvey = async (req, res) => {
    let transaction;
    
    try {
        transaction = await sequelize.transaction();
        const surveyId = req.params.id;
        
        // 1. Find the survey
        const survey = await Survey.findByPk(surveyId);
        
        if (!survey) {
            if (transaction) await transaction.rollback();
            return res.status(404).json({ message: 'Survey not found' });
        }
        
        // 1. Find all questions associated with this survey
        const questions = await Question.findAll({
            where: { surveyId: surveyId },
            transaction
        });
        
        const questionIds = questions.map(q => q.id);
        
        // 2. Find all responses to this survey
        const responses = await Response.findAll({
            where: { surveyId: surveyId },
            transaction
        });
        
        const responseIds = responses.map(r => r.id);
        
        // 3. Delete selected options for choice questions
        if (questionIds.length > 0 && responseIds.length > 0) {
            await SelectedOption.destroy({
                where: {
                    questionId: { [Op.in]: questionIds },
                    responseId: { [Op.in]: responseIds }
                },
                transaction
            });
        }
        
        // 4. Delete answers to questions
        if (questionIds.length > 0 && responseIds.length > 0) {
            await Answer.destroy({
                where: {
                    questionId: { [Op.in]: questionIds },
                    responseId: { [Op.in]: responseIds }
                },
                transaction
            });
        }
        
        // 5. Delete question options
        if (questionIds.length > 0) {
            await QuestionOption.destroy({
                where: {
                    questionId: { [Op.in]: questionIds }
                },
                transaction
            });
        }
        
        // 6. Delete responses
        if (responseIds.length > 0) {
            await Response.destroy({
                where: {
                    id: { [Op.in]: responseIds }
                },
                transaction
            });
        }
        
        // 7. Delete questions
        if (questionIds.length > 0) {
            await Question.destroy({
                where: {
                    id: { [Op.in]: questionIds }
                },
                transaction
            });
        }
        
        // 8. Finally delete the survey
        await survey.destroy({ transaction });
        
        await transaction.commit();
        transaction = null; // Set to null so we don't try to roll it back later
        res.json({ message: 'Survey and all related data deleted successfully' });
    } catch (err) {
        if (transaction) await transaction.rollback();
        console.error('Error deleting survey:', err);
        res.status(500).json({ error: err.message });
    }
};

exports.getActiveSurveys = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const offset = (page - 1) * limit;
        const userId = req.user.id;

        // We need to get both:
        // 1. Published surveys that the user is assigned to
        // 2. Published surveys that are public
        
        // First, find all published public surveys
        const publicSurveysQuery = {
            where: {
                isPublished: true,
                isPublic: true
            },
            include: [{ 
                model: Question, 
                as: 'questions',
                include: [{ model: QuestionOption, as: 'options' }]
            }]
        };
        
        // Then, find all published surveys the user is assigned to
        const assignedSurveysQuery = {
            where: {
                isPublished: true,
                isPublic: false // Only get non-public surveys that require assignment
            },
            include: [
                { 
                    model: Question, 
                    as: 'questions',
                    include: [{ model: QuestionOption, as: 'options' }]
                },
                {
                    model: sequelize.models.SurveyAssignment,
                    as: 'assignments',
                    where: {
                        userId: userId,
                        isRemoved: false
                    },
                    required: true // Only include surveys where the user is assigned
                }
            ]
        };
        
        // Execute both queries
        const [publicSurveys, assignedSurveys] = await Promise.all([
            Survey.findAll(publicSurveysQuery),
            Survey.findAll(assignedSurveysQuery)
        ]);
        
        // Combine the results
        const allSurveys = [...publicSurveys, ...assignedSurveys];
        
        // Sort by createdAt descending
        allSurveys.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        // Apply pagination manually
        const totalCount = allSurveys.length;
        const paginatedSurveys = allSurveys.slice(offset, offset + limit);

        console.log(`Found ${publicSurveys.length} public surveys and ${assignedSurveys.length} assigned surveys for user ${userId}`);
        
        res.json({
            total: totalCount,
            page,
            limit,
            surveys: paginatedSurveys
        });
    } catch (err) {
        console.error('Error getting active surveys:', err);
        res.status(500).json({ error: err.message });
    }
};

// Toggle published status of a survey (publish or unpublish)
exports.toggleArchiveStatus = async (req, res) => {
    try {
        const surveyId = req.params.id;
        const survey = await Survey.findByPk(surveyId);
        
        if (!survey) {
            return res.status(404).json({ message: 'Survey not found' });
        }
        
        // Toggle the isPublished status
        const newPublishedStatus = !survey.isPublished;
        const wasPublished = survey.isPublished;
        
        await survey.update({
            isPublished: newPublishedStatus
        });
        
        // If the survey was just published and it's a public survey, auto-assign to all users
        if (newPublishedStatus && !wasPublished && survey.isPublic) {
            try {
                const users = await sequelize.models.User.findAll({
                    where: {
                        role: 'user',
                        isActive: true
                    }
                });
                
                for (const user of users) {
                    // Check if assignment already exists
                    const existingAssignment = await sequelize.models.SurveyAssignment.findOne({
                        where: {
                            surveyId: survey.id,
                            userId: user.id
                        }
                    });
                    
                    if (existingAssignment) {
                        if (existingAssignment.isRemoved) {
                            // Reactivate the assignment
                            await existingAssignment.update({
                                isRemoved: false,
                                removedAt: null,
                                removedBy: null,
                                assignedBy: req.user ? req.user.id : null,
                                assignedAt: new Date()
                            });
                        }
                        // Skip if already assigned and active
                    } else {
                        // Create new assignment
                        await sequelize.models.SurveyAssignment.create({
                            surveyId: survey.id,
                            userId: user.id,
                            assignedBy: req.user ? req.user.id : null
                        });
                    }
                }
                
                console.log(`Auto-assigned public survey ${survey.id} to ${users.length} users on publish`);
            } catch (err) {
                console.error('Error auto-assigning public survey to users on publish:', err);
                // Don't fail the request if auto-assignment fails
            }
        }
        
        res.json({
            message: newPublishedStatus ? 'Survey published successfully' : 'Survey unpublished successfully',
            isPublished: newPublishedStatus
        });
    } catch (err) {
        console.error('Error toggling archive status:', err);
        res.status(500).json({ error: err.message });
    }
};
