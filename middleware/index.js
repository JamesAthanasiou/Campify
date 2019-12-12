var middlewareObj = {};
Campground = require("../models/campground");
Comment = require("../models/comment");

// Check if logged in and are owner of campground
middlewareObj.checkCampgroundOwnership = function (req, res, next){
	if(req.isAuthenticated()){
		Campground.findById(req.params.id, function(err, foundCampground){
			if(err){
				req.flash("error", "Campground not found");
				res.redirect("back");
				console.log(err);
			} else {
				// foundCampground is a mongoose object,
				// must use equals method to compare with other id which is a string
				if(foundCampground.author.id.equals(req.user._id)) {
					next();
				} else {
					req.flash("error", "You don\'t have permission to do that");
					res.redirect("back");
				}	
			}
		});
	} else {
		req.flash("error", "You need to be logged in to do that");
		res.redirect("/login");
	}
}
// Check if campground exists
middlewareObj.checkUserCampground = function(req, res, next){
    Campground.findById(req.params.id, function(err, foundCampground){
      if(err || !foundCampground){
          console.log(err);
          req.flash("error", "That campground does not exist");
          res.redirect('/campgrounds');
      } else if(foundCampground.author.id.equals(req.user._id) || req.user.isAdmin){
          req.campground = foundCampground;
          next();
      } else {
          req.flash("error", "You don\'t have permission to do that!");
          res.redirect("/campgrounds/" + req.params.id);
      }
    });
  }


// Check if comment owner
middlewareObj.checkCommentOwnership = function(req, res, next){
	if(req.isAuthenticated()){
		Comment.findById(req.params.comment_id, function(err, foundComment){
			if(err){
				req.flash("error", "Comment not found");
				res.redirect("back");
				console.log(err);
			} else {
				// foundComment is a mongoose object,
				// must use equals method to compare with other id which is a string
				if(foundComment.author.id.equals(req.user._id)) {
					next();
				} else {
					req.flash("error", "You don\'t have permission to do that");
					res.redirect("back");
				}	
			}
		});
	} else {
		req.flash("error", "You need to be logged in to do that");
		res.redirect("/login");
	}
}

// Check if comment exists
  middlewareObj.checkUserComment = function(req, res, next){
    Comment.findById(req.params.commentId, function(err, foundComment){
       if(err || !foundComment){
           console.log(err);
           req.flash("error", "That comment does not exist");
           res.redirect("/campgrounds");
       } else if(foundComment.author.id.equals(req.user._id) || req.user.isAdmin){
            req.comment = foundComment;
            next();
       } else {
           req.flash("error", "You don\'t have permission to do that");
           res.redirect("/campgrounds/" + req.params.id);
       }
    });
  }

// Check if logged in
middlewareObj.isLoggedIn = function (req, res, next){
	if(req.isAuthenticated()){
		return next();
	}
	req.flash("error", "You must be logged in to do that");
	res.redirect("/login");
}

module.exports = middlewareObj;