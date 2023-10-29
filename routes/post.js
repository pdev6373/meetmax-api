const express = require("express");
const PostController = require("../controllers/post");
const { storage } = require("../storage/storage");
const multer = require("multer");
const upload = multer({ storage });

const PostRoutes = () => {
  const router = express.Router();

  router
    .route("/")
    .post(upload.array("image", 3), PostController.createPost)
    .patch(upload.array("image", 3), PostController.updatePost)
    .delete(PostController.deletePost);
  router.get("/posts/:id", PostController.getPosts);
  router.patch("/react-to-post", PostController.reactToPost);
  router.get("/profile-posts/:id/:profileId", PostController.profilePosts);
  router.get("/timeline-posts", PostController.timelinePosts);
  router.patch("/hide-post", PostController.hidePost);
  router
    .route("/comment")
    .get(PostController.getCommentsOnPost)
    .post(PostController.commentOnPost)
    .patch(PostController.reactToComment);
  router.patch("/react-to-reply", PostController.reactToReply);
  router.patch("/reply-comment", PostController.replyComment);

  return router;
};

module.exports = PostRoutes;
