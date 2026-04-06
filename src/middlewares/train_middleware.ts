import type { ICity, ICountry, IState } from "country-state-city";
import { City, Country, State } from "country-state-city"; //use later to get corresponding country, state, city, with the getcountrybycode or name
import type { NextFunction, Request, Response } from "express";
import { CheckBool } from "../Controllers/CheckBool";
import catchError from "../Utils/CatchError";
import { firstLetterToUpper } from "../Utils/Utils_Functions";

export function create_Train_Auth(
	req: Request,
	res: Response,
	next: NextFunction,
) {
	try {
		if (!req.body) throw new Error("Something missing");
		const {
			name,
			number,
			train_Types,
			station_name,
			code,
			city,
			state,
			country,
			seatCount,
			departureTime,
			arrivalTime,
			status
		} = req.body;
		if (
			!name ||
			!number ||
			!train_Types ||
			!station_name ||
			!code ||
			!city ||
			!state ||
			!country ||
			!seatCount ||
			!departureTime ||
			!arrivalTime ||
			!status
		)
			throw new Error("Sorry you can't leave any field empty");
		// Minimizing the seatCount to below 300 sound reasonable at least.

		// Checking if country, state and city exist on global standard.
		const globalCountry: ICountry[] = Country.getAllCountries();
		const check1 = globalCountry.some(
			(ele) => ele.name === firstLetterToUpper(country),
		)
			? { errorState: true }
			: { errorState: false, errorMessage: "Sorry, Not a valid Country." };

		const globalCity: ICity[] = City.getAllCities();
		const check2 = globalCity.some(
			(ele) => ele.name === firstLetterToUpper(city),
		)
			? { errorState: true }
			: { errorState: false, errorMessage: "Sorry, Not a valid City." };

		const globalState: IState[] = State.getAllStates();
		const check3 = globalState.some(
			(ele) => ele.name === firstLetterToUpper(state),
		)
			? { errorState: true }
			: {
					errorState: false,
					errorMessage: "Sorry, Not a valid Country State.",
				};

		// Filter departure date to match future dates and not past date. same goes for arrival date.

		const arrLow: Array<string> = [
			name,
			number,
			train_Types,
			station_name,
			code,
			city,
			state,
			country,
			seatCount,
			departureTime,
			arrivalTime,
			status
		].map((e) => e.toLowerCase().replace(/[^a-zA-Z0-9@.]/g, ""));
		const { errState, errMsg } = CheckBool(check1, check2, check3);
		if (!errState) throw new Error(`Wrong-Country-Msg: ${errMsg}`);
		res.locals.createTrainData = arrLow;
	} catch (error: any) {
		catchError(error, error.message, 400, next);
		return;
	}

	next();
}

export function update_Train_Auth(
	req: Request,
	res: Response,
	next: NextFunction,
) {
	try {
		if (!req.body) throw new Error("Something missing");
		const {
			name,
			number,
			train_Types,
			station_name,
			code,
			city,
			state,
			country,
			coachType,
			seatCount,
		} = req.body;
		if (
			!name ||
			!number ||
			!train_Types ||
			!station_name ||
			!code ||
			!city ||
			!state ||
			!country ||
			!coachType ||
			!seatCount
		)
			// Minimizing the seatCount to below 300 sound reasonable at least.
			throw new Error("Sorry you can't leave any field empty");

		// Turning First letter of country, state and city to upperCase..
		const formatCountry = firstLetterToUpper(country);
		console.log(formatCountry);

		// Checking if country, state and city exist on global standard.
		const globalCountry: ICountry[] = Country.getAllCountries();
		const check1 = globalCountry.some(
			(ele) => ele.name === firstLetterToUpper(country),
		)
			? { errorState: true }
			: { errorState: false, errorMessage: "Sorry, Not a valid Country." };

		const globalCity: ICity[] = City.getAllCities();
		const check2 = globalCity.some(
			(ele) => ele.name === firstLetterToUpper(city),
		)
			? { errorState: true }
			: { errorState: false, errorMessage: "Sorry, Not a valid City." };

		const globalState: IState[] = State.getAllStates();
		const check3 = globalState.some(
			(ele) => ele.name === firstLetterToUpper(state),
		)
			? { errorState: true }
			: {
					errorState: false,
					errorMessage: "Sorry, Not a valid Country State.",
				};

		const arrLow: Array<string> = [
			name,
			number,
			train_Types,
			station_name,
			code,
			city,
			state,
			country,
			coachType,
			seatCount,
		].map((e) => e.toLowerCase().replace(/[^a-zA-Z0-9@.]/g, ""));
		const { errState, errMsg } = CheckBool(check1, check2, check3);
		if (!errState) throw new Error(`Wrong-Country-Msg: ${errMsg}`);
		res.locals.updateTrainData = arrLow;
	} catch (error: any) {
		catchError(error, error.message, 400, next);
		return;
	}

	next();
}

export function create_Train_Booking_Auth(
	req: Request,
	res: Response,
	next: NextFunction,
) {
	try {
		if (!req.body) throw new Error("Something missing");
		const {
			coach,
			seatNumber,
			seatType,
			isWindowAvailable,
			isAvailable,
			user,
			train,
			schedule,
			seats,
			passengers,
			totalPrice,
			status
		} = req.body;
		if (
			!coach ||
			!seatNumber ||
			!seatType ||
			!isWindowAvailable ||
			!isAvailable ||
			!user ||
			!train ||
			!schedule ||
			!seats ||
			!passengers ||
			!totalPrice ||
			!status
		)
			throw new Error("Sorry you can't leave any field empty");
		// Minimizing the seatCount to below 300 sound reasonable at least.

		
		// Filter departure date to match future dates and not past date. same goes for arrival date.

		const arrLow: Array<string> = [
			coach,
			seatNumber,
			seatType,
			isWindowAvailable,
			isAvailable,
			user,
			train,
			schedule,
			seats,
			passengers,
			totalPrice,
			status
		].map((e) => e.toLowerCase().replace(/[^a-zA-Z0-9@.]/g, ""));
		res.locals.createTrainBookingData = arrLow;
	} catch (error: any) {
		catchError(error, error.message, 400, next);
		return;
	}

	next();
}