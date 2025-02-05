import fs from "fs";

const cleanupFileOnFailure = (req, res, next) => {
  // Attach a cleanup function to the request object
  req.cleanupFile = () => {
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) {
          console.error("Failed to delete file:", err);
        }
      });
    }
  };

  // Call next middleware
  next();
};

export default cleanupFileOnFailure;
