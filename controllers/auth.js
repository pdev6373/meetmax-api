const isEmail = require("validator/lib/isEmail");
const isDate = require("validator/lib/isDate");
const User = require("../models/User");
const { sign, verify } = require("jsonwebtoken");
const { compare, hash } = require("bcrypt");
const normalizeEmail = require("validator/lib/normalizeEmail");
const sendVerificationEmail = require("../utils/sendVerificationEmail");
const sendEmail = require("../utils/email");

// ⚡️ @Description -> Register a user
// ⚡️ @Route -> api/auth/register (POST)
// ⚡️ @Access -> Public
const register = async (req, res) => {
  const {
    email: userEmail,
    firstname,
    lastname,
    password,
    dateOfBirth,
    gender,
  } = req.body;

  const email = normalizeEmail(userEmail);

  // <== VALIDATE USER ENTRIES ==>
  const isInvalid = [
    email,
    firstname,
    lastname,
    password,
    dateOfBirth,
    gender,
  ].some((entry) => !entry);

  if (isInvalid)
    return res
      .status(400)
      .json({ success: false, message: "All fields are required" });

  if (!isEmail(email))
    return res
      .status(400)
      .json({ success: false, message: "Invalid email address" });

  if (password.length < 8)
    return res.status(400).json({
      success: false,
      message: "Password must be at least 8 characters",
    });

  if (!isDate(dateOfBirth))
    return res.status(400).json({
      success: false,
      message: "Invalid date of birth",
    });

  if (gender !== "Male" && gender !== "Female")
    return res
      .status(400)
      .json({ success: false, message: "Invalid gender provided" });

  // <== CHECK IF USER EXIST ==>
  const user = await User.findOne({ email }).exec();

  // <== USER EXISTS ==>
  if (user) {
    // <== CHECKS IF USER EMAIL IS VERIFIED ==>
    if (user.isVerified)
      return res
        .status(409)
        .json({ success: false, message: "Account already exist" });

    // <== USER NOT VERIFIED ==>
    user.firstname = firstname;
    user.lastname = lastname;
    user.password = await hash(password, Number(process.env.SALT));
    user.dateOfBirth = dateOfBirth;
    user.gender = gender;

    const updatedUser = await user.save();

    if (updatedUser) {
      const token = user.generateVerificationToken();
      const url = `https://meetmax-social.vercel.app/verify-email?token=${token}`;

      await sendVerificationEmail({
        from: "Meetmax taiwoluborode@gmail.com",
        to: user.email,
        subject: "Verify your account",
        // body: `<h1>Please confirm your OTP</h1>
        //        <p>Click <a href='${url}'>here</a> to confirm your email.</p>`,
        body: sendEmail("verify-account", url),
      });

      return res.json({
        success: true,
        message: `A verification email was sent to ${userEmail}`,
      });
    }

    return res
      .status(400)
      .json({ success: false, message: "Invalid user data received" });
  }

  // <== USER DOES NOT EXIST ==>
  const hashedPassword = await hash(password, Number(process.env.SALT));

  const userObject = {
    email,
    password: hashedPassword,
    firstname,
    lastname,
    dateOfBirth,
    gender,
  };

  const registeredUser = await User.create(userObject);
  if (registeredUser) {
    const token = registeredUser.generateVerificationToken();
    const url = `https://meetmax-social.vercel.app/verify-email?token=${token}`;

    await sendVerificationEmail({
      from: "Meetmax taiwoluborode@gmail.com",
      to: registeredUser.email,
      subject: "Verify your account",
      // body: `<h1>Please confirm your OTP</h1>
      //          <p>Click <a href='${url}'>here</a> to confirm your email.</p>`,
      body: sendEmail("verify-account", url),
    });

    return res.json({
      success: true,
      message: `A verification email was sent to ${userEmail}`,
    });
  }

  return res
    .status(400)
    .json({ success: false, message: "Invalid user data received" });
};

