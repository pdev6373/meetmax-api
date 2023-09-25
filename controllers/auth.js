const isEmail = require("validator/lib/isEmail");
const isDate = require("validator/lib/isDate");
const User = require("../models/User");
const { sign, verify } = require("jsonwebtoken");
const { compare, hash } = require("bcrypt");
const normalizeEmail = require("validator/lib/normalizeEmail");
const sendVerificationEmail = require("../utils/sendVerificationEmail");

// ⚡️ @Description -> Register a user
// ⚡️ @Route -> api/auth/register (POST)
// ⚡️ @Access -> Public
const register = async (req, res) => {
  const { email, firstname, lastname, password, dateOfBirth, gender } =
    req.body;

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

  const userGender = gender.toLowerCase().trim();
  if (userGender !== "male" && userGender !== "female")
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
        .json({ success: false, message: "User is already registered" });

    // <== USER NOT VERIFIED ==>
    user.firstname = firstname;
    user.lastname = lastname;
    user.password = await hash(password, Number(process.env.SALT));
    user.dateOfBirth = dateOfBirth;
    user.gender = gender;

    const updatedUser = await user.save();

    if (updatedUser) {
      const token = user.generateVerificationToken();
      const url = `http://localhost:3500/api/auth/verify/${token}`;

      await sendVerificationEmail({
        from: "Meetmax taiwoluborode@gmail.com",
        to: user.email,
        subject: "Verify your account",
        body: `<h1>Please confirm your OTP</h1>
               <p>Click <a href = '${url}'>here</a> to confirm your email.</p>`,
      });

      return res.json({
        success: true,
        message: `A verification email was sent to ${updatedUser.email}`,
      });
    }

    return res
      .status(400)
      .json({ success: false, message: "Invalid user data received" });
  }

  // <== USER DOES NOT EXIST ==>
  const hashedPassword = await hash(password, Number(process.env.SALT));

  const userObject = {
    email: normalizeEmail(email),
    password: hashedPassword,
    firstname,
    lastname,
    dateOfBirth,
    gender,
  };

  const registeredUser = await User.create(userObject);

  if (registeredUser)
    return res.json({
      success: true,
      message: `A verification email was sent to ${registeredUser.email}`,
    });

  return res
    .status(400)
    .json({ success: false, message: "Invalid user data received" });
};

// ⚡️ @Description -> Verify user email
// ⚡️ @Route -> api/auth/verify/:token (GET)
// ⚡️ @Access -> Public
const verifyUser = async (req, res) => {
  const { token } = req.params;

  // <== CHECK WE HAVE A TOKEN ==>
  if (!token)
    return res.status(422).send({ success: false, message: "Missing Token" });

  verify(
    token,
    process.env.USER_VERIFICATION_TOKEN_SECRET,
    async (err, decoded) => {
      if (err)
        return res.status(403).json({ success: false, message: "Forbidden" });

      // <== FIND USER WITH MATCHING ID ==>
      const user = await User.findOne({ _id: decoded.id }).exec();

      if (!user)
        return res
          .status(400)
          .send({ success: false, message: "User does not exist" });

      if (user.isVerified)
        return res
          .status(400)
          .send({ success: false, message: "User already verified" });

      // <== UPDATE USER VERIFICATION STATUS TO TRUE ==>
      user.isVerified = true;
      await user.save();

      return res.status(200).send({
        success: true,
        message: `User ${user.lastname} ${user.firstname} with email: ${user.email} verified`,
      });
    }
  );
};

