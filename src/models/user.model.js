const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  fullname: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  phoneNumber: {
    type: String,
    required: false,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  age: { type: Number },
  gender: {
    type: String,
    enum: ["male", "female", "other"],
    ddefault: "other",
  },
  weight: { type: Number },
  currentWeight: { type: Number },
  height: { type: Number },
  mealType: { type: String },
  activityLevel: {
    type: String,
  },
  goal: { type: String, enum: ["build muscle mass", "lose weight", "bulk up"] },
  workoutDays: { type: String },
  profilePicture: { type: String, default: "" },
  profileComplete: { type: Boolean, default: false },
  stripeCustomerId: { type: String, default: null },
  mealGenerated: { type: Boolean, default: false },
  resetPasswordOTP: { type: String },
  resetPasswordExpires: { type: Date },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null },
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.pre(/^find/, function (next) {
  this.where({ isDeleted: false });
  next();
});

userSchema.methods.softDelete = async function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  await this.save();
};

userSchema.methods.restore = async function () {
  this.isDeleted = false;
  this.deletedAt = null;
  await this.save();
};

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model("User", userSchema);

module.exports = User;
