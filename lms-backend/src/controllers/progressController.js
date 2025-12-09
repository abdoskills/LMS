const User = require("../models/User");

// @desc    Update course progress
// @route   PUT /api/progress
// @access  Private
exports.updateProgress = async (req, res, next) => {
  try {
    const { courseId, progress, completed, lastWatched } = req.body;

    // Validate progress
    if (progress < 0 || progress > 100) {
      return res.status(400).json({
        success: false,
        message: "Progress must be between 0 and 100",
      });
    }

    // Update user's course progress
    const user = await User.findById(req.user._id);
    const courseIndex = user.purchasedCourses.findIndex(
      (pc) => pc.courseId.toString() === courseId
    );

    if (courseIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Course not found in user purchases",
      });
    }

    // Update progress
    user.purchasedCourses[courseIndex].progress = progress;
    user.purchasedCourses[courseIndex].completed = completed || false;
    user.purchasedCourses[courseIndex].lastWatched = lastWatched || new Date();
    // If course marked completed, set completedAt timestamp
    if (completed) {
      user.purchasedCourses[courseIndex].completedAt = new Date();
    }

    await user.save();

    res.status(200).json({
      success: true,
      data: {
        progress,
        completed: user.purchasedCourses[courseIndex].completed,
        lastWatched: user.purchasedCourses[courseIndex].lastWatched,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user progress for all courses
// @route   GET /api/progress
// @access  Private
exports.getProgress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: "purchasedCourses.courseId",
      select: "title thumbnail category totalDuration",
    });

    const progressData = user.purchasedCourses.map((pc) => ({
      courseId: pc.courseId._id,
      title: pc.courseId.title,
      thumbnail: pc.courseId.thumbnail,
      category: pc.courseId.category,
      totalDuration: pc.courseId.totalDuration,
      progress: pc.progress,
      completed: pc.completed,
      lastWatched: pc.lastWatched,
      enrolledAt: pc.enrolledAt,
    }));

    res.status(200).json({
      success: true,
      count: progressData.length,
      data: progressData,
    });
  } catch (error) {
    next(error);
  }
};
