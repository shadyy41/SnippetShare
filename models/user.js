const mongoose = require('mongoose')
const Schema = mongoose.Schema
const passportLocalMongoose = require('passport-local-mongoose')

const userSchema = new Schema({
  timestamp: {
    type: Date,
    default: Date.now()
  },
  snippets: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Snippet'
    }
  ],
  savedSnippets: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Snippet'
    }
  ],
  email: {
    type: String,
    required: true,
    unique: true
  }
})

userSchema.plugin(passportLocalMongoose)
/*Add password username to the model*/

const User =  mongoose.model('User', userSchema)
// mongoose.models.Snippet || 

module.exports = User