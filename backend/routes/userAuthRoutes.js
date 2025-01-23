import express from "express";
import userAuthController from "../controllers/userAuthController.js";
import validateRequest from "../middleware/validateRequestMiddleware.js";
import registerSchema from "../dataSchemas/registerSchema.js";
import loginSchema from "../dataSchemas/loginSchema.js";
import resetpasswordSchema from "../dataSchemas/resetPasswordSchema.js";

const userAuthRouter = express.Router();

// Endpoints
userAuthRouter.post(
  "/register",
  validateRequest(registerSchema),
  userAuthController.asyncRegisterUser
);
userAuthRouter.post(
  "/login",
  validateRequest(loginSchema),
  userAuthController.asyncLoginUser
);
userAuthRouter.get("/approve-user/:id", userAuthController.asyncApproveUser);
userAuthRouter.get("/reject-user/:id", userAuthController.asyncRejectUser);
userAuthRouter.post("/forgot-password", userAuthController.asyncForgotPassword);
userAuthRouter.post(
  "/reset-password",
  validateRequest(resetpasswordSchema),
  userAuthController.asyncResetPassword
);

export default userAuthRouter;
