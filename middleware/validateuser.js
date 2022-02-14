const userSchema = require("../schemas/userSchema")
const ExpressError = require("../utils/ExpressError")

const validateUser = (req, res, next)=>{
  const {error} = userSchema.validate(req.body)
  console.log(error)
  if(error){
    throw new ExpressError("Bad Request!", 400)
  }
  else next()
}

module.exports = validateUser
