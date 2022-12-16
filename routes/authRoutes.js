const { Router }= require('express');
const authController = require('../controllers/authController');
const multer = require('multer');
var upload = multer({dest: 'uploads/'});
const { requireAuth, checkUser, } = require('../middleware/authMiddleware');


const router = Router();



router.get('/', authController.home);
// (req, res) => res.render('home')
// (req, res) => res.render('smoothies')
router.get('/smoothies', requireAuth, authController.smoothies);


router.get('/signup' , authController.signup_get);

router.get('/logout' ,authController.logout_get);

router.post('/signup', upload.fields([{name: 'avatar', maxCount: 2}, {name: 'avatar2', maxCount: 1}, {name: 'avatar3', maxCount: 1}]), authController.signup_post);

router.get('/login', authController.login_get);

router.post('/login', upload.fields([]), authController.login_post);

module.exports = router;