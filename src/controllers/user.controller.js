const User = require("../models/user.model");

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const updateProfile = async (req, res) => {
  try {
    const {
      age,
      gender,
      weight,
      height,
      activityLevel,
      goal,
      workoutDays,
      profileComplete,
      mealType,
    } = req.body;

    const updateData = {};

    if (age !== undefined) updateData.age = age;
    if (gender !== undefined) updateData.gender = gender;
    if (weight !== undefined) {
      updateData.weight = weight;
      updateData.currentWeight = weight;
    }
    if (height !== undefined) updateData.height = height;
    if (activityLevel !== undefined) updateData.activityLevel = activityLevel;
    if (goal !== undefined) updateData.goal = goal;
    if (workoutDays !== undefined) updateData.workoutDays = workoutDays;
    if (mealType !== undefined) updateData.mealType = mealType;

    // Determine profile completion status
    const isProfileComplete =
      typeof profileComplete === "boolean"
        ? profileComplete
        : !!(
            age &&
            gender &&
            weight &&
            height &&
            activityLevel &&
            goal &&
            workoutDays &&
            mealType
          );

    updateData.profileComplete = isProfileComplete;

    const updatedUser = await User.findByIdAndUpdate(req.userId, updateData, {
      new: true,
    }).select("-password");

    if (!updatedUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      message: "Profile updated successfully",
      profileComplete: isProfileComplete,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const updateCurrentWeight = async (req, res) => {
  try {
    const { currentWeight } = req.body;
    if (typeof currentWeight !== "number" || currentWeight <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid weight value" });
    }
    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      { currentWeight },
      { new: true }
    ).select("-password");
    if (!updatedUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    res.json({
      message: "Current weight updated successfully",
      data: updatedUser.currentWeight,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const updateFullName = async (req, res) => {
  try {
    const { fullname } = req.body;

    // Validate fullname
    if (
      !fullname ||
      typeof fullname !== "string" ||
      fullname.trim().length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Full name is required and cannot be empty",
      });
    }

    const trimmedFullname = fullname.trim();

    // Check if fullname is at least 2 characters long
    if (trimmedFullname.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Full name must be at least 2 characters long",
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      { fullname: trimmedFullname },
      { new: true }
    ).select("-password");

    if (!updatedUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      message: "Full name updated successfully",
      data: {
        fullname: updatedUser.fullname,
      },
    });
  } catch (error) {
    console.error("Error updating full name:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const uploadProfileImage = async (req, res) => {
  try {
    const profileImage = req.file?.path;
    console.log("Request body:", req.body);
    console.log("Profile image URL:", profileImage);

    const userId = req.userId;

    // Use findByIdAndUpdate instead of save()
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profilePicture: profileImage },
      { new: true } // Return the updated document
    );

    console.log("Updated user:", updatedUser);

    if (!updatedUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      message: "Profile image uploaded successfully",
      data: {
        profilePicture: updatedUser.profilePicture,
      },
    });
  } catch (error) {
    console.error("Backend error occurred:", error);
    console.error("Error message:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

const deleteAccount = async (req, res) => {
  try {
    const userId = req.userId;

    const deletedUser = await User.findByIdAndUpdate(
      userId,
      { isDeleted: true, deletedAt: new Date() },
      { new: true }
    );

    if (!deletedUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting account:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  updateCurrentWeight,
  updateFullName,
  uploadProfileImage,
  deleteAccount,
};
