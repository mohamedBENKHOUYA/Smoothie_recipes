require('dotenv').config({});
const User = require('../models/User');
const {ValidationError} = require('yup');
const fs = require('fs');
const {cvData, verifyToken, generateToken, verifyTokenRedirect, verifyUser, verifyEntity, EmailError, PasswordError, RedirectionError} = require('./script');
const utf8 = require('utf8');
const { raw } = require('body-parser');
const { manageMultiPartBuffer, saveFiles, readFileBuffers } = require('./script');  
const jwt = require('jsonwebtoken');

// handle errors
const handleValidationErrors = (errors) => {
    // console.log(err.message, err.code);

    if(!errors) return;

    // let error = { email: '', password: '' };
    let transformedErrors = {};
    const errorKeys = Reflect.ownKeys(errors);
    errorKeys.forEach((key, i) => {
        transformedErrors[key] = `${errors[key].name}: ${errors[key].message}`
    });
    return transformedErrors;
     
}

//token
const maxAge = 3 * 24 * 60 * 60; //  3 days
const createToken = (id) => {
    return jwt.sign({id}, process.env.SECRET, {
        expiresIn: maxAge
    })
}

// smothies endpoint
module.exports.smoothies = async (req, res) => {
    // const redirectError = 'login';
    // try {
    //     verifyTokenRedirect(req.cookies?.token, res, null, redirectError)
    //     return res.render('smoothies');
    // }
    // catch(e) {
    //     // return res.status(500).json({error: e.message});
    //     return res.render(redirectError);
    // }
    return res.render('smoothies');
}

// home endpoint
module.exports.home = async (req, res) => {
    const redirectError = 'login';
    try {
        verifyTokenRedirect(req.cookies?.token, res, null, redirectError)
        return res.render('home');
    }
    catch(e) {
        // return res.status(500).json({error: e.message});
        if(e instanceof RedirectionError) return res.render(redirectError);
        return res.status(500).json({success: false, error: e.message});
    }
}

// signup get endpoint
module.exports.signup_get = async(req, res) => {
    try {
        verifyTokenRedirect(req.cookies?.token, res, '/', 'signup');
        return res.end();
    } catch(e){
        if(e instanceof RedirectionError) {
            return res.render('signup');
        }
    } 
    
}

// signup post endpoint
module.exports.signup_post =  async (req, res) => {
    // const { data, fileNames, blocks } = await manageMultiPartBuffer(req); 
    
   
    // const buffers = await readFileBuffers(req.files);

    try {
        const user =  await User.create({ email, password } = req.body);
        // saveFiles(fileNames, blocks);
        const token = createToken(user._id);
        res.cookie('token', token, {httpOnly: true, maxAge: maxAge * 1000});
        return res.status(201).json({success: true, user: user._id });
    }catch(e) {
        let clientErrors = undefined;
        switch(e.name) {
            case 'ValidationError': clientErrors = handleValidationErrors(e.errors); break;
            default: clientErrors = {[e.name]: e.message}; break;
        }
        return res.status(400).json({success: false, errors: clientErrors});
    }
}

// login get endpoint
module.exports.login_get = (req, res) => {
    try {
        verifyTokenRedirect(req.cookies?.token, res, '/', 'login');
        return res.end();
    }
    catch(e) {
        if(e instanceof RedirectionError) {
            return res.render('login');
        };
    }
}

// login post endpoint
module.exports.login_post = async (req, res) => {
    try {
        // console.log(req.cookies);
    // const token = req.cookies?.token;
    // verifyToken(token, process.env.SECRET);
    const { email, password } = req.body;
    
    const user = await verifyEntity(email, password);
    // if(!user) throw new Error('password or email are invalid');
    const token = generateToken({id: user._id}, process.env.SECRET);
     res.setHeader('Set-Cookie',`token= ${token}; HttpOnly; secure;`);
    return res.status(200).json({success: true});

    }
    catch(e) {
        if(e instanceof EmailError) 
        return res.status(400).json({success: false, errors: {email: e.message}});
        else if (e instanceof PasswordError)
        return res.status(400).json({success: false, errors: {password: e.message}});
        else 
        return res.status(400).json({success: false, errors: {err: e.message}});
    }
}


module.exports.logout_get = (req, res) => {
    res.cookie('token', '', {maxAge: 0});
    res.redirect('/');
}




