import dotenv from "dotenv";

dotenv.config({ path: "./../config.env" });

import cookieParser from "cookie-parser";
import express, {
	type NextFunction,
	type Request,
	type Response,
} from "express";
import { rateLimit } from "express-rate-limit";
import session from "express-session";
import helmet from "helmet";
import cors from "cors";
import dbConnection from "./Db/dbConnect";
import trainRouter from "./routes/trainsRoutes";
import userRouter from "./routes/userRoutes";
import { handleAppError } from "./Utils/AppError";

// Global Middlewares
const app = express();
app.use(cors());
const limiter = rateLimit({
	windowMs: 10 * 60 * 1000, // 10 minutes
	limit: 50, // Limit each IP to 50 requests per `window` (here, per 15 minutes).
	standardHeaders: "draft-8", // draft-6: `RateLimit-*` headers; draft-7 & draft-8: combined `RateLimit` header
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
	ipv6Subnet: 56, // Set to 60 or 64 to be less aggressive, or 52 or 48 to be more aggressive
});

app.use(helmet());
app.use(limiter);
app.use(cookieParser());
app.use(express.json());
if (process.env.EXPRESS_SESSION_SECRET_KEY) {
	app.use(
		session({
			secret: process.env.EXPRESS_SESSION_SECRET_KEY,
			resave: false,
			saveUninitialized: true,
		}),
	);
}

dbConnection();

// Local routes
app.get("/", (req: Request, res: Response) => {
	res.status(200).send("simple");
});

// Custom routes and Middlewares
app.use(userRouter);
app.use(trainRouter);

// Global error handling middlewares
app.use(handleAppError());

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
	console.error("ERROR:", err);

	res.status(err.statusCode || 500).json({
		error: err.message || "Server Error",
	});

	next();
});

const port = process.env.PORT;

app.listen(port, () => {
	console.log("I have to focus on my projects ", port);
});

export default app;
