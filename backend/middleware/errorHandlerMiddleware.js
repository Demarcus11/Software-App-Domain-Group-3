const errorHandler = (err, req, res, next) => {
  if (err.status) {
    res.status(err.status).json({ error: true, msg: err.message });
    return;
  }

  res.status(500).json({ msg: err.message });
  next();
};

export default errorHandler;

/*
This middleware handles errors that zod cant catch such as email already in use,
invalid credentials, etc.
*/
