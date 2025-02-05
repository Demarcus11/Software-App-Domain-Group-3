import prisma from "../config/prismaClient.js";
import { getErrorMessage } from "../config/prismaClient.js";
import { Prisma } from "@prisma/client";
import userAuthUtils from "../utils/userAuthUtils.js";
import crypto from "crypto";
import bcrypt from "bcryptjs";

// TODO: Update links to https://software-app-domain-group-3.onrender.com

/* @desc      Register a user
   @endpoint  POST /register
   @access    Public
*/
export const asyncRegisterUser = async (req, res, next) => {
  /*
  - new user is put into the system
  - email is sent to admin email: ksuappdomainmanager@gmail.com
  - admin clicks link in email to approve or deny request
  - approve or reject function runs
  */
  const {
    email,
    password,
    firstName,
    lastName,
    address,
    dateOfBirth,
    roleId,
    securityQuestions,
  } = req.body;

  try {
    const questionIds = securityQuestions.map(({ questionId }) => questionId);
    const unqiueQuestionIds = new Set(questionIds);

    if (unqiueQuestionIds.size !== questionIds.length) {
      const { message, httpStatusCode } = await getErrorMessage("17", {});
      const err = new Error(message);
      err.status = httpStatusCode;
      return next(err);
    }

    for (const { questionId } of securityQuestions) {
      const securityQuestionExists = await prisma.securityQuestion.findFirst({
        where: { id: questionId },
      });

      if (!securityQuestionExists) {
        const { message, httpStatusCode } = await getErrorMessage("1", {
          securityQuestionId: questionId,
        });
        const err = new Error(message);
        err.status = httpStatusCode;
        return next(err);
      }
    }

    const roleExists = await prisma.role.findFirst({
      where: { id: roleId },
    });

    if (!roleExists) {
      const { message, httpStatusCode } = await getErrorMessage("2", {
        roleId,
      });
      const err = new Error(message);
      err.status = httpStatusCode;
      return next(err);
    }

    const hashedPassword = await userAuthUtils.hashPassword(password);

    const username = userAuthUtils.generateUsername({ firstName, lastName });

    const profilePicturePath = req.file ? req.file.path : null;

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        address,
        dateOfBirth,
        roleId,
        profilePicture: profilePicturePath,
        username,
      },
    });

    userAuthUtils.generateJWT(user.id);

    for (const { questionId, answer } of securityQuestions) {
      const hashedAnswer = await userAuthUtils.hashSecurityAnswer(
        answer.toLowerCase()
      );
      await prisma.userSecurityQuestion.create({
        data: {
          userId: user.id,
          securityQuestionId: questionId,
          answer: hashedAnswer,
        },
      });
    }

    await prisma.accessRequest.create({
      data: {
        userId: user.id,
        firstName,
        lastName,
        email,
        address,
        dateOfBirth,
      },
    });

    await prisma.passwordHistory.create({
      data: {
        oldPassword: hashedPassword,
        isExpired: false,
        userId: user.id,
      },
    });

    const role = await prisma.role.findUnique({
      where: {
        id: roleId,
      },
    });

    const approveLink = `${process.env.BASE_URL}/api/auth/approve-user/${user.id}`;
    const rejectLink = `${process.env.BASE_URL}/api/auth/reject-user/${user.id}`;

    await userAuthUtils.sendEmail({
      to: "ksuappdomainmanager@gmail.com",
      subject: "New user account creation request",
      text: ` 
      User account details:
      - First Name: ${firstName}
      - Last Name: ${lastName}
      - Email: ${email}
      - Role: ${role.name}

      Click the link below to approve or deny this request:
      - Approve: ${approveLink}
      - Reject: ${rejectLink}
    `,
    });

    res.status(200).json({
      msg: "Email sent to admin at ksuappdomainmanager@gmail.com for approval, please wait for approval",
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      if (err.meta.target.includes("email")) {
        const { message, httpStatusCode } = await getErrorMessage("3", {});
        const err = new Error(message);
        err.status = httpStatusCode;
        return next(err);
      }
    }

    console.error(err);
    const { message, httpStatusCode } = await getErrorMessage("4", {});
    const error = new Error(message);
    error.status = httpStatusCode;
    return next(error);
  }
};

