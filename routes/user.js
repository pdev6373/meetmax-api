const express = require("express");
const UserController = require("../controllers/user");
const { storage } = require("../storage/storage");
const multer = require("multer");
const upload = multer({ storage });

const UserRoutes = () => {
  const router = express.Router();

  router
    .route("/")
    .get(UserController.getAllUsers)
    .patch(UserController.updateUser)
    .delete(UserController.deleteUser);
  router.patch(
    "/profile-picture",
    upload.single("image"),
    UserController.uploadProfilePhoto
  );
  router.patch(
    "/cover-picture",
    upload.single("image"),
    UserController.uploadCoverPhoto
  );
  router.get("/:id", UserController.getUser);
  router.patch("/change-password", UserController.changePassword);
  router.get("/some-users/:ids", UserController.getSomeUsers);
  router.get("/recommended/:id", UserController.getRecommendedUsers);
  router.get("/followers/:id", UserController.getFollowers);
  router.get("/following/:id", UserController.getFollowing);
  router.patch("/follow-user", UserController.followUser);
  router.patch("/unfollow-user", UserController.unfollowUser);

  return router;
};

module.exports = UserRoutes;
