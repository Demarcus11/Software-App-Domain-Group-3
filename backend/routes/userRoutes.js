import protect from "../middleware/protectMiddleware.js";
import express from "express";
import userRoutesController from "../controllers/userRoutesController.js";

const userRouter = express.Router();

userRouter.get("/profile", protect, userRoutesController.asyncGetUserProfile);
userRouter.get(
  "/security-questions",
  userRoutesController.asyncGetUserSecurityQuestion
);
userRouter.post(
  "/security-questions/verify",
  userRoutesController.asyncVerifySecurityQuestions
);

export default userRouter;
