import { randomUUID } from 'node:crypto';
import type { RowDataPacket } from 'mysql2';
import { db } from '../config/database.js';

export interface TopicPerformanceRow {topic_id:string;topic:string;lesson_id:string;lesson_title:string;subject_id:string;subject_name:string;correct_answers:number;total_answers:number;accuracy:number}
export interface SubjectPerformanceRow {subject_id:string;subject_name:string;color:string;correct_answers:number;total_answers:number;attempt_count:number;accuracy:number}

export const getMetricTotals=async(userId:string)=>{const [rows]=await db.query<(RowDataPacket&{quizzes_completed:number;quiz_accuracy:number;flashcards_reviewed:number;total_sessions:number;study_minutes:number;lessons_studied:number;due_cards:number})[]>(`SELECT
  (SELECT COUNT(*) FROM quiz_attempts WHERE user_id=?) quizzes_completed,
  (SELECT COALESCE(ROUND(SUM(correct_count)/NULLIF(SUM(total_count),0)*100,2),0) FROM quiz_attempts WHERE user_id=?) quiz_accuracy,
  (SELECT COUNT(*) FROM flashcard_reviews WHERE user_id=?) flashcards_reviewed,
  (SELECT COUNT(*) FROM study_sessions WHERE user_id=?) total_sessions,
  (SELECT COALESCE(ROUND(SUM(duration_seconds)/60),0) FROM study_sessions WHERE user_id=?) study_minutes,
  (SELECT COUNT(DISTINCT lesson_id) FROM (
    SELECT q.lesson_id FROM quiz_attempts qa JOIN quizzes q ON q.id=qa.quiz_id WHERE qa.user_id=?
    UNION SELECT fc.lesson_id FROM flashcard_reviews fr JOIN flashcards fc ON fc.id=fr.flashcard_id WHERE fr.user_id=?
    UNION SELECT lesson_id FROM study_sessions WHERE user_id=? AND lesson_id IS NOT NULL
  ) studied) lessons_studied,
  (SELECT COUNT(*) FROM flashcards fc JOIN lessons l ON l.id=fc.lesson_id JOIN subjects s ON s.id=l.subject_id WHERE s.user_id=? AND NOT EXISTS (SELECT 1 FROM flashcard_reviews fr WHERE fr.flashcard_id=fc.id AND fr.user_id=? AND fr.due_at>UTC_TIMESTAMP())) due_cards`,[userId,userId,userId,userId,userId,userId,userId,userId,userId,userId]);const row=rows[0]!;return{quizzes_completed:Number(row.quizzes_completed),quiz_accuracy:Number(row.quiz_accuracy),flashcards_reviewed:Number(row.flashcards_reviewed),total_sessions:Number(row.total_sessions),study_minutes:Number(row.study_minutes),lessons_studied:Number(row.lessons_studied),due_cards:Number(row.due_cards)};};

export const getTopicPerformance=async(userId:string)=>{const [rows]=await db.query<(RowDataPacket&TopicPerformanceRow)[]>(`SELECT tp.topic_id,t.name topic,l.id lesson_id,l.title lesson_title,s.id subject_id,s.name subject_name,tp.correct_answers,tp.total_answers,ROUND(tp.correct_answers/NULLIF(tp.total_answers,0)*100,2) accuracy FROM topic_performance tp JOIN topics t ON t.id=tp.topic_id JOIN lessons l ON l.id=t.lesson_id JOIN subjects s ON s.id=l.subject_id WHERE tp.user_id=? AND tp.total_answers>0 ORDER BY accuracy ASC,tp.total_answers DESC,t.name`,[userId]);return rows.map(row=>({...row,correct_answers:Number(row.correct_answers),total_answers:Number(row.total_answers),accuracy:Number(row.accuracy)}));};

export const getSubjectPerformance=async(userId:string)=>{const [rows]=await db.query<(RowDataPacket&SubjectPerformanceRow)[]>(`SELECT s.id subject_id,s.name subject_name,s.color,COALESCE(SUM(qa.correct_count),0) correct_answers,COALESCE(SUM(qa.total_count),0) total_answers,COUNT(qa.id) attempt_count,COALESCE(ROUND(SUM(qa.correct_count)/NULLIF(SUM(qa.total_count),0)*100,2),0) accuracy FROM subjects s LEFT JOIN lessons l ON l.subject_id=s.id LEFT JOIN quizzes q ON q.lesson_id=l.id LEFT JOIN quiz_attempts qa ON qa.quiz_id=q.id AND qa.user_id=? WHERE s.user_id=? AND s.archived_at IS NULL GROUP BY s.id,s.name,s.color ORDER BY attempt_count DESC,s.name`,[userId,userId]);return rows.map(row=>({...row,correct_answers:Number(row.correct_answers),total_answers:Number(row.total_answers),attempt_count:Number(row.attempt_count),accuracy:Number(row.accuracy)}));};

