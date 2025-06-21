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
const cors = require("cors");

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Importing routes
app.use("/admin/meal", adminMealRoutes);
app.use("/admin/supplement", adminSupplementRoutes);
app.use("/admin/workout", adminworkoutRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/meal", mealRoutes);
app.use("/api/workout", workoutRoutes);
app.use("/api/supplement", supplementRoutes);

app.get("/", (req, res) => {
  res.send("Welcome to Fitness App!");
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
