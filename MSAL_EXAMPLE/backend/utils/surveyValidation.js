const Joi = require('joi');

const surveySchema = Joi.object({
  title: Joi.string().required().min(3).max(200),
  description: Joi.string().optional().max(1000),
  
  // targetAudience field temporarily removed
  // targetAudience: Joi.string().valid('all', 'department', 'office', 'adGroup', 'custom'),
  // targetDetails: Joi.alternatives().conditional('targetAudience', {
  //   is: Joi.string().valid('department', 'office', 'adGroup', 'custom'),
  //   then: Joi.array().items(Joi.string()).required(),
  //   otherwise: Joi.forbidden()
  // }),
  targetDetails: Joi.array().items(Joi.string()).optional(),
  
  category: Joi.string().optional(),
  
  questions: Joi.array().items(
    Joi.object({
      text: Joi.string().required(),
      type: Joi.string().valid(
        'single-choice', 'multiple-choice', 'rating', 
        'text', 'date', 'number'
      ).required(),
      isRequired: Joi.boolean().optional(),
      options: Joi.when('type', {
        is: Joi.string().valid('single-choice', 'multiple-choice'),
        then: Joi.array().items(
          Joi.object({
            text: Joi.string().required(),
            isDefault: Joi.boolean().optional()
          })
        ).min(2).required(),
        otherwise: Joi.forbidden()
      }),
      group: Joi.string().optional(),
      description: Joi.string().optional()
    })
  ).min(1).required(),
  
  // isAnonymous: Joi.boolean().optional(), // temporarily removed
  
  startDateTime: Joi.date().iso().required(),
  endDateTime: Joi.date().iso().min(Joi.ref('startDateTime')).required(),
  
  // Recurrence and reminders temporarily removed
  // recurrence: Joi.object({
  //   frequency: Joi.string().valid('none', 'daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom'),
  //   pattern: Joi.alternatives().conditional('frequency', {
  //     is: Joi.string().valid('weekly', 'monthly', 'custom'),
  //     then: Joi.object().required(),
  //     otherwise: Joi.forbidden()
  //   }),
  //   endDate: Joi.date().iso().optional()
  // }).optional(),
  // 
  // reminders: Joi.array().items(
  //   Joi.object({
  //     type: Joi.string().valid('email', 'teams'),
  //     sendAt: Joi.date().iso().required()
  //   })
  // ).optional(),
  
  status: Joi.string().valid('draft', 'scheduled', 'active', 'closed', 'paused').optional()
});

const validateSurvey = (surveyData) => {
  const { error } = surveySchema.validate(surveyData, { abortEarly: false });
  if (error) {
    const errorDetails = error.details.map(detail => detail.message);
    throw new Error(JSON.stringify(errorDetails));
  }
};

module.exports = { validateSurvey };
