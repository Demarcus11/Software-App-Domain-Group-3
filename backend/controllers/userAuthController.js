import bcrypt from "bcryptjs";
import asyncSendEmail from "../utils/sendEmail.js";
import generateJWT from "../utils/generateJWT.js";
import generateUsername from "../utils/generateUsername.js";
import getSuspensionMessage from "../utils/suspensionMessage.js";

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
    loginAttempts: 0,
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
  // TODO: Update links to https://software-app-domain-group-3.onrender.com
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
    role = "User",
    profilePicture = null,
    securityQuestions,
  } = req.body;

  const id = users.length + 1;

  const user = users.find((user) => user.email === email);

  if (user) {
    const err = new Error("This email is already in use. Try another email.");
    err.status = 400;
    return next(err);
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  const username = generateUsername({ firstName, lastName });

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
    loginAttempts: 0,
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

  const approveLink = `${process.env.BASE_URL}/api/auth/approve-user/${id}`;
  const rejectLink = `${process.env.BASE_URL}/api/auth/reject-user/${id}`;

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
    return res.status(500).send("Error sending email");
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

    if (await bcrypt.compare(password, user.password)) {
      user.loginAttempts = 0;
      return res.status(200).json({
        id: user.id,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture,
        token: generateJWT(user.id),
      });
    } else {
      user.loginAttempts += 1;

      if (user.loginAttempts >= 3) {
        let suspensionLengthInMinutes = 30;
        user.isSuspended = true;
        user.suspensionStarts = new Date();
        user.suspensionEnds = new Date(
          Date.now() + suspensionLengthInMinutes * 60 * 1000
        );
      }
      const err = new Error("Invalid credentials");
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

  // TODO: update login link to the frontend login page
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
