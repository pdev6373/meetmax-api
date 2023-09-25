const { Schema } = require("mongoose");

const profileSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    bio: { type: String, required: true },

    profilePicUrl: {
      type: String,
      required: true,
    },

    birthdate: {
      type: Date,
      required: true,
    },

    profession: {
      type: String,
      required: true,
    },

    profileCompletion: {
      type: Number,
      default: 50,
      min: 0,
      max: 100,
    },

    credits: {
      type: Number,
      default: 2,
      min: 0,
    },

    lastLogin: {
      type: Date,
      default: new Date(),
      required: true,
    },
  },
  { timestamps: true }
);
