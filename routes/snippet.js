const express = require('express')
const { addreturnto } = require('../middleware/addreturnto.js')
const { isLoggedIn } = require('../middleware/isloggedin.js')
const router = express.Router()
const Snippet = require('../models/snippet.js')//Snippet model
const privateSnippet = require('../models/privateSnippet.js')
const User = require('../models/user.js')
const ExpressError = require('../utils/ExpressError.js')
const WrapAsync = require('../utils/WrapAsync.js')
const validateSnippet = require('../middleware/validatesnippet.js')

//theme language code title

router.get('/new', (req, res)=>{//new page
  res.render('snippet/new.ejs')
})
router.get('/edit/:id', WrapAsync(async(req, res)=>{//edit page
  const {id} = req.params
  const snippet = await Snippet.findById(id)

  if(!snippet) throw new ExpressError("Snippet Not Found", 404)

  if(!req.user || !snippet.author.equals(req.user._id)){
    throw new ExpressError("Access Denied", 403)
  }

  res.render('snippet/edit.ejs', {snippet})
}))
const snippetIsSaved = async(user, snippet)=>{//user has saved a certain snippet or not
  for(let i of user.savedSnippets){
    if(i.equals(snippet._id)) return 1;
  }
  return 0;
}
router.get('/:id', addreturnto, WrapAsync(async(req, res)=>{//show page
  const {id} = req.params
  const snippet = await Snippet.findById(id).populate('author')

  if(!snippet) throw new ExpressError("Snippet Not Found", 404)

  const {views = 0} = snippet

  snippet.views = views + 1

  try{
    await snippet.save()
  }catch(e){
    throw new ExpressError()
  }

  const saved = (req.user)? await snippetIsSaved(req.user, snippet) : 0;
  const days = Math.floor((Date.now() - snippet.timestamp) / (1000*60*60*24))

  res.render('snippet/show.ejs', {snippet, days, saved})

}))

router.get('/private/:id', addreturnto, WrapAsync(async(req, res)=>{
  if(!req.user) throw new ExpressError("Access Denied", 403)
  const {id} = req.params
  const user = await User.findById(req.user._id).populate('privateSnippets')
  if(!user) throw new ExpressError()//some server error

  let snippet

  for(let snip of user.privateSnippets){
    if(snip._id.equals(id)){
      snippet = snip
      break
    }
  }

  if(!snippet) throw new ExpressError("Snippet Not Found", 404)


  try{
    await snippet.populate('author')
  }catch(e){
    throw new ExpressError()
  }

  const days = Math.floor((Date.now() - snippet.timestamp) / (1000*60*60*24))

  res.render('snippet/private-show.ejs', {snippet, days})
}))

router.get('/private/edit/:id', WrapAsync(async(req, res)=>{
  const {id} = req.params
  const snippet = await privateSnippet.findById(id)

  if(!snippet) throw new ExpressError("Snippet Not Found", 404)

  if(!req.user || !snippet.author.equals(req.user._id)){
    throw new ExpressError("Access Denied", 403)
  }

  res.render('snippet/private-edit.ejs', {snippet})
}))

router.put('/private/edit/:id', validateSnippet, WrapAsync(async(req, res)=>{
  const {id} = req.params
  req.session.returnTo = null
  const snippet = await privateSnippet.findById(id)
  if(!snippet) throw new ExpressError()

  if(req.user && snippet.author.equals(req.user._id)){
    try{
      const {title, theme, language, code} = req.body
      await Snippet.findByIdAndUpdate(id, {title, theme, language, code})
    }catch(e){
      req.flash('error', "Couldn't Update The Snippet")
      res.redirect(`/s/private/edit/${id}`)
    }
  }
  else{
    throw new ExpressError("Access Denied", 403)
  }

  req.flash('success', "Changes Saved.")
  res.redirect(`/s/private/${id}`)
}))

