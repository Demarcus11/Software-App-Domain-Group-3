import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import userAuthRouter from "./routes/userAuthRoutes.js";
import userRouter from "./routes/userRoutes.js";
import notFound from "./middleware/notFoundMiddleware.js";
import errorHandler from "./middleware/errorHandlerMiddleware.js";

const app = express(); // Create server
const PORT = process.env.PORT || 8000;

// Middleware
app.use(
  cors({
    origin: "*",
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Routes
app.use("/api/auth", userAuthRouter);
app.use("/api/users", userRouter);

app.use((req, res, next) => {
  const error = new Error("Not Found");
  error.status = 404;
  next(error);
});

app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on localhost and listening on PORT ${PORT}...`);
});
