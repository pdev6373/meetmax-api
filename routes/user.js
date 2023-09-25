const express = require("express");
const UserController = require("../controllers/user");

const UserRoutes = () => {
  const router = express.Router();

  router.get("/all-users", UserController.getAllUsers);
  router.patch("/update-user", UserController.updateUser);
  router.delete("/delete-user", UserController.deleteUser);

  return router;
};

module.exports = UserRoutes;
