import prisma from "../config/prismaClient.js";

// To seed to db run: npx prisma db seed
// TODO: seed roles

async function main() {
  const securityQuestions = [
    { question: "What is your favorite color?" },
    { question: "What is your favorite food?" },
    { question: "What is your favorite animal?" },
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
