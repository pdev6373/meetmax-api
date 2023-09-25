const { model, Schema } = require("mongoose");
const { sign } = require("jsonwebtoken");

const userSchema = new Schema({
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
    enum: ["male", "female"],
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
});

userSchema.methods.generateVerificationToken = function () {
  const verificationToken = sign(
    { id: this._id },
    `${process.env.USER_VERIFICATION_TOKEN_SECRET}`,
    { expiresIn: "5m" }
  );
  return verificationToken;
};

module.exports = model("User", userSchema);
