import express from "express";

const app = express(); // Create server
const PORT = process.env.PORT || 8000;

// Endpoints
app.get("/", (req, res) => {
  res.send("Hello World");
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on localhost and listening on PORT ${PORT}...`);
});
