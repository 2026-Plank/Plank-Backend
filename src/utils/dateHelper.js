const formatDate = (date) => {
  return date.toISOString().split('T')[0];
};

const calculateDeadline = (startDate, days) => {
  const date = new Date(startDate);
  date.setDate(date.getDate() + days);
  return date;
};

const isOverdue = (deadline) => {
  return new Date() > new Date(deadline);
};

module.exports = { formatDate, calculateDeadline, isOverdue };
