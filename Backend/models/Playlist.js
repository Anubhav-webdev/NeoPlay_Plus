const mongoose = require("mongoose");

const playlistSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 150
        },

        isPublic: {
            type: Boolean,
            default: true,
            index: true
        },

        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },

        contentIds: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Content"
            }
        ]
    },
    {
        timestamps: true
    }
);

playlistSchema.index({
    userId: 1,
    createdAt: -1
});

module.exports = mongoose.model("Playlist", playlistSchema);