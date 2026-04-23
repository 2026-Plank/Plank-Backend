const Team = require('../models/Team');
const User = require('../models/User');

// [팀원] 초대 코드로 팀 참가 신청
exports.joinTeamRequest = async (req, res, next) => {
  try {
    const { inviteCode } = req.body;

    if (!inviteCode) {
      return res.status(400).json({ message: 'inviteCode는 필수입니다.' });
    }

    const team = await Team.findByInviteCode(inviteCode);

    if (!team) {
      return res.status(404).json({ message: '유효하지 않은 초대 코드입니다.' });
    }

    await User.updateTeamRequest(req.user.userId, team.id);

    res.status(200).json({
      message: '팀 참가 신청이 완료되었습니다. 관리자 승인을 기다려주세요.',
      team: {
        id: team.id,
        name: team.name,
        inviteCode: team.inviteCode
      }
    });
  } catch (error) {
    next(error);
  }
};

// [관리자] 대기 중인 팀원 목록 조회
exports.getPendingMembers = async (req, res, next) => {
  try {
    if (!req.user.teamId) {
      return res.status(400).json({ message: '소속 팀이 없습니다.' });
    }

    const pendingUsers = await User.findPendingByTeamId(req.user.teamId);
    res.status(200).json(pendingUsers);
  } catch (error) {
    next(error);
  }
};

// [관리자] 팀원 가입 승인
exports.approveMember = async (req, res, next) => {
  try {
    const { targetUserId } = req.params;

    if (!req.user.teamId) {
      return res.status(400).json({ message: '소속 팀이 없습니다.' });
    }

    const result = await User.approveTeamMember(targetUserId, req.user.teamId);

    if (!result.affectedRows) {
      return res.status(404).json({ message: '사용자를 찾을 수 없거나 해당 팀 소속이 아닙니다.' });
    }

    const approvedUser = await User.findById(targetUserId);

    res.status(200).json({
      message: `${approvedUser.name}님의 가입이 승인되었습니다.`,
      user: approvedUser
    });
  } catch (error) {
    next(error);
  }
};
