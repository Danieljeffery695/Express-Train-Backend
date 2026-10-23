import type { NextFunction, Request, Response } from "express";
import type { Types, UpdateResult, UpdateWriteOpResult } from "mongoose";
import TrainCoach from "../Models/Coaches";
import TrainStation from "../Models/Stations";
import TrainRoute from "../Models/TrainRoute";
import TrainSchedule from "../Models/Schedule";
import Trains from "../Models/Trains";
import TrainBookings from "../Models/Booking";
import Seats from "../Models/Seats";
import SeatsInfo from "../Models/SeatInfo";
import { handleAsyncErr } from "../Utils/AsyncError";
import Explore_Routes from "../Models/ExploreRoutes";
import type {
	ExploreRoutes,
	ITrainCoach,
	ITrainCreate,
	ITrainRouteCreate,
	ITrainStation,
	RouteStop
} from "../Utils/DataChecking";


export const createTrain = handleAsyncErr(
	async (req: Request, res: Response, _next: NextFunction) => {
		const userId = req.cookies;
		if(!userId.access_token[0].access_token) throw new Error("Not authorize for such actions");

		const [
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
		]: Array<string> = res.locals.createTrainData;
		const newTrain = await Trains.create({
			name,
			number,
			train_Types,
		});

		const station_id = await createStation({
			station_name,
			code,
			city,
			state,
			country,
		});
		const trainRoute_id = await createRoute(newTrain._id, station_id);
		newTrain.route = trainRoute_id._id;
		await newTrain.save();
		const trainCoach_id = await createCoach(newTrain._id, +seatCount);
		newTrain.coaches = trainCoach_id._id;
		await newTrain.save();

		const trainScheduleCreate = await TrainSchedule.create({
			train: newTrain._id,
			date: Date.now(),
			departureTime,
			arrivalTime,
			status
		});

		const seatShares = (trainCoach_id.seatCount / 3) * 100;

		const seatInformations = await SeatsInfo.create({
			train: newTrain._id,
			availableSeats: trainCoach_id.seatCount,
			availableTopSeats: seatShares,
			availableMiddleSeats: seatShares,
			availableLowSeats: seatShares,
		});

		res.status(201).json({
			Status: "success",
			data: newTrain,
		});
		return;
	},
);

export const createCoach = async (
	param1: Types.ObjectId,
	seatCount: number,
) => {
	const newCoach = await TrainCoach.create({
		train: param1,
		coachType: "Business",
		seatCount,
	});

	return newCoach;
};

export const createRoute = async (
	param1: Types.ObjectId,
	param2: Types.ObjectId,
) => {
	const newRoute = await TrainRoute.create({
		train: param1,
		from: param2,
		to: param2,
		stops: param2,
	});

	return newRoute;
};

export const createStation = async (data: ITrainStation) => {
	const newStation = await TrainStation.create(data);

	return newStation._id;
};

type SearchFilter<T> = Partial<Record<keyof T, unknown>>;

export const buildFilter = <T>(obj: SearchFilter<T>) => {
	return Object.fromEntries(
		Object.entries(obj).filter(([_k, v]) => v !== undefined && v !== ""),
	);
};

interface TrainFilter_Type extends ITrainCreate {
	createdAt?: number;
}

interface TrainFilter_Type1 extends ITrainCreate, TrainFilter_Type {
	createdAt: number;
}

let allTrains: Array<TrainFilter_Type> | undefined | null;

let deleteTrain1: Array<ITrainCreate> | undefined | null;

let searchTrainFilter: (v: any) => boolean;

