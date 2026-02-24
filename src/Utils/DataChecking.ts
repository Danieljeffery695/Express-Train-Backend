import type { Types } from "mongoose";


export interface BodyCasting {
	name?: string;
	email: string;
	phone?: string;
	password: string;
	passwordConfirm?: string;
}

export interface IUserCreate {
	name: string;
	email: string;
	phone: string;
	phoneNumberRegion: string;
	password: string;
	passwordConfirm?: string;
	role: string;
	AdminToken: string;
	AdminTokenExpires: string;
	isAdmin: boolean;
	ipGeo: Array<string>;
	ipAddress: Array<string>;
	passwordChanged: boolean;
	passwordChangedAt: Date;
	resetPasswordToken: string;
	resetPasswordTokenExpires: Date;
	deactivated: boolean;
	deactivatedAt: Date;
	updatedAt: Date;
	createdAt: Date;

	compareLoginPassword(
		currentInputPwd: string,
		userDbPwd: string,
	): Promise<boolean>;
}

export interface ResetTokenType {
	resetPasswordTokenExpires: Date;
	resetPasswordToken?: string;
	resetUrl: string;
	id: string;
	saltToken: string;
}

export interface ITrainCreate {
	name: string;
	number: string;
	train_Types: string;
	coaches: Types.ObjectId | ITrainCoach;
	route: Types.ObjectId | ITrainRouteCreate;
}

export interface ITrainRouteCreate {
	train: Types.ObjectId;
	from: Types.ObjectId;
	to: Types.ObjectId;
	stops: Types.ObjectId;
	arrivalTime: Date;
	departureTime: Date;
}

export interface ITrainCoach {
	train: Types.ObjectId | ITrainCreate;
	coachType: string;
	seatCount: number;
	seats: Types.ObjectId | ITrainSeats;
}

export interface ITrainStation {
	station_name: string;
	code: string;
	city: string;
	state: string;
	country: string;
}

export interface ITrainSeats {
	coach: Types.ObjectId | ITrainCoach;
	seat_number: string;
	seat_type: string;
	isWindow: boolean;
	isAvailable: boolean;
}

export interface ITrainSchedule {
	train: Types.ObjectId | ITrainCreate;
	date: Date;
	departureTime: string;
	arrivalTime: string;
	status: string;
}

export type passengersTypes = {
	name: string;
	age: number;
	gender: string;
}

export interface ITrainBooking {
	user: Types.ObjectId | IUserCreate;
	schedule: Types.ObjectId | ITrainSchedule;
	seats: Types.ObjectId | ITrainSeats;
	passengers: passengersTypes;
	totalPrice: number;
	status: string
}

export interface ITrainSeatInfo {
	train: Types.ObjectId | ITrainCreate;
	availableSeats: number;
	availableTopSeats: number;
	availableMiddleSeats: number;
	availableLowSeats: number;
}