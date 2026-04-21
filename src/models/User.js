const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },
    role: { type: String, enum: ['ADMIN', 'MEMBER'], default: 'MEMBER' },
    // 가입 승인 상태 (기획안 4.1 '관리자 승인' 반영)
    status: { type: String, enum: ['PENDING', 'APPROVED'], default: 'PENDING' }
});

module.exports = mongoose.model('User', userSchema);