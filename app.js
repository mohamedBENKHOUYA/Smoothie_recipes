const express = require('express');
const mongoose = require('mongoose');
const authRoutes = require('./routes/authRoutes');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const { checkUser } = require('./middleware/authMiddleware');
const WebServiceClient = require('@maxmind/geoip2-node').WebServiceClient;
const geoip = require('geoip-country');

console.log('geoip: ', geoip.lookup('90.90.127.226'));

const app = express();


// middleware
app.use(express.static('public'));
app.use(express.json());
app.use(cookieParser());  
// app.use(bodyParser.raw({type: 'multipart/form-data', limit:'1000mb'}))

// view engine
app.set('view engine', 'ejs');

//database connection
const dbURI = 'mongodb://localhost:27017';
mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
.then((result) =>[console.log('server listening on 3000'), app.listen(3000)] )
.catch((err) => console.log(err.message));


//routes

app.get('*', checkUser);
app.use(authRoutes);


// cookies
app.get('/set-cookies', (req, res) => {
    // res.setHeader('Set-Cookie', 'newUser=true; secure; HttpOnly; Max-Age=50000;');
    res.cookie('sixth', false, {secure: true});

    res.status(201).send('cookie setted')
});

app.get('/read-cookies', (req, res) => {
    console.log(req.cookies)
    res.send({cookies: req.cookies})
});
