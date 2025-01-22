import bcrypt from "bcryptjs";
import asyncSendEmail from "../utils/sendEmail.js";

let users = [
  {
    id: 1,
    username: `JSmith${new Date().getMonth() + 1} ${new Date()
      .getFullYear()
      .toString()
      .slice(-2)}`,
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
    suspensionStarts: null,
    suspensionEnds: null,
    passwordExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    securityQuestions: [
      {
        id: 1,
        userId: 1,
        question: "What is your favorite food?",
        answer: "Pizza",
      },
    ],
    passwordHistory: [
      {
        id: 1,
        userId: 1,
        oldPassword: "Kennesaw11",
        createdAt: new Date(),
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
  - user is put into the system
  - email is sent to admin email: ksuappdomainmanager@gmail.com
  - click link in email to approve or deny request
  */
  const {
    email,
    password,
    firstName,
    lastName,
    role = "User",
    profilePicture = null,
    securityQuestions,
  } = req.body;

  const id = users.length + 1;

  if (!email || !password || !firstName || !lastName || !securityQuestions) {
    const err = new Error("Please provide all required fields.");
    err.status = 400;
    return next(err);
  }

  const user = users.find((user) => user.email === email);

  if (user) {
    const err = new Error("This email is already in use. Try another email.");
    err.status = 400;
    return next(err);
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  const username = `${firstName.slice(0, 1)}${lastName.toLowerCase()}${(
    new Date().getMonth() + 1
  )
    .toString()
    .padStart(2, "0")}${new Date().getFullYear().toString().slice(-2)}`;

  const nextAccessRequestId =
    users.reduce(
      (maxId, user) => Math.max(maxId, user.accessRequests.length),
      0
    ) + 1;
  const newUser = {
    id,
    firstName,
    lastName,
    email,
    password: hashedPassword,
    role,
    profilePicture,
    username,
    securityQuestions,
    accessRequests: [
      {
        id: nextAccessRequestId,
        userId: id,
        firstName,
        lastName,
        email,
        address: "123 Main St, Kennesaw, GA 30144",
        dateOfBirth: "1999-01-01",
        status: "pending",
        createdAt: new Date(),
      },
    ],
  };

  users.push(newUser);

  const approveLink = `http://localhost:5000/api/auth/approve-user/${id}`;
  const rejectLink = `http://localhost:5000/api/auth/reject-user/${id}`;

  // Send email to admin email: ksuappdomainproject@gmail.com
  const emailText = `
  User account details:
  - First Name: ${firstName}
  - Last Name: ${lastName}
  - Email: ${email}
  - Role: ${role}

  Click the link below to approve or deny this request:
  - Approve: ${approveLink}
  - Reject: ${rejectLink}
  `;
  try {
    await asyncSendEmail({
      to: "ksuappdomainmanager@gmail.com",
      subject: "New user account creation request",
      text: emailText,
    });
  } catch (error) {
    console.error(error);
  }

  res.status(200).json({
    msg: "Email sent to admin for approval, check your email for updates",
  });
};

/* @desc      Authenticate a user 
   @endpoint  POST /auth/login
   @access    Public
*/
export const asyncLoginUser = async (req, res, next) => {
  res.status(200).json({ msg: "Login User" });
};

/* @desc      Forgot password
   @endpoint  POST /auth/forgot-password
   @access    Public
*/
export const asyncForgotPassword = async (req, res, next) => {
  res.status(200).json({ msg: "Forgot password" });
};

/* @desc      Reset password
   @endpoint  POST /auth/reset-password
   @access    Public
*/
export const asyncResetPassword = async (req, res, next) => {
  res.status(200).json({ msg: "Reset password" });
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

  const accessRequest = user.accessRequests.find(
    (request) => request.userId === parseInt(id) && request.status === "pending"
  );

  if (!accessRequest) {
    return res.status(400).send("Access request not found");
  }

  accessRequest.status = "approved";
  user.isActive = true;

  // FIXME: update login link to the frontend login page
  const loginLink = `http://localhost:5000/api/auth/login`;
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
  }

  return res.send("User approved, email sent to user");
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

  // FIXME: update login link to the frontend login page
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
    console.error(err);
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
