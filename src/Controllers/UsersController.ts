import bcrypt from "bcryptjs";
import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import type { Types } from "mongoose";
import { publicIp } from "public-ip";
import Users from "../Models/Users";
import { handleAsyncErr } from "../Utils/AsyncError";
import { adminEmailSender, emailSenderToken } from "../Utils/EmailSender";
import { hashForgetPasswordToken } from "../Utils/TokenHashing";

export const createToken = (id: Types.ObjectId) => {
	if (process.env.JWT_SECRET && process.env.JWT_EXPIRE_DATE) {
		// The VAR keyword was use here to make sure the variable can be used outside the if/else blocks
		var jwtSecret: string | object = process.env.JWT_SECRET;
		var jwtDate: number | string = process.env.JWT_EXPIRE_DATE;
		var signupToken = jwt.sign({ id }, jwtSecret, {
			expiresIn: +jwtDate,
		});
		return signupToken;
	} else {
		throw new Error(
			"Server error, something went wrong on our side. get back to you",
		);
	}
};

export const createUser = handleAsyncErr(
	async (req: Request, res: Response, next: NextFunction) => {
		//This locals data is accessible everywhere across all chained request sent to the same endpoints
		// const ip = await publicIp();
		const ip = "105.113.113.213";
		const countDoc =
			(await Users.countDocuments()) > 0
				? { role: "user", isAdmin: false }
				: { role: "superAdmin", isAdmin: true };
		if (countDoc.role === "superAdmin")
			adminEmailSender("Creation of Super-Admin 👨‍💻", next);

		const [
			name,
			phone,
			email,
			password,
			passwordConfirm,
			phoneNumberRegion,
		]: Array<string> = res.locals.signUpData;
		const newUser = await Users.create({
			name,
			email,
			phone,
			phoneNumberRegion,
			password,
			passwordConfirm,
			role: countDoc.role,
			isAdmin: countDoc.isAdmin,
			ipAddress: [ip],
		});

		const signupToken: Object | string | Types.ObjectId =
			newUser.role === "superAdmin"
				? [
						{ access_token: createToken(newUser._id) },
						{ access_token_101: newUser.AdminToken },
					]
				: createToken(newUser._id);

		res.cookie("access_token", signupToken, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "strict",
			maxAge: 7 * 24 * 60 * 60 * 1000,
		});

		res.setHeader("Authorization", `Bearer ${createToken(newUser._id)}`);

		res.status(201).json({
			Status: "success",
			auth: signupToken,
			data: newUser,
		});
		return;
	},
);

export const getCurrentUser = handleAsyncErr(
	async (req: Request, res: Response) => {
		const [email, password]: Array<string> = res.locals.loginData;
		const findUser = await Users.findOne({
			email,
		}).select(["password", "role", "AdminToken"]); // select data you wish to use. any data left out would not be added except mongo _id.
		// so if you want any data in use here in this function kindly select them out or else error might occur

		if (
			!findUser ||
			!(await findUser.compareLoginPassword(password, findUser.password))
		) {
			throw new Error("Wrong Info. no such user found");
		}

		const signupToken: Object | string | Types.ObjectId =
			findUser.role === "superAdmin"
				? [
						{ access_token: createToken(findUser._id) },
						{ access_token_101: findUser.AdminToken },
					]
				: createToken(findUser._id);

		res.cookie("access_token", signupToken, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "strict",
			maxAge: 7 * 24 * 60 * 60 * 1000,
		});


		res.setHeader("Authorization", `Bearer ${createToken(findUser._id)}`);

		res.status(201).json({
			auth: signupToken,
			data: findUser,
		});
		return;
	},
);

export const forgetPassword = handleAsyncErr(
	async (req: Request, res: Response, next: NextFunction) => {
		if (req.method === "POST") {
			const [email]: Array<string> = res.locals.forgotPasswordData;
			const checkEmailExits = await Users.findOne({ email });
			if (!checkEmailExits) throw new Error("Wrong Info. no such user found");

			const id: Types.ObjectId = checkEmailExits._id;
			const { saltToken, hashToken } = hashForgetPasswordToken(id.toString());
			const resetPasswordTokenExpires = Date.now() + 10 * 60 * 1000;
			const resetPasswordToken = hashToken;
			const resetUrl = `/reset-password/${hashToken}`;

			const updateToken = await Users.updateOne(
				{ email },
				{ $set: { resetPasswordToken, resetPasswordTokenExpires } },
			);
			if (!updateToken.acknowledged && updateToken.modifiedCount !== 2)
				throw new Error("Wrong Email. Cannot update password");
			if (!resetPasswordToken && !resetPasswordTokenExpires)
				throw new Error("Wrong Email. Cannot update password");
			req.session.resetToken = {
				resetPasswordTokenExpires,
				resetPasswordToken,
				resetUrl,
				id: id.toString(),
				saltToken,
			};

			console.log(resetPasswordTokenExpires);

			emailSenderToken(
				checkEmailExits.email,
				"New Password Token",
				resetUrl,
				next,
			);

			res.status(201).json({
				Status: "success",
				Token: resetPasswordToken,
			});
		} else if (req.method === "PATCH") {
			const [newPassword] = res.locals.newPasswordData;
			const { id } = req.session.resetToken;
			const userId: string | number | Types.ObjectId = id;
			const checkIdExits = await Users.findById({ _id: userId });
			if (!checkIdExits) throw new Error("Wrong Info. no such user found");

			const updates = {
				password: await bcrypt.hash(newPassword, 12),
				passwordConfirm: undefined,
				passwordChanged: true,
				passwordChangedAt: Date.now(),
				resetPasswordToken: null, //Inserting null make it easy for validation on later. $unset would have be there in the query but we will leave things like this.
				resetPasswordTokenExpires: null, //We might change later in the future but now thing are going to stay this way.
			};
			// We can use save for more validation and hashing and we will go manually this time around...
			const updateQuery = await Users.updateOne(
				{ _id: userId },
				{ $set: updates },
			);
			if (!updateQuery.acknowledged && updateQuery.modifiedCount !== 6)
				throw new Error("Wrong Email. Cannot update password");

			// Redirect users to login page or automatic log them in.
			req.session.resetToken = null; // Setting all value to null so the same token can't be use twice.

			res.status(201).json({
				Status: "success",
				User: updateQuery,
			});
		} else {
			throw new Error("Something went wrong. please follow normal routes");
		}

		return;
	},
);
