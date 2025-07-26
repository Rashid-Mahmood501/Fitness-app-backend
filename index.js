require("dotenv").config();
const express = require("express");
const connectDB = require("./src/config/database");
const authRoutes = require("./src/routes/auth.routes");
const userRoutes = require("./src/routes/user.routes");
const mealRoutes = require("./src/routes/meal.routes");
const workoutRoutes = require("./src/routes/workout.routes");
const supplementRoutes = require("./src/routes/supplement.routes");
const adminMealRoutes = require("./src/routes/adminMeal.routes");
const adminSupplementRoutes = require("./src/routes/adminSupplement.routes");
const adminworkoutRoutes = require("./src/routes/adminWorkout.routes");
const adminWorkoutCategoryRoutes = require("./src/routes/adminWorkoutCategory.routes");
const adminWorkoutPlanRoutes = require("./src/routes/adminWorkoutPlan.routes");
const adminMeetingRoutes = require("./src/routes/adminMeeting.routes");
const bookingRoutes = require("./src/routes/booking.routes");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 3005;

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (origin.startsWith("http://localhost:")) {
      return callback(null, true);
    }
    if (origin.startsWith("https://deepskyblue-zebra-292697.hostingersite.com")) {
      return callback(null, true);
    }
    if (origin === "https://admin-fitness-app.onrender.com") {
      return callback(null, true);
    }

    if (process.env.NODE_ENV !== "production") {
      return callback(null, true);
    }

    callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "x-auth-token",
    "Origin",
    "Accept",
    "X-Requested-With",
  ],
  credentials: true,
  optionsSuccessStatus: 200,
  preflightContinue: false,
};

app.use(cors(corsOptions));

app.options("*", cors(corsOptions));

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS, PATCH"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization, x-auth-token"
  );
  res.header("Access-Control-Allow-Credentials", true);

  if (req.method === "OPTIONS") {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/admin/meal", adminMealRoutes);
app.use("/admin/supplement", adminSupplementRoutes);
app.use("/admin/workout", adminworkoutRoutes);
app.use("/admin/workout-category", adminWorkoutCategoryRoutes);
app.use("/admin/workout-plan", adminWorkoutPlanRoutes);
app.use("/admin/meeting", adminMeetingRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/meal", mealRoutes);
app.use("/api/workout", workoutRoutes);
app.use("/api/supplement", supplementRoutes);
app.use("/api/booking", bookingRoutes);

app.get("/", (req, res) => {
  res.send("Welcome to Fitness App!!!!!");
});

connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch((err) => {
    console.log("Error connecting to MongoDB", err);
  });
