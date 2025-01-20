import express from "express";
import userAuthController from "../controllers/userAuthController.js";

const userAuthRouter = express.Router();

// Endpoints
userAuthRouter.post("/register", userAuthController.asyncRegisterUser);
userAuthRouter.post("/login", userAuthController.asyncLoginUser);
userAuthRouter.post("/forgot-password", userAuthController.asyncForgotPassword);
userAuthRouter.post("/reset-password", userAuthController.asyncResetPassword);

export default userAuthRouter;
