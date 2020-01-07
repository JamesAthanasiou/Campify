var express = require("express");
var router = express.Router();
var passport = require("passport");
var User = require("../models/user");

// Root Route
router.get("/", function(req,res){
	res.render("landing");
});

// Register Route
router.get("/register", function(req, res){
	res.render("register", {page: "register"});
});

// Handles register logic
router.post("/register", function(req, res){
	var newUser = new User(
        {
            username: req.body.username,
            email: req.body.email,
            isOwner: req.body.isOwner
        });
    if (req.body.avatar){
        newUser.avatar = req.body.avatar;
    }
    // input data validation 
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

	User.register(newUser, req.body.password, function(err, user){
		if(err){	
			req.flash("error", err.message);
			return res.redirect("/register");
		}
		passport.authenticate("local")(req, res, function(){
			req.flash("success", "Welcome aboard " + user.username + "!");
			res.redirect("/campgrounds");
		});
	});
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