import mongoose, { Schema } from "mongoose";
import { ITrainSeatInfo } from "../Utils/DataChecking";

// available seats should match the train exact seats count as the document is created. so that means i have to get that data directly from the coach table
// the rest seats availability will divide from the available seats values
const seatInfoSchema = new mongoose.Schema<ITrainSeatInfo>(
    {
        train: {
            type: Schema.Types.ObjectId,
            ref: "Trains",
        },

        availableSeats: {
            type: Number,
        },

        availableTopSeats: {
            type: Number,
        },

        availableMiddleSeats: {
            type: Number,
        },

        availableLowSeats: {
            type: Number,
        }

    },
    {
        timestamps: true,
    },
);

const SeatsInfo = mongoose.model<ITrainSeatInfo>("SeatsInfo", seatInfoSchema);

export default SeatsInfo;