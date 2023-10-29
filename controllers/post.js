const User = require("../models/User");
const Post = require("../models/Post");
const { VISIBILITY_OPTIONS } = require("../constants");

// ⚡️ @Description -> Get posts
// ⚡️ @Route -> api/post/posts/:id (GET)
// ⚡️ @Access -> Private
const getPosts = async (req, res) => {
  const { id } = req.params;

  if (!id)
    return res.status(400).json({
      success: false,
      message: "User Id is required",
    });

  const user = await User.findById(id).exec();
  if (!user)
    return res.status(400).json({
      success: false,
      message: "Account not found",
    });

  const posts = await Post.find({
    $and: [
      { hiddenTo: { $nin: id } },
      {
        $or: [
          { visibility: VISIBILITY_OPTIONS.everyone },
          { $and: [{ visibility: "me" }, { id }] },
          { $and: [{ visibility: "followers" }, { id }] },
          {
            $and: [
              { visibility: "followers" },
              {
                id: {
                  $in: user.following,
                },
              },
            ],
          },
        ],
      },
    ],
  })
    .sort({ createdAt: -1 })
    .exec();

  return res.json({
    success: true,
    message: "Posts retrieved",
    data: posts,
  });
};

// ⚡️ @Description -> Create post
// ⚡️ @Route -> api/post (POST)
// ⚡️ @Access -> Private
const createPost = async (req, res) => {
  const { id, profileId, message, visibility } = req.body;

  if (!id)
    return res.status(400).json({
      success: false,
      message: "User Id is required",
    });

  if (!message && !req.files.length)
    return res.status(400).json({
      success: false,
      message: "Message or image(s) is required",
    });

  const user = await User.findById(id).exec();
  if (!user)
    return res.status(400).json({
      success: false,
      message: "Account not found",
    });

  const postObject = {
    message: "",
    images: [],
    id,
    visibility: user.postVisibility,
  };

  if (req.files.length)
    postObject.images = req.files.map((image) => image.path);
  if (message) postObject.message = message;
  if (visibility) postObject.visibility = visibility;

  await Post.create(postObject);

  if (!profileId) {
    const posts = await Post.find({
      $and: [
        { hiddenTo: { $nin: id } },
        {
          $or: [
            { visibility: VISIBILITY_OPTIONS.everyone },
            { $and: [{ visibility: "me" }, { id }] },
            { $and: [{ visibility: "followers" }, { id }] },
            {
              $and: [
                { visibility: "followers" },
                {
                  id: {
                    $in: user.following,
                  },
                },
              ],
            },
          ],
        },
      ],
    })
      .sort({ createdAt: -1 })
      .exec();

    return res.json({
      success: true,
      message: `Post created successfully`,
      data: posts,
    });
  }

  const profileUser = await User.findById(profileId).exec();
  if (!profileUser)
    return res.status(400).json({
      success: false,
      message: "Profile not found",
    });

  const posts = await Post.find({
    $and: [
      { id: profileUser._id },
      { hiddenTo: { $nin: id } },
      {
        $or: [
          { visibility: VISIBILITY_OPTIONS.everyone },
          { $and: [{ visibility: "me" }, { id }] },
          { $and: [{ visibility: "followers" }, { id }] },
          {
            $and: [
              { visibility: "followers" },
              {
                id: {
                  $in: user.following,
                },
              },
            ],
          },
        ],
      },
    ],
  })
    .sort({ createdAt: -1 })
    .exec();

  return res.json({
    success: true,
    message: `Post created successfully`,
    data: posts,
  });
};

// ⚡️ @Description -> Hide post
// ⚡️ @Route -> api/post/hide-post (PATCH)
// ⚡️ @Access -> Private
const hidePost = async (req, res) => {
  const { id, postId } = req.body;

  if (!id)
    return res.status(400).json({
      success: false,
      message: "User Id is required",
    });

  if (!postId)
    return res.status(400).json({
      success: false,
      message: "Post Id is required",
    });

  const user = await User.findById(id).exec();
  if (!user)
    return res.status(400).json({
      success: false,
      message: "Account not found",
    });

  const post = await Post.findById(postId).exec();
  if (!post)
    return res.status(400).json({
      success: false,
      message: "Post not found",
    });

  if (post.id === id)
    return res.status(400).json({
      success: false,
      message: "You cannot hide your post",
    });

  post.hiddenTo = [...post.hiddenTo, id];
  await post.save();

  return res.json({
    success: true,
    message: "Post hidden successfully",
  });
};

