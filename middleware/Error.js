const ErrorMiddleware = async (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || "Internal Server Error";
  let response = {
    success: false,
    message: err.message,
  };
  if (process.env.NODE_ENV === "development") {
    response.stack = err.stack;
  }

  res.status(err.statusCode || 500).json(response);
};
module.exports = ErrorMiddleware;
