const { hash, compare } = require("bcryptjs");
const isEmail = require("validator/lib/isEmail");
const isDate = require("validator/lib/isDate");
const normalizeEmail = require("validator/lib/normalizeEmail");
const User = require("../models/User");

// ⚡️ @Description -> Get all users
// ⚡️ @Route -> api/user/all-users (GET)
// ⚡️ @Access -> Private
const getAllUsers = async (req, res) => {
  const users = await User.find().select("-password").lean();

  return res.json({
    success: true,
    message: "Users retrieved",
    data: users,
  });
};

// ⚡️ @Description -> Get some users
// ⚡️ @Route -> api/user/some-users (GET)
// ⚡️ @Access -> Private
const getSomeUsers = async (req, res) => {
  const { ids } = req.params;

  if (!ids.length)
    return res.status(400).json({
      success: false,
      message: "Invalid ids received",
    });

  const userIds = ids.split(",");
  if (!userIds.length || !Array.isArray(userIds))
    return res.status(400).json({
      success: false,
      message: "Invalid ids received",
    });

  const users = await User.find({
    _id: {
      $in: userIds,
    },
  })
    .select("-password")
    .lean();

  return res.json({
    success: true,
    message: "Users retrieved",
    data: users,
  });
};

// ⚡️ @Description -> Get a user
// ⚡️ @Route -> api/user/:id (GET)
// ⚡️ @Access -> Private
const getUser = async (req, res) => {
  const { id } = req.params;

  if (!id)
    return res
      .status(400)
      .json({ success: false, message: "Account ID required" });

  const user = await User.findOne({ _id: id }).select("-password").lean();
  if (!user)
    return res.status(400).json({
      success: false,
      message: "Account not found",
    });

  return res.json({
    success: true,
    message: "Account retrieved",
    data: user,
  });
};

// ⚡️ @Description -> Get followers
// ⚡️ @Route -> api/user/followers/:id (GET)
// ⚡️ @Access -> Private
const getFollowers = async (req, res) => {
  const { id } = req.params;

  if (!id)
    return res
      .status(400)
      .json({ success: false, message: "Account ID required" });

  const user = await User.findById(id).exec();
  if (!user)
    return res.status(400).json({
      success: false,
      message: "User not found",
    });

  const followers = await User.find({
    _id: {
      $in: user.followers,
    },
  });

  return res.json({
    success: true,
    message: "Followers retrieved",
    data: followers,
  });
};

// ⚡️ @Description -> Get following
// ⚡️ @Route -> api/user/following/:id (GET)
// ⚡️ @Access -> Private
const getFollowing = async (req, res) => {
  const { id } = req.params;

  if (!id)
    return res
      .status(400)
      .json({ success: false, message: "Account ID required" });

  const user = await User.findById(id).exec();
  if (!user)
    return res.status(400).json({
      success: false,
      message: "User not found",
    });

  const following = await User.find({
    _id: {
      $in: user.following,
    },
  });

  return res.json({
    success: true,
    message: "Following retrieved",
    data: following,
  });
};

// ⚡️ @Description -> Get recommended users
// ⚡️ @Route -> api/user/recommended/:id (GET)
// ⚡️ @Access -> Private
const getRecommendedUsers = async (req, res) => {
  const { id } = req.params;

  if (!id)
    return res
      .status(400)
      .json({ success: false, message: "Account ID required" });

  const user = await User.findById(id).lean().exec();
  if (!user)
    return res
      .status(400)
      .json({ success: false, message: "User does not exist" });

  const excludedUsers = [user._id, ...user.following];
  const users = await User.find({ _id: { $nin: excludedUsers } })
    .select("-password")
    .lean();

  return res.json({
    success: true,
    message: "Recommended Users retrieved",
    data: users,
  });
};

