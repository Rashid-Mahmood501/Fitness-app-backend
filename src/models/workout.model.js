const mongoose = require("mongoose");

const workoutSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    muscleGroup: { type: String, required: true },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: "Workout", default: null },
    setType: { type: String, required: true },
    reps: { type: String, required: true },
    equipments: [{ type: String }],
    comments: { type: String },
    suggestion: { type: String },
    video: { type: String },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Workout", workoutSchema);
