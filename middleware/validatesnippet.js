const snippetSchema = require("../schemas/snippetSchema")
const ExpressError = require("../utils/ExpressError")

const validateSnippet = (req, res, next)=>{
  const {error} = snippetSchema.validate(req.body)
  if(error){
    throw new ExpressError("Bad Request!", 400)
  }
  else next()
}

module.exports = validateSnippet