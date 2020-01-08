var express = require("express");
var router = express.Router();
var passport = require("passport");
var User = require("../models/user");

// for image upload
var multer = require("multer");
var storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error("Only image files are allowed!"), false);
    }
    cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter})

var cloudinary = require("cloudinary");
cloudinary.config({ 
  cloud_name: "dagknixgt", 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Root Route
router.get("/", function(req,res){
	res.render("landing");
});

// Register Route
router.get("/register", function(req, res){
	res.render("register", {page: "register"});
});

// Handles register logic
router.post("/register", upload.single("avatar"), function(req, res){
    // validate data (note this is also partially done in HTML)
    // this was refactored as middleware but it was put back because req.body.password kept being undefined.
    if (req.body.password.length < 8){
        req.flash("error", "Password must be at least 8 characters");
        return res.redirect("/register");
    }
    if (req.body.retypePassword !== req.body.password){
        req.flash("error", "Passwords do not match");
        return res.redirect("/register");
    }
    if (req.body.email && !(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(req.body.email))){
        req.flash("error", "Must enter valid email or leave email empty");
        return res.redirect("/register");
    }
    var newUser = new User(
        {
            username: req.body.username,
            // if email is blank this is ok, this is expected in profile view
            email: req.body.email,
            isOwner: req.body.isOwner
        });
    // If image is uploaded, add image.
    // Due to the async nature of js, the register and authenication steps need to be double
    // typed in this if statement. 
    if (req.file){
        cloudinary.v2.uploader.upload(req.file.path, function(err, result) {
            if(err) {
              req.flash("error", err.message);
              return res.redirect("back");
            }
            // add cloudinary url for the image to the campground object under image property
            newUser.avatar = result.secure_url;
            // add image's public_id to campground object
            newUser.avatarId = result.public_id;
            // register and authenticate
            User.register(newUser, req.body.password, function(err, user){
                if(err){	
                    req.flash("error", err.message);
                    return res.redirect("/register");
                }
                passport.authenticate("local")(req, res, function(){
                    req.flash("success", "Welcome aboard " + newUser.username + "!");
                    res.redirect("/campgrounds");
                });
            });
        });
    // for the case where the user does not add an image
    } else {
        User.register(newUser, req.body.password, function(err, user){
            if(err){	
                req.flash("error", err.message);
                return res.redirect("/register");
            }
            passport.authenticate("local")(req, res, function(){
                req.flash("success", "Welcome aboard " + newUser.username + "!");
                res.redirect("/campgrounds");
            });
        });
    }
});

// Login route
router.get("/login", function(req, res){
	res.render("login", {page: "login"});
});

//TODO does not display error message for wrong login
// Handels login logic
router.post("/login", passport.authenticate("local", 
	{
		successRedirect:"/campgrounds",
		failureRedirect:"/login"
	}), function(req, res){
});

// Logout out
router.get("/logout", function(req, res){
	req.logout();
	req.flash("success", "You Logged Out");
	res.redirect("/campgrounds/"); 
});

module.exports = router;