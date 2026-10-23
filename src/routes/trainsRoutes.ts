import { Router } from "express";
import {
	createTrain,
	deleteTrain,
	getAllTrain,
	updateTrain,
	routesCreation
} from "../Controllers/TrainController";
import {
	create_Train_Auth,
	update_Train_Auth,
} from "../middlewares/train_middleware";
import { protectRoutes } from "../Controllers/AuthController";

const trainRouter = Router();

trainRouter
.post("/api/v1/createTrain", protectRoutes, create_Train_Auth, createTrain)
.post("/api/v1/createRoute", protectRoutes, routesCreation)


trainRouter
	.get("/api/v1/getTrains", protectRoutes, getAllTrain)
	.patch("/api/v1/updateTrain/:id", protectRoutes, update_Train_Auth, updateTrain)
	.delete("/api/v1/deleteTrain/:id", protectRoutes, deleteTrain);

export default trainRouter;
