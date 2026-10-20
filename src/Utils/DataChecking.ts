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
	isWindowAvailable: boolean;
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
	train: Types.ObjectId | ITrainCreate
	schedule: Types.ObjectId | ITrainSchedule;
	seats: Types.ObjectId | ITrainSeats;
	passengers: passengersTypes;
	totalPrice: number;
	bookingCode: string;
	status: string
}

export interface ITrainSeatInfo {
	train: Types.ObjectId | ITrainCreate;
	availableSeats: number;
	availableTopSeats: number;
	availableMiddleSeats: number;
	availableLowSeats: number;
}

export type RoutesStatus = "Active" | "InActive" | "Under Maintenance" | "Closed"; // along the way we can add more status info

export type RouteVisibility = "Draft" | "Published" | "Archived";

export interface RouteStop {
	station: Types.ObjectId;
	sequence: number;
	distanceFromOriginKm: number;
}


export interface RoutesDetails {
	intermediate_stops: string;
	estimated_journey_duration: number;
	distance_if_available: number;
	operating_days: string;
	train_service_info: string;
	current_service_status: string;
}

export interface ExploreRoutes {
	name: string;
	code: string;
	slug: string;
	description: string;
	shortDescription: string
	image: string;
	originStation: Types.ObjectId;
	destinationStation: Types.ObjectId;
	stops: RouteStop[];
	distanceKm: number;
	estimatedDurationMinutes: number;
	scenicHighlights: string[];
	status: RoutesStatus
	visibility: RouteVisibility;
	isFeatured: boolean;
	// createdAt: Date;
	// updatedAt: Date;
	// route: string;
	// departure: string;
	// arrival: string;
	// status: RoutesStatus;
	// details: RoutesDetails;
}