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
	User           = require("./models/user");
	//seedDB        = require("./seeds"); // no longer used 
	
// Include routes which have been moved to other files
var commentRoutes    = require("./routes/comments"),
	campgroundRoutes  = require("./routes/campgrounds"),
	indexRoutes       = require("./routes/index");

// To fix deprication warnings for mongoose/mongo
mongoose.set("useNewUrlParser", true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);

mongoose.connect(process.env.DATABASEURL || "mongodb://localhost/campify");
//"mongodb://localhost/campify" will be used in the future during development.
// Right now the app isn't remotely done so only using one db right now.

// To parse data from JSON files
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public")); // double check why this isn't just public
app.use(methodOverride("_method"));
app.use(flash());
// This is to create data within the db originally
//seedDB();

// Passport Configuration
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


// Allow current user info from db to be accessed on webpages
app.use(function(req, res, next){
	res.locals.currentUser = req.user;
	// error or success is in header template. If there is no req.flash, then no message is rendered
	// error/success are not bootstrap names, can be whatever
	res.locals.error = req.flash("error");
	res.locals.success = req.flash("success");
	next();
});

// Shortening routes
app.use("/", indexRoutes); // "/" not required, just done to match pattern
app.use("/campgrounds", campgroundRoutes);
app.use("/campgrounds/:id/comments", commentRoutes);

// Configure server

var port = process.env.PORT || 3000;
app.listen(port, function () {
  console.log("Server Has Started!");
});