router.post('/new', isLoggedIn, validateSnippet, WrapAsync(async(req, res)=>{
  const newSnippet = (req.body.private)?new privateSnippet(req.body) : new Snippet(req.body)
  newSnippet.author = req.user._id

  const author = await User.findById(req.user._id)

  if(req.body.private) author.privateSnippets.push(newSnippet._id)
  else author.snippets.push(newSnippet._id)

  try{
    await author.save()
  }catch(e){
    throw new ExpressError()
  }

  try {
    await newSnippet.save()
  }catch(e) {
    throw new ExpressError("Snippet Couldn't Be Saved")
  }

  req.flash('success', "Snippet Created.")

  if(req.body.private) return res.redirect(`/s/private/${newSnippet._id}`)

  res.redirect(`/s/${newSnippet._id}`)

}))
router.post('/:id/save', async(req, res)=>{//user wants to save :)
  if(!req.user){//someone using postman
    return res.send("Stop :)")
  }
  const {id} = req.params

  const user = await User.findById(req.user._id)
  if(!user) return res.status(500).send("Error")

  const snippet = await Snippet.findById(id)
  if(!snippet) return res.status(500).send("Error")

  user.savedSnippets.push(snippet)
  snippet.savers.push(user)
  try {
    await snippet.save()
    await user.save()
  } catch (e) {
    return res.status(500).send("Error")
  }

  res.status(200).send("Snippet saved")
})
router.delete('/:id/save', async(req, res)=>{
  if(!req.user) return res.send("Stop :)")
  const {id} = req.params
  const user = await User.findById(req.user._id)
  if(!user) return res.status(500).send("Error")

  const snippet = await Snippet.findById(id)
  if(!snippet) return res.status(500).send("Error")

  user.savedSnippets = user.savedSnippets.filter(i=>!(i.equals(snippet._id)))
  snippet.savers = snippet.savers.filter(i=>!(i.equals(user._id)))

  try {
    await snippet.save()
    await user.save()
  } catch (e) {
    return res.status(500).send("Error")
  }

  res.status(200).send("Worked")
})
router.put('/edit/:id', validateSnippet, WrapAsync(async(req, res)=>{
  const {id} = req.params
  req.session.returnTo = null

  const snippet = await Snippet.findById(id)

  if(!snippet) throw new ExpressError()

  if(req.user && snippet.author.equals(req.user._id)){
    try{
      const {title, theme, language, code} = req.body
      await Snippet.findByIdAndUpdate(id, {title, theme, language, code})
    }catch(e){
      throw new ExpressError()
    }
  }
  else{
    throw new ExpressError("Unauthorized", 400)
  }

  req.flash('success', "Changes Saved.")
  res.redirect(`/s/${id}`)
}))

const deleteSavers = async(snippet)=>{
  for(let i of snippet.savers){
    let saver
    try{
      saver = await User.findById(i)
    }catch(e){
      continue
    }
    saver.savedSnippets = saver.savedSnippets.filter(j=>!(j.equals(snippet._id)))
    try{
      await saver.save()
    }catch(e){
      continue
    }
  }
}

router.delete('/:id', WrapAsync(async(req, res)=>{
  const {id} = req.params

  const snippet = await Snippet.findById(id)
  
  if(!snippet){
    throw new ExpressError()
  }

  if(req.user && snippet.author.equals(req.user._id)){
    let author

    try{
      author = await User.findById(snippet.author)
    }catch(e){
      req.flash('error', "Couldn't Delete The Snippet :(")
      return res.redirect(`/s/${id}`)
    }

    author.snippets = author.snippets.filter(i=>!(i.equals(snippet._id)))

    try{
      await author.save()
    }catch(e){
      console.log("DB Error while deleting snippet")
    }
    await deleteSavers(snippet)

    try{
      await Snippet.findByIdAndDelete(id)
    }
    catch(e){
      console.log("DB Error while deleting snippet")
    }
  }
  else{
    throw new ExpressError("Unauthorized", 400)
  }

  req.flash('success', 'Snippet Deleted!!!')
  res.redirect('/explore')
}))

router.delete('/private/:id', WrapAsync(async(req, res)=>{
  const {id} = req.params

  let snippet

  try{
    snippet = await privateSnippet.findById(id)
  }
  catch(e){
    throw new ExpressError()
  }

  if(req.user && snippet.author.equals(req.user._id)){
    let author

    try{
      author = await User.findById(snippet.author)
    }catch(e){
      throw new ExpressError("Access Denied", 403)
    }

    author.privateSnippets = author.privateSnippets.filter(i=>!(i.equals(snippet._id)))

    try{
      await author.save()
    }catch(e){
      console.log("DB Error while deleting snippet")
    }

    try{
      await privateSnippet.findByIdAndDelete(id)
    }
    catch(e){
      console.log("DB Error while deleting snippet")
    }
  }
  else{
    throw new ExpressError("Access Denied", 403)
  }

  req.flash('success', 'Snippet Deleted!!!')
  res.redirect('/explore')
}))


module.exports = router