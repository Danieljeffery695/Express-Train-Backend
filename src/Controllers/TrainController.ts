import type { NextFunction, Request, Response } from "express";
import type { Types, UpdateResult, UpdateWriteOpResult } from "mongoose";
import TrainCoach from "../Models/Coaches";
import TrainStation from "../Models/Stations";
import TrainRoute from "../Models/TrainRoute";
import Trains from "../Models/Trains";
import { handleAsyncErr } from "../Utils/AsyncError";
import type {
	ITrainCoach,
	ITrainCreate,
	ITrainRouteCreate,
	ITrainStation,
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
		newTrain.route = trainRoute_id;
		await newTrain.save();
		const trainCoach_id = await createCoach(newTrain._id, +seatCount);
		newTrain.coaches = trainCoach_id;
		await newTrain.save();

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

	return newCoach._id;
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

	return newRoute._id;
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
