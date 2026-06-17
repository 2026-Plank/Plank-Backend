const { toErrorResponse } = require('../utils/errorResponse');

const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  const response = toErrorResponse(err, 500);
  res.status(response.statusCode).json(response.body);
};

module.exports = errorHandler;
