const express = require('express')
const router = express.Router()
const Snippet = require('../models/snippet.js')
const User = require('../models/user.js')

const getLang =(lang)=>{

  switch(lang){
    case 'cpp': return 'text/x-c++src'
    case 'py': return 'text/x-python'
    case 'js': return 'javascript'
    case 'css': return 'text/css'
    case 'java': return 'text/x-java'
    case 'html': return 'text/html'
  }

  return null
}
router.get('/snippets', async(req, res)=>{
  let {page = 0, lang, top} = req.query
  page = Math.max(page, 0)
  let snippets

  let cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 30)

  if(!lang && !top){//normal
    snippets = await Snippet.find({}).sort({'_id': -1}).limit(3).skip(3*(page)).populate('author', '-privateSnippets -savedSnippets').select('-savers')
  }
  else if(top){//top
    snippets = await Snippet.find({timestamp: {$gt: cutoff}}).skip(3*(page)).limit(3).sort({'views': -1, '_id':-1}).populate('author', '-privateSnippets -savedSnippets').select('-savers')
  }
  else{//according to language
    const cmLang = getLang(lang)
    if(!cmLang) return res.status(404).send()
    snippets = await Snippet.find({language: `${cmLang}`}).sort({'_id': -1}).limit(3).skip(3*(page)).populate('author', '-privateSnippets -savedSnippets').select('-savers')
  }
  return res.send(snippets)
})

router.get('/:username/snippets', async(req, res)=>{
  const {username} = req.params
  const {page} = req.query

  const user = await User.findOne({'username': username}, {privateSnippets: 0, savedSnippets: 0}).populate({
    path: 'snippets', 
    perDocumentLimit: 3,
    select: '-savers',
    options: { skip: page*3, sort: {'_id': -1}}
  })

  if(!user) return res.status(404).send({msg: "User doesn't exist"})
  res.send(user)
})


module.exports = router