// ⚡️ @Description -> Updates a user
// ⚡️ @Route -> api/update-user (PATCH)
// ⚡️ @Access -> Private
const updateUser = async (req, res) => {
  const {
    id,
    email: userEmail,
    firstname,
    lastname,
    password,
    dateOfBirth,
    gender,
    bio,
    phoneNumber,
    website,
    location,
    socialLinks,
    postVisibility,
    profileVisibility,
    canBefollowed,
  } = req.body;

  const email = normalizeEmail(userEmail);

  // <== VALIDATE USER ENTRIES ==>
  const isInvalid = [id, email, firstname, lastname, dateOfBirth, gender].some(
    (entry) => !entry
  );

  if (isInvalid)
    return res
      .status(400)
      .json({ success: false, message: "All fields are required" });

  if (!isEmail(email))
    return res
      .status(400)
      .json({ success: false, message: "Invalid email address" });

  if (!isDate(dateOfBirth))
    return res.status(400).json({
      success: false,
      message: "Invalid date of birth",
    });

  if (password && password.length < 8) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 8 characters",
    });
  }

  if (
    phoneNumber &&
    !/^\s*(?:\+?(\d{1,3}))?[-. (]*(\d{3})[-. )]*(\d{3})[-. ]*(\d{4})(?: *x(\d+))?\s*$/i.test(
      phoneNumber
    )
  )
    return res
      .status(400)
      .json({ success: false, message: "Invalid phone number" });

  if (gender !== "Male" && gender !== "Female")
    return res
      .status(400)
      .json({ success: false, message: "Invalid gender provided" });

  if (
    typeof canBefollowed !== "undefined" &&
    typeof canBefollowed !== "boolean"
  )
    return res
      .status(400)
      .json({ success: false, message: "Invalid value for 'canBeFollowed'" });

  const visibilityOptions = ["everyone", "followers", "me"];
  if (postVisibility && !visibilityOptions.includes(postVisibility)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid visibility option provided" });
  }

  if (profileVisibility && !visibilityOptions.includes(profileVisibility)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid visibility option provided" });
  }

  const user = await User.findById(id).exec();
  if (!user)
    return res
      .status(400)
      .json({ success: false, message: "User does not exist" });

  if (!user.isVerified)
    return res
      .status(400)
      .json({ success: false, message: "User is not verified" });

  if (email !== user.email) {
    const duplicate = await User.findOne({
      email,
    })
      .lean()
      .exec();

    if (duplicate && duplicate._id !== id)
      return res
        .status(400)
        .json({ success: false, message: "Email already taken" });

    user.email = email; // Verify Email
  }

  user.gender = gender;
  user.lastname = lastname;
  user.firstname = firstname;
  user.dateOfBirth = dateOfBirth;
  if (bio) user.bio = bio;
  if (website) user.website = website;
  if (location) user.location = location;
  if (phoneNumber) user.phoneNumber = phoneNumber;
  if (postVisibility) user.postVisibility = postVisibility;
  if (profileVisibility) user.profileVisibility = profileVisibility;
  if (typeof canBefollowed === "boolean") user.canBefollowed = canBefollowed;
  if (password) user.password = await hash(password, Number(process.env.SALT));
  if (socialLinks) {
    if (socialLinks.facebook) user.socialLinks.facebook = socialLinks.facebook;
    if (socialLinks.twitter) user.socialLinks.twitter = socialLinks.twitter;
    if (socialLinks.instagram)
      user.socialLinks.instagram = socialLinks.instagram;
    if (socialLinks.linkedin) user.socialLinks.linkedin = socialLinks.linkedin;
  }

  const updatedUser = await User.findByIdAndUpdate(
    {
      _id: id,
    },
    user,
    { new: true }
  );

  await user.save();
  res.json({
    success: true,
    message: `User updated successfully`,
    data: updatedUser,
  });
};

// ⚡️ @Description -> Deletes users account
// ⚡️ @Route -> api/delete-user (DELETE)
// ⚡️ @Access -> Private
const deleteUser = async (req, res) => {
  const { id } = req.body;

  if (!id)
    return res
      .status(400)
      .json({ success: false, message: "Account ID required" });

  const user = await User.findById(id).exec();
  if (!user)
    return res
      .status(400)
      .json({ success: false, message: "Account does not exist" });

  const deletedUser = await user.deleteOne();

  return res.json({
    success: true,
    message: `User ${deletedUser.lastname} ${deletedUser.firstname} with email: ${userEmail} deleted`,
  });
};

// ⚡️ @Description -> Changes users password
// ⚡️ @Route -> api/delete-user (PATCH)
// ⚡️ @Access -> Private
const changePassword = async (req, res) => {
  const { id, oldPassword, newPassword } = req.body;

  if (!id)
    return res
      .status(400)
      .json({ success: false, message: "Account ID required" });

  if (oldPassword.length < 8 || newPassword.length < 8)
    return res.status(400).json({
      success: false,
      message: "Password should be at least 8 characters long",
    });

  const user = await User.findById(id).exec();
  if (!user)
    return res
      .status(400)
      .json({ success: false, message: "Account does not exist" });

  const match = await compare(oldPassword, user.password);

  if (!match)
    return res
      .status(401)
      .send({ success: false, message: "Incorrect old password" });

  user.password = await hash(newPassword, Number(process.env.SALT));

  const updatedUser = await User.findByIdAndUpdate(
    {
      _id: id,
    },
    user,
    { new: true }
  );

  return res.json({
    success: true,
    message: `Password updated`,
    data: updatedUser,
  });
};

