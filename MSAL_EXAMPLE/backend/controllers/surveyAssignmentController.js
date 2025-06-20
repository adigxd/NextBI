const { Survey, User, SurveyAssignment, Question, QuestionOption, Response, AnonymousSurveyResponse, Sequelize } = require('../models');
const { Op } = Sequelize;

// Assign a survey to a user or email
exports.assignUserToSurvey = async (req, res) => {
    try {
        const { surveyId, userId, email } = req.body;

        // Validate input - either userId or email must be provided
        if (!surveyId || (!userId && !email)) {
            return res.status(400).json({ message: 'Survey ID and either User ID or Email are required' });
        }

        // Check if survey exists
        const survey = await Survey.findByPk(surveyId);
        if (!survey) {
            return res.status(404).json({ message: 'Survey not found' });
        }

        let user;
        let userIdToAssign;

        if (userId) {
            // If userId is provided, check if that user exists
            user = await User.findByPk(userId);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            userIdToAssign = userId;
        } else if (email) {
            // If email is provided, check if it's a @dynpro.com email
            if (!email.endsWith('@dynpro.com')) {
                return res.status(400).json({ message: 'Only @dynpro.com email addresses are allowed' });
            }

            // Check if a user with this email already exists
            user = await User.findOne({ where: { email } });
            
            if (!user) {
                // Create a placeholder user with this email
                // Extract the username from the email (part before @)
                const username = email.split('@')[0];
                
                // Create a new user with minimal information
                user = await User.create({
                    email,
                    username,
                    // Generate a random password that will be reset when the user logs in
                    password: Math.random().toString(36).slice(-8),
                    role: 'user',
                    isActive: true,
                    // These fields will be populated when the user logs in
                    firstName: null,
                    lastName: null
                });
            }
            
            userIdToAssign = user.id;
        }

        // Check if assignment already exists but was removed
        const existingAssignment = await SurveyAssignment.findOne({
            where: {
                surveyId,
                userId: userIdToAssign
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
                return res.status(200).json({ message: 'User reassigned to survey', assignment: existingAssignment });
            } else {
                // Assignment already exists and is active
                return res.status(409).json({ message: 'User is already assigned to this survey' });
            }
        }

        // Check if the user is already assigned to this survey
        const existingAssignmentActive = await SurveyAssignment.findOne({
            where: {
                surveyId,
                userId: userIdToAssign,
                isRemoved: false
            }
        });

        if (existingAssignmentActive) {
            // If there's an existing assignment, check if it's active
            if (!existingAssignmentActive.isRemoved) {
                return res.status(409).json({ message: 'User is already assigned to this survey' });
            }
        }

        // Create new assignment
        const assignment = await SurveyAssignment.create({
            surveyId,
            userId: userIdToAssign,
            assignedBy: req.user ? req.user.id : null
        });

        res.status(201).json({
            message: 'User assigned to survey successfully',
            assignment
        });
    } catch (err) {
        console.error('Error assigning user to survey:', err);
        res.status(500).json({ error: err.message });
    }
};

// Remove a user from a survey
exports.removeUserFromSurvey = async (req, res) => {
    try {
        const { surveyId, userId } = req.params;

        // Validate input
        if (!surveyId || !userId) {
            return res.status(400).json({ message: 'Survey ID and User ID are required' });
        }

        // Find the assignment
        const assignment = await SurveyAssignment.findOne({
            where: {
                surveyId,
                userId,
                isRemoved: false
            }
        });

        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found or already removed' });
        }

        // Mark as removed instead of deleting
        await assignment.update({
            isRemoved: true,
            removedAt: new Date(),
            removedBy: req.user.id
        });

        res.json({
            message: 'User removed from survey successfully'
        });
    } catch (err) {
        console.error('Error removing user from survey:', err);
        res.status(500).json({ error: err.message });
    }
};

