const { hash } = require("bcrypt");
const isEmail = require("validator/lib/isEmail");
const isDate = require("validator/lib/isDate");
const normalizeEmail = require("validator/lib/normalizeEmail");
const User = require("../models/User");

const getAllUsers = async (req, res) => {
  const users = await User.find().select("-password").lean();

  if (!users?.length)
    return res.status(400).json({
      success: false,
      message: "No user(s) found",
    });

  return res.json({
    success: true,
    message: "Users retrieved",
    data: users,
  });
};

const updateUser = async (req, res) => {
  const { id, email, firstname, lastname, password, dateOfBirth, gender } =
    req.body;

  // <== VALIDATE USER ENTRIES ==>
  const isInvalid = [id, email, firstname, lastname, dateOfBirth, gender].some(
    (entry) => !entry
  );

  if (isInvalid)
    return res
      .status(400)
      .json({ success: false, message: "All fields are required" });

  if (password && password.length < 8) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 8 characters",
    });
  }

  if (!isEmail(email))
    return res
      .status(400)
      .json({ success: false, message: "Invalid email address" });

  if (!isDate(dateOfBirth))
    return res.status(400).json({
      success: false,
      message: "Invalid date of birth",
    });

  const userGender = gender.toLowerCase().trim();
  if (userGender !== "male" && userGender !== "female")
    return res
      .status(400)
      .json({ success: false, message: "Invalid gender provided" });

  const user = User.findById(id).exec();

  if (!user)
    return res
      .status(400)
      .json({ success: false, message: "User does not exist" });

  if (!user.isVerified)
    return res
      .status(400)
      .json({ success: false, message: "User is not verified" });

  const duplicate = await User.findOne({ email }).lean().exec();

  if (duplicate && duplicate._id.toString() !== id)
    return res
      .status(400)
      .json({ success: false, message: "Email already taken" });

  const oldData = {
    email: user.email,
    firstname: user.firstname,
    lastname: user.lastname,
  };

  user.email = normalizeEmail(email); // Verify email first oo
  user.firstname = firstname;
  user.lastname = lastname;
  user.dateOfBirth = dateOfBirth;
  user.gender = gender;

  if (password) user.password = await hash(password, Number(process.env.SALT));

  const updatedUser = await user.save();
  res.json({
    success: true,
    message: `User ${oldData.lastname} ${oldData.firstname} with email: ${oldData.email} updated to: User ${updatedUser.lastname} ${updatedUser.firstname} with email: ${updatedUser.email}`,
  });
};

const deleteUser = async (req, res) => {
  const { id } = req.body;

  if (!id)
    return res
      .status(400)
      .json({ success: false, message: "User ID required" });

  const user = User.findById(id).exec();
  if (!user)
    return res
      .status(400)
      .json({ success: false, message: "User does not exist" });

  const deletedUser = await user.deleteOne();

  return res.json({
    success: true,
    message: `User ${deletedUser.lastname} ${deletedUser.firstname} with email: ${deletedUser.email} deleted`,
  });
};

module.exports = {
  getAllUsers,
  updateUser,
  deleteUser,
};
