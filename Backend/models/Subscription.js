const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema(
    {
        subscriberId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        creatorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Creator",
            required: true
        }
    },
    {
        timestamps: true
    }
);

subscriptionSchema.index(
    {
        subscriberId: 1,
        creatorId: 1
    },
    {
        unique: true
    }
);

subscriptionSchema.index({
    creatorId: 1,
    createdAt: -1
});

module.exports = mongoose.model(
    "Subscription",
    subscriptionSchema
);