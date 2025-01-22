const validateRequest = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    const errors = result.error.errors.map((error) => ({
      path: error.path.join("."),
      message: error.message,
    }));

    return res.status(400).json({ error: true, errors });
  }
  next();
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
