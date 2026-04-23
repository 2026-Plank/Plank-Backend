const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  const status = err.status || 500;
  const message = err.message || '서버 에러가 발생했습니다.';

  if (status >= 500) {
    console.error(err);
  }

  return res.status(status).json({ message });
};

module.exports = errorHandler;
