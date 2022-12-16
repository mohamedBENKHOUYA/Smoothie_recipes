require('dotenv').config({});
const jwt = require('jsonwebtoken');
const User = require('../models/User');


function requireAuth(req, res, next) {
const token = req.cookies?.token;

// check json web token existes & is verified
if(token) {
    jwt.verify(token, process.env.SECRET, (err, decodedToken)=> {
        if(err) {
            console.log(err.message);
            res.redirect('/login');
        } else {
            console.log(decodedToken);
            next();
        }
    } )
}
else {
    res.redirect('/login');
}
}

// check current user
const checkUser = (req, res, next) => {
    const token = req.cookies?.token;
    if(token) {
        jwt.verify(token, process.env.SECRET, async (err, decodedPayload) => {
            if(err) {
                res.locals.user = null;
                next();
            }
            else {
                const user = await User.findOne({_id: decodedPayload.id})
                res.locals.user = user;
                next();
            }
        })
    }
    else {
        res.locals.user = null;
        next();
    }
}


module.exports = {requireAuth, checkUser}