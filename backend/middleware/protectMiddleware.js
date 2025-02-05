import jwt from "jsonwebtoken";
import prisma from "../config/prismaClient.js";

const protect = async (req, res, next) => {
  let token;

  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // make a new object on the req object with the authenticated user's data
      req.user = await prisma.user.findUnique({
        where: {
          id: decoded.id,
        },
        select: {
          id: true,
          username: true,
          email: true,
          profilePicture: true,
          roleId: true,
          firstName: true,
          lastName: true,
        },
      });

      next();
    } catch (e) {
      console.error(e);
      const err = new Error("Unauthorized, invalid token");
      err.status = 401;
      next(err);
    }
  } else {
    const err = new Error("Unauthorized, no token provided");
    err.status = 401;
    next(err);
  }
};

export default protect;
