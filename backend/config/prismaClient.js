import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getErrorMessage = async (errorCode, placeholders = {}) => {
  const errorMessage = await prisma.errorMessage.findUnique({
    where: { errorCode },
  });

  if (!errorMessage) {
    return { message: "An unexpected error occurred", httpStatusCode: 500 };
  }

  let message = errorMessage.errorMessage;

  for (const [key, value] of Object.entries(placeholders)) {
    message = message.replace(`{${key}}`, value.toString());
  }

  return { message, httpStatusCode: errorMessage.httpStatusCode };
};

export default prisma;
