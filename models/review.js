var mongoose = require("mongoose");

var reviewSchema = new mongoose.Schema({
    rating: {
        type: Number,
        required: "Please provide a rating from 1 to 5",
        min: 1,
        max: 5,
        validate: {
            validator: Number.isInteger,
            message: "{VALUE} is not an integer"
        }
    },
    text: {
        type: String
    },
    author: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String
    },
    // Different from comments, since comments do not hold which campground they belong to.
    // Comments are added to an array of comments for each campground only.
    campground: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Campground"
    }
}, {
    // Again, this is different from comments. Comments has a created at field, not a timestamp.
    // Unclear on what the difference is.
    timestamps: true
});

module.exports = mongoose.model("Review", reviewSchema);