// ⚡️ @Description -> Sends a password reset link to users email
// ⚡️ @Route -> api/auth/forgot-password (POST)
// ⚡️ @Access -> Public
const forgotPassword = async (req, res) => {
  const { email } = req.body;

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
      .send({ success: false, message: "User does not exist" });

  // <== Ensure the account has been verified ==>
  if (!user.isVerified)
    return res
      .status(401)
      .send({ success: false, message: "User not verified" });

  const token = user.generateVerificationToken();
  const url = `http://localhost:3500/api/auth/new-password/${token}`;

  await sendVerificationEmail({
    from: "Meetmax taiwoluborode@gmail.com",
    to: user.email,
    subject: "Reset Password",
    body: `
    <body style="background-color: #191C21;">

  <!-- start preheader -->
  <div class="preheader" style="display: none; max-width: 0; max-height: 0; overflow: hidden; font-size: 1px; line-height: 1px; color: #fff; opacity: 0;">
    A preheader is the short summary text that follows the subject line when an email is viewed in the inbox.
  </div>
  <!-- end preheader -->

  <!-- start body -->
  <table border="0" cellpadding="0" cellspacing="0" width="100%">

    <!-- start logo -->
    <tr>
      <td align="center" bgcolor="#e9ecef">
        <!--[if (gte mso 9)|(IE)]>
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="600">
        <tr>
        <td align="center" valign="top" width="600">
        <![endif]-->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
          <tr>
            <td align="center" valign="top" style="padding: 36px 24px;">
              <a href="https://www.blogdesire.com" target="_blank" style="display: inline-block;">
                <img src="https://www.blogdesire.com/wp-content/uploads/2019/07/blogdesire-1.png" alt="Logo" border="0" width="48" style="display: block; width: 48px; max-width: 48px; min-width: 48px;">
              </a>
            </td>
          </tr>
        </table>
        <!--[if (gte mso 9)|(IE)]>
        </td>
        </tr>
        </table>
        <![endif]-->
      </td>
    </tr>
    <!-- end logo -->

    <!-- start hero -->
    <tr>
      <td align="center" bgcolor="#e9ecef">
        <!--[if (gte mso 9)|(IE)]>
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="600">
        <tr>
        <td align="center" valign="top" width="600">
        <![endif]-->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
          <tr>
            <td align="left" bgcolor="#ffffff" style="padding: 36px 24px 0; font-family: 'Source Sans Pro', Helvetica, Arial, sans-serif; border-top: 3px solid #d4dadf;">
              <h1 style="margin: 0; font-size: 32px; font-weight: 700; letter-spacing: -1px; line-height: 48px;">Confirm Your Email Address</h1>
            </td>
          </tr>
        </table>
        <!--[if (gte mso 9)|(IE)]>
        </td>
        </tr>
        </table>
        <![endif]-->
      </td>
    </tr>
    <!-- end hero -->

    <!-- start copy block -->
    <tr>
      <td align="center" bgcolor="#e9ecef">
        <!--[if (gte mso 9)|(IE)]>
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="600">
        <tr>
        <td align="center" valign="top" width="600">
        <![endif]-->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">

          <!-- start copy -->
          <tr>
            <td align="left" bgcolor="#ffffff" style="padding: 24px; font-family: 'Source Sans Pro', Helvetica, Arial, sans-serif; font-size: 16px; line-height: 24px;">
              <p style="margin: 0;">Tap the button below to confirm your email address. If you didn't create an account with <a href="https://blogdesire.com">Paste</a>, you can safely delete this email.</p>
            </td>
          </tr>
          <!-- end copy -->

          <!-- start button -->
          <tr>
            <td align="left" bgcolor="#ffffff">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" bgcolor="#ffffff" style="padding: 12px;">
                    <table border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" bgcolor="#1a82e2" style="border-radius: 6px;">
                          <a href="https://www.blogdesire.com" target="_blank" style="display: inline-block; padding: 16px 36px; font-family: 'Source Sans Pro', Helvetica, Arial, sans-serif; font-size: 16px; color: #ffffff; text-decoration: none; border-radius: 6px;">Do Something Sweet</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- end button -->

          <!-- start copy -->
          <tr>
            <td align="left" bgcolor="#ffffff" style="padding: 24px; font-family: 'Source Sans Pro', Helvetica, Arial, sans-serif; font-size: 16px; line-height: 24px;">
              <p style="margin: 0;">If that doesn't work, copy and paste the following link in your browser:</p>
              <p style="margin: 0;"><a href="https://blogdesire.com" target="_blank">https://blogdesire.com/xxx-xxx-xxxx</a></p>
            </td>
          </tr>
          <!-- end copy -->

          <!-- start copy -->
          <tr>
            <td align="left" bgcolor="#ffffff" style="padding: 24px; font-family: 'Source Sans Pro', Helvetica, Arial, sans-serif; font-size: 16px; line-height: 24px; border-bottom: 3px solid #d4dadf">
              <p style="margin: 0;">Cheers,<br> Paste</p>
            </td>
          </tr>
          <!-- end copy -->

        </table>
        <!--[if (gte mso 9)|(IE)]>
        </td>
        </tr>
        </table>
        <![endif]-->
      </td>
    </tr>
    <!-- end copy block -->

    <!-- start footer -->
    <tr>
      <td align="center" bgcolor="#e9ecef" style="padding: 24px;">
        <!--[if (gte mso 9)|(IE)]>
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="600">
        <tr>
        <td align="center" valign="top" width="600">
        <![endif]-->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">

          <!-- start permission -->
          <tr>
            <td align="center" bgcolor="#e9ecef" style="padding: 12px 24px; font-family: 'Source Sans Pro', Helvetica, Arial, sans-serif; font-size: 14px; line-height: 20px; color: #666;">
              <p style="margin: 0;">You received this email because we received a request for [type_of_action] for your account. If you didn't request [type_of_action] you can safely delete this email.</p>
            </td>
          </tr>
          <!-- end permission -->

          <!-- start unsubscribe -->
          <tr>
            <td align="center" bgcolor="#e9ecef" style="padding: 12px 24px; font-family: 'Source Sans Pro', Helvetica, Arial, sans-serif; font-size: 14px; line-height: 20px; color: #666;">
              <p style="margin: 0;">To stop receiving these emails, you can <a href="https://www.blogdesire.com" target="_blank">unsubscribe</a> at any time.</p>
              <p style="margin: 0;">Paste 1234 S. Broadway St. City, State 12345</p>
            </td>
          </tr>
          <!-- end unsubscribe -->

        </table>
        <!--[if (gte mso 9)|(IE)]>
        </td>
        </tr>
        </table>
        <![endif]-->
      </td>
    </tr>
    <!-- end footer -->

  </table>
  <!-- end body -->

</body>`,
    // body: `<h1>Follow the link below to reset your password</h1>
    //  <p>Click <a href = '${url}'>here</a> to confirm your email.</p>`,
  });

  res.json({
    success: true,
    message: `A password reset email was sent to ${user.email}`,
  });
};