// ⚡️ @Description -> Update post
// ⚡️ @Route -> api/post (PATCH)
// ⚡️ @Access -> Private
const updatePost = async (req, res) => {
  const { id, message, visibility, postId } = req.body;

  if (!id)
    return res.status(400).json({
      success: false,
      message: "User Id is required",
    });

  if (!postId)
    return res.status(400).json({
      success: false,
      message: "Post Id is required",
    });

  if (!message && !req.files.length)
    return res.status(400).json({
      success: false,
      message: "Message or image(s) is required",
    });

  const user = await User.findById(id).exec();
  if (!user)
    return res.status(400).json({
      success: false,
      message: "Account not found",
    });

  const post = await Post.findById(postId).exec();
  if (!post)
    return res.status(400).json({
      success: false,
      message: "Post not found",
    });

  if (post.id !== id)
    return res.status(400).json({
      success: false,
      message: "You can only update your post",
    });

  if (req.files.length) post.images = req.files.map((image) => image.path);
  if (message) post.message = message;
  if (visibility) post.visibility = visibility;

  await post.save();
  const updatedPost = await Post.findById(postId).exec();

  return res.json({
    success: true,
    message: "Post updated successfully",
    data: updatedPost,
  });
};

// ⚡️ @Description -> Deletes post
// ⚡️ @Route -> api/post (DELETE)
// ⚡️ @Access -> Private
const deletePost = async (req, res) => {
  const { id, postId } = req.body;

  if (!id)
    return res
      .status(400)
      .json({ success: false, message: "Account ID required" });

  if (!postId)
    return res
      .status(400)
      .json({ success: false, message: "Post ID required" });

  const user = User.findById(id).exec();
  if (!user)
    return res
      .status(400)
      .json({ success: false, message: "Account does not exist" });

  const post = await Post.findById(postId).exec();
  if (!post)
    return res.status(400).json({
      success: false,
      message: "Post not found",
    });

  if (post.id !== id)
    return res.status(400).json({
      success: false,
      message: "You can only delete your post",
    });

  await post.deleteOne();
  const posts = await Post.find({
    $and: [
      { hiddenTo: { $nin: id } },
      {
        $or: [
          { visibility: VISIBILITY_OPTIONS.everyone },
          { $and: [{ visibility: "me" }, { id }] },
          { $and: [{ visibility: "followers" }, { id }] },
          {
            $and: [
              { visibility: "followers" },
              {
                id: {
                  $in: user.following,
                },
              },
            ],
          },
        ],
      },
    ],
  })
    .sort({ createdAt: -1 })
    .exec();

  return res.json({
    success: true,
    message: `Post deleted successfully`,
    data: posts,
  });
};

// ⚡️ @Description -> react to a post
// ⚡️ @Route -> api/post/react-to-post (PATCH)
// ⚡️ @Access -> Private
const reactToPost = async (req, res) => {
  const { id, postId } = req.body;

  const isInvalid = [id, postId].some((entry) => !entry);

  if (isInvalid)
    return res
      .status(400)
      .json({ success: false, message: "All fields are required" });

  const user = await User.findById(id).exec();
  if (!user)
    return res
      .status(400)
      .json({ success: false, message: "Account does not exist" });

  const likePost = await Post.findById(postId).exec();
  if (!likePost)
    return res.status(400).json({
      success: false,
      message: "Post does not exist",
    });

  if (likePost.likes.includes(id)) {
    const updatedPost = await Post.findByIdAndUpdate(
      {
        _id: postId,
      },
      { $pull: { likes: id } },
      { new: true }
    );

    return res.json({
      success: true,
      message: "Post unliked successfully",
      data: updatedPost,
    });
  }

  const updatedPost = await Post.findByIdAndUpdate(
    {
      _id: postId,
    },
    { $push: { likes: id } },
    { new: true }
  );

  return res.json({
    success: true,
    message: "Post liked successfully",
    data: updatedPost,
  });
};

