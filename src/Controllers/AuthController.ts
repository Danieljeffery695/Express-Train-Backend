import type { NextFunction, Request, Response } from "express";
import jwt, { type GetPublicKeyOrSecret } from "jsonwebtoken";
import { handleAsyncErr } from "../Utils/AsyncError";
import catchError from "../Utils/CatchError";

// Grabbing the headers name: "Authorization" after login to validate routes.
// We're using the bearer token (Jwt token) method for the fetching of the token

if (process.env.JWT_SECRET)
	var jwt_secret: string | Buffer<ArrayBufferLike> | GetPublicKeyOrSecret =
		process.env.JWT_SECRET;

export const protectRoutes = handleAsyncErr(
	async (req: Request, res: Response, next: NextFunction) => {
		let token;
		const { authorization } = req.headers;
		if (authorization && authorization.includes("Bearer", 0))
			token = authorization.toString().split(" ")[1];
		if (token) {
			const tokenDecoder = await jwt.verify(token, jwt_secret);
			console.log(tokenDecoder);
			next();
			return;
		}

		catchError(new Error(), "Not authorize", 401, next);
	},
);
