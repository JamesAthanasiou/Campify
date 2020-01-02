var mongoose = require("mongoose");
var Comment = require('./comment');

// Schema Setup
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
	comments: [
		{ 
			type: mongoose.Schema.Types.ObjectId,
			ref: "Comment"
		}
	],
	price: {
        type: Number,
    }
});

module.exports =  mongoose.model("Campground", campgroundSchema);