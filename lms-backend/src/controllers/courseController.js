const Course = require('../models/Course');
const User = require('../models/User');
const Purchase = require('../models/Purchase');

// @desc    Get all courses
// @route   GET /api/courses
// @access  Public
exports.getCourses = async (req, res, next) => {
  try {
    let query;

    // Copy req.query
    const reqQuery = { ...req.query };

    // Fields to exclude
    const removeFields = ['select', 'sort', 'page', 'limit'];
    removeFields.forEach(param => delete reqQuery[param]);

    // Create query string
    let queryStr = JSON.stringify(reqQuery);
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

    // Finding resource
    query = Course.find(JSON.parse(queryStr)).populate('instructor', 'name email').where('isPublished').equals(true);

    // Select fields
    if (req.query.select) {
      const fields = req.query.select.split(',').join(' ');
      query = query.select(fields);
    }

    // Sort
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt');
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Course.countDocuments(JSON.parse(queryStr)).where('isPublished').equals(true);

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
    const course = await Course.findById(req.params.id).populate('instructor', 'name email');

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    // Check if user has purchased the course
    let isPurchased = false;
    let userProgress = null;

    if (req.user) {
      const user = await User.findById(req.user._id);
      const purchasedCourse = user.purchasedCourses.find(
        pc => pc.courseId.toString() === req.params.id
      );
      
      if (purchasedCourse) {
        isPurchased = true;
        userProgress = {
          progress: purchasedCourse.progress,
          completed: purchasedCourse.completed,
          lastWatched: purchasedCourse.lastWatched,
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
        message: 'Course not found',
      });
    }

    // Make sure user is course instructor or admin
    if (course.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this course',
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
        message: 'Course not found',
      });
    }

    // Make sure user is course instructor or admin
    if (course.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this course',
      });
    }

    await course.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
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
        message: 'Course not found',
      });
    }

    // Check if already purchased
    const user = await User.findById(req.user._id);
    const alreadyPurchased = user.purchasedCourses.some(
      pc => pc.courseId.toString() === req.params.id
    );

    if (alreadyPurchased) {
      return res.status(400).json({
        success: false,
        message: 'Course already purchased',
      });
    }

    // Create purchase record
    const purchase = await Purchase.create({
      userId: req.user._id,
      courseId: req.params.id,
      amount: course.price,
      paymentMethod: req.body.paymentMethod || 'stripe',
      paymentStatus: 'completed',
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

    // Increment total students
    await Course.findByIdAndUpdate(req.params.id, {
      $inc: { totalStudents: 1 },
    });

    res.status(200).json({
      success: true,
      data: purchase,
    });
  } catch (error) {
    next(error);
  }
};