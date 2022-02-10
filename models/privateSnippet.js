const mongoose = require('mongoose')
const Schema = mongoose.Schema
const User = require('./user.js')

const snippetSchema = new Schema({
  theme: String,
  language: String,
  code: String,
  title: String,
  timestamp: {
    type: Date,
    default: Date.now()
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
})

const privateSnippet = mongoose.model('PrivateSnippet', snippetSchema)



module.exports = privateSnippet