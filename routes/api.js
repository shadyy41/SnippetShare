const express = require('express')
const router = express.Router()
const Snippet = require('../models/snippet.js')

//per page 3 snippets
// api/snippets?page=3
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
  let {page = 0, lang = null} = req.query
  page = Math.max(page, 0)
  if(!lang){
    const snippets = await Snippet.find({}).sort({'_id': -1}).limit(3).skip(3*(page)).populate('author')
    return res.send(snippets)
  }
  else{
    const cmLang = getLang(lang)
    if(!cmLang) return res.status(404).send()
    const snippets = await Snippet.find({language: `${cmLang}`}).sort({'_id': -1}).limit(3).skip(3*(page)).populate('author')
    return res.send(snippets)
  }
})


module.exports = router