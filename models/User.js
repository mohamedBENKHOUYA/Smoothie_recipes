require('dotenv').config();
const mongoose = require('mongoose');
const { isEmail  } = require('validator')
const bcrypt = require('bcryptjs');


const userSchema = new mongoose.Schema({
    email: {
        type: String, 
        required: [true, 'Please entrer an email'],
        unique: true,
        lowercase: true,
        validate: [isEmail, 'Please enter a valid email'] 
    },
    password: {
        type: String,
        required: [true, 'Please enter an password'],
        minlength: [6, 'Minimum password length is 6 characters']
    },
});

// fire a function after doc saved to db
userSchema.post('save', function fct(dec, next) {
    // console.log('user saved', this);
    next();
});
// fire a function before 
userSchema.pre('save', async function(next) {
    const salt = await bcrypt.genSalt();
    console.log('salt: ', salt);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

userSchema.statics.login = async function(email, password) {
    const user = await this.findOne({email});
    
}


const User = mongoose.model('utilisateur', userSchema);


module.exports = User;