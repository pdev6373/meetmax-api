const { model, Schema } = require("mongoose");
const { VISIBILITY_OPTIONS } = require("../constants");

const postSchema = new Schema(
  {
    id: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      max: 500,
    },
    images: {
      type: Array,
    },
    likes: {
      type: Array,
      default: [],
    },
    visibility: {
      type: String,
      enum: Object.keys(VISIBILITY_OPTIONS),
      default: VISIBILITY_OPTIONS.everyone,
    },
    hiddenTo: {
      type: Array,
      default: [],
    },
    comments: [
      {
        id: {
          type: String,
          required: true,
        },
        message: {
          type: String,
          required: true,
        },
        likes: {
          type: Array,
          default: [],
        },
        createdAt: { type: Date, default: Date.now },
        replies: [
          {
            id: {
              type: String,
              required: true,
            },
            repliedComment: {
              lastname: String,
              firstname: String,
              message: String,
            },
            message: {
              type: String,
              required: true,
            },
            likes: {
              type: Array,
              default: [],
            },
            createdAt: { type: Date, default: Date.now },
          },
        ],
      },
    ],
  },
  {
    timestamps: true,
  }
);

// const Post = model("Post", postSchema);
// Post.findbyId(id).populate("followers", "followers").exec();

module.exports = model("Post", postSchema);
