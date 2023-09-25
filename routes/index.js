const express = require("express");
const UserRoutes = require("./user");
const AuthRoutes = require("./auth");
const verifyJWT = require("../middleware/verifyJWT");

const getRoutes = () => {
  const router = express.Router();
  router.use("/auth", AuthRoutes());
  router.use(verifyJWT);
  router.use("/user", UserRoutes());

  return router;
};

module.exports = getRoutes;
