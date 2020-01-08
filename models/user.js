var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");

var UserSchema = new mongoose.Schema({
    username: String,
    // This says password, but it is actually the hash
    password: String,
    email: {type: String, default: ""},
    avatar: {type: String, default: "https://images.unsplash.com/photo-1504697570352-47c3bbc09af9?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=752&q=80"},
    avatarId: {type: String, default: ""}, 
    description: {type: String, default: "This user has nothing to say about themself yet!"},
    isOwner: {type: Boolean, default: false}
});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", UserSchema);