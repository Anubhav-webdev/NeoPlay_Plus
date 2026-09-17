const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
    {
        text: {
            type: String,
            required: true,
            trim: true,
            maxlength: 2000
        },

        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },

        contentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Content",
            required: true,
            index: true
        }
    },
    {
        timestamps: true
    }
);

commentSchema.index({
    contentId: 1,
    createdAt: -1
});

module.exports = mongoose.model("Comment", commentSchema);