export const getQuizTrend=async(userId:string)=>{const [rows]=await db.query<(RowDataPacket&{id:string;quiz_title:string;lesson_title:string;percentage:number;completed_at:Date})[]>(`SELECT qa.id,q.title quiz_title,l.title lesson_title,qa.percentage,qa.completed_at FROM quiz_attempts qa JOIN quizzes q ON q.id=qa.quiz_id JOIN lessons l ON l.id=q.lesson_id WHERE qa.user_id=? ORDER BY qa.completed_at DESC LIMIT 12`,[userId]);return rows.map(row=>({...row,percentage:Number(row.percentage)})).reverse();};

export const getRecentLessons=async(userId:string)=>{const [rows]=await db.query<(RowDataPacket&{lesson_id:string;lesson_title:string;subject_id:string;subject_name:string;color:string;last_activity:Date;accuracy:number})[]>(`SELECT l.id lesson_id,l.title lesson_title,s.id subject_id,s.name subject_name,s.color,MAX(activity.activity_at) last_activity,COALESCE(stats.accuracy,0) accuracy FROM (
  SELECT q.lesson_id,qa.completed_at activity_at FROM quiz_attempts qa JOIN quizzes q ON q.id=qa.quiz_id WHERE qa.user_id=?
  UNION ALL SELECT fc.lesson_id,fr.reviewed_at FROM flashcard_reviews fr JOIN flashcards fc ON fc.id=fr.flashcard_id WHERE fr.user_id=?
  UNION ALL SELECT lesson_id,started_at FROM study_sessions WHERE user_id=? AND lesson_id IS NOT NULL
) activity JOIN lessons l ON l.id=activity.lesson_id JOIN subjects s ON s.id=l.subject_id LEFT JOIN (SELECT q.lesson_id,ROUND(SUM(qa.correct_count)/NULLIF(SUM(qa.total_count),0)*100,2) accuracy FROM quiz_attempts qa JOIN quizzes q ON q.id=qa.quiz_id WHERE qa.user_id=? GROUP BY q.lesson_id) stats ON stats.lesson_id=l.id GROUP BY l.id,l.title,s.id,s.name,s.color,stats.accuracy ORDER BY last_activity DESC LIMIT 5`,[userId,userId,userId,userId]);return rows.map(row=>({...row,accuracy:Number(row.accuracy)}));};

export const getWeeklyActions=async(userId:string,offsetMinutes:number)=>{const [rows]=await db.query<(RowDataPacket&{day:string;actions:number})[]>(`SELECT DATE_FORMAT(DATE_ADD(activity_at,INTERVAL ? MINUTE),'%Y-%m-%d') day,COUNT(*) actions FROM (
  SELECT completed_at activity_at FROM quiz_attempts WHERE user_id=?
  UNION ALL SELECT reviewed_at FROM flashcard_reviews WHERE user_id=?
) activity WHERE activity_at>=DATE_SUB(UTC_TIMESTAMP(),INTERVAL 8 DAY) GROUP BY day`,[offsetMinutes,userId,userId]);return rows.map(row=>({...row,actions:Number(row.actions)}));};

export const getWeeklyMinutes=async(userId:string,offsetMinutes:number)=>{const [rows]=await db.query<(RowDataPacket&{day:string;minutes:number})[]>(`SELECT DATE_FORMAT(DATE_ADD(started_at,INTERVAL ? MINUTE),'%Y-%m-%d') day,ROUND(SUM(duration_seconds)/60) minutes FROM study_sessions WHERE user_id=? AND started_at>=DATE_SUB(UTC_TIMESTAMP(),INTERVAL 8 DAY) GROUP BY day`,[offsetMinutes,userId]);return rows.map(row=>({...row,minutes:Number(row.minutes)}));};

export const getActivityDates=async(userId:string,offsetMinutes:number)=>{const [rows]=await db.query<(RowDataPacket&{day:string})[]>(`SELECT DISTINCT DATE_FORMAT(DATE_ADD(activity_at,INTERVAL ? MINUTE),'%Y-%m-%d') day FROM (
  SELECT completed_at activity_at FROM quiz_attempts WHERE user_id=?
  UNION ALL SELECT reviewed_at FROM flashcard_reviews WHERE user_id=?
  UNION ALL SELECT started_at FROM study_sessions WHERE user_id=?
) activity ORDER BY day`,[offsetMinutes,userId,userId,userId]);return rows.map(row=>row.day);};

export const recordStudySession=async(input:{userId:string;lessonId:string|null;activityType:'lesson'|'reviewer'|'flashcards'|'quiz'|'exam'|'tutor';startedAt:Date;endedAt:Date;durationSeconds:number},connection:typeof db|Awaited<ReturnType<typeof db.getConnection>>=db)=>{await connection.execute(`INSERT INTO study_sessions (id,user_id,lesson_id,activity_type,duration_seconds,started_at,ended_at) VALUES (?,?,?,?,?,?,?)`,[randomUUID(),input.userId,input.lessonId,input.activityType,input.durationSeconds,input.startedAt,input.endedAt]);};
