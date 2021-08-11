const User = require('../models/user')
const Product = require('../models/post')
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Post = require('../models/post')
const _ = require('lodash');
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

exports.signup = (req, res) => {

    // console.log("Request body", req.body)

    const {name, email, password} = req.body;

    User.findOne({email}).exec((err,user) => {
        console.log("this is the user", user);
        console.log("this is the err", err);
        if(user && err) {
            return res.status(400).json({
                error: 'Email is taken'
            });
        }
    }); 

    let newUser = new User({name,email,password})

    newUser.save((err,success) => {
       if(err) {
           console.log('SIGNUP ERROR', err)
           return res.status(400).json({
               error: err
           })
       }
       res.json({
           message: 'Signup success! Sign in please'
       })
    })
};
exports.addproduct = (req, res) => {

    // var productObj = {
    //     "_id": new mongoose.Types.ObjectId(),
    //     "title": req.body.title,
    //     "discription": req.body.description,
    //     "user_id": req.body.user_id
    // }

    let newProduct = new Post({
        "_id": new mongoose.Types.ObjectId(),
        "title": req.body.title,
        "discription": req.body.description,
        "user": req.body.user_id
    })

    newProduct.save((err,product) => {
       if(err) {
           console.log('Data Saving Error', err)
           return res.status(400).json({
               error: err
           })
       }
       res.json({
        message: `Great! product Added`
       })
    })
};
exports.deleteProduct = (req, res) => {
    const { _id } = req.body;
    Product.findByIdAndRemove(_id, function(err){
        if(err){
            return res.status(400).json({
                error: 'Product id does not exist.'
            });
        } else {
            return res.json({
                message: `Product delete`
            });
     }
})
}
// exports.signup = (req,res) => {

// };
exports.signin = (req, res) => {
    const { email, password } = req.body;
    // check if user exist
    User.findOne({ email }).exec((err, user) => {
        console.log("this is the error", err)
        if (err || !user) {
            return res.status(400).json({
                error: 'User with that email does not exist. Please signup'
            });
        }
        // authenticate
        if (!user.authenticate(password)) {
            return res.status(400).json({
                error: 'Email and password do not match'
            });
        }
        // generate a token and send to client
        const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        const { _id, name, email, role } = user;

        return res.json({
            token,
            user: { _id, name, email, role }
        });
    });
};

exports.findme = (req,res) => {
    const {_id } = req.body;
    jwt.verify(req.headers.token, process.env.JWT_SECRET, function(err, decoded) {
    if(err) {
        return res.status(401).json({
            error: 'User with that token does not exist. part # 1'
        });
    } else {
        User.findOne({ _id }).exec((err, user) => {
                if (err || !user) {
                    return res.status(401).json({
                        error: 'User with that id does not exist.'
                    });
                }
                const { _id, name, email, role } = user;
                const token = req.headers.token;        
                return res.json({
                    token,
                    user: { _id, name, email, role }
                });
            });
        }
    });
};
exports.resettoken = (req,res) => {
    const { token } = req.body;
    jwt.verify(token,  process.env.JWT_RESET_PASSWORD, function(err, decoded) {
    if(err) {
        return res.status(401).json({
            error: 'User with that token does not exist. part # 1'
        });
    } else {
        return res.json({
            token
        });
        }
    });
};
exports.getusers = (req, res) => {
    User.find({},function(err,users){
        if (err || !users) {
            return res.status(401).json({
                error: 'no users.'
            });
        }
        return res.json({
            users
        });
    })
};
exports.getposts = (req, res) => {
    Post.find({},function(err,posts){
        if (err || !posts) {
            return res.status(401).json({
                error: 'no post.'
            });
        }
        return res.json({
            posts
        });
    })
};

exports.forgotPassword = (req, res) => {
    const { email } = req.body;

    User.findOne({ email }, (err, user) => {
        if (err || !user) {
            return res.status(400).json({
                error: 'User with that email does not exist'
            });
        }

        const token = jwt.sign({ _id: user._id, name: user.name }, process.env.JWT_RESET_PASSWORD, { expiresIn: '10m' });

        const emailData = {
            from: process.env.EMAIL_FROM,
            to: email,
            subject: `Password Reset link`,
            html: `
                <h1>Please use the following link to reset your password</h1>
                <p>${process.env.CLIENT_URL}/auth/password/reset/${token}</p>
                <hr />
                <p>This email may contain sensetive information</p>
                <p>${process.env.CLIENT_URL}</p>
            `
        };

        return user.updateOne({ resetPasswordLink: token }, (err, success) => {
            if (err) {
                console.log('RESET PASSWORD LINK ERROR', err);
                return res.status(400).json({
                    error: 'Database connection error on user password forgot request'
                });
            } else {
                sgMail
                    .send(emailData)
                    .then(sent => {
                        // console.log('SIGNUP EMAIL SENT', sent)
                        return res.json({
                            message: `Email has been sent to ${email}. Follow the instruction to activate your account`
                        });
                    })
                    .catch(err => {
                        // console.log('SIGNUP EMAIL SENT ERROR', err)
                        return res.json({
                            message: err.message
                        });
                    });
            }
        });
    });
};

exports.resetPassword = (req, res) => {
    const { resetPasswordLink, newPassword } = req.body;

    if (resetPasswordLink) {
        jwt.verify(resetPasswordLink, process.env.JWT_RESET_PASSWORD, function(err, decoded) {
            if (err) {
                return res.status(400).json({
                    error: 'Expired link. Try again'
                });
            }

            User.findOne({ resetPasswordLink }, (err, user) => {
                if (err || !user) {
                    return res.status(400).json({
                        error: 'Something went wrong. Try later'
                    });
                }

                const updatedFields = {
                    password: newPassword,
                    resetPasswordLink: ''
                };

                user = _.extend(user, updatedFields);

                user.save((err, result) => {
                    if (err) {
                        return res.status(400).json({
                            error: 'Error resetting user password'
                        });
                    }
                    res.json({
                        message: `Great! Now you can login with your new password`
                    });
                });
            });
        });
    }
};
exports.changePassword = (req, res) => {
    const { userToken, newPassword, _id,old_password } = req.body;
    jwt.verify(userToken, process.env.JWT_SECRET, function(err, decoded) {
    if(err) {
        return res.status(401).json({
            error: 'User with that token does not exist. part # 1'
        });
    } else {
        User.findOne({_id }).exec((err, user) => {
                if (err || !user) {
                    return res.status(401).json({
                        error: 'User with that id does not exist.'
                    });
                }
                if (!user.authenticate(old_password)) {
                    return res.status(400).json({
                        error: 'password do not match'
                    });
                }
                const updatedFields = {
                    password: newPassword,
                };

                user = _.extend(user, updatedFields);

                user.save((err, result) => {
                    if (err) {
                        return res.status(400).json({
                            error: 'Error resetting user password'
                        });
                    }
                    res.json({
                        message: `Great! Now you can login with your new password`
                    });
                });
            });
        }
    });
};
exports.updateProduct = (req, res) => {
    const {  _id,titleupdate } = req.body;


            Product.findOne({ _id }, (err, product) => {
                if (err || !product) {
                    return res.status(400).json({
                        error: 'Something went wrong. Try later'
                    });
                }

                const updatedFields = {
                    title: titleupdate
                };

                product = _.extend(product, updatedFields);

                product.save((err, result) => {
                    
                    if (err) {
                        return res.status(400).json({
                            error: 'Error updating title'
                        });
                    }
                    res.json({
                        message: `Great! title update Succesfully`
                    });
                });
            });
        
    
};