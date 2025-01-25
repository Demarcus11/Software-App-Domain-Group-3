import prisma from "../config/prismaClient.js";
import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import asyncSendEmail from "../utils/sendEmail.js";
import generateJWT from "../utils/generateJWT.js";
import generateUsername from "../utils/generateUsername.js";
import getSuspensionMessage from "../utils/suspensionMessage.js";

// TODO: Update links to https://software-app-domain-group-3.onrender.com

const predefinedSecurityQuestions = [
  { id: 1, question: "What is your favorite food?" },
  { id: 2, question: "What is your first pet name?" },
  { id: 3, question: "What city were you born in?" },
];

const PASSWORD_EXPIRATION_TIME = 10 * 24 * 60 * 60 * 1000; // 10 days
const MAX_LOGIN_ATTEMPTS = 3;
const SUSPENSION_LENGTH_IN_MINUTES = 30;

let users = [
  {
    id: 1,
    username: `${generateUsername({ firstName: "Jane", lastName: "Smith" })}`,
    email: "example@gmail.com",
    password: "$whdwdwbwu1627193j3eu2e8920i2282282e92unw",
    role: "accountant",
    passwordResetToken: null,
    passwordResetExpiry: null,
    firstName: "Jane",
    lastName: "Smith",
    profilePicture:
      "https://www.gravatar.com/avatar/205e460b479e2e5b48aec07710c08d50?f=y",
    isActive: true,
    isSuspended: false,
    loginAttempts: 0,
    suspensionStarts: null,
    suspensionEnds: null,
    passwordExpiresAt: new Date(Date.now() + PASSWORD_EXPIRATION_TIME),
    lastPasswordChangeAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    securityQuestion: {
      id: 1,
      question: "What is your favorite food?",
      answer: "$2a$10$wHq8z8",
    },
    passwordHistory: [
      {
        id: 1,
        userId: 1,
        oldPassword: "$dwndwoowmowdinwdw72829283uiefk",
        createdAt: new Date(),
        isExpired: false,
      },
    ],
    accessRequests: [
      {
        id: 1,
        userId: 1,
        firstName: "Jane",
        lastName: "Smith",
        email: "example@gmail.com",
        address: "123 Main St, Kennesaw, GA 30144",
        dateOfBirth: "1999-01-01",
        status: "pending",
        createdAt: new Date(),
      },
    ],
  },
];

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
    profilePicture,
    securityQuestion,
  } = req.body;

  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const username = generateUsername({ firstName, lastName });

    const securityQuestionExists = await prisma.securityQuestion.findFirst({
      where: {
        id: securityQuestion.id,
      },
    });

    if (!securityQuestionExists) {
      const err = new Error("Invalid security question");
      err.status = 400;
      return next(err);
    }

    const roleExists = await prisma.role.findFirst({
      where: {
        id: roleId,
      },
    });

    if (!roleExists) {
      const err = new Error("Invalid role");
      err.status = 400;
      return next(err);
    }

    const hashedSecurityQuestionAnswer = bcrypt.hashSync(
      securityQuestion.answer,
      10
    );

    let user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        address,
        dateOfBirth,
        roleId,
        profilePicture,
        username,
        securityQuestionId: securityQuestion.id,
        securityAnswer: hashedSecurityQuestionAnswer,
      },
    });

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

    const role = await prisma.role.findUnique({
      where: {
        id: roleId,
      },
    });

    const approveLink = `${process.env.BASE_URL}/api/auth/approve-user/${user.id}`;
    const rejectLink = `${process.env.BASE_URL}/api/auth/reject-user/${user.id}`;

    const emailText = `
      User account details:
      - First Name: ${firstName}
      - Last Name: ${lastName}
      - Email: ${email}
      - Role: ${role.name}

      Click the link below to approve or deny this request:
      - Approve: ${approveLink}
      - Reject: ${rejectLink}
    `;

    await asyncSendEmail({
      to: "ksuappdomainmanager@gmail.com",
      subject: "New user account creation request",
      text: emailText,
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      if (err.meta.target.includes("email")) {
        return res.status(400).json({
          message: "Email is already in use. Please try another one",
        });
      }
    }

    console.error(err);
    const error = new Error("Server error, please try again later");
    error.status = 500;
    return next(error);
  }

  res.status(200).json({
    msg: "Email sent to admin for approval, check your email for updates",
  });
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
  const { username, password } = req.body;

  let user;

  user = users.find((user) => user.username === username);

  if (!user) {
    const err = new Error("Account not found");
    err.status = 404;
    return next(err);
  }

  try {
    const passwordAgeInMilliseconds =
      Date.now() - new Date(user.createdAt).getTime();
    const passwordAgeInDays = passwordAgeInMilliseconds / (1000 * 60 * 60 * 24);

    if (passwordAgeInDays > PASSWORD_EXPIRATION_TIME / (1000 * 60 * 60 * 24)) {
      user.isExpired = true;
    } else {
      user.isExpired = false;
    }

    if (user.isSuspended) {
      const currentTime = new Date();
      if (currentTime >= user.suspensionEnds) {
        user.isSuspended = false;
        user.suspensionStarts = null;
        user.suspensionEnds = null;
      } else {
        const err = new Error(getSuspensionMessage(user.suspensionEnds));
        err.status = 403;
        return next(err);
      }
    }

    if (!user.isActive) {
      const err = new Error("This account is not active");
      err.status = 403;
      return next(err);
    }

    if (new Date() > user.passwordExpiresAt) {
      const err = new Error(
        "Your password has expired. Please reset your password"
      );
      err.status(403);
      return next(err);
    }

    if (await bcrypt.compare(password, user.password)) {
      user.loginAttempts = 0;
      return res.status(200).json({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture,
        token: generateJWT(user.id),
      });
    } else {
      user.loginAttempts += 1;

      if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
        user.isSuspended = true;
        user.suspensionStarts = new Date();
        user.suspensionEnds = new Date(
          Date.now() + SUSPENSION_LENGTH_IN_MINUTES * 60 * 1000
        );

        // Immediately show the suspension message
        const err = new Error(getSuspensionMessage(user.suspensionEnds));
        err.status = 403;
        return next(err);
      }

      const err = new Error(
        `Invalid credentials, you have ${
          MAX_LOGIN_ATTEMPTS - user.loginAttempts
        } remaining attempt(s)`
      );
      err.status = 401;
      return next(err);
    }
  } catch (err) {
    console.error(err);
    const error = new Error("Server error, please try again later");
    error.status = 500;
    return next(error);
  }
};

