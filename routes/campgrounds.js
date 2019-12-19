var express = require("express");
var router = express.Router();
var Campground = require("../models/campground");
var middleware = require("../middleware/index");
var NodeGeocoder = require("node-geocoder");

// For google maps
var options = {
    provider: "google",
    httpAdapter: "https",
    apiKey: process.env.GEOCODER_API_KEY,
    formatter: null
};
var geocoder = NodeGeocoder(options);

// INDEX
router.get("/", function(req, res){
    if(req.query.search){
        var regex = new RegExp(escapeRegex(req.query.search), 'gi');
        Campground.find({name: regex}, function(err, allCampgrounds){
            if(err){
                req.flash("error", "Could not find campgrounds");
                console.log(err);
            } else {
                res.render("campgrounds/index",{campgrounds: allCampgrounds, page: "campgrounds"});
            }
        });
    } else {
        // retrieve all campgrounds from db
        Campground.find({}, function(err, allCampgrounds){
            if(err){
                req.flash("error", "Could not find campgrounds");
                console.log(err);
            } else {
                res.render("campgrounds/index",{campgrounds: allCampgrounds, page: "campgrounds"});
            }
        });
    }
});

// NEW
router.get("/new", middleware.isLoggedIn, function(req,res){
	res.render("campgrounds/new");
});

// CREATE
router.post("/", middleware.isLoggedIn, function(req, res){
    var name = req.body.name;
    var image = req.body.image;
    var desc = req.body.description;
    var author = {
        id: req.user._id,
        username: req.user.username
    }
    geocoder.geocode(req.body.location, function (err, data) {
        if (err || !data.length) {
            req.flash('error', 'Invalid address');
            return res.redirect('back');
        }
        var lat = data[0].latitude;
        var lng = data[0].longitude;
        var location = data[0].formattedAddress;
        var newCampground = {name: name, image: image, description: desc, author:author, location: location, lat: lat, lng: lng};
        // Create a new campground and save to DB
        Campground.create(newCampground, function(err, newCampground){
            if(err){
                console.log(err);
            } else {
                res.redirect("/campgrounds");
            }
        });
    });
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
router.get("/:id/edit", middleware.isLoggedIn, middleware.checkUserCampground, function(req, res){
  res.render("campgrounds/edit", {campground: req.campground});
});

// UPDATE
router.put("/:id", middleware.checkCampgroundOwnership, function(req, res){
    geocoder.geocode(req.body.location, function (err, data) {
        if (err || !data.length) {
            req.flash('error', 'Invalid address');
            console.log(err.message);
            return res.redirect('back');
        }
        req.body.campground.lat = data[0].latitude;
        req.body.campground.lng = data[0].longitude;
        req.body.campground.location = data[0].formattedAddress;
  
        Campground.findByIdAndUpdate(req.params.id, req.body.campground, function(err, campground){
            if(err){
                req.flash("error", err.message);
                res.redirect("back");
            } else {
                req.flash("success","Successfully Updated!");
                res.redirect("/campgrounds/" + campground._id);
            }
        });
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

// Function to help with search
function escapeRegex(text){
    return text.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

module.exports = router;