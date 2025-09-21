const mongoose = require("mongoose");

const workoutPlanSchema = new mongoose.Schema(
  {
    planId: { type: String, required: true },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isCustomized: { type: Boolean, default: false },
    days: [
      {
        dayNumber: { type: Number, required: true },
        category: { type: String, required: true },
        exercises: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Workout",
          },
        ],
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("UserWorkoutPlan", workoutPlanSchema);
