const mongoose = require("mongoose");

const creatorSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
            index: true
        },

        displayName: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100
        },

        avatar: {
            type: String,
            default: null
        },

        applicationStatus: {
            type: String,
            enum: [
                "pending",
                "approved",
                "rejected",
                "suspended"
            ],
            default: "pending",
            index: true
        },

        approvedAt: {
            type: Date,
            default: null
        },

        isMonetized: {
            type: Boolean,
            default: false
        },

        stripeAccountId: {
            type: String,
            default: null,
            select: false
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Creator", creatorSchema);