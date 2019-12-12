var express = require("express");
var router = express.Router();
var Campground = require("../models/campground");
var middleware = require("../middleware/index");

// INDEX
router.get("/", function(req, res){
	// retrieve all campgrounds from db
	Campground.find({}, function(err, allCampgrounds){
		if(err){
			req.flash("error", "Could not find campgrounds");
			console.log(err);
		} else {
			res.render("campgrounds/index",{campgrounds:allCampgrounds});
		}
	});
});

// NEW
router.get("/new", middleware.isLoggedIn, function(req,res){
	res.render("campgrounds/new");
});

// CREATE
router.post("/", middleware.isLoggedIn, function(req,res){
	var name = req.body.name;
	var image = req.body.image;
	var description = req.body.description;
	var author = {
		id: req.user._id,
		username: req.user.username
	};
	var price = req.body.price;
	var newCampground = {name: name, image: image, description: description, author: author, price: price};

	Campground.create(newCampground, function(err, newCampground){
		if(err){
			req.flash("error", "Could not create campground");
			console.log(err);
		} else {
			res.redirect("/campgrounds");
		}
	})
});

// SHOW
router.get("/:id", function(req,res){
	// findById is provided by mongoose
	Campground.findById(req.params.id).populate("comments").exec(function(err,foundCampground){
		if(err){
			req.flash("error", "Campground not found");
			console.log(err);
		} else {
			res.render("campgrounds/show", {campground:foundCampground});
		}
	});
});

// EDIT
// Revised edit to allow checking if campground url has been changed mid-edit
router.get("/:id/edit", middleware.isLoggedIn, middleware.checkUserCampground, function(req, res){
  res.render("campgrounds/edit", {campground: req.campground});
});

// Older code that can be broken
/*router.get("/:id/edit", middleware.checkCampgroundOwnership, function(req, res){
	Campground.findById(req.params.id, function(err, foundCampground){
		if(err){
			req.flash("error", "Campground not found");
			res.redirect("back");
		} else {
			res.render("campgrounds/edit", {campground: foundCampground});
		}	
	});
});*/

// UPDATE
router.put("/:id", middleware.checkCampgroundOwnership, function(req, res){
	Campground.findByIdAndUpdate(req.params.id, req.body.campground, function(err, updatedCampground){
		if(err){
			req.flash("error", "Campground not found");
			res.redirect("/campgrounds");
		} else {
			res.redirect("/campgrounds/" + req.params.id);
		}
	});
});

// DESTROY
router.delete("/:id", middleware.checkCampgroundOwnership, function(req, res){
	Campground.findByIdAndDelete(req.params.id, function(err){
		if(err){
			req.flash("error", "Campground not found");
		   res.redirect("/campgrounds");
		} else {
			req.flash("success", "Campground deleted");
			res.redirect("/campgrounds");
		}
	});
});

module.exports = router;