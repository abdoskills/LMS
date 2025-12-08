const mongoose = require("mongoose");

const recentActivitySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    actionType: {
      type: String,
      required: true,
      enum: [
        "course_enrolled",
        "course_completed",
        "certificate_earned",
        "profile_updated",
        "comment_posted",
        "login",
      ],
    },
    description: {
      type: String,
      required: true,
    },
    relatedId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "relatedModel",
    },
    relatedModel: {
      type: String,
      enum: ["Course", "User"],
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("RecentActivity", recentActivitySchema);
