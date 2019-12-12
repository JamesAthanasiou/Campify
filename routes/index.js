//TODO does not display error message for wrong login

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
	res.render("register");
});

// Handels register logic
router.post("/register", function(req, res){
	var newUser = new User({username: req.body.username});
	User.register(newUser, req.body.password, function(err, user){
		if(err){	
			// passport gives a specific error message so it is being passed through to req.flash
			req.flash("error", err.message);
			return res.redirect("/register");
		}
		passport.authenticate("local")(req, res, function(){
			req.flash("success", "Welcome aboard " + user.username + "!");
			res.redirect("/campgrounds");
		})
	});
});

// Login route
router.get("/login", function(req, res){
	res.render("login");
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
	res.redirect("campgrounds"); 
});

module.exports = router;