-- 기존 테이블 삭제
begin
   execute immediate 'DROP TABLE TEAM_MEMBERS CASCADE CONSTRAINTS';
exception
   when others then
      null;
end;

begin
   execute immediate 'DROP TABLE TASKS_SCHEDULES CASCADE CONSTRAINTS';
exception
   when others then
      null;
end;

begin
   execute immediate 'DROP TABLE MESSAGES CASCADE CONSTRAINTS';
exception
   when others then
      null;
end;

begin
   execute immediate 'DROP TABLE TEAMS CASCADE CONSTRAINTS';
exception
   when others then
      null;
end;

begin
   execute immediate 'DROP TABLE USERS CASCADE CONSTRAINTS';
exception
   when others then
      null;
end;

--------------------------------------------------
-- 1. USERS 테이블 (회원)
--------------------------------------------------

create table users (
   id       number primary key,                     -- PK (자동 증가)
   userid   varchar2(50) unique not null,       -- 로그인 ID
   password varchar2(100) not null,           -- 비밀번호
   email    varchar2(100) not null,              -- 이메일
   name     varchar2(50) not null,                -- 이름
   profile  blob                               -- 프로필 이미지
);

-- 자동 증가용 시퀀스
create sequence users_seq;

-- 자동 증가 트리거
create or replace trigger users_trg before
   insert on users
   for each row
begin
   select users_seq.nextval
     into :new.id
     from dual;
end;

--------------------------------------------------
-- 2. TEAMS 테이블 (팀)
--------------------------------------------------

create table teams (
   id        number primary key,                     -- PK
   teamname  varchar2(100) not null,           -- 팀 이름
   personnel number not null,                 -- 팀 인원수
   teamcode  varchar2(50) unique,              -- 팀 코드 (초대용)
   dpnum     number,                              -- 부서 개수
   dpname    clob,                               -- 부서 이름들 (문자열로 저장)
   dpleader  clob,                             -- 부서 리더들
   deadline  date not null                     -- 마감일
);

create sequence teams_seq;

create or replace trigger teams_trg before
   insert on teams
   for each row
begin
   select teams_seq.nextval
     into :new.id
     from dual;
end;

--------------------------------------------------
-- 3. TEAM_MEMBERS 테이블 (팀 소속)
--------------------------------------------------

create table team_members (
   teamid number,                             -- 팀 ID
   userid varchar2(50),                       -- 사용자 ID
   role   varchar2(10) check ( role in ( 'Admin',
                                       'User' ) ), -- 권한
   department varchar2(50 char),
   jobdetail varchar2(200 char),

   constraint fk_team foreign key ( teamid )
      references teams ( id ),
   constraint fk_user foreign key ( userid )
      references users ( userid )
);

--------------------------------------------------
-- 4. TASKS_SCHEDULES (일정 + 할일)
--------------------------------------------------

create table tasks_schedules (
   id          number primary key,
   teamid      number,                              -- 팀 ID
   type        varchar2(10) check ( type in ( 'Schedule',
                                       'Task' ) ), -- 타입
   title       varchar2(100) not null,              -- 제목
   description clob,                          -- 설명
   dpname      varchar2(100),                      -- 부서명
   status      varchar2(10) check ( status in ( 'Progress',
                                           'Done',
                                           'Wait' ) ), -- 상태
   targetdate  date not null,                  -- 목표 날짜

   constraint fk_task_team foreign key ( teamid )
      references teams ( id )
);

create sequence task_seq;

create or replace trigger task_trg before
   insert on tasks_schedules
   for each row
begin
   select task_seq.nextval
     into :new.id
     from dual;
end;

--------------------------------------------------
-- 5. MESSAGES (알림)
--------------------------------------------------

create table messages (
   id       number primary key,
   teamname varchar2(100) not null,           -- 팀 이름 (간단하게 유지)
   dpname   varchar2(100),                      -- 부서명
   userid   varchar2(50) not null,              -- 수신자
   content  clob not null,                     -- 내용

   constraint fk_msg_user foreign key ( userid )
      references users ( userid )
);

create sequence msg_seq;

create or replace trigger msg_trg before
   insert on messages
   for each row
begin
   select msg_seq.nextval
     into :new.id
     from dual;
end;

commit;
