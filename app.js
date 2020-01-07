// used for environment variables in local development
require("dotenv").config();

var express        = require("express"),
	app            = express(),
	bodyParser     = require("body-parser"), 
	mongoose       = require("mongoose"),
	flash          = require("connect-flash"),
	passport       = require("passport"),
	LocalStrategy  = require("passport-local"),
	methodOverride = require("method-override"),
	Campground     = require("./models/campground"),
    Comment        = require("./models/comment"),
    Review         = require("./models/review"),
    User           = require("./models/user");
    
// Requiring routes
var campgroundRoutes  = require("./routes/campgrounds"),
    commentRoutes     = require("./routes/comments"),
    indexRoutes       = require("./routes/index"),
    reviewRoutes      = require("./routes/reviews"),
    userRoutes        = require("./routes/users");
    

// Connect to DB
// To fix deprication warnings for mongoose due to changes in MongoDB
mongoose.set("useNewUrlParser", true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);
mongoose.connect(process.env.DATABASEURL || "mongodb://localhost/campify");

// Helpful stuff
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public")); // double check why this isn't just public
app.use(methodOverride("_method"));
app.use(flash());
app.locals.moment = require("moment");

// Passport configuration
app.use(require("express-session")({
	secret: "Here is another sentence that has been secretized",
	resave: false,
	saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next){
	res.locals.currentUser = req.user;
	res.locals.error = req.flash("error");
	res.locals.success = req.flash("success");
	next();
});

// Shortening routes
app.use("/", indexRoutes); // "/" not required, just done to match pattern
app.use("/campgrounds", campgroundRoutes);
app.use("/campgrounds/:id/comments", commentRoutes);
app.use("/users", userRoutes);
app.use("/campgrounds/:id/reviews", reviewRoutes);

// Configure server
var port = process.env.PORT || 3000;
app.listen(port, function () {
  console.log("Server Has Started!");
});


