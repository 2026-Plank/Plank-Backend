# Plank_Backend

```text
📦 src
 ┣ 📂 config
 ┃ ┣ 📜 db.config.js       # DB(MySQL 또는 MongoDB) 연결 설정 파일
 ┃ ┗ 📜 socket.config.js   # (선택) 채팅/알림용 Socket.io 설정
 ┣ 📂 controllers          # (요청 처리 및 응답 반환)
 ┃ ┣ 📜 authController.js        # 로그인, 회원가입 (login.jsx, signup.jsx 연동)
 ┃ ┣ 📜 userController.js        # 마이페이지, 프로필 수정, 친구 관리 (mypage.jsx 연동)
 ┃ ┣ 📜 teamController.js        # 팀/부서 생성, 초대, 승인 (team_create.jsx, team_join.jsx 등 연동)
 ┃ ┣ 📜 scheduleController.js    # 캘린더, 일정/할 일 CRUD (schedule_page.jsx 연동)
 ┃ ┣ 📜 chatController.js        # 채팅 내역 불러오기, 검색 (chat_page.jsx 연동)
 ┃ ┣ 📜 notificationController.js# 알림 내역 조회, 마감 알림 전송 (alarm.jsx 연동)
 ┃ ┗ 📜 feedbackController.js    # 팀원 간 피드백 작성/조회 (team_detail.jsx 연동)
 ┣ 📂 middlewares          # (요청 전 중간 검사)
 ┃ ┣ 📜 authMiddleware.js  # JWT 토큰 검증 (로그인한 유저인지 확인)
 ┃ ┣ 📜 roleMiddleware.js  # 팀장/팀원 권한 확인 (관리자만 부서/일정 수정하게)
 ┃ ┗ 📜 errorHandler.js    # 공통 에러 처리 로직
 ┣ 📂 models               # (데이터베이스 스키마 / 테이블 정의)
 ┃ ┣ 📜 User.js
 ┃ ┣ 📜 Team.js
 ┃ ┣ 📜 Department.js      # 팀 내 세부 부서
 ┃ ┣ 📜 Schedule.js        # 일정 및 할 일
 ┃ ┣ 📜 Chat.js            # 채팅 메시지 기록
 ┃ ┣ 📜 Notification.js    # 알림 데이터
 ┃ ┣ 📜 Feedback.js
 ┃ ┗ 📜 Friend.js          # 친구 관계 테이블
 ┣ 📂 routes               # (API 엔드포인트 URL 정의)
 ┃ ┣ 📜 authRoutes.js      # ex) POST /api/auth/login
 ┃ ┣ 📜 userRoutes.js      # ex) GET /api/users/mypage
 ┃ ┣ 📜 teamRoutes.js      # ex) POST /api/teams/create
 ┃ ┣ 📜 scheduleRoutes.js  # ex) GET /api/schedules/:teamId
 ┃ ┣ 📜 chatRoutes.js
 ┃ ┣ 📜 notificationRoutes.js
 ┃ ┗ 📜 feedbackRoutes.js
 ┣ 📂 services             # (핵심 비즈니스 로직 - 컨트롤러가 너무 뚱뚱해지는 걸 방지)
 ┃ ┣ 📜 authService.js
 ┃ ┣ 📜 teamService.js
 ┃ ┣ 📜 scheduleService.js
 ┃ ┗ 📜 ... (기타 컨트롤러와 1:1 매칭 혹은 생략 가능)
 ┣ 📂 utils                # (공통 유틸리티)
 ┃ ┣ 📜 jwtHelper.js       # 토큰 생성 및 해독 함수
 ┃ ┣ 📜 dateHelper.js      # 마감일 계산, 날짜 포맷팅 함수
 ┃ ┗ 📜 codeGenerator.js   # 팀 초대 코드 랜덤 생성 함수
 ┗ 📜 app.js               # Express 앱 세팅, 미들웨어 등록, 라우터 연결
```