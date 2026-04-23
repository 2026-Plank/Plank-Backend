const Schedule = require('../models/Schedule');

// 일정 추가 로직
exports.addSchedule = async (req, res) => {
  try {
    const { scheduleName, scheduleDate, description, dpName, scope = 'TEAM' } = req.body;
    const normalizedScope = String(scope).toUpperCase();

    if (!['PERSONAL', 'TEAM'].includes(normalizedScope)) {
      return res.status(400).json({ message: 'scope는 PERSONAL 또는 TEAM 이어야 합니다.' });
    }

    if (normalizedScope === 'TEAM' && !req.user?.teamId) {
      return res.status(400).json({ message: '팀 일정은 팀에 속한 사용자만 추가할 수 있습니다.' });
    }

    await Schedule.create({
      userId: normalizedScope === 'PERSONAL' ? req.user.userId : null,
      teamId: normalizedScope === 'TEAM' ? req.user.teamId : null,
      type: normalizedScope,
      scheduleName,
      description,
      dpName,
      scheduleDate
    });
    res.status(201).json({ message: "일정이 성공적으로 추가되었습니다." });
  } catch (error) {
    res.status(500).json({ error: "서버 에러: 일정 추가 실패" });
  }
};

// 일정 수정 로직
exports.updateSchedule = async (req, res) => {
  try {
    const { scheduleId, scheduleName, scheduleDate, description, dpName, scope = 'TEAM' } = req.body;
    const normalizedScope = String(scope).toUpperCase();

    if (!scheduleId) {
      return res.status(400).json({ message: 'scheduleId는 필수입니다.' });
    }

    if (!['PERSONAL', 'TEAM'].includes(normalizedScope)) {
      return res.status(400).json({ message: 'scope는 PERSONAL 또는 TEAM 이어야 합니다.' });
    }

    if (normalizedScope === 'TEAM' && !req.user?.teamId) {
      return res.status(400).json({ message: '소속 팀이 없습니다.' });
    }

    const result = await Schedule.update({
      scheduleId,
      ownerColumn: normalizedScope === 'PERSONAL' ? 'userId' : 'teamId',
      ownerId: normalizedScope === 'PERSONAL' ? req.user.userId : req.user.teamId,
      scheduleName,
      scheduleDate,
      description,
      dpName
    });

    if (!result.affectedRows) {
      return res.status(404).json({ message: '수정할 일정을 찾을 수 없습니다.' });
    }

    res.json({ message: "일정이 성공적으로 수정되었습니다." });
  } catch (error) {
    res.status(500).json({ error: "서버 에러: 일정 수정 실패" });
  }
};

// 일정 삭제 로직
exports.deleteSchedule = async (req, res) => {
  try {
    const { scheduleId, scope = 'TEAM' } = req.body;
    const normalizedScope = String(scope).toUpperCase();

    if (!scheduleId) {
      return res.status(400).json({ message: 'scheduleId는 필수입니다.' });
    }

    if (!['PERSONAL', 'TEAM'].includes(normalizedScope)) {
      return res.status(400).json({ message: 'scope는 PERSONAL 또는 TEAM 이어야 합니다.' });
    }

    if (normalizedScope === 'TEAM' && !req.user?.teamId) {
      return res.status(400).json({ message: '소속 팀이 없습니다.' });
    }

    const result = await Schedule.delete({
      scheduleId,
      ownerColumn: normalizedScope === 'PERSONAL' ? 'userId' : 'teamId',
      ownerId: normalizedScope === 'PERSONAL' ? req.user.userId : req.user.teamId
    });

    if (!result.affectedRows) {
      return res.status(404).json({ message: '삭제할 일정을 찾을 수 없습니다.' });
    }

    res.json({ message: "일정이 성공적으로 삭제되었습니다." });
  } catch (error) {
    res.status(500).json({ error: "서버 에러: 일정 삭제 실패" });
  }
};

exports.getSchedules = async (req, res) => {
  try {
    const scope = String(req.query.scope || 'ALL').toUpperCase();

    if (!['ALL', 'PERSONAL', 'TEAM'].includes(scope)) {
      return res.status(400).json({ message: 'scope는 ALL, PERSONAL, TEAM 중 하나여야 합니다.' });
    }

    if (scope !== 'PERSONAL' && !req.user?.teamId) {
      return res.status(400).json({ message: '팀 일정 조회를 위해 소속 팀이 필요합니다.' });
    }

    const schedules = await Schedule.findByOwner({
      userId: req.user.userId,
      teamId: req.user.teamId,
      scope
    });
    res.json(schedules);
  } catch (error) {
    res.status(500).json({ error: '서버 에러: 일정 조회 실패' });
  }
};
