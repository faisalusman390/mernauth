const mongoose = require('mongoose');
const User = require('./user')
const crypto = require('crypto');
var postSchema = mongoose.Schema;
// user schema
// const postSchema = new mongoose.Schema(
//     {   
//          _id: postSchema.Types.ObjectId,
//         title: String,
//         post: String,
//         user: {
//             required: true,
//             type: postSchema.Types.ObjectId,
//             ref: 'User'
//         }
//     }
// );

// let Post = module.exports = mongoose.model('Post', postSchema);

module.exports = mongoose.model('Post', postSchema({

    _id: postSchema.Types.ObjectId,
    title: String,
    discription: String,
    user: {
        required: true,
        type: postSchema.Types.ObjectId,
        ref: 'User'
    }
}));