const validateRequest = (schema) => async (req, res, next) => {
  try {
    // Validate the request body
    const result = schema.safeParse(req.body);

    if (!result.success) {
      // If validation fails, clean up the uploaded file
      if (req.cleanupFile) {
        req.cleanupFile();
      }

      // Format validation errors
      const errors = result.error.errors.map((error) => ({
        path: error.path.join("."),
        message: error.message,
      }));

      // Return validation errors
      return res.status(400).json({ error: true, errors });
    }

    // If validation succeeds, proceed to the next middleware
    next();
  } catch (err) {
    console.error("Validation middleware error:", err);

    // If an unexpected error occurs, clean up the uploaded file
    if (req.cleanupFile) {
      req.cleanupFile();
    }

    // Return a generic error response
    return res.status(500).json({
      error: true,
      message: "Internal server error during validation",
    });
  }
};

export default validateRequest;

/*
This middleware handles validation errors for incoming requests such as invalid email, 
password, etc. Its using Zod to validate the request body against a given schema.

Sends error messages to the frontend in the format:

{
  "error": true,
  "errors": [
    {
      "path": "email",
      "message": "Please provide a valid email address."
    },
    {
      "path": "password",
      "message": "Password must be at least 8 characters."
    }
  ]
}

*/
