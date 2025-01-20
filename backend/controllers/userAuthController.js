import prisma from "../config/prismaClient.js";

/* @desc      Register a user
   @endpoint  POST /register
   @access    Public
*/
export const asyncRegisterUser = async (req, res, next) => {
  res.status(200).json({ msg: "Register User" });
};

/* @desc      Authenticate a user 
   @endpoint  POST /login
   @access    Public
*/
export const asyncLoginUser = async (req, res, next) => {
  res.status(200).json({ msg: "Login User" });
};

/* @desc      Forgot password
   @endpoint  POST /forgot-password
   @access    Public
*/
export const asyncForgotPassword = async (req, res, next) => {
  res.status(200).json({ msg: "Forgot password" });
};

/* @desc      Reset password
   @endpoint  POST /reset-password
   @access    Public
*/
export const asyncResetPassword = async (req, res, next) => {
  res.status(200).json({ msg: "Reset password" });
};

export default {
  asyncRegisterUser,
  asyncLoginUser,
  asyncForgotPassword,
  asyncResetPassword,
};
