const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },

        type: {
            type: String,
            enum: [
                "like",
                "comment",
                "reply",
                "subscription",
                "content",
                "system",
                "report"
            ],
            required: true
        },

        message: {
            type: String,
            required: true,
            trim: true,
            maxlength: 500
        },

        isRead: {
            type: Boolean,
            default: false,
            index: true
        }
    },
    {
        timestamps: true
    }
);

notificationSchema.index({
    userId: 1,
    isRead: 1,
    createdAt: -1
});

module.exports = mongoose.model(
    "Notification",
    notificationSchema
);