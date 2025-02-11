const express = require("express");
const Job = require("./models/Job");
require("express-async-errors");
const app = express();

app.set("view engine", "ejs");
app.use(require("body-parser").urlencoded({ extended: true }));

require("dotenv").config();
const session = require("express-session");   
const MongoDBStore = require("connect-mongodb-session")(session);
const csurf = require("csurf"); // CSRF protection
const cookieParser = require("cookie-parser"); // Required for CSRF middleware

const url = process.env.MONGO_URI;
const store = new MongoDBStore({
  uri: url,
  collection: "mySessions",
});
store.on("error", function (error) {
  console.log(error);
});

const sessionParms = {
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  store: store,
  cookie: { secure: false, sameSite: "strict" },
};

if (app.get("env") === "production") {
  app.set("trust proxy", 1);
  sessionParms.cookie.secure = true;
}

app.use(cookieParser()); // Must be before CSRF middleware
app.use(session(sessionParms));

const passport = require("passport");
const passportInit = require("./passport/passportInit");
passportInit();
app.use(passport.initialize());
app.use(passport.session());

app.use(require("connect-flash")());
app.use(require("./middleware/storeLocals"));

//  CSRF Protection Middleware (Must be after session and body-parser)
app.use(csurf());

//  Middleware to pass CSRF token to views
app.use((req, res, next) => {
  res.locals._csrf = req.csrfToken();  // Make sure CSRF token is available in views
  next();
});

// Jobs - Add New Job Page
app.get("/jobs/new", (req, res) => {
  res.render("job", { job: null, _csrf: req.csrfToken() }); // Explicitly pass job as null
});

app.get("/jobs/:id/edit", async (req, res) => {
  const job = await Job.findById(req.params.id);  // Find the job by ID
  if (!job) {
    return res.status(404).send("Job not found");  // Handle case when job is not found
  }
  res.render("job", { job, _csrf: req.csrfToken() });  // Pass job object for editing
});

app.get("/", (req, res) => {
  res.render("index");
});

//  Job Routes
const auth = require("./middleware/auth");
const jobRouter = require("./routes/jobs");  // Import job routes
app.use("/jobs", auth, jobRouter);  // Add job routes to the app and ensure auth middleware is applied

// Other routes
app.use("/sessions", require("./routes/sessionRoutes"));
const secretWordRouter = require("./routes/secretWord");
app.use("/secretWord", auth, secretWordRouter);

// Error handling middleware
app.use((req, res) => {
  res.status(404).send(`That page (${req.url}) was not found.`);
});

app.use((err, req, res, next) => {
  res.status(500).send(err.message);
  console.log(err);
});

const port = process.env.PORT || 3000;

const start = async () => {
  try {
    await require("./db/connect")(process.env.MONGO_URI);
    app.listen(port, () =>
      console.log(`Server is listening on port ${port}...`)
    );
  } catch (error) {
    console.log(error);
  }
};

start();
