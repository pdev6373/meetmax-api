const express = require("express");
const AuthRoutes = require("./auth");
const UserRoutes = require("./user");
const PostRoutes = require("./post");
const verifyJWT = require("../middleware/verifyJWT");

const getRoutes = () => {
  const router = express.Router();
  router.use("/auth", AuthRoutes());
  router.use(verifyJWT);
  router.use("/user", UserRoutes());
  router.use("/post", PostRoutes());

  return router;
};

module.exports = getRoutes;
