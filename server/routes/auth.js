const express = require('express');
const router = express.Router();

// import controller
const { signup, signin, findme, getusers, addproduct, getposts, forgotPassword, resetPassword,changePassword,resettoken,updateProduct,deleteProduct } = require('../controllers/auth');

// import validators
const { userSignupValidator, userSigninValidator
    ,forgotPasswordValidator,
    resetPasswordValidator } = require('../validators/auth');
const { runValidation } = require('../validators');

router.post('/signup', userSignupValidator, runValidation, signup);
// router.post('/account-activation', accountActivation);
router.post('/signin', userSigninValidator, runValidation, signin);

router.post('/findme',findme);
router.get('/getusers',getusers);
router.post('/add-product',addproduct);
router.get('/getposts',getposts);
router.put('/update-product',updateProduct);
router.put('/delete-product',deleteProduct);


// forgot reset password
router.put('/forgot-password', forgotPasswordValidator, runValidation, forgotPassword);
router.put('/reset-password', resetPasswordValidator, runValidation, resetPassword);
router.put('/change-password', resetPasswordValidator, runValidation, changePassword);
router.post('/reset-token',resettoken);


module.exports = router;