/* @desc      Login a user 
   @endpoint  POST /auth/login
   @access    Public
*/
export const asyncLoginUser = async (req, res, next) => {
  /*
  - user enters username and password
  - server sends users data and generated token to the client
  - client uses token to access protected routes
  */

  // TODO: fix invalid attempt logic to show even when username is not found
  const { username, password } = req.body;

  try {
    const user = await userAuthUtils.findUserByUsername(username);

    if (!user) {
      const { message, httpStatusCode } = await getErrorMessage("5", {});
      const err = new Error(message);
      err.status = httpStatusCode;
      return next(err);
    }

    if (userAuthUtils.isPasswordExpired(user)) {
      await expirePassword(user.id);
      const { message, httpStatusCode } = await getErrorMessage("6", {});
      const err = new Error(message);
      err.status = httpStatusCode;
      return next(err);
    }

    if (!user.isActive) {
      const { message, httpStatusCode } = await getErrorMessage("7", {});
      const err = new Error(message);
      err.status = httpStatusCode;
      return next(err);
    }

    if (await userAuthUtils.isPasswordValid(user, password)) {
      if (user.isSuspended) {
        if (userAuthUtils.isSuspensionOver(user.suspensionEnd)) {
          await userAuthUtils.unsuspendUser(user.id);
          await resetFailedLoginAttempts(user.id);
        } else {
          const err = new Error(
            userAuthUtils.getSuspensionMessage(user.suspensionEnd)
          );
          err.status = 403;
          return next(err);
        }
      }

      await userAuthUtils.resetFailedLoginAttempts(user.id);

      const updatedUser = await userAuthUtils.findUserByUsername(username);

      const token = userAuthUtils.generateJWT(updatedUser.id);

      return res.status(200).json({
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        roleId: updatedUser.roleId,
        profilePicture: updatedUser.profilePicture,
        token,
      });
    } else {
      const updatedUser = await userAuthUtils.handleFailedLoginAttempts(
        user.id
      );
      if (updatedUser.failedLoginAttempts >= userAuthUtils.MAX_LOGIN_ATTEMPTS) {
        const suspendedUser = await userAuthUtils.suspendUser(user.id);
        const err = new Error(
          userAuthUtils.getSuspensionMessage(suspendedUser.suspensionEnd)
        );
        err.status = 403;
        return next(err);
      }

      const remainingAttempts =
        userAuthUtils.MAX_LOGIN_ATTEMPTS - updatedUser.failedLoginAttempts;
      const { message, httpStatusCode } = await getErrorMessage("8", {
        remainingAttempts,
      });
      const err = new Error(message);
      err.status = httpStatusCode;
      return next(err);
    }
  } catch (err) {
    console.error(err);
    const { message, httpStatusCode } = await getErrorMessage("4", {});
    const error = new Error(message);
    error.status = httpStatusCode;
    return next(error);
  }
};

/* @desc      Forgot password
   @endpoint  POST /auth/forgot-password
   @access    Public
*/
export const asyncForgotPassword = async (req, res, next) => {
  const { username, email } = req.body;

  try {
    const user = await userAuthUtils.findUserByUsernameAndEmail({
      username,
      email,
    });

    if (!user) {
      const { message, httpStatusCode } = await getErrorMessage("5", {});
      const error = new Error(message);
      error.status = httpStatusCode;
      return next(error);
    }

    await userAuthUtils.resetUserResetToken(user.id);

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 1000 * 60 * 10); // 10 minutes

    await userAuthUtils.updateUserResetToken({
      userId: user.id,
      resetToken,
      resetTokenExpiry,
    });

    res.status(200).json({
      resetToken,
    });
  } catch (err) {
    console.error(err);
    const { message, httpStatusCode } = await getErrorMessage("4", {});
    const error = new Error(message);
    error.status = httpStatusCode;
    return next(error);
  }
};

