const User = require("../models/User");
const Course = require("../models/Course");
const RecentActivity = require("../models/RecentActivity");

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .select("-password")
      .populate({
        path: "purchasedCourses.courseId",
        select: "title thumbnail category description totalDuration",
      });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Calculate stats
    const enrolledCourses = user.purchasedCourses.length;
    const completedCourses = user.purchasedCourses.filter(
      (pc) => pc.completed
    ).length;
    const totalLearningTime = user.purchasedCourses.reduce((total, pc) => {
      return total + (pc.progress * (pc.courseId?.totalDuration || 0)) / 100;
    }, 0);

    // Format purchased courses for frontend
    const courses = user.purchasedCourses.map((pc) => ({
      _id: pc.courseId?._id,
      title: pc.courseId?.title || "Course not found",
      category: pc.courseId?.category || "Unknown",
      progress: pc.progress,
      lastAccessed: pc.lastWatched || pc.enrolledAt,
      thumbnail: pc.courseId?.thumbnail,
    }));

    const profileData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      bio: user.bio,
      location: user.location,
      website: user.website,
      socialLinks: user.socialLinks,
      role: user.role,
      enrolledCourses,
      completedCourses,
      totalLearningTime: Math.round(totalLearningTime),
      skills: user.skills || [],
      createdAt: user.createdAt,
      courses,
    };

    res.status(200).json({
      success: true,
      data: profileData,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const fieldsToUpdate = {
      name: req.body.name,
      bio: req.body.bio,
      location: req.body.location,
      website: req.body.website,
      skills: req.body.skills,
      socialLinks: req.body.socialLinks,
    };

    // Remove undefined fields
    Object.keys(fieldsToUpdate).forEach((key) => {
      if (fieldsToUpdate[key] === undefined) {
        delete fieldsToUpdate[key];
      }
    });

    const user = await User.findByIdAndUpdate(req.user._id, fieldsToUpdate, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload avatar
// @route   POST /api/users/avatar
// @access  Private
exports.uploadAvatar = async (req, res, next) => {
  try {
    // This would typically handle file upload to cloud storage
    // For now, we'll assume the avatar URL is provided in the request
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: req.body.avatar },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user certificates
// @route   GET /api/users/certificates
// @access  Private
exports.getCertificates = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: "purchasedCourses.courseId",
      select: "title",
    });

    const certificates = user.purchasedCourses
      .filter((pc) => pc.completed)
      .map((pc, index) => ({
        _id: pc._id,
        courseId: pc.courseId?._id,
        courseTitle: pc.courseId?.title || "Course not found",
        issueDate: pc.completedAt || pc.enrolledAt,
        certificateId: `CERT-${user._id.toString().slice(-6).toUpperCase()}-${(
          index + 1
        )
          .toString()
          .padStart(3, "0")}`,
        downloadUrl: "#", // This would be a real URL in production
      }));

    res.status(200).json({
      success: true,
      data: certificates,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Change user password
// @route   PUT /api/users/change-password
// @access  Private
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await User.findById(req.user._id).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check current password
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Change user email
// @route   PUT /api/users/change-email
// @access  Private
exports.changeEmail = async (req, res, next) => {
  try {
    const { newEmail, password } = req.body;

    // Get user with password
    const user = await User.findById(req.user._id).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Password is incorrect",
      });
    }

    // Check if email is already taken
    const existingUser = await User.findOne({ email: newEmail });
    if (
      existingUser &&
      existingUser._id.toString() !== req.user._id.toString()
    ) {
      return res.status(400).json({
        success: false,
        message: "Email is already in use",
      });
    }

    // Update email
    user.email = newEmail;
    user.isEmailVerified = false; // Require re-verification
    await user.save();

    res.status(200).json({
      success: true,
      message:
        "Email changed successfully. Please check your new email for verification.",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user learning stats
// @route   GET /api/users/stats
// @access  Private
exports.getUserStats = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: "purchasedCourses.courseId",
      select: "totalDuration",
    });

    const enrolledCourses = user.purchasedCourses.length;
    const completedCourses = user.purchasedCourses.filter(
      (pc) => pc.completed
    ).length;
    const totalLearningTime = user.purchasedCourses.reduce((total, pc) => {
      return total + (pc.progress * (pc.courseId?.totalDuration || 0)) / 100;
    }, 0);

    const averageRating = 4.8; // This could be calculated from course ratings

    res.status(200).json({
      success: true,
      data: {
        enrolledCourses,
        completedCourses,
        totalLearningTime: Math.round(totalLearningTime),
        averageRating,
        completionRate:
          enrolledCourses > 0
            ? Math.round((completedCourses / enrolledCourses) * 100)
            : 0,
      },
    });
  } catch (error) {
    next(error);
  }
};
