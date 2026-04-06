// This model will be created when user book a train session. so admin cannot create it on their side
// User will navigate to their train of their choice and choose and that id of the train will be use for creating adequate seats

import mongoose, { Schema } from "mongoose";
import { ITrainSeats } from "../Utils/DataChecking";

const seatSchema = new mongoose.Schema<ITrainSeats>(
    {
        coach: {
            type: Schema.Types.ObjectId,
            ref: "Coach",
        },

        seat_number: {
            type: String,
            unique: true,
        },

        seat_type: {
            type: String,
            enum: ["Type1", "Type2", "Type3"],
            default: "Type1",
        },

        isWindowAvailable: { type: Boolean },

        isAvailable: {type: Boolean},

    },
    {
        timestamps: true,
    },
);

const Seats = mongoose.model<ITrainSeats>("Seats", seatSchema);

export default Seats;