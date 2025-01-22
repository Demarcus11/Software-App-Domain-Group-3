import express from "express";
import userAuthController from "../controllers/userAuthController.js";
import validateRequest from "../middleware/validateRequestMiddleware.js";
import registerSchema from "../dataSchemas/registerSchema.js";

const userAuthRouter = express.Router();

// Endpoints
userAuthRouter.post(
  "/register",
  validateRequest(registerSchema),
  userAuthController.asyncRegisterUser
);
userAuthRouter.post("/login", userAuthController.asyncLoginUser);
userAuthRouter.post("/forgot-password", userAuthController.asyncForgotPassword);
userAuthRouter.post("/reset-password", userAuthController.asyncResetPassword);
userAuthRouter.get("/approve-user/:id", userAuthController.asyncApproveUser);
userAuthRouter.get("/reject-user/:id", userAuthController.asyncRejectUser);

export default userAuthRouter;
