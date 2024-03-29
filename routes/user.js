const express = require('express')
const router = express.Router()
const User = require('../models/user.js')//User Model
const passport = require('passport')
const { addreturnto } = require('../middleware/addreturnto.js')
const WrapAsync = require('../utils/WrapAsync.js')
const ExpressError = require('../utils/ExpressError.js')
const validateUser = require('../middleware/validateuser.js')

router.get('/signup', (req, res)=>{
  res.render('user/signup.ejs')
})
router.post('/signup', validateUser,WrapAsync(async (req, res)=>{
  try{
    const {email, username, password} = req.body
    const user = new User({email, username})
    const registeredUser = await User.register(user, password)

    req.login(registeredUser, e=>{
      if(e) console.log('Never runs')
    })
    req.flash('success', 'Successfully Registered!')
    if(req.session.returnTo) return res.redirect(req.session.returnTo)
    res.redirect('/')
  }catch(e){
    req.flash('error', 'Username Or Email Already In Use!!!')
    return res.redirect('/signup')
  }
}))

router.get('/login', (req, res)=>{
  res.render('user/login.ejs')
})
router.post('/login', passport.authenticate('local', {failureFlash: true, failureRedirect: '/login'}), async (req, res)=>{
  req.flash('success', 'Successfully Logged In!')
  if(req.session.returnTo) return res.redirect(req.session.returnTo)
  res.redirect('/explore')
})

router.get('/logout', (req, res)=>{
  req.logout()
  req.flash('success', 'Logged Out')
  if(req.session.returnTo) return res.redirect(req.session.returnTo)
  res.redirect('/')
})

router.get('/u/:username/snippets', addreturnto, WrapAsync(async(req, res)=>{
  const {username} = req.params
  const user = await User.findOne({'username': username})

  if(!user) throw new ExpressError("User Not Found", 404)

  res.render('user/usersnippets.ejs', {user})
}))

router.get('/u/:username/private', addreturnto, WrapAsync(async(req, res)=>{
  const {username} = req.params
  if(!req.user || username!==req.user.username) throw new ExpressError("Access Denied", 403)

  const user = await User.findOne({'username': username}).populate({path:'privateSnippets', options: {sort: {'_id': -1}}})

  if(!user) throw new ExpressError("User Not Found", 404)

  res.render('user/privatesnippets.ejs', {user})
}))

router.get('/u/:username/saved', addreturnto, WrapAsync(async(req, res)=>{
  const {username} = req.params
  if(!req.user || username!==req.user.username) throw new ExpressError("Access Denied", 403)

  const user = await User.findOne({'username': username}).populate({path:'savedSnippets', options: {sort: {'_id': -1}}})

  if(!user) throw new ExpressError("User Not Found", 404)

  res.render('user/savedsnippets.ejs', {user})
}))

router.get('/u/:username', addreturnto, WrapAsync(async(req, res)=>{
  const {username} = req.params

  const user = await User.findOne({'username': username}).populate({
    path: 'snippets',
    options: {sort: {'_id': -1}}
  }).populate({path:'savedSnippets', options: {sort: {'_id': -1}}}).populate({path:'privateSnippets', options: {sort: {'_id': -1}}})

  if(!user) throw new ExpressError("User Not Found", 404)

  const {timestamp} = user

  const date = timestamp.getUTCDate() + "/" + timestamp.getUTCMonth()+1 + "/" + timestamp.getUTCFullYear()

  res.render('user/show.ejs', {user, date})
}))

module.exports = router
