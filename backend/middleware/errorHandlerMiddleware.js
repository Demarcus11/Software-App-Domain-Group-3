const errorHandler = (err, req, res, next) => {
  if (err.status) {
    res.status(err.status).json({ error: true, msg: err.message });
    return;
  }

  res.status(500).json({ msg: err.message });
  next();
};

export default errorHandler;
