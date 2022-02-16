if(process.env.NODE_ENV !== "production"){
  require('dotenv').config()
}

const express = require('express')
const path = require('path')
const methodOverride = require('method-override')
const ejsMate = require('ejs-mate')
const app = express()
const mongoose = require('mongoose')
const snippetRouter = require('./routes/snippet.js')
const session = require('express-session')
const flash = require('connect-flash')
const passport = require('passport')
const homeRouter = require('./routes/home.js')
const userRouter = require('./routes/user.js')
const apiRouter = require('./routes/api.js')
const User = require('./models/user.js')
const localStrategy = require('passport-local')
const { addreturnto } = require('./middleware/addreturnto.js')
const ExpressError = require('./utils/ExpressError.js')
const mongoSanitize = require('express-mongo-sanitize')
const dbUrl = process.env.DB_URL
// const dbUrl = 'mongodb://localhost:27017/snippet-share'
const MongoStore = require('connect-mongo')

mongoose.connect(dbUrl)
// 'mongodb://localhost:27017/snippet-share'
const db = mongoose.connection
db.on('error', console.error.bind(console, "connection error:"))
db.once('open', ()=>{
  console.log("Database Connected")
})

app.engine('ejs', ejsMate)
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))

app.use(express.urlencoded({ extended: true }))
app.use(methodOverride('_method'))
app.use(express.static(path.join(__dirname, 'public')))
app.use(mongoSanitize());

const store = MongoStore.create({
  mongoUrl: dbUrl,
  touchAfter: 24*60*60,
  crypto: {
    secret: process.env.SECRET,
  }
})

store.on("error", (e)=>console.log(e))

const sessionConfig = {
  store,
  name: `${Math.floor(Math.random(100)*1000000)}`,
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    // secure: true,
    expires: Date.now()+ 1000 * 60 * 60 * 24 * 7, //expires in a week (in miliseconds)
    maxAge: 1000 * 60 * 60 * 24 * 7
  }
}

app.use(session(sessionConfig))
app.use(flash())

app.use(passport.initialize())
app.use(passport.session())
passport.use(new localStrategy(User.authenticate()))
passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())

app.use((req, res, next)=>{
  res.locals.currentUser = req.user
  res.locals.success = req.flash('success')
  res.locals.error = req.flash('error')
  next()
})

app.use('/', userRouter)
app.use('/s', snippetRouter)
app.use('/explore', homeRouter)
app.use('/apis/', apiRouter)

app.get('/', addreturnto, (req, res)=>{//landing page
  res.render('home/landing.ejs')
})

app.all('*', (req, res, next)=>{//handles any invalid route
  next(new ExpressError('Page Not Found', 404))
})

app.use((err, req, res, next)=>{//error handler
  const {status=500} = err
  if(!err.message) err.message = 'Something Went Wrong'
  res.status(status).render('error.ejs', {err})
})

app.listen(process.env.PORT, ()=>{
  console.log(`App Serving On Port ${process.env.PORT}`)
})
