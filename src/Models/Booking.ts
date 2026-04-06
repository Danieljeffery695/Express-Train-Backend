import mongoose, { Schema } from "mongoose";
import type { ITrainBooking } from "../Utils/DataChecking";

const trainBooking = new mongoose.Schema<ITrainBooking>(
	{
		user: {
			type: Schema.Types.ObjectId,
			ref: "Users",
		},

		train: {
			type: Schema.Types.ObjectId,
			ref: "Trains",
		},

		schedule: {
			type: Schema.Types.ObjectId,
			ref: "Schedule",
		},

		seats: {
			type: Schema.Types.ObjectId,
			ref: "Seats",
		},

		passengers: {
			type: Object,
			default: { name: "null", age: 4, gender: "null" },
		},

		totalPrice: {
			type: Number,
		},

		bookingCode: {
			type: String,
			unique: true,
			required: [true, "can't book a train without booking code"]
		},

		status: {
			type: String,
			enums: ["PENDING", "CONFIRMED", "CANCELLED"],
			default: "PENDING",
		},
	},
	{
		timestamps: true,
	},
);

const TrainBookings = mongoose.model<ITrainBooking>("Bookings", trainBooking);

export default TrainBookings;