// ⚡️ @Description -> Verify user email
// ⚡️ @Route -> api/auth/verify/:token (GET)
// ⚡️ @Access -> Public
const verifyUser = async (req, res) => {
  const { token } = req.body;

  // <== CHECK WE HAVE A TOKEN ==>
  if (!token)
    return res.status(422).send({ success: false, message: "Missing token" });

  verify(
    token,
    process.env.USER_VERIFICATION_TOKEN_SECRET,
    async (err, decoded) => {
      if (err)
        return res
          .status(400)
          .json({ success: false, message: "Invalid token" });

      // <== FIND USER WITH MATCHING ID ==>
      const user = await User.findOne({ _id: decoded.id }).exec();

      if (!user)
        return res
          .status(400)
          .send({ success: false, message: "Account does not exist" });

      if (user.isVerified)
        return res
          .status(400)
          .send({ success: false, message: "Account already verified" });

      // <== UPDATE USER VERIFICATION STATUS TO TRUE ==>
      user.isVerified = true;
      await user.save();

      res.json({
        success: true,
        message: "Account verified successfully",
      });
    }
  );
};

// ⚡️ @Description -> Sends a password reset link to users email
// ⚡️ @Route -> api/auth/forgot-password (POST)
// ⚡️ @Access -> Public
const forgotPassword = async (req, res) => {
  const { email: userEmail } = req.body;
  const email = normalizeEmail(userEmail);

  if (!email)
    return res
      .status(400)
      .json({ success: false, message: "Email field is required" });

  if (!isEmail(email))
    return res
      .status(400)
      .json({ success: false, message: "Invalid email address" });

  // <== CHECKS IF USER EXISTS ==>
  const user = await User.findOne({ email }).exec();
  if (!user)
    return res
      .status(400)
      .send({ success: false, message: "Account does not exist" });

  // <== Ensure the account has been verified ==>
  if (!user.isVerified)
    return res
      .status(401)
      .send({ success: false, message: "Account not verified" });

  const token = user.generateVerificationToken();
  const url = `https://meetmax-social.vercel.app/reset-password?token=${token}`;

  await sendVerificationEmail({
    from: "Meetmax taiwoluborode@gmail.com",
    to: user.email,
    subject: "Reset Password",
    // body: `<h1>Click the link below to reset your password</h1>
    //            <p>Click <a href = '${url}'>here</a> to reset your password.</p>`,
    body: sendEmail("password-reset", url),
  });

  res.json({
    success: true,
    message: `A password reset email was sent to ${userEmail}`,
  });
};

// ⚡️ @Description -> Sets user new password
// ⚡️ @Route -> api/auth/new-password/:token (PATCH)
// ⚡️ @Access -> Public
const setNewPassword = async (req, res) => {
  const { password, token } = req.body;

  // <== CHECK WE HAVE A TOKEN ==>
  if (!token)
    return res.status(422).send({ success: false, message: "Missing token" });

  verify(
    token,
    process.env.USER_VERIFICATION_TOKEN_SECRET,
    async (err, decoded) => {
      if (err)
        return res
          .status(400)
          .json({ success: false, message: "Invalid token" });

      // <== FIND USER WITH MATCHING ID ==>
      const user = await User.findOne({ _id: decoded.id }).exec();

      if (!user)
        return res
          .status(400)
          .send({ success: false, message: "Account does not exist" });

      // <== VERIFY THE TOKEN FROM THE URL ==>
      if (!user.isVerified)
        return res
          .status(400)
          .send({ success: false, message: "Account not verified" });

      if (password.length < 8)
        return res.status(400).json({
          success: false,
          message: "Password must be at least 8 characters",
        });

      // <== UPDATE USER PASSWORD ==>
      user.password = await hash(password, Number(process.env.SALT));
      await user.save();

      res.json({
        success: true,
        message: "Password changed successfully",
      });
    }
  );
};

