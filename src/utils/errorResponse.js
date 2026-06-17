const isDatabaseConnectionError = (error) => {
  const message = String(error?.message || '');
  return (
    error?.code === 'ECONNREFUSED' ||
    message.includes('ECONNREFUSED') ||
    message.includes('NJS-503') ||
    message.includes('NJS-') ||
    message.includes('DPI-') ||
    message.includes('ORA-12170') ||
    message.includes('ORA-125')
  );
};

const toErrorResponse = (error, fallbackStatus = 500) => {
  if (isDatabaseConnectionError(error)) {
    return {
      statusCode: 503,
      body: {
        message: '데이터베이스에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.',
        error: 'DATABASE_UNAVAILABLE'
      }
    };
  }

  return {
    statusCode: error.statusCode || fallbackStatus,
    body: {
      message: error.message || '요청 처리 중 오류가 발생했습니다.',
      error: error.message || 'REQUEST_FAILED'
    }
  };
};

module.exports = { isDatabaseConnectionError, toErrorResponse };
