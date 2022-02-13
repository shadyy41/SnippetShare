const baseJoi = require('joi')
const sanitizeHtml = require('sanitize-html')

const extension = (joi)=>({
  type: 'string',
  base: joi.string(),
  messages:{
    'string.escapeHTML': '{{#label}} must not include HTML!'
  },
  rules:{
    escapeHTML:{
      validate(value, helpers){
        const clean = sanitizeHtml(value, {
          allowedTags: [],
          allowedAttributes: {},
        })
        if(clean!==value) return helpers.error('string.escapeHTML', {value})
        return clean
      }
    }
  }
})

const Joi = baseJoi.extend(extension)

const snippetSchema = Joi.object({
  title: Joi.string().required().escapeHTML(),
  theme: Joi.string().required(),
  language: Joi.string().required(),
  code: Joi.string().allow(''),
  private: Joi.string()
})

module.exports = snippetSchema