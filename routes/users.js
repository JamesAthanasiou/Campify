var express = require("express");
var router = express.Router();
var User = require("../models/user");
var Campground = require("../models/campground");
var Review = require("../models/review");
var middleware = require("../middleware/index");

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
router.put("/:id", middleware.checkProfileOwnership, upload.single("avatar"), function (req, res){
    User.findById(req.params.id, function(err, user){
        if(err){
            req.flash("error", err.message);
            return res.redirect("back");
        }
        if (req.file){
            // case where user uploads an new avatar image
            if(user.avatarId){
                // if the user previously uploaded an image and is not using the default id, delete image from cloud
                cloudinary.v2.uploader.destroy(user.avatarId), function(err){
                    if(err){
                        req.flash("error", err.message);
                        return res.redirect("back");
                    }
                }
            }
            // add new image to cloud and replace in db
            cloudinary.v2.uploader.upload(req.file.path, function(err, result){
                if(err){
                    req.flash("error", err.message);
                    return res.redirect("back");
                }
                user.avatarId = result.public_id;
                user.avatar = result.secure_url;
                user.email = req.body.user.email;
                user.description = req.body.user.description;
                user.save(function(err){
                    if(err){
                        req.flash("error", "Failed to update profile");
                        return res.redirect("/users/" + req.params.id);
                    }
                });
                req.flash("success","Successfully updated!");
                res.redirect("/users/" + req.params.id);
            });
        // if no image uploaded, only update other values in campground
        } else {
            user.email = req.body.user.email;
            user.description = req.body.user.description;
            user.save(function(err){
                if(err){
                    req.flash("error", "Failed to update profile");
                    return res.redirect("/users/" + req.params.id)
                }
                req.flash("success","Successfully updated!");
                res.redirect("/users/" + req.params.id)
            });
        }
    });
});

module.exports = router;