export const getAllTrain = handleAsyncErr(
	async (req: Request, res: Response): Promise<void> => {
		const userId = req.cookies;
		const currentDate_now = new Date();
		const twelveDaysbehindDate = currentDate_now.setDate(
			currentDate_now.getDate() - 12,
		);
		const { name, trainType: train_Types, coachType, seatCount } = req.query;
		if (userId.access_token[0].access_token) {
			allTrains = await Trains.find(buildFilter({ name, train_Types }))
				.populate<ITrainRouteCreate>("route")
				.populate<ITrainCoach>({
					path: "coaches",
					match: buildFilter({ coachType, seatCount }),
				});
			searchTrainFilter = (v: TrainFilter_Type) =>
				v.coaches !== null && v.coaches !== undefined;
		} else {
			allTrains = await Trains.find(buildFilter({ name, train_Types }))
				.populate<ITrainRouteCreate>("route")
				.populate<ITrainCoach>({
					path: "coaches",
					match: buildFilter({ coachType, seatCount }),
				});
			searchTrainFilter = (v: TrainFilter_Type1) =>
				v.coaches !== null &&
				v.coaches !== undefined &&
				v.createdAt > twelveDaysbehindDate;
		}

		const objFilter = Object.entries(allTrains).filter(([_k, v]) =>
			searchTrainFilter(v),
		);

		res.status(200).json({
			result: objFilter.length,
			data: objFilter,
		});
		return;
	},
);

export const updateTrain = handleAsyncErr(
	async (req: Request, res: Response): Promise<void> => {
		let updateTrain1:
			| Partial<ITrainCreate>
			| UpdateWriteOpResult
			| UpdateResult
			| null;
		let updateCoach:
			| Partial<ITrainCoach>
			| UpdateWriteOpResult
			| UpdateResult
			| null;
		let updateStation:
			| Partial<ITrainStation>
			| UpdateWriteOpResult
			| UpdateResult
			| null;
		const paramId = req.params;
		const userId = req.cookies;
		const [
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
		]: Array<string> = res.locals.updateTrainData;

		if (userId.access_token[0].access_token) {
			// Updating Trains collection

			updateTrain1 = await Trains.findByIdAndUpdate(
				paramId.id,
				buildFilter({ name, number, train_Types }),
			);

			// Updating Train Coach collection

			updateCoach = await TrainCoach.updateOne(
				{ train: paramId.id },
				buildFilter({ coachType, seatCount }),
			);
			// Query Train Route for station _Id

			const trainRoute = await TrainRoute.find({ train: paramId.id }).populate(
				"from",
			);

			// Updating Trains collection

			updateStation = await TrainStation.updateOne(
				{ _id: trainRoute[0].from._id },
				buildFilter({ station_name, code, city, state, country }),
			);
		} else {
			res.status(403).json({
				result: "bad request",
				something: "not authorized",
			});
			return;
		}
		res.status(200).json({
			result: "Success",
			data: updateTrain1,
		});
		return;
	},
);

export const deleteTrain = handleAsyncErr(
	async (req: Request, res: Response): Promise<void> => {
		const paramId = req.params;
		const userId = req.cookies;

		if (userId.access_token[0].access_token) {
			deleteTrain1 = await Trains.findByIdAndDelete(paramId.id);
		} else {
			res.status(403).json({
				result: "bad request",
				something: "not authorized",
			});
			return;
		}
		res.status(200).json({
			result: "Success",
			data: deleteTrain1,
		});
		return;
	},
);


// BOOKING OF TRAIN AND SEATS

export const createBooking = handleAsyncErr(
	async (req: Request, res: Response): Promise<void> => {
		// validate and authorize user to access booking
		// check seats is available
		// begin all DB transactions
		// reduce seats numbers
		// create booking status (pending, live, close)
		// commit transaction
		// prevent double booking for same user and same train
		// seat expiration
		// generate ticket number
		// assign seat numbers
		// send email confirmation and booking summary page
		// optionally generate pdf ticket
		// the booking code will not be taken from the body, instead it will be generated as a json token and hash with expiry date
		// match the train schedule date. once the schedule date has been passed then the booking code is rendered useless and not valid

		const userId = req.cookies;

		if (userId.access_token[0].access_token) {
			const [
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
			status ] = res.locals.createTrainBookingData;
			const bookingCode = "something"; // I will get back to this later, get some package from npm that generate random sequence of characters
			const bookingCreation = await TrainBookings.create({
				user,
				train,
				schedule,
				passengers,
				totalPrice,
				bookingCode,
				status
			});

			const creatingSeats = await Seats.create({
				coach,
				seat_number: seatNumber,
				seat_type: seatType,
				isWindowAvailable,
				isAvailable
			});
			// i will look into create method in the mongoose doc to see if it return any validation that the document has been created before assigning seat id to booking seats
			// bookingCreation.seats = creatingSeats._id;
			// await bookingCreation.save();
			
		} else {
			res.status(403).json({
				result: "bad request",
				something: "not authorized",
			});
			return;
		}
		res.status(200).json({
			result: "Success",
			data: deleteTrain1,
		});
	}
)


