const express = require('express')
const { addreturnto } = require('../middleware/addreturnto.js')
const router = express.Router()
const Snippet = require('../models/snippet.js')
const ExpressError = require('../utils/ExpressError.js')
const WrapAsync = require('../utils/WrapAsync.js')



router.get('/', addreturnto, WrapAsync(async(req, res)=>{
  let cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 30)
  const topSnippets = await Snippet.find({timestamp: {$gt: cutoff}}).limit(5).sort({'views': -1})
  res.render('home/explore.ejs', {topSnippets})
}))


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

router.get('/:lang', addreturnto, WrapAsync(async(req, res)=>{
  const {lang} = req.params
  const cmLang = getLang(lang)
  if(!cmLang) throw new ExpressError('Page Not Found', 404)
  let cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 30)
  const topSnippets = await Snippet.find({timestamp: {$gt: cutoff}}).limit(5).sort({'views': -1})
  res.render('home/langExplore.ejs', {topSnippets, lang})
}))

/*
  Negative pages
  Or Pages for whic we dont have a result for
*/

module.exports = router