const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
    name: { type: String, required: true },
    inviteCode: { type: String, required: true, unique: true }, // 가입용 초대 코드
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // 팀장(관리자)
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Team', teamSchema);