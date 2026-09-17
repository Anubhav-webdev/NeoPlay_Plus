const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
    {
        reporterId: {
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
        },

        reason: {
            type: String,
            enum: [
                "spam",
                "harassment",
                "hate",
                "violence",
                "copyright",
                "sexual",
                "misinformation",
                "other"
            ],
            required: true
        },

        status: {
            type: String,
            enum: [
                "pending",
                "reviewing",
                "resolved",
                "dismissed"
            ],
            default: "pending",
            index: true
        }
    },
    {
        timestamps: true
    }
);

reportSchema.index({
    contentId: 1,
    status: 1
});

module.exports = mongoose.model(
    "Report",
    reportSchema
);