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

const userSchema = Joi.object({
  username: Joi.string().max(10).required().escapeHTML(),
  email: Joi.string().email().max(254).required().escapeHTML(),
  password: Joi.string().required()
})

module.exports = userSchema