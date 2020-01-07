var express = require("express");
var router = express.Router();
var User = require("../models/user");
var Campground = require("../models/campground");
var Review = require("../models/review");
var middleware = require("../middleware/index");

// Show user profile
router.get("/:id", function (req,res){
    User.findById(req.params.id, function(err, user){

        if(err){
            req.flash("error", "Could not find profile for that user");
            return res.redirect("/campgrounds/");
        }

        // For owner type profiles, find all campgrounds owned by user
        if (user.isOwner){
            Campground.find().where("author.id").equals(user._id).exec(function(err, campgrounds){
                if(err){
                    req.flash("error", err.message);
                    return res.redirect("/campgrounds/");
                }
                res.render("users/show", {user: user, campgrounds: campgrounds});
            });
        } else {
        // For user type profiles, find all reviews made by user
            Review.find().where("author.id").equals(user._id).populate("campground").exec(function(err, reviews){
                if(err){
                    req.flash("error", err.message);
                    return res.redirect("/campgrounds/");
                }
                res.render("users/show", {user: user, reviews: reviews});
            });
        }
    });
});

// Edit user profile
router.get("/:id/edit", middleware.checkProfileOwnership, function (req, res){
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
router.put("/:id", middleware.checkProfileOwnership, function (req, res){
    User.findByIdAndUpdate(req.params.id, req.body.user, function(err, updatedUser){
        if(err){
            console.log(err);
            req.flash("error", "Could not edit profile");
            res.redirect("/users/" + req.params.id);
        } else {
            res.redirect("/users/" + req.params.id);
        }
    });
});

module.exports = router;