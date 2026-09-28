import type { RowDataPacket } from '../config/database.js';
import { db } from '../config/database.js';

export interface SearchResult extends RowDataPacket {id:string;type:'subject'|'lesson'|'material'|'reviewer'|'flashcards'|'quiz'|'exam'|'plan';title:string;subtitle:string;href:string}
export const searchWorkspace=async(userId:string,query:string)=>{const term=`%${query}%`;const [rows]=await db.query<SearchResult[]>(`SELECT * FROM (
  SELECT s.id,'subject' type,s.name title,COALESCE(s.description,'Subject') subtitle,CONCAT('/app/subjects/',s.id) href FROM subjects s WHERE s.user_id=? AND s.archived_at IS NULL AND (s.name ILIKE ? OR s.description ILIKE ?)
  UNION ALL SELECT l.id,'lesson',l.title,s.name,CONCAT('/app/lessons/',l.id) FROM lessons l JOIN subjects s ON s.id=l.subject_id WHERE s.user_id=? AND (l.title ILIKE ? OR l.description ILIKE ?)
  UNION ALL SELECT d.id,'material',d.original_name,CONCAT(s.name,' · ',l.title),CONCAT('/app/lessons/',l.id) FROM documents d JOIN lessons l ON l.id=d.lesson_id JOIN subjects s ON s.id=l.subject_id WHERE s.user_id=? AND d.original_name ILIKE ?
  UNION ALL SELECT r.id,'reviewer',r.title,CONCAT(s.name,' · ',l.title),'/app/reviewers' FROM reviewers r JOIN lessons l ON l.id=r.lesson_id JOIN subjects s ON s.id=l.subject_id WHERE s.user_id=? AND r.title ILIKE ?
  UNION ALL SELECT fd.id,'flashcards',fd.title,CONCAT(s.name,' · ',l.title),CONCAT('/app/flashcards/',fd.id,'/study') FROM flashcard_decks fd JOIN lessons l ON l.id=fd.lesson_id JOIN subjects s ON s.id=l.subject_id WHERE s.user_id=? AND fd.title ILIKE ?
  UNION ALL SELECT q.id,'quiz',q.title,CONCAT(s.name,' · ',l.title),CONCAT('/app/quizzes/',q.id,'/take') FROM quizzes q JOIN lessons l ON l.id=q.lesson_id JOIN subjects s ON s.id=l.subject_id WHERE s.user_id=? AND q.title ILIKE ?
  UNION ALL SELECT e.id,'exam',e.title,'Practice exam',CONCAT('/app/exams/',e.id,'/take') FROM practice_exams e WHERE e.user_id=? AND e.title ILIKE ?
  UNION ALL SELECT p.id,'plan',p.title,COALESCE(s.name,'Study plan'),CONCAT('/app/planner/',p.id) FROM study_plans p LEFT JOIN subjects s ON s.id=p.subject_id WHERE p.user_id=? AND p.title ILIKE ?
) results ORDER BY type,title LIMIT 24`,[userId,term,term,userId,term,term,userId,term,userId,term,userId,term,userId,term,userId,term,userId,term]);return rows;};