export const routesCreation = handleAsyncErr(
	async (req: Request, res: Response, next: NextFunction) => {
		if (!req.body) throw new Error("Something missing");
		const {
			name,
			code,
			slug,
			description,
			shortDescription,
			image,
			originStation,
			destinationStation,
			stops,
			distanceKm,
			estimatedDurationMinutes,
			scenicHighlights,
			status,
			visibility,
			isFeatured
		}: ExploreRoutes = req.body;
		if (
			!name ||
			!code ||
			!slug ||
			!description ||
			!shortDescription ||
			!image ||
			!originStation ||
			!destinationStation ||
			!stops ||
			!distanceKm ||
			!estimatedDurationMinutes ||
			!scenicHighlights ||
			!status ||
			!visibility ||
			!isFeatured
		) {
			throw new Error("Missing a field") // throwing custom error to handleAsynceErr to deal with it. 
		}

		// validation on stations stops
		// Three is the require amount of stations that add be added. no more than three and sure less than three is allowed
		// Gotta validate if such stations is available on our database
		// needs to find the appropriate slow to search for three reference with no delays
		// Once stations is select each stations will be assigned a sequence number e.g [{station: "stationId", sequence: 1}, station: "stationId", sequence: 1}]
		// sequence number will be generated through a loop.
		// no duplicate stations id.
		// check to make sure originStation and destinationStation is not the same. we can't have people going to the station they were boarded.
		
		if(originStation === destinationStation) throw new Error("can't go around with our train and stop at where we started. please go to an amusing park")

		if(stops.length > 3) throw new Error("Train Stops Exceeds limits (3).");

		let testingDuplicateStation: Set<string> = new Set()
		const trdd = stops.map(async (stationObj: RouteStop) => await TrainStation.find({_id: { $in : [stationObj.station]}})) // checking all mentioned stop stations if they're available at our discretion. return valid is an array of promises

		// resolving all promises and getting the data out for validation. 
		Promise.all(trdd).then((data) => { 
			const dataItem = data.map((item) => item[0]._id); // getting only the id.
			dataItem.forEach((item) => testingDuplicateStation.add(item.toString())) // looping through the data and turning all the ObjectId to string for the checking of duplicates.
			if(stops.length !== testingDuplicateStation.size) throw new Error("duplicate station not allowed");

				Explore_Routes.create(req.body).then((data) => {
					res.status(201).json({
						status: "Success in creating explore route",
						message: data
					});
				}).catch((err: Error) => {
					res.status(400).json({
						status: "Request Failed",
						message: err.message
					});
				});

		
		})
		.catch((err: Error) => {
			res.status(400).json({
				status: "Request Failed",
				message: err.message
			});
		});

		//  The uses for try/catch being here is complicated
		// without the try/catch here when we throw error at the top. that error won't stop the code from reaching the bottom. then that lead to error ('Cannot set headers after they are sent to the client')
		// maybe because we already sent that error and cannot send the same thing twice at runtime. leading to two same headers being set. that crash the server
		// i am also thinking of something simple. like an 'if/else' condition. 
		// try {
			// const createData = await Explore_Routes.create(req.body);
			
			// res.status(201).json({
				// status: "Success in creating explore route",
				// message: createData
			// }); // getting all flirted required data from request body and any unrelated data will be ignore by mongoose model.
		// } catch (error) {
			// res.status(400).json({
				// status: "Request Failed",
				// message: error
			// });

			// return;
		// }
	}
);

// gonna create routes editing for later updates