// ⚡️ @Description -> Get porifle posts
// ⚡️ @Route -> api/post/profile-posts (GET)
// ⚡️ @Access -> Private
const profilePosts = async (req, res) => {
  const { id, profileId } = req.params;

  if (!id)
    return res.status(400).json({
      success: false,
      message: "User Id is required",
    });

  if (!profileId)
    return res.status(400).json({
      success: false,
      message: "Profile Id is required",
    });

  const user = await User.findById(id).exec();
  if (!user)
    return res.status(400).json({
      success: false,
      message: "User not found",
    });

  if (id === profileId) {
    const userPosts = await Post.find({ id: user._id })
      .sort({ createdAt: -1 })
      .exec();

    return res.json({
      success: true,
      message: "Profile posts retrieved",
      data: userPosts,
    });
  }

  const follower = await User.findById(profileId).exec();
  if (!follower)
    return res.status(400).json({
      success: false,
      message: "profile not found",
    });

  const profilePosts = await Post.find({
    $and: [
      { id: follower._id },
      { hiddenTo: { $nin: id } },
      {
        $or: [
          { visibility: VISIBILITY_OPTIONS.everyone },
          { $and: [{ visibility: "me" }, { id: user._id }] },
          { $and: [{ visibility: "followers" }, { id: user._id }] },
          {
            $and: [
              { visibility: "followers" },
              {
                id: {
                  $in: user.following,
                },
              },
            ],
          },
        ],
      },
    ],
  })
    .sort({ createdAt: -1 })
    .exec();

  return res.json({
    success: true,
    message: "Profile posts retrieved",
    data: profilePosts,
  });
};

// ⚡️ @Description -> Comment on post
// ⚡️ @Route -> api/post/comment (POST)
// ⚡️ @Access -> Private
const commentOnPost = async (req, res) => {
  const { id, postId, message } = req.body;
  const isInvalid = [id, postId, message].some((entry) => !entry);

  if (isInvalid)
    return res
      .status(400)
      .json({ success: false, message: "All fields are required" });

  const user = await User.findById(id).exec();
  if (!user)
    return res.status(400).json({
      success: false,
      message: "User not found",
    });

  const post = await Post.findById(postId);
  if (!post)
    return res.status(400).json({
      success: false,
      message: "Post not found",
    });

  const newComment = {
    message,
    id,
    likes: [],
    replies: [],
  };

  post.comments = [...post.comments, newComment];
  await post.save();
  const updatedPost = await Post.findById(postId);

  return res.json({
    success: true,
    message: "Comment added successfully",
    data: updatedPost,
  });
};

// ⚡️ @Description -> Get Comments on post
// ⚡️ @Route -> api/post/comment (GET)
// ⚡️ @Access -> Private
const getCommentsOnPost = async (req, res) => {
  const { id, postId } = req.body;
  const isInvalid = [id, postId].some((entry) => !entry);

  if (isInvalid)
    return res
      .status(400)
      .json({ success: false, message: "All fields are required" });

  const user = await User.findById(id).exec();
  if (!user)
    return res.status(400).json({
      success: false,
      message: "User not found",
    });

  const post = await Post.findById(postId);
  if (!post)
    return res.status(400).json({
      success: false,
      message: "Post not found",
    });

  return res.json({
    success: true,
    message: "Comment retrieved successfully",
    data: post,
  });
};

// ⚡️ @Description -> Reply comment on post
// ⚡️ @Route -> api/post/comment (PATCH)
// ⚡️ @Access -> Private
const replyComment = async (req, res) => {
  const { id, postId, repliedComment, commentId, message } = req.body;
  const isInvalid = [id, postId, commentId, message].some((entry) => !entry);

  if (isInvalid)
    return res
      .status(400)
      .json({ success: false, message: "All fields are required" });

  const user = await User.findById(id).exec();
  if (!user)
    return res.status(400).json({
      success: false,
      message: "User not found",
    });

  const post = await Post.findById(postId);
  if (!post)
    return res.status(400).json({
      success: false,
      message: "Post not found",
    });

  const comment = post.comments.id(commentId);
  if (!comment)
    return res.status(400).json({
      success: false,
      message: "Comment not found",
    });

  const newReply = {
    message,
    id,
    repliedComment,
    likes: [],
  };

  comment.replies.push(newReply);
  await post.save();
  const updatedPost = await Post.findById(postId);

  return res.json({
    success: true,
    message: "Reply added successfully",
    data: updatedPost,
  });
};

