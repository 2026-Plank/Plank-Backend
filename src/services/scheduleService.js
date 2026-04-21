const Schedule = require('../models/Schedule');

exports.createNewSchedule = async (scheduleData) => {
  // 여기서 '마감 기한이 프로젝트 전체 기한을 넘지 않는지' 체크하는 로직을 넣으면 좋아 [cite: 123]
  return await Schedule.create(scheduleData);
};

exports.getTeamSchedules = async (teamId) => {
  return await Schedule.findByTeamId(teamId);
};