/* @desc      Reset password
   @endpoint  POST /auth/reset-password
   @access    Public
*/
export const asyncResetPassword = async (req, res, next) => {
  const { token } = req.query;
  const { password } = req.body;

  try {
    const user = await userAuthUtils.findUserByResetToken(token);

    if (!user || user.passwordResetTokenExpiry < new Date()) {
      const { message, httpStatusCode } = await getErrorMessage("10", {});
      const error = new Error(message);
      error.status = httpStatusCode;
      return next(error);
    }

    const passwords = await prisma.passwordHistory.findMany({
      where: { userId: user.id },
    });

    const passwordUsedBefore = await Promise.all(
      passwords.map(async (entry) => {
        const match = await bcrypt.compare(password, entry.oldPassword);
        return match;
      })
    );

    const passwordUsedBeforeMatch = passwordUsedBefore.some((match) => match);

    if (passwordUsedBeforeMatch) {
      const { message, httpStatusCode } = await getErrorMessage("11", {});
      const error = new Error(message);
      error.status = httpStatusCode;
      return next(error);
    }

    if (passwords.length > 0) {
      const lastEntry = passwords[passwords.length - 1];
      await prisma.passwordHistory.update({
        where: { id: lastEntry.id },
        data: { isExpired: true },
      });
    }

    const hashedNewPassword = await bcrypt.hash(password, 10);

    await prisma.passwordHistory.create({
      data: {
        oldPassword: hashedNewPassword,
        isExpired: false,
        userId: user.id,
      },
    });

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedNewPassword,
        passwordResetToken: null,
        passwordResetTokenExpiry: null,
        lastPasswordChangeAt: new Date(),
      },
    });

    res.status(200).json({ msg: "Password has been reset" });
  } catch (err) {
    console.error(err);
    const { message, httpStatusCode } = await getErrorMessage("4", {});
    const error = new Error(message);
    error.status = httpStatusCode;
    return next(error);
  }
};

/* @desc      Approve user
   @endpoint  POST /auth/approve-user
   @access    Public
*/
export const asyncApproveUser = async (req, res, next) => {
  /*
  - if approval link is clicked, this functions runs
  - update user in system to approved and send email to user with link to login and their username
  NOTE: email sent to user may be in their spam folder depending on their email provider
  */
  const { id } = req.params;

  try {
    const user = await userAuthUtils.findUserById(id);

    if (!user) {
      const { message, httpStatusCode } = await getErrorMessage("5", {});
      const error = new Error(message);
      error.status = httpStatusCode;
      return next(error);
    }

    if (user.isActive) {
      const { message, httpStatusCode } = await getErrorMessage("12", {});
      const error = new Error(message);
      error.status = httpStatusCode;
      return next(error);
    }

    const pendingAccessRequest =
      await userAuthUtils.findUserPendingAccessRequest(id);

    if (!pendingAccessRequest) {
      const { message, httpStatusCode } = await getErrorMessage("13", {});
      const error = new Error(message);
      error.status = httpStatusCode;
      return next(error);
    }

    await userAuthUtils.approveUserAccessRequest(id);

    const loginLink = `${process.env.BASE_URL}/login`;
    const emailText = `
  Your account has been approved. Your username is ${user.username}

  Click the link below to login:
  - Login: ${loginLink}
  `;

    await userAuthUtils.sendEmail({
      to: user.email,
      subject: "Account approved",
      text: emailText,
    });

    return res.status(200).send(`User approved, email sent to ${user.email}`);
  } catch (err) {
    console.error(err);
    const { message, httpStatusCode } = await getErrorMessage("4", {});
    const error = new Error(message);
    error.status = httpStatusCode;
    return next(error);
  }
};

