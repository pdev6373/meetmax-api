const express = require("express");
const AuthController = require("../controllers/auth");
const loginLimiter = require("../middleware/loginLimiter");

const AuthRoutes = () => {
  const router = express.Router();

  router.post("/register", AuthController.register);
  router.post("/verify", AuthController.verifyUser);
  router.patch("/new-password", AuthController.setNewPassword);
  router.post("/forgot-password", AuthController.forgotPassword);
  router.post("/login", loginLimiter, AuthController.login);
  router.get("/refresh", AuthController.refresh);
  router.get("/logout", AuthController.logout);

  return router;
};

module.exports = AuthRoutes;
