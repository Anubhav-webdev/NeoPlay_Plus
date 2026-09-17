const mongoose = require("mongoose");

const contentSchema = new mongoose.Schema(
    {
        creatorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Creator",
            required: true,
            index: true
        },

        type: {
            type: String,
            enum: ["Tweet", "Video", "Image"],
            required: true,
            index: true
        },

        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 200
        },

        description: {
            type: String,
            trim: true,
            maxlength: 5000
        },

        thumbnailUrl: {
            type: String,
            default: null
        },

        mediaUrl: {
            type: String,
            default: null
        },

        status: {
            type: String,
            enum: [
                "draft",
                "published",
                "archived"
            ],
            default: "draft",
            index: true
        },

        publishedAt: {
            type: Date,
            default: null,
            index: true
        },

        viewCount: {
            type: Number,
            default: 0,
            min: 0
        },

        categoryIds: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Category"
            }
        ]
    },
    {
        timestamps: true
    }
);

contentSchema.index({
    creatorId: 1,
    createdAt: -1
});

contentSchema.index({
    status: 1,
    publishedAt: -1
});

module.exports = mongoose.model("Content", contentSchema);