export const asyncRejectUser = async (req, res, next) => {
  const { id } = req.params;

  try {
    const user = await userAuthUtils.findUserById(id);

    if (!user) {
      const { message, httpStatusCode } = await getErrorMessage("5", {});
      const error = new Error(message);
      error.status = httpStatusCode;
      return next(error);
    }

    if (user.isActive) {
      const { message, httpStatusCode } = await getErrorMessage("14", {});
      const error = new Error(message);
      error.status = httpStatusCode;
      return next(error);
    }

    const pendingAccessRequest =
      await userAuthUtils.findUserPendingAccessRequest(id);

    if (!pendingAccessRequest) {
      const { message, httpStatusCode } = await getErrorMessage("13", {});
      const error = new Error(message);
      error.status = httpStatusCode;
      return next(error);
    }

    await userAuthUtils.rejectUserAccessRequest(id);

    const emailText = `Your account has been rejected.`;

    await userAuthUtils.sendEmail({
      to: user.email,
      subject: "Account rejected",
      text: emailText,
    });

    return res.status(200).send(`User rejected, email sent to ${user.email}`);
  } catch (err) {
    console.error(err);
    const { message, httpStatusCode } = await getErrorMessage("4", {});
    const error = new Error(message);
    error.status = httpStatusCode;
    return next(error);
  }
};

/* @desc      Get all security questions
   @endpoint  GET /auth/security-questions
   @access    Public
*/
export const asyncGetAllSecurityQuestions = async (req, res, next) => {
  try {
    const securityQuestions = await prisma.securityQuestion.findMany();

    if (securityQuestions.length === 0) {
      const { message, httpStatusCode } = await getErrorMessage("15", {});
      const error = new Error(message);
      error.status = httpStatusCode;
      return next(error);
    }

    res.status(200).json(securityQuestions);
  } catch (err) {
    console.error(err);
    const { message, httpStatusCode } = await getErrorMessage("4", {});
    const error = new Error(message);
    error.status = httpStatusCode;
    return next(error);
  }
};

/* @desc      Get all roles
   @endpoint  GET /auth/roles
   @access    Public
*/
export const asyncGetAllRoles = async (req, res, next) => {
  try {
    const roles = await prisma.role.findMany();

    if (roles.length === 0) {
      const { message, httpStatusCode } = await getErrorMessage("16", {});
      const error = new Error(message);
      error.status = httpStatusCode;
      return next(error);
    }

    res.status(200).json(roles);
  } catch (err) {
    console.error(err);
    const { message, httpStatusCode } = await getErrorMessage("4", {});
    const error = new Error(message);
    error.status = httpStatusCode;
    return next(error);
  }
};

/* @desc      Get a user's security question
   @endpoint  GET /auth/security-question
   @access    Public
*/
export const asyncGetSecurityQuestion = async (req, res, next) => {
  const { username } = req.body;

  try {
    const user = await prisma.user.findFirst({
      where: { username },
    });

    if (!user) {
      const { message, httpStatusCode } = await getErrorMessage("5", {});
      const err = new Error(message);
      err.status = httpStatusCode;
      return next(err);
    }

    const securityQuestion = await prisma.securityQuestion.findFirst({
      where: { id: user.securityQuestionId },
    });

    if (!securityQuestion) {
      const { message, httpStatusCode } = await getErrorMessage("1", {
        securityQuestionId: user.securityQuestionId,
      });
      const err = new Error(message);
      err.status = httpStatusCode;
      return next(err);
    }

    res.status(200).json(securityQuestion);
  } catch (err) {
    console.error(err);
    const { message, httpStatusCode } = await getErrorMessage("4", {});
    const error = new Error(message);
    error.status = httpStatusCode;
    return next(error);
  }
};

export default {
  asyncRegisterUser,
  asyncLoginUser,
  asyncForgotPassword,
  asyncResetPassword,
  asyncApproveUser,
  asyncRejectUser,
  asyncGetAllSecurityQuestions,
  asyncGetAllRoles,
  asyncGetSecurityQuestion,
};
