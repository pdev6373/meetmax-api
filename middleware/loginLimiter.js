const { rateLimit } = require("express-rate-limit");

const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 MINUTE,
  max: 5, // LIMITS EACH IP TO 5 LOGIN REQUESTS PER `WINDOW` PER MINUTE,
  message: {
    message:
      "Too many requests made from this IP, please try again after 5 minutes",
  },
  handler: (req, res, next, options) => {
    res.status(options.statusCode).send(options.message);
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = loginLimiter;