// ⚡️ @Description -> Sets user new password
// ⚡️ @Route -> api/auth/new-password/:token (PATCH)
// ⚡️ @Access -> Public
const setNewPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  // <== CHECK WE HAVE A TOKEN ==>
  if (!token)
    return res.status(422).send({ success: false, message: "Missing Token" });

  verify(
    token,
    process.env.USER_VERIFICATION_TOKEN_SECRET,
    async (err, decoded) => {
      if (err)
        return res.status(403).json({ success: false, message: "Forbidden" });

      // <== FIND USER WITH MATCHING ID ==>
      const user = await User.findOne({ _id: decoded.id }).exec();

      if (!user)
        return res
          .status(400)
          .send({ success: false, message: "User does not exist" });

      // <== VERIFY THE TOKEN FROM THE URL ==>
      if (user.isVerified)
        return res
          .status(400)
          .send({ success: false, message: "User already verified" });

      // <== UPDATE USER PASSWORD ==>
      user.password = await hash(password, Number(process.env.SALT));
      await user.save();

      return res.status(200).send({
        success: true,
        message: `User ${user.lastname} ${user.firstname} with email: ${user.email} password changed`,
      });
    }
  );
};

// ⚡️ @Description -> Login user
// ⚡️ @Route -> api/auth/login (POST)
// ⚡️ @Access -> Public
const login = async (req, res) => {
  const { email, password } = req.body;

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
    return res
      .status(400)
      .send({ success: false, message: "User does not exist" });

  // <== Ensure the account has been verified ==>
  if (!user.isVerified)
    return res
      .status(401)
      .send({ success: false, message: "User not verified" });

  const match = compare(password, user.password);
  if (!match)
    return res
      .status(401)
      .send({ success: false, message: "Incorrect email or password" });

  const accessToken = sign(
    { UserInfo: { email: user.email } },
    process.env.ACCESS_TOKEN_SECRET,
    // { expiresIn: "15m" }
    { expiresIn: "10s" }
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
  res.json({
    success: true,
    message: "User logged in",
    data: { accessToken },
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

      const user = await User.findOne({ email: decoded.email }).lean().exec();

      if (!user)
        return res
          .status(401)
          .send({ success: false, message: "Unauthorized" });

      const accessToken = sign(
        { UserInfo: { email: user.email } },
        process.env.ACCESS_TOKEN_SECRET,
        // { expiresIn: "15m" }
        { expiresIn: "10s" }
      );

      // SEND ACCESS TOKEN CONTAINING USERNAME
      res.json({
        success: true,
        message: "New access token generated",
        data: { accessToken },
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
