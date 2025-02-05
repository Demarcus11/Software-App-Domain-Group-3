import prisma from "../config/prismaClient.js";
import bcrypt from "bcryptjs";

// To seed to db run: npx prisma db seed
// TODO: seed roles

async function main() {
  const securityQuestions = [
    { question: "What is your favorite color?" },
    { question: "What is your favorite food?" },
    { question: "What is your favorite animal?" },
    { question: "What is your favorite planet?" },
    { question: "What is your favorite school subject?" },
    { question: "What is your favorite sport?" },
    { question: "What is your favorite movie?" },
  ];

  for (const question of securityQuestions) {
    await prisma.securityQuestion.upsert({
      where: { question: question.question },
      update: {},
      create: {
        question: question.question,
      },
    });
  }

  console.log("Security questions seeded successfully.");

  const roles = [{ name: "User" }, { name: "Manager" }, { name: "Admin" }];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: {
        name: role.name,
      },
    });
  }

  console.log("Roles seeded successfully.");

  const adminRole = await prisma.role.findUnique({
    where: { name: "Admin" },
  });

  if (!adminRole) {
    console.error("Admin role not found. Seeding failed.");
    return;
  }

  const securityQuestionsForAdmin = await prisma.securityQuestion.findMany({
    take: 3,
  });

  if (securityQuestionsForAdmin.length === 0) {
    console.error("No security questions found. Seeding failed.");
    return;
  }

  const hashedPassword = await bcrypt.hash("admin@123", 10);

  await prisma.user.upsert({
    where: { email: "ksuappdomainmanager@gmail.com" },
    update: {},
    create: {
      email: "ksuappdomainmanager@gmail.com",
      username: "admin",
      password: hashedPassword,
      roleId: adminRole.id,
      firstName: "Admin",
      lastName: "User",
      dateOfBirth: "2025-01-01",
      address: "123 Admin St, Admin City, Admin Country",
      isActive: true,
      securityQuestions: {
        create: [
          {
            securityQuestion: {
              connect: { id: securityQuestionsForAdmin[0].id },
            },
            answer: await bcrypt.hash("AdminAnswerFor1", 10),
          },
          {
            securityQuestion: {
              connect: { id: securityQuestionsForAdmin[1].id },
            },
            answer: await bcrypt.hash("AdminAnswerFor2", 10),
          },
          {
            securityQuestion: {
              connect: { id: securityQuestionsForAdmin[2].id },
            },
            answer: await bcrypt.hash("AdminAnswerFor3", 10),
          },
        ],
      },
    },
  });

  console.log("Admin user seeded successfully.");

  const statuses = [
    { name: "Pending" },
    { name: "Approved" },
    { name: "Rejected" },
  ];

  for (const status of statuses) {
    await prisma.status.upsert({
      where: { name: status.name },
      update: {},
      create: {
        name: status.name,
      },
    });
  }

  console.log("Statuses seeded successfully.");

  await prisma.errorMessage.createMany({
    data: [
      {
        errorCode: "1",
        httpStatusCode: 404,
        errorMessage:
          "Security question with id {securityQuestionId} not found",
      },
      {
        errorCode: "2",
        httpStatusCode: 404,
        errorMessage: "Role with id {roleId} not found",
      },
      {
        errorCode: "3",
        httpStatusCode: 400,
        errorMessage: "Email is already in use. Please try another one",
      },
      {
        errorCode: "4",
        httpStatusCode: 500,
        errorMessage: "Server error, please try again later",
      },
      {
        errorCode: "5",
        httpStatusCode: 404,
        errorMessage: "Couldn't find your account",
      },
      {
        errorCode: "6",
        httpStatusCode: 403,
        errorMessage: "Your password has expired. Please reset your password",
      },
      {
        errorCode: "7",
        httpStatusCode: 403,
        errorMessage:
          "This account is not active. Please send a request to admin to activate your account",
      },
      {
        errorCode: "8",
        httpStatusCode: 403,
        errorMessage:
          "Invalid credentials, you have {remainingAttempts} remaining attempt(s)",
      },
      {
        errorCode: "9",
        httpStatusCode: 400,
        errorMessage: "Incorrect security question answer(s)",
      },
      {
        errorCode: "10",
        httpStatusCode: 400,
        errorMessage: "Invalid or expired password reset token",
      },
      {
        errorCode: "11",
        httpStatusCode: 400,
        errorMessage: "Cannot use previously used passwords",
      },
      {
        errorCode: "12",
        httpStatusCode: 400,
        errorMessage: "This account has already been approved",
      },
      {
        errorCode: "13",
        httpStatusCode: 404,
        errorMessage: "No pending access requests for this user",
      },
      {
        errorCode: "14",
        httpStatusCode: 403,
        errorMessage: "This account has already been rejected",
      },
      {
        errorCode: "15",
        httpStatusCode: 404,
        errorMessage: "No security questions found",
      },
      {
        errorCode: "16",
        httpStatusCode: 404,
        errorMessage: "No roles found",
      },
      {
        errorCode: "17",
        httpStatusCode: 400,
        errorMessage: "Duplicate security questions",
      },
    ],
  });

  console.log("Errors seeded successfully.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