// ⚡️ @Description -> Upload profile photo
// ⚡️ @Route -> api/user/profile-photo (PATCH)
// ⚡️ @Access -> Private
const uploadProfilePhoto = async (req, res) => {
  const { id } = req.body;

  if (!id)
    return res
      .status(400)
      .json({ success: false, message: "Account ID required" });

  const user = await User.findById(id).exec();
  if (!user)
    return res
      .status(400)
      .json({ success: false, message: "Account does not exist" });

  if (!req.file)
    return res
      .status(400)
      .json({ success: false, message: "Profile image is required" });

  user.profilePicture = req.file.path;
  const updatedUser = await user.save();

  return res.json({
    success: true,
    message: `Profile picture updated`,
    data: updatedUser,
  });
};

// ⚡️ @Description -> Upload cover photo
// ⚡️ @Route -> api/user/cover-photo (PATCH)
// ⚡️ @Access -> Private
const uploadCoverPhoto = async (req, res) => {
  const { id } = req.body;

  if (!id)
    return res
      .status(400)
      .json({ success: false, message: "Account ID required" });

  const user = await User.findById(id).exec();
  if (!user)
    return res
      .status(400)
      .json({ success: false, message: "Account does not exist" });

  if (!req.file)
    return res
      .status(400)
      .json({ success: false, message: "Profile image is required" });

  user.coverPicture = req.file.path;
  const updatedUser = await user.save();

  return res.json({
    success: true,
    message: `Cover picture updated`,
    data: updatedUser,
  });
};

// ⚡️ @Description -> Follow a user
// ⚡️ @Route -> api/user/follow-user (PATCH)
// ⚡️ @Access -> Private
const followUser = async (req, res) => {
  const { id, followId } = req.body;

  const isInvalid = [id, followId].some((entry) => !entry);
  if (isInvalid)
    return res
      .status(400)
      .json({ success: false, message: "All fields are required" });

  const user = await User.findById(id).exec();
  if (!user)
    return res
      .status(400)
      .json({ success: false, message: "Account does not exist" });

  const followUser = await User.findById(followId).exec();
  if (!followUser)
    return res.status(400).json({
      success: false,
      message: "Account to be followed does not exist",
    });

  if (followUser._id === user._id)
    return res.status(400).json({
      success: false,
      message: "You cant follow yourself",
    });

  if (user.following.includes(followUser._id))
    return res.status(400).json({
      success: false,
      message: "You are already following this user",
    });

  if (!followUser.canBefollowed)
    return res.status(400).json({
      success: false,
      message: "This user can't be followed",
    });

  const updatedUser = await User.findByIdAndUpdate(
    {
      _id: id,
    },
    {
      $push: { following: followId },
    },
    { new: true }
  );

  await followUser.updateOne({ $push: { followers: id } });

  return res.json({
    success: true,
    message: `User followed successfully`,
    data: updatedUser,
  });
};

// ⚡️ @Description -> unfollow a user
// ⚡️ @Route -> api/user/unfollow-user (PATCH)
// ⚡️ @Access -> Private
const unfollowUser = async (req, res) => {
  const { id, unfollowId } = req.body;

  const isInvalid = [id, unfollowId].some((entry) => !entry);

  if (isInvalid)
    return res
      .status(400)
      .json({ success: false, message: "All fields are required" });

  const user = await User.findById(id).exec();
  if (!user)
    return res
      .status(400)
      .json({ success: false, message: "Account does not exist" });

  const unfollowUser = await User.findById(unfollowId).exec();
  if (!unfollowUser)
    return res.status(400).json({
      success: false,
      message: "Account to be unfollowed does not exist",
    });

  if (unfollowUser._id === user._id)
    return res.status(400).json({
      success: false,
      message: "You cant unfollow yourself",
    });

  if (!user.following.includes(unfollowUser._id))
    return res.status(400).json({
      success: false,
      message: "You are not following this user",
    });

  const updatedUser = await User.findByIdAndUpdate(
    {
      _id: id,
    },
    {
      $pull: { following: unfollowId },
    },
    { new: true }
  );
  await unfollowUser.updateOne({ $pull: { followers: id } });

  return res.json({
    success: true,
    message: `User unfollowed successfully`,
    data: updatedUser,
  });
};

module.exports = {
  getAllUsers,
  getFollowers,
  getFollowing,
  getRecommendedUsers,
  getUser,
  updateUser,
  deleteUser,
  followUser,
  unfollowUser,
  getSomeUsers,
  uploadProfilePhoto,
  uploadCoverPhoto,
  changePassword,
};