// ⚡️ @Description -> Login user
// ⚡️ @Route -> api/auth/login (POST)
// ⚡️ @Access -> Public
const login = async (req, res) => {
  const { email: userEmail, password } = req.body;

  const email = normalizeEmail(userEmail);

  // <== VALIDATE USER ENTRIES ==>
  const isInvalid = [email, password].some((entry) => !entry);

  if (isInvalid)
    return res
      .status(400)
      .json({ success: false, message: "All fields are required" });

  if (!isEmail(email))
    return res
      .status(400)
      .json({ success: false, message: "Invalid email address" });

  if (password.length < 8)
    return res.status(400).json({
      success: false,
      message: "Password must be at least 8 characters",
    });

  // <== CHECKS IF USER EXISTS ==>
  const user = await User.findOne({ email }).exec();
  if (!user)
    return (
      res
        .status(400)
        // .send({ success: false, message: "User does not exist" });
        .send({ success: false, message: "Invalid email or password" })
    );

  // <== Ensure the account has been verified ==>
  if (!user.isVerified)
    return res
      .status(401)
      .send({ success: false, message: "Account not verified" });

  const match = await compare(password, user.password);
  if (!match)
    return res
      .status(401)
      .send({ success: false, message: "Incorrect email or password" });

  const accessToken = sign(
    {
      UserInfo: { email: user.email },
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "15m" }
  );

  const refreshToken = sign(
    { email: user.email },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" }
  );

  // CREATE SECURE COOKIE WITH REFRESH TOKEN
  res.cookie("jwt", refreshToken, {
    httpOnly: true, // ACCESSIBLE ONLY BY WEB SERVER
    secure: true, // HTTPS
    sameSite: "none", // CROSS-SITE COOKIE
    maxAge: 7 * 24 * 60 * 60 * 1000, // COOKIE EXPIRY: SET TO MATCH REFRESH TOKEN EXPIRY TIME
  });

  // SEND ACCESS TOKEN CONTAINING USERNAME

  user.password = undefined;
  res.json({
    success: true,
    message: "User logged in",
    data: { accessToken, userDetails: user },
  });
};

// ⚡️ @Description -> Sends new access token with refresh token
// ⚡️ @Route -> api/auth/refresh (GET)
// ⚡️ @Access -> Public
const refresh = async (req, res) => {
  const cookies = req.cookies;

  if (!cookies?.jwt)
    return res.status(401).send({ success: false, message: "Unauthorized" });

  const refreshToken = cookies.jwt;

  // <== VALIDATE REFRESH TOKEN ==>
  verify(
    refreshToken,
    process.env.REFRESH_TOKEN_SECRET,
    async (err, decoded) => {
      if (err)
        return res.status(403).send({ success: false, message: "Forbidden" });

      const user = await User.findOne({ email: normalizeEmail(decoded.email) })
        .select("-password")
        .lean()
        .exec();

      if (!user)
        return res
          .status(401)
          .send({ success: false, message: "Unauthorized" });

      if (!user.isVerified)
        return res
          .status(401)
          .send({ success: false, message: "Account not verified" });

      const accessToken = sign(
        {
          UserInfo: { email: user.email },
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "15m" }
      );

      // SEND ACCESS TOKEN CONTAINING USERNAME
      res.json({
        success: true,
        message: "New access token generated",
        data: { accessToken, userDetails: user },
      });
    }
  );
};

// ⚡️ @Description -> Clears cookie if it exist
// ⚡️ @Route -> api/auth/logout (GET)
// ⚡️ @Access -> Public
const logout = async (req, res) => {
  const cookies = req.cookies;

  if (!cookies.jwt) return res.sendStatus(204); // NO CONTENT

  // CLEAR SECURE COOKIE WITH REFRESH TOKEN
  res.clearCookie("jwt", {
    httpOnly: true, // ACCESSIBLE ONLY BY WEB SERVER
    secure: true, // HTTPS
    sameSite: "none", // CROSS-SITE COOKIE
  });

  res.json({ success: true, message: "Cookie cleared" });
};

module.exports = {
  register,
  verifyUser,
  forgotPassword,
  setNewPassword,
  login,
  refresh,
  logout,
};
