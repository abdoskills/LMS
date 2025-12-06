const mongoose = require("mongoose");

const lessonSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: String,
  videoUrl: {
    type: String,
    required: true,
  },
  duration: {
    type: Number,
    required: true,
  },
  order: {
    type: Number,
    required: true,
  },
  isPreview: {
    type: Boolean,
    default: false,
  },
});

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Please provide a course title"],
    maxlength: [100, "Title cannot be more than 100 characters"],
  },
  description: {
    type: String,
    required: [true, "Please provide a description"],
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  price: {
    type: Number,
    required: true,
    min: [0, "Price cannot be negative"],
  },
  category: {
    type: String,
    required: true,
  },
  thumbnail: {
    type: String,
    required: true,
  },
  whatYouWillLearn: [
    {
      type: String,
    },
  ],
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  totalStudents: {
    type: Number,
    default: 0,
  },
  lessons: [lessonSchema],
  totalDuration: {
    type: Number,
    default: 0,
  },
  isPublished: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Calculate total duration before saving
courseSchema.pre("save", function (next) {
  try {
    this.totalDuration = this.lessons.reduce(
      (total, lesson) => total + lesson.duration,
      0
    );
    this.updatedAt = new Date();
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model("Course", courseSchema);
