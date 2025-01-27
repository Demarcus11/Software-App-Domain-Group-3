import prisma from "../config/prismaClient.js";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";

const SUSPENSION_LENGTH_IN_MINUTES = 30;
const PASSWORD_EXPIRATION_TIME = 10 * 24 * 60 * 60 * 1000; // 10 days
export const MAX_LOGIN_ATTEMPTS = 3;

export const findUserByUsername = async (username) => {
  return await prisma.user.findFirst({
    where: {
      username: username,
    },
  });
};

export const findUserById = async (userId) => {
  return await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });
};

export const isPasswordExpired = (user) => {
  const passwordAgeInDays =
    (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24);
  return passwordAgeInDays > PASSWORD_EXPIRATION_TIME / (1000 * 60 * 60 * 24);
};

export const expirePassword = async (userId) => {
  return await prisma.passwordHistory.update({
    where: { id: userId },
    data: { expired: true },
  });
};

export const isPasswordValid = async (user, password) => {
  return await bcrypt.compare(password, user.password);
};

export const isUserSuspended = (user) => {
  if (user.failedLoginAttempts >= MAX_LOGIN_ATTEMPTS) {
    if (user.isSuspended) {
      return true;
    } else {
      return true;
    }
  }
  return false;
};

const suspendUser = async (userId) => {
  return await prisma.user.update({
    where: { id: userId },
    data: {
      isSuspended: true,
      suspensionStart: new Date(),
      suspensionEnd: new Date(
        Date.now() + SUSPENSION_LENGTH_IN_MINUTES * 60 * 1000
      ),
    },
  });
};

const isSuspensionOver = (suspensionEnd) => {
  return new Date(suspensionEnd) <= new Date();
};

export const handleFailedLoginAttempts = async (userId) => {
  return await prisma.user.update({
    where: { id: userId },
    data: { failedLoginAttempts: { increment: 1 } },
  });
};

export const resetFailedLoginAttempts = async (userId) => {
  await prisma.user.update({
    where: { id: userId },
    data: { failedLoginAttempts: 0 },
  });
};

export const unsuspendUser = async (userId) => {
  await prisma.user.update({
    where: { id: userId },
    data: {
      isSuspended: false,
      suspensionStart: null,
      suspensionEnd: null,
    },
  });
};

export const generateUsername = ({ firstName, lastName }) => {
  // Format: FirstlastMMYY
  return `${firstName.slice(0, 1)}${lastName.toLowerCase()}${(
    new Date().getMonth() + 1
  )
    .toString()
    .padStart(2, "0")}${new Date().getFullYear().toString().slice(-2)}`;
};

export const sendEmail = async ({ text, subject, to }) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const result = await transporter.sendMail({
    from: process.env.EMAIL_USERNAME,
    to,
    subject,
    text,
  });

  console.log(JSON.stringify(result, null, 4));
};

export const generateJWT = (id) => {
  return jwt.sign({ id }, process.env.TOKEN_SECRET, {
    expiresIn: "30d",
  });
};

export const getSuspensionMessage = (suspensionEnds) => {
  const currentTime = new Date();
  suspensionEnds = new Date(suspensionEnds);
  const timeDifference = suspensionEnds - currentTime;
  const minutesRemaining = Math.ceil(timeDifference / (60 * 1000));

  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  const relativeTimeMessage =
    minutesRemaining > 60
      ? rtf.format(Math.ceil(minutesRemaining / 60), "hours")
      : rtf.format(minutesRemaining, "minutes");

  return `Account is suspended, try again ${relativeTimeMessage}`;
};

export const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

export const hashSecurityAnswer = async (securityAnswer) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(securityAnswer, salt);
};

export const findUserPendingAccessRequest = async (userId) => {
  return await prisma.accessRequest.findFirst({
    where: {
      userId: userId,
      statusId: 1,
    },
  });
};

export const approveUserAccessRequest = async (userId) => {
  await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      isActive: true,
    },
  });

  await prisma.accessRequest.updateMany({
    where: {
      id: userId,
    },
    data: {
      statusId: 2,
    },
  });
};

export default {
  findUserByUsername,
  findUserById,
  isPasswordExpired,
  expirePassword,
  isPasswordValid,
  isUserSuspended,
  handleFailedLoginAttempts,
  resetFailedLoginAttempts,
  unsuspendUser,
  generateUsername,
  getSuspensionMessage,
  suspendUser,
  hashPassword,
  hashSecurityAnswer,
  generateJWT,
  sendEmail,
  findUserPendingAccessRequest,
  approveUserAccessRequest,
  isSuspensionOver,
  MAX_LOGIN_ATTEMPTS,
};