// ⚡️ @Description -> react to a comment
// ⚡️ @Route -> api/post/react-to-comment (PATCH)
// ⚡️ @Access -> Private
const reactToComment = async (req, res) => {
  const { id, postId, commentId } = req.body;

  const isInvalid = [id, postId, commentId].some((entry) => !entry);

  if (isInvalid)
    return res
      .status(400)
      .json({ success: false, message: "All fields are required" });

  const user = await User.findById(id).exec();
  if (!user)
    return res
      .status(400)
      .json({ success: false, message: "Account does not exist" });

  const likePost = await Post.findById(postId).exec();
  if (!likePost)
    return res.status(400).json({
      success: false,
      message: "Post does not exist",
    });

  const comment = likePost.comments.id(commentId);
  if (!comment)
    return res.status(400).json({
      success: false,
      message: "Comment does not exist",
    });

  if (comment.likes.includes(id)) {
    const updatedPost = await Post.findByIdAndUpdate(
      {
        _id: postId,
      },
      { $pull: { "comments.$[element].likes": id } },
      { arrayFilters: [{ "element._id": commentId }], new: true }
    );

    return res.json({
      success: true,
      message: "Comment unliked successfully",
      data: updatedPost,
    });
  }

  const updatedPost = await Post.findByIdAndUpdate(
    {
      _id: postId,
    },
    { $push: { "comments.$[element].likes": id } },
    { arrayFilters: [{ "element._id": commentId }], new: true }
  );

  return res.json({
    success: true,
    message: "Comment liked successfully",
    data: updatedPost,
  });
};

// ⚡️ @Description -> react to a reply
// ⚡️ @Route -> api/post/react-to-reply (PATCH)
// ⚡️ @Access -> Private
const reactToReply = async (req, res) => {
  const { id, postId, commentId, replyId } = req.body;

  const isInvalid = [id, postId, commentId, replyId].some((entry) => !entry);

  if (isInvalid)
    return res
      .status(400)
      .json({ success: false, message: "All fields are required" });

  const user = await User.findById(id).exec();
  if (!user)
    return res
      .status(400)
      .json({ success: false, message: "Account does not exist" });

  const likePost = await Post.findById(postId).exec();
  if (!likePost)
    return res.status(400).json({
      success: false,
      message: "Post does not exist",
    });

  const comment = likePost.comments.id(commentId);
  if (!comment)
    return res.status(400).json({
      success: false,
      message: "Comment does not exist",
    });

  const reply = comment.replies.id(replyId);
  if (!reply)
    return res.status(400).json({
      success: false,
      message: "Reply does not exist",
    });

  if (reply.likes.includes(id)) {
    const updatedPost = await Post.findByIdAndUpdate(
      {
        _id: postId,
      },
      { $pull: { "comments.$[commentIndex].replies.$[replyIndex].likes": id } },
      {
        arrayFilters: [
          { "commentIndex._id": commentId },
          { "replyIndex._id": replyId },
        ],
        new: true,
      }
    );

    return res.json({
      success: true,
      message: "Comment unliked successfully",
      data: updatedPost,
    });
  }

  const updatedPost = await Post.findByIdAndUpdate(
    {
      _id: postId,
    },
    { $push: { "comments.$[commentIndex].replies.$[replyIndex].likes": id } },
    {
      arrayFilters: [
        { "commentIndex._id": commentId },
        { "replyIndex._id": replyId },
      ],
      new: true,
    }
  );

  return res.json({
    success: true,
    message: "Comment liked successfully",
    data: updatedPost,
  });
};

// ⚡️ @Description -> Gets timeline posts
// ⚡️ @Route -> api/post/timeline-posts (GET)
// ⚡️ @Access -> Private
const timelinePosts = async (req, res) => {
  const { id } = req.body;

  if (!id)
    return res.status(400).json({
      success: false,
      message: "User Id is required",
    });

  const user = await User.findById(id).exec();
  if (!user)
    return res.status(400).json({
      success: false,
      message: "User not found",
    });

  const userPosts = await Post.find({ id: user._id }).exec();
  const friendsPosts = await Promise.all(
    user.following.map((friend) => Post.find({ id: friend._id }))
  );

  const posts = userPosts.concat(friendsPosts);

  return res.json({
    success: true,
    message: "Timeline posts retrieved",
    data: [...userPosts, ...friendsPosts],
  });
};

module.exports = {
  getPosts,
  createPost,
  updatePost,
  deletePost,
  reactToPost,
  profilePosts,
  timelinePosts,
  hidePost,
  commentOnPost,
  getCommentsOnPost,
  replyComment,
  reactToComment,
  reactToReply,
};
