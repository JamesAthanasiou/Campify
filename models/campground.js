var mongoose = require("mongoose");
var Comment = require("./comment");
var Review = require ("./review");

var campgroundSchema = new mongoose.Schema({
	name: String,
    image: String,
    imageId: String,
    description: String,
    location: String,
    lat: Number,
    lng: Number,
    createdAt: {
        type: Date,
        default: Date.now
    },
	author: {
		id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User"
		},
		username: String
    },
    price: {
        type: Number,
    },
	comments: [
		{ 
			type: mongoose.Schema.Types.ObjectId,
			ref: "Comment"
		}
    ],
    reviews: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Review"
        }
    ],
    rating: {
        type: Number,
        default: 0
    },
    isClaimed: {
        type: Boolean,
        default: false
    }
});

module.exports =  mongoose.model("Campground", campgroundSchema);