import express from "express";
import userAuthController from "../controllers/userAuthController.js";
import validateRequest from "../middleware/validateRequestMiddleware.js";
import registerSchema from "../dataSchemas/registerSchema.js";
import loginSchema from "../dataSchemas/loginSchema.js";
import resetpasswordSchema from "../dataSchemas/resetPasswordSchema.js";
import multer from "multer";
import cleanupFileOnFailure from "../middleware/cleanUpFileOnFailureMiddleware.js";

const userAuthRouter = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + "-" + file.originalname);
  },
});
const upload = multer({ storage });

// Endpoints
userAuthRouter.post(
  "/register",
  upload.single("profilePicture"),
  cleanupFileOnFailure,
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
userAuthRouter.get(
  "/security-questions",
  userAuthController.asyncGetAllSecurityQuestions
);
userAuthRouter.get("/roles", userAuthController.asyncGetAllRoles);
userAuthRouter.get(
  "/security-question",
  userAuthController.asyncGetSecurityQuestion
);

export default userAuthRouter;
