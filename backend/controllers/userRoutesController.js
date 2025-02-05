import prisma from "../config/prismaClient.js";
import { getErrorMessage } from "../config/prismaClient.js";
import { Prisma } from "@prisma/client";
import userAuthUtils from "../utils/userAuthUtils.js";
import crypto from "crypto";
import bcrypt from "bcryptjs";

/* @desc      Get a user's profile
   @endpoint  GET /users/dashboard
   @access    Private
*/
export const asyncGetUserProfile = async (req, res, next) => {
  res.status(200).json(req.user);
};

/* @desc      Get a user's security questions
   @endpoint  GET /users/security-questions?token=:token
   @access    Private
*/
export const asyncGetUserSecurityQuestion = async (req, res, next) => {
  const { token } = req.query;

  if (!token) {
    const { message, httpStatusCode } = await getErrorMessage("12", {}); // Add a new error code for missing token
    const error = new Error(message);
    error.status = httpStatusCode;
    return next(error);
  }

  try {
    const user = await userAuthUtils.findUserByResetToken(token);

    if (!user || user.passwordResetTokenExpiry < new Date()) {
      const { message, httpStatusCode } = await getErrorMessage("10", {});
      const error = new Error(message);
      error.status = httpStatusCode;
      next(error);
      return;
    }

    const userSecurityQuestionIds = await prisma.userSecurityQuestion.findMany({
      where: {
        userId: user.id,
      },
      select: {
        securityQuestionId: true,
      },
    });

    const userSecurityQuestions = await prisma.securityQuestion.findMany({
      where: {
        id: {
          in: userSecurityQuestionIds.map(
            (question) => question.securityQuestionId
          ),
        },
      },
    });

    res.status(200).json(userSecurityQuestions);
  } catch (err) {
    console.log(err);
  }
};

/* @desc      Verify a user's security question answers
   @endpoint  POST /users/security-questions/verfiy?token=:token
   @access    Private
*/
export const asyncVerifySecurityQuestions = async (req, res, next) => {
  const { answers } = req.body;
  const { token } = req.query;

  if (!token) {
    const { message, httpStatusCode } = await getErrorMessage("9", {});
    const error = new Error(message);
    error.status = httpStatusCode;
    return next(error);
  }

  try {
    const user = await prisma.user.findUnique({
      where: {
        passwordResetToken: token,
      },
      include: {
        securityQuestions: {
          include: {
            securityQuestion: true,
          },
        },
      },
    });

    if (!user || user.passwordResetTokenExpiry < new Date()) {
      const { message, httpStatusCode } = await getErrorMessage("10", {});
      const error = new Error(message);
      error.status = httpStatusCode;
      next(error);
      return;
    }

    const correctAnswers = user.securityQuestions.map((question) => ({
      questionId: question.securityQuestionId,
      answer: question.answer,
    }));

    const isMatch = await Promise.all(
      answers.map(async (userAnswer) => {
        const correctAnswer = correctAnswers.find(
          (ca) => ca.questionId === userAnswer.questionId
        );

        if (!correctAnswer) return false;

        return await bcrypt.compare(
          userAnswer.answer.toLowerCase(),
          correctAnswer.answer
        );
      })
    );

    if (!isMatch.every((match) => match)) {
      const { message, httpStatusCode } = await getErrorMessage("9", {});
      const error = new Error(message);
      error.status = httpStatusCode;
      return next(error);
    }

    res.status(200).json({ message: "Security answers verified successfully" });
  } catch (err) {
    console.log(err);
    next(err);
  }
};

export default {
  asyncGetUserProfile,
  asyncGetUserSecurityQuestion,
  asyncVerifySecurityQuestions,
};
