const snippetSchema = require("../schemas/snippetSchema")
const ExpressError = require("../utils/ExpressError")

const validateSnippet = (req, res, next)=>{
  const {error} = snippetSchema.validate(req.body)
  if(error){
    const msg = (error.message[1]==='t')?"The title musn't contain any HTML tags!":"Bad request"
    throw new ExpressError(msg, 400)
  }
  else next()
}

module.exports = validateSnippet