// Get all users assigned to a survey
exports.getUsersBySurveyId = async (req, res) => {
    try {
        const { surveyId } = req.params;
        
        // Check if survey exists
        const survey = await Survey.findByPk(surveyId);
        if (!survey) {
            return res.status(404).json({ message: 'Survey not found' });
        }

        // Get all active assignments for this survey
        const assignments = await SurveyAssignment.findAll({
            where: {
                surveyId,
                isRemoved: false
            },
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'username', 'email', 'firstName', 'lastName', 'role']
                }
            ]
        });

        // Extract just the user data
        const users = assignments.map(assignment => assignment.user);

        res.json(users);
    } catch (err) {
        console.error('Error getting users for survey:', err);
        res.status(500).json({ error: err.message });
    }
};

// Get all surveys assigned to a user
exports.getSurveysByUserId = async (req, res) => {
    try {
        // If userId is not provided, use the current user's id
        const userId = req.params.userId || req.user.id;
        console.log(`Getting surveys for user ID: ${userId}`);
        
        // If the current user is not an admin and is trying to access another user's surveys, deny access
        // Convert both IDs to strings for comparison to avoid type issues
        if (req.user.role !== 'admin' && String(req.user.id) !== String(userId)) {
            console.log('Access denied: User trying to access another user\'s surveys');
            console.log('User ID from token:', req.user.id, 'Type:', typeof req.user.id);
            console.log('Requested user ID:', userId, 'Type:', typeof userId);
            return res.status(403).json({ message: 'Access denied' });
        }

        // Prepare the where clause for the survey
        // If user is not admin, only show published surveys
        const surveyWhereClause = req.user.role === 'admin' ? {} : { isPublished: true };
        console.log('Survey where clause:', surveyWhereClause);

        // First, get the distinct surveyIds assigned to this user
        const assignedSurveyIds = await SurveyAssignment.findAll({
            attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('surveyId')), 'surveyId']],
            where: {
                userId,
                isRemoved: false
            },
            raw: true
        });

        console.log(`Found ${assignedSurveyIds.length} survey assignments for user ${userId}:`, assignedSurveyIds);

        // Extract just the IDs from direct assignments
        const directlyAssignedSurveyIds = assignedSurveyIds.map(assignment => assignment.surveyId);
        
        // Get all public surveys that should be visible to everyone
        const publicSurveys = await Survey.findAll({
            where: {
                isPublic: true,
                isPublished: true // Only include published public surveys
            },
            attributes: ['id']
        });
        
        const publicSurveyIds = publicSurveys.map(survey => survey.id);
        
        console.log(`Found ${publicSurveyIds.length} public surveys available to all users`);
        
        // Combine directly assigned surveys with public surveys
        const allAccessibleSurveyIds = [...new Set([...directlyAssignedSurveyIds, ...publicSurveyIds])];
        
        console.log('All accessible survey IDs:', allAccessibleSurveyIds);

        // If no surveys are assigned or public, return empty array
        if (allAccessibleSurveyIds.length === 0) {
            console.log('No surveys assigned to this user or available as public');
            return res.json([]);
        }

        // Now fetch the actual survey data for these IDs
        const surveys = await Survey.findAll({
            where: {
                id: { [Op.in]: allAccessibleSurveyIds },
                ...surveyWhereClause // Apply the filter for published surveys
            },
            include: [
                {
                    model: User,
                    as: 'creator', // Explicitly use the 'creator' alias we defined in the model
                    attributes: ['id', 'username', 'firstName', 'lastName']
                },
                {
                    model: Question,
                    as: 'questions',
                    include: [{ model: QuestionOption, as: 'options' }]
                }
            ]
        });
        
        // For regular users, mark surveys they've already responded to as completed
        if (req.user.role === 'user') {
            console.log('Marking completed surveys for user', userId);
            
            // Get all surveys the user has responded to
            const userResponses = await Response.findAll({
                where: { userId },
                attributes: ['surveyId']
            });
            
            // Get all anonymous surveys the user has responded to
            const userAnonymousResponses = await AnonymousSurveyResponse.findAll({
                where: { userId },
                attributes: ['surveyId']
            });
            
            // Combine both sets of survey IDs
            const respondedSurveyIds = [
                ...userResponses.map(r => r.surveyId),
                ...userAnonymousResponses.map(r => r.surveyId)
            ];
            
            console.log('User has responded to these surveys:', respondedSurveyIds);
            
            // Add a completed flag to each survey
            const surveysWithCompletedFlag = surveys.map(survey => {
                const surveyJson = survey.toJSON();
                surveyJson.completed = respondedSurveyIds.includes(survey.id);
                return surveyJson;
            });
            
            console.log(`Marked ${respondedSurveyIds.length} surveys as completed`);
            
            return res.json(surveysWithCompletedFlag);
        }

        console.log(`Found ${surveys.length} surveys matching criteria`);
        if (surveys.length === 0) {
            console.log('No surveys found that match the criteria. Survey IDs:', surveyIds);
            
            // Check if the surveys exist but don't match the where clause
            const allSurveys = await Survey.findAll({
                where: {
                    id: { [Op.in]: surveyIds }
                },
                attributes: ['id', 'title', 'isPublished']
            });
            
            console.log('All surveys with these IDs (regardless of publication status):', 
                allSurveys.map(s => ({ id: s.id, title: s.title, isPublished: s.isPublished })));
        }

        res.json(surveys);
    } catch (err) {
        console.error('Error getting surveys for user:', err);
        res.status(500).json({ error: err.message });
    }
};

// Search users for assignment
exports.searchUsers = async (req, res) => {
    try {
        const { query } = req.query;
        
        // Check if the query looks like a valid email address
        const isEmailQuery = query && query.includes('@') && query.includes('.');
        
        // If query is empty, return a limited set of users instead of error
        let whereClause = { role: 'user' };
        
        if (query && query.trim() !== '') {
            whereClause = {
                role: 'user',
                [Op.or]: [
                    { username: { [Op.like]: `%${query}%` } },
                    { firstName: { [Op.like]: `%${query}%` } },
                    { lastName: { [Op.like]: `%${query}%` } },
                    { email: { [Op.like]: `%${query}%` } }
                ]
            };
        }
        
        // If it's an email query but doesn't match any users, suggest creating a placeholder
        let suggestCreatePlaceholder = false;

        // Search for users with 'user' role
        const users = await User.findAll({
            where: whereClause,
            attributes: ['id', 'username', 'email', 'firstName', 'lastName'],
            limit: 20 // Increased limit for better results
        });
        
        // If the query is an email and specifically a @dynpro.com email, but no users were found
        // suggest creating a placeholder user
        if (isEmailQuery && 
            query.endsWith('@dynpro.com') && 
            users.findIndex(u => u.email.toLowerCase() === query.toLowerCase()) === -1) {
            
            suggestCreatePlaceholder = true;
            
            // Add a virtual user to suggest creating
            users.push({
                id: 'new',
                username: query.split('@')[0],
                email: query,
                firstName: '(New',
                lastName: 'User)',
                isNewPlaceholder: true
            });
        }

        res.json(users);
    } catch (err) {
        console.error('Error searching users:', err);
        res.status(500).json({ error: err.message });
    }
};

// Auto-assign all users with 'user' role to a survey
exports.autoAssignUsers = async (req, res) => {
    try {
        const { surveyId } = req.params;
        
        // Check if survey exists
        const survey = await Survey.findByPk(surveyId);
        if (!survey) {
            return res.status(404).json({ message: 'Survey not found' });
        }

        // Get all users with 'user' role
        const users = await User.findAll({
            where: {
                role: 'user',
                isActive: true
            }
        });

        // Create assignments for each user
        const assignments = [];
        const errors = [];

        for (const user of users) {
            try {
                // Check if assignment already exists
                const existingAssignment = await SurveyAssignment.findOne({
                    where: {
                        surveyId,
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
                        assignments.push(existingAssignment);
                    }
                    // Skip if already assigned and active
                } else {
                    // Create new assignment
                    const assignment = await SurveyAssignment.create({
                        surveyId: surveyId,
                        userId: user.id,
                        assignedBy: req.user ? req.user.id : null
                    });
                    assignments.push(assignment);
                }
            } catch (err) {
                errors.push({ userId: user.id, error: err.message });
            }
        }

        res.status(201).json({
            message: `${assignments.length} users assigned to survey successfully`,
            assignmentCount: assignments.length,
            totalUsers: users.length,
            errors: errors.length > 0 ? errors : undefined
        });
    } catch (err) {
        console.error('Error auto-assigning users to survey:', err);
        res.status(500).json({ error: err.message });
    }
};
