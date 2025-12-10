const Course = require("../models/Course");
const User = require("../models/User");
const Purchase = require("../models/Purchase");
const mongoose = require("mongoose");

// @desc    Get all courses
// @route   GET /api/courses
// @access  Public
exports.getCourses = async (req, res, next) => {
  try {
    let query;

    // Copy req.query
    const reqQuery = { ...req.query };

    // Fields to exclude
    const removeFields = ["select", "sort", "page", "limit"];
    removeFields.forEach((param) => delete reqQuery[param]);

    // Create query string
    let queryStr = JSON.stringify(reqQuery);
    queryStr = queryStr.replace(
      /\b(gt|gte|lt|lte|in)\b/g,
      (match) => `$${match}`
    );

    // Finding resource
    query = Course.find(JSON.parse(queryStr))
      .populate("instructor", "name email")
      .where("isPublished")
      .equals(true);

    // Select fields
    if (req.query.select) {
      const fields = req.query.select.split(",").join(" ");
      query = query.select(fields);
    }

    // Sort
    if (req.query.sort) {
      const sortBy = req.query.sort.split(",").join(" ");
      query = query.sort(sortBy);
    } else {
      query = query.sort("-createdAt");
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Course.countDocuments(JSON.parse(queryStr))
      .where("isPublished")
      .equals(true);

    query = query.skip(startIndex).limit(limit);

    // Executing query
    const courses = await query;

    // Pagination result
    const pagination = {};

    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit,
      };
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit,
      };
    }

    res.status(200).json({
      success: true,
      count: courses.length,
      pagination,
      data: courses,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single course
// @route   GET /api/courses/:id
// @access  Public
exports.getCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id).populate(
      "instructor",
      "name email"
    );

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // Check if user has purchased the course
    let isPurchased = false;
    let userProgress = null;

    if (req.user) {
      const user = await User.findById(req.user._id);
      const purchasedCourse = user.purchasedCourses.find(
        (pc) => pc.courseId.toString() === req.params.id
      );

      if (purchasedCourse) {
        isPurchased = true;
        userProgress = {
          progress: purchasedCourse.progress,
          completed: purchasedCourse.completed,
          lastWatched: purchasedCourse.lastWatched,
          timeSpent: purchasedCourse.timeSpent,
        };
      }
    }

    res.status(200).json({
      success: true,
      data: {
        ...course.toObject(),
        isPurchased,
        userProgress,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new course
// @route   POST /api/courses
// @access  Private (Instructor/Admin)
exports.createCourse = async (req, res, next) => {
  try {
    // Add user to req.body
    req.body.instructor = req.user._id;

    const course = await Course.create(req.body);

    res.status(201).json({
      success: true,
      data: course,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update course
// @route   PUT /api/courses/:id
// @access  Private (Instructor/Admin)
exports.updateCourse = async (req, res, next) => {
  try {
    let course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // Make sure user is course instructor or admin
    if (
      course.instructor.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this course",
      });
    }

    course = await Course.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: course,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete course
// @route   DELETE /api/courses/:id
// @access  Private (Instructor/Admin)
exports.deleteCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // Make sure user is course instructor or admin
    if (
      course.instructor.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this course",
      });
    }

    // Start a session for transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. Delete the course
      await course.deleteOne({ session });

      // 2. Remove course from all users' purchased courses
      await User.updateMany(
        { "purchasedCourses.courseId": req.params.id },
        { $pull: { purchasedCourses: { courseId: req.params.id } } },
        { session }
      );

      // 3. Delete all purchase records for this course
      await Purchase.deleteMany({ courseId: req.params.id }, { session });

      // 4. Delete all reviews for this course
      // Assuming you have a Review model
      // await Review.deleteMany({ courseId: req.params.id }, { session });

      // 5. Delete all enrollments for this course
      // Assuming you have an Enrollment model
      // await Enrollment.deleteMany({ courseId: req.params.id }, { session });

      // Commit the transaction
      await session.commitTransaction();
      session.endSession();

      res.status(200).json({
        success: true,
        data: {},
        message: "Course and all related data deleted successfully",
      });
    } catch (error) {
      // If an error occurred, abort the transaction
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Soft delete course (archive instead of permanent delete)
// @route   DELETE /api/courses/:id/soft
// @access  Private (Instructor/Admin)
exports.softDeleteCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // Make sure user is course instructor or admin
    if (
      course.instructor.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this course",
      });
    }

    // Instead of deleting, mark as deleted (soft delete)
    const deletedCourse = await Course.findByIdAndUpdate(
      req.params.id,
      {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: req.user._id,
        isPublished: false, // Unpublish the course
      },
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      success: true,
      data: deletedCourse,
      message: "Course archived successfully",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Restore soft deleted course
// @route   PUT /api/courses/:id/restore
// @access  Private (Instructor/Admin)
exports.restoreCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // Make sure user is course instructor or admin
    if (
      course.instructor.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to restore this course",
      });
    }

    const restoredCourse = await Course.findByIdAndUpdate(
      req.params.id,
      {
        isDeleted: false,
        deletedAt: null,
        deletedBy: null,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      success: true,
      data: restoredCourse,
      message: "Course restored successfully",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Force delete course (permanent delete - Admin only)
// @route   DELETE /api/courses/:id/force
// @access  Private (Admin only)
exports.forceDeleteCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // Only admin can force delete
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admin can force delete courses",
      });
    }

    // Start a session for transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Permanent deletion of all related data
      await course.deleteOne({ session });

      await User.updateMany(
        { "purchasedCourses.courseId": req.params.id },
        { $pull: { purchasedCourses: { courseId: req.params.id } } },
        { session }
      );

      await Purchase.deleteMany({ courseId: req.params.id }, { session });

      // Delete other related data if exists
      // await Review.deleteMany({ courseId: req.params.id }, { session });
      // await Enrollment.deleteMany({ courseId: req.params.id }, { session });
      // await Lesson.deleteMany({ courseId: req.params.id }, { session });

      await session.commitTransaction();
      session.endSession();

      res.status(200).json({
        success: true,
        data: {},
        message: "Course permanently deleted with all related data",
      });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Purchase course
// @route   POST /api/courses/:id/purchase
// @access  Private
exports.purchaseCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // Check if course is deleted
    if (course.isDeleted) {
      return res.status(400).json({
        success: false,
        message: "This course is no longer available",
      });
    }

    // Check if already purchased
    const user = await User.findById(req.user._id);
    const alreadyPurchased = user.purchasedCourses.some(
      (pc) => pc.courseId.toString() === req.params.id
    );

    if (alreadyPurchased) {
      // Idempotent response: if the user already purchased/enrolled, return success
      return res.status(200).json({
        success: true,
        message: "Course already purchased",
      });
    }

    // Create purchase record
    const purchase = await Purchase.create({
      userId: req.user._id,
      courseId: req.params.id,
      amount: course.price,
      paymentMethod: req.body.paymentMethod || "stripe",
      paymentStatus: "completed",
    });

    // Add course to user's purchased courses
    await User.findByIdAndUpdate(req.user._id, {
      $push: {
        purchasedCourses: {
          courseId: req.params.id,
          enrolledAt: new Date(),
          progress: 0,
        },
      },
    });

    // Fetch updated user to return useful data to client (so frontend can refresh easily)
    const updatedUser = await User.findById(req.user._id).select("-password");

    // Increment total students
    await Course.findByIdAndUpdate(req.params.id, {
      $inc: { totalStudents: 1 },
    });

    res.status(200).json({
      success: true,
      data: purchase,
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get deleted courses (Admin only)
// @route   GET /api/courses/deleted
// @access  Private (Admin only)
exports.getDeletedCourses = async (req, res, next) => {
  try {
    // Only admin can view deleted courses
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admin can view deleted courses",
      });
    }

    const courses = await Course.find({ isDeleted: true })
      .populate("instructor", "name email")
      .populate("deletedBy", "name email")
      .sort("-deletedAt");

    res.status(200).json({
      success: true,
      count: courses.length,
      data: courses,
    });
  } catch (error) {
    next(error);
  }
};
