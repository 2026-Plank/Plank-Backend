const Schedule = require('../models/Schedule');

// 일정 추가 로직
exports.addSchedule = async (req, res) => {
  try {
    // API 명세서에 정의된 VALUE [cite: 144-146]
    const { scheduleName, scheduleDate, description, dpName } = req.body;

    // (임시) teamId는 1, type은 'Schedule'로 고정. 추후 로그인 토큰과 프론트 데이터에 맞게 수정
    await Schedule.create(1, 'Schedule', scheduleName, description, dpName, scheduleDate);
    res.status(201).json({ message: "일정이 성공적으로 추가되었습니다." });
  } catch (error) {
    res.status(500).json({ error: "서버 에러: 일정 추가 실패" });
  }
};

// 일정 수정 로직
exports.updateSchedule = async (req, res) => {
  try {
    // API 명세서에 정의된 VALUE [cite: 148]
    const { scheduleName, scheduleDate, description, dpName } = req.body;
    await Schedule.update(scheduleName, scheduleDate, description, dpName);
    res.json({ message: "일정이 성공적으로 수정되었습니다." });
  } catch (error) {
    res.status(500).json({ error: "서버 에러: 일정 수정 실패" });
  }
};

// 일정 삭제 로직
exports.deleteSchedule = async (req, res) => {
  try {
    // API 명세서에 정의된 VALUE [cite: 148]
    const { scheduleName } = req.body;
    await Schedule.delete(scheduleName);
    res.json({ message: "일정이 성공적으로 삭제되었습니다." });
  } catch (error) {
    res.status(500).json({ error: "서버 에러: 일정 삭제 실패" });
  }
};