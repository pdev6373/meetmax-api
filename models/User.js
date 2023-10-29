const { model, Schema } = require("mongoose");
const { sign } = require("jsonwebtoken");
const { VISIBILITY_OPTIONS } = require("../constants");

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    firstname: {
      type: String,
      required: true,
      trim: true,
    },
    lastname: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      trim: true,
    },
    dateOfBirth: {
      type: Date,
      required: true,
    },
    gender: {
      type: String,
      required: true,
      enum: ["Male", "Female"],
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    bio: {
      type: String,
      trim: true,
      default: "",
      max: 50,
    },
    phoneNumber: {
      type: String,
      trim: true,
      default: "",
    },
    website: {
      type: String,
      trim: true,
      default: "",
      max: 50,
    },
    location: {
      type: String,
      trim: true,
      default: "",
      max: 50,
    },
    socialLinks: {
      facebook: {
        type: String,
        trim: true,
        default: "",
      },
      twitter: {
        type: String,
        trim: true,
        default: "",
      },
      instagram: {
        type: String,
        trim: true,
        default: "",
      },
      linkedin: {
        type: String,
        trim: true,
        default: "",
      },
    },
    profilePicture: {
      type: String,
      default: "",
    },
    coverPicture: {
      type: String,
      default: "",
    },
    followers: {
      type: Array,
      default: [],
    },
    following: {
      type: Array,
      default: [],
    },
    blockedUsers: {
      type: Array,
      default: [],
    },
    postVisibility: {
      type: String,
      enum: Object.keys(VISIBILITY_OPTIONS),
      default: VISIBILITY_OPTIONS.everyone,
    },
    profileVisibility: {
      type: String,
      enum: Object.keys(VISIBILITY_OPTIONS),
      default: VISIBILITY_OPTIONS.everyone,
    },
    canBefollowed: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.methods.generateVerificationToken = function () {
  const verificationToken = sign(
    { id: this._id },
    `${process.env.USER_VERIFICATION_TOKEN_SECRET}`,
    { expiresIn: "5m" }
  );
  return verificationToken;
};

module.exports = model("User", userSchema);
