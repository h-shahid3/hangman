const express = require('express');
const volleyball = require('volleyball')
const app =express()
const path = require('path')

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(volleyball)
require('dotenv').config();

const index = require('./routes/index')
const game = require('./routes/game')
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')
app.use(express.static(path.join(__dirname, 'public')))



app.use('/',index);
app.use('/game',game);


const port = process.env.PORT || 3000;

app.listen(port,()=>{
    console.log(`Listening on http://localhost:${port}`)
})