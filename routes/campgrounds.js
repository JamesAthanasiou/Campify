var express = require("express");
var router = express.Router();
var Campground = require("../models/campground");
var Review = require("../models/review");
var middleware = require("../middleware/index");
var NodeGeocoder = require("node-geocoder");
var request = require("request");

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

// for google maps
var options = {
    provider: "google",
    httpAdapter: "https",
    apiKey:process.env.GEOCODER_API_KEY,
    formatter: null
};
var geocoder = NodeGeocoder(options);

// INDEX
router.get("/", function(req, res){
    // retrieve all campgrounds from db that match search string
    if(req.query.search){
        var regex = new RegExp(escapeRegex(req.query.search), "gi");
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
router.post("/", middleware.isLoggedIn, upload.single("image"), function(req, res){
    // add data for google maps location
    geocoder.geocode(req.body.campground.location, function (err, data) {
        if (err || !data.length) {
            req.flash("error", err.message);
            return res.redirect("back");
        }
        req.body.campground.lat = data[0].latitude;
        req.body.campground.lng = data[0].longitude;
        req.body.campground.location = data[0].formattedAddress;

        cloudinary.v2.uploader.upload(req.file.path, function(err, result) {
            if(err) {
              req.flash("error", err.message);
              return res.redirect("back");
            }
            // add cloudinary url for the image to the campground object under image property
            req.body.campground.image = result.secure_url;
            // add image's public_id to campground object
            req.body.campground.imageId = result.public_id;
            // add author to campground
            req.body.campground.author = {
              id: req.user._id,
              username: req.user.username
            };
            if(req.user.isOwner){
                req.body.campground.isClaimed = true;
            }
            // create a new campground and save to DB
            Campground.create(req.body.campground, function(err, campground) {
              if (err) {
                req.flash("error", err.message);
                console.log(err.message);
                return res.redirect("back");
              }
              res.redirect("/campgrounds/" + campground.id);
            });
        });
    });
});

// SHOW
router.get("/:id", function(req, res){
    // find campgrounds and retrieve comments in reverse chronological order
	Campground.findById(req.params.id).populate("comments").populate({
        path: "reviews",
        options: {sort: {createdAt: -1}}
    }).exec(function(err, foundCampground){
		if(err){
			req.flash("error", "Campground not found");
			res.redirect("/campgrounds")
		} else {
			res.render("campgrounds/show", {campground: foundCampground});
		}
	});
});

// EDIT
router.get("/:id/edit", middleware.isLoggedIn, middleware.checkUserCampground, function(req, res){
  res.render("campgrounds/edit", {campground: req.campground});
});

// UPDATE
router.put("/:id", middleware.checkCampgroundOwnership, upload.single("image"), function(req, res){
    // remove rating field to prevent rating from being manipulated
    delete req.body.campground.rating;

    Campground.findById(req.params.id, function(err, campground){
        if(err){
            req.flash("error", err.message);
            return res.redirect("back");
        } 
        
        // revise location data
        geocoder.geocode(campground.location, function (err, data) {
            if (err || !data.length) {
                req.flash("error", "Invalid address");
                return res.redirect("back");
            }
            campground.lat = data[0].latitude;
            body.campground.lng = data[0].longitude;
            body.campground.location = data[0].formattedAddress;

            // if user uploads new campground, delete old image and update new one
            if (req.file){
                cloudinary.v2.uploader.destroy(campground.imageId), function(err){
                    if(err){
                        req.flash("error", err.message);
                        return res.redirect("back");
                    }
                }
                cloudinary.v2.uploader.upload(req.file.path, function(err, result){
                    if(err){
                        req.flash("error", err.message);
                        return res.redirect("back");
                    }
                    campground.imageId = result.public_id;
                    campground.image = result.secure_url;
                    campground.name = req.body.campground.name;
                    campground.description = req.body.campground.description;
                    campground.price = req.body.campground.price;
                    campground.save();
                    req.flash("success","Successfully updated!");
                    res.redirect("/campgrounds/" + campground._id);
                });
            // if no image uploaded, only update other values in campground
            } else {
                campground.name = req.body.campground.name;
                campground.description = req.body.campground.description;
                campground.price = req.body.campground.price;
                campground.save(function(err){
                    if(err){
                        req.flash("error", "Failed to update campground");
                        return res.redirect("/campgrounds/" + campground._id);
                    }
                    req.flash("success","Successfully updated!");
                    res.redirect("/campgrounds/" + campground._id);
                });
            }
        });
    });
});

// Update - claim profile
router.put("/:id/claim", middleware.canClaimCampground, function (req, res){
    Campground.findById(req.params.id, function(err, campground){
        if(err){
            req.flash("error", "Campground not found");
            return res.redirect("/campgrounds");
        }
        campground.author = {
            id: req.user._id,
            username: req.user.username
        };
        campground.isClaimed = true;
        campground.save(function(err){
            if (err){
                req.flash("error", "Failed to claim campground");
                return res.redirect("/campgrounds/" + campground._id);
            }
            req.flash("success", " Successfully claimed campground!");
            res.redirect("/campgrounds/" + campground._id);
        });
    });
});

// DESTROY
router.delete("/:id", middleware.checkCampgroundOwnership, function(req, res){
    Campground.findById(req.params.id, function(err, campground){
        if(err){
            req.flash("error", "Campground not found");
            return res.redirect("/campgrounds");
        }
        // delete image on cloudinary 
        cloudinary.v2.uploader.destroy(campground.imageId, function(err){
            if(err){
                req.flash("error", err.message);
                return res.redirect("back");
            }
            // delete associated comments for campground
            Review.remove({"_id": {$in: campground.comments}}, function (err){
                if (err) {
                    req.flash("error", err.message);
                    return res.redirect("back");
                }
                // delete associated reviews for campground
                Review.remove({"_id": {$in: campground.reviews}}, function (err){
                    if (err) {
                        req.flash("error", err.message);
                        return res.redirect("back");
                    }
                    // delete campground
                    campground.remove(function(err){
                        if(err){
                            req.flash("error", "Campground not found");
                            return res.redirect("/campgrounds");
                        }
                        req.flash("success", "Campground deleted");
                        res.redirect("/campgrounds");
                    });
                });
            });
        });
    });
});

// function for search feature
function escapeRegex(text){
    return text.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

module.exports = router;