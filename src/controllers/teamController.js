const Team = require('../models/Team');
const User = require('../models/User');

// [팀원] 초대 코드로 팀 참가 신청 (회원가입 후 진행)
exports.joinTeamRequest = async (req, res) => {
    try {
        const { inviteCode } = req.body;
        const team = await Team.findOne({ inviteCode });

        if (!team) {
            return res.status(404).json({ message: "유효하지 않은 초대 코드입니다." });
        }

        // 로그인한 유저의 teamId 업데이트 (상태는 기본값 PENDING)
        await User.findByIdAndUpdate(req.user.userId, {
            teamId: team._id,
            status: 'PENDING'
        });

        res.status(200).json({ message: "팀 참가 신청이 완료되었습니다. 관리자 승인을 기다려주세요." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// [관리자] 대기 중인 팀원 목록 조회
exports.getPendingMembers = async (req, res) => {
    try {
        const pendingUsers = await User.find({
            teamId: req.user.teamId,
            status: 'PENDING'
        }).select('-password');

        res.status(200).json(pendingUsers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// [관리자] 팀원 가입 승인
exports.approveMember = async (req, res) => {
    try {
        const { targetUserId } = req.params;

        const user = await User.findOneAndUpdate(
            { _id: targetUserId, teamId: req.user.teamId },
            { status: 'APPROVED' },
            { new: true }
        );

        if (!user) return res.status(404).json({ message: "사용자를 찾을 수 없거나 해당 팀 소속이 아닙니다." });

        res.status(200).json({ message: `${user.name}님의 가입이 승인되었습니다.` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};