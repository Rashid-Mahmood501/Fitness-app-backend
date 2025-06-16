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
            profilePicture,
            profileComplete
        } = req.body;

        const isProfileComplete = typeof profileComplete === 'boolean'
            ? profileComplete
            : !!(age && gender && weight && height && activityLevel && goal && workoutDays);

        const updatedUser = await User.findByIdAndUpdate(
            req.userId,
            {
                age,
                gender,
                weight,
                height,
                activityLevel,
                goal,
                workoutDays,
                profilePicture,
                profileComplete: isProfileComplete
            },
            { new: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.json({ message: 'Profile updated successfully', profileComplete: isProfileComplete });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = { getProfile, updateProfile };