/* @desc      Forgot password
   @endpoint  POST /auth/forgot-password
   @access    Public
*/
export const asyncForgotPassword = async (req, res, next) => {
  const { username, securityAnswer } = req.body;

  const user = users.find((user) => user.username === username);

  if (!user) {
    const err = new Error("Account not found");
    err.status = 404;
    return next(err);
  }

  if (!bcrypt.compareSync(securityAnswer, user.securityQuestion.answer)) {
    const err = new Error("Incorrect security question answer");
    err.status = 401;
    return next(err);
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  const resetTokenExpiry = new Date(Date.now() + 1000 * 60 * 10); // 10 minutes

  user.passwordResetToken = resetToken;
  user.passwordResetExpiry = resetTokenExpiry;

  const resetLink = `${process.env.BASE_URL}/api/auth/reset-password?token=${resetToken}`;
  const emailText = `
  Password reset link: ${resetLink}
  `;

  try {
    await asyncSendEmail({
      to: user.email,
      subject: "Password reset",
      text: emailText,
    });
  } catch (err) {
    console.error(err);
    const error = new Error("Server error, please try again later");
    error.status = 500;
    return next(error);
  }

  res.status(200).json({ msg: "Password reset link sent to your email" });
};

/* @desc      Reset password
   @endpoint  POST /auth/reset-password
   @access    Public
*/
export const asyncResetPassword = async (req, res, next) => {
  const { token } = req.query;
  const { newPassword } = req.body;

  const user = users.find((user) => user.passwordResetToken === token);

  if (!user) {
    const err = new Error("Invalid password reset token");
    err.status = 400;
    return next(err);
  }

  if (new Date() > user.passwordResetExpiry) {
    const err = new Error("Password reset token has expired");
    err.status = 400;
    return next(err);
  }

  const passwordUsedBefore = await Promise.all(
    user.passwordHistory.map(async (entry) => {
      const match = await bcrypt.compare(newPassword, entry.oldPassword);
      return match;
    })
  );

  const passwordUsedBeforeMatch = passwordUsedBefore.some(
    (match) => match === true
  );

  if (passwordUsedBeforeMatch) {
    const err = new Error(
      "Password has been used before. Please use a different password"
    );
    err.status = 400;
    return next(err);
  }

  if (user.passwordHistory.length > 0) {
    user.passwordHistory[user.passwordHistory.length - 1].isExpired = true;
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);
  user.password = hashedPassword;
  user.passwordResetToken = null;
  user.passwordResetExpiry = null;
  user.lastPasswordChangeAt = new Date();
  user.passwordExpiresAt = new Date(Date.now() + PASSWORD_EXPIRATION_TIME);
  user.passwordHistory.push({
    id: user.passwordHistory.length + 1,
    userId: user.id,
    oldPassword: hashedPassword,
    createdAt: new Date(),
  });

  res.status(200).json({ msg: "Password has been reset" });
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

  const user = await prisma.user.findUnique({
    where: {
      id: parseInt(id),
    },
  });

  if (!user) {
    const err = new Error("Account not found");
    err.status = 404;
    return next(err);
  }

  if (user.isActive) {
    return res.status(400).send("This account has already been approved");
  }

  const accessRequest = await prisma.accessRequest.findFirst({
    where: {
      userId: parseInt(id),
      statusId: 1,
    },
  });

  if (!accessRequest) {
    return res.status(400).send("Access request not found");
  }

  await prisma.accessRequest.update({
    where: {
      id: accessRequest.id,
    },
    data: {
      statusId: 2,
    },
  });

  await prisma.user.update({
    where: {
      id: parseInt(id),
    },
    data: {
      isActive: true,
    },
  });

  const loginLink = `${process.env.BASE_URL}/api/auth/login`;
  const emailText = `
  Your account has been approved. Your username is ${user.username}

  Click the link below to login:
  - Login: ${loginLink}
  `;

  try {
    await asyncSendEmail({
      to: user.email,
      subject: "Account approved",
      text: emailText,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).send("Error sending email");
  }

  return res.send(`User approved, email sent to ${user.email}`);
};

export const asyncRejectUser = async (req, res, next) => {
  const { id } = req.params;

  const user = users.find((user) => user.id === parseInt(id));

  if (!user) {
    const err = new Error("User not found");
    err.status = 404;
    return next(err);
  }

  if (user.isActive) {
    return res
      .status(400)
      .send("Your account has already been approved, check your email");
  }

  const rejectedAccessRequest = user.accessRequests.find(
    (request) =>
      request.userId === parseInt(id) && request.status === "rejected"
  );
  if (rejectedAccessRequest) {
    return res.status(400).send("Access request already rejected");
  }

  const accessRequest = user.accessRequests.find(
    (request) => request.userId === parseInt(id) && request.status === "pending"
  );

  if (!accessRequest) {
    return res.status(400).send("Access request not found");
  }

  accessRequest.status = "rejected";
  user.isActive = false;

  const emailText = `
  Your account has been rejected.
  `;

  try {
    await asyncSendEmail({
      to: user.email,
      subject: "Account rejected",
      text: emailText,
    });
  } catch (err) {
    console.error("Error sending email", err);
    return res.status(500).send("Error sending email");
  }

  return res.send("User rejected, email sent to user");
};

export default {
  asyncRegisterUser,
  asyncLoginUser,
  asyncForgotPassword,
  asyncResetPassword,
  asyncApproveUser,
  asyncRejectUser,
};
