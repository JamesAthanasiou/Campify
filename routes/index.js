var express = require("express");
var router = express.Router();
var passport = require("passport");
var User = require("../models/user");
var Campground = require("../models/campground");
var middleware = require("../middleware/index");

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
            avatar: req.body.avatar
        });
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

// Show user profile
router.get("/users/:id", function (req,res){
    User.findById(req.params.id, function(err, foundUser){
        if(err){
            req.flash("error", "Could not find profile for that user");
            res.redirect("/campgrounds/");
        } else {
            Campground.find().where("author.id").equals(foundUser._id).exec(function(err, campgrounds){
                if(err){
                    req.flash("error", "Could not find profile for that user");
                    res.redirect("/campgrounds/");
                } else {
                    res.render("users/show", {user: foundUser, campgrounds: campgrounds});
                }
            });
        }
    });
});

// Edit user profile
router.get("/users/:id/edit", middleware.checkProfileOwnership, function (req, res){
    User.findById(req.params.id, function(err, foundUser){
        if(err){
            req.flash("error", "Could not find profile for that user");
            res.redirect("/campgrounds/");
        } else {
            res.render("users/edit", {user: foundUser});
        }
    });
});

// Update user profile
router.put("/users/:id", middleware.checkProfileOwnership, function (req, res){
    User.findByIdAndUpdate(req.params.id, req.body.user, function(err, updatedUser){
        // Mongo keeps throwing writeConcernError {code 79, codeName: 'UnknownReplWriteConcern'}
        // The database still updates but it will display an error message to the user.
        // For the time being the error handling has been removed since editing an existing user
        // will only fail if the DB is taken offline. In that case, there are probably other errors that
        // will occur anyway

        if(err){
            console.log(err);
            /*
            req.flash("error", "Could not edit profile");
            */
            res.redirect("/users/" + req.params.id);
        } else {
            res.redirect("/users/" + req.params.id);
        }
    });
});

module.exports = router;