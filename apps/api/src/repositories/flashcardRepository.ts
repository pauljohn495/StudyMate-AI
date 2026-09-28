import { randomUUID } from 'node:crypto';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { db } from '../config/database.js';
import type { FlashcardOutput } from '../services/aiService.js';

export interface DeckRecord {id:string;lesson_id:string;title:string;difficulty:'easy'|'medium'|'hard'|'mixed';card_count:number;source_version:string;generation_key:string;created_at:Date;updated_at:Date;lesson_title?:string;subject_name?:string;reviewed_count?:number;due_count?:number}

export const findCachedDeck=async(lessonId:string,userId:string,generationKey:string)=>{const [rows]=await db.query<(RowDataPacket&DeckRecord)[]>(`SELECT fd.* FROM flashcard_decks fd JOIN lessons l ON l.id=fd.lesson_id JOIN subjects s ON s.id=l.subject_id WHERE fd.lesson_id=? AND s.user_id=? AND fd.generation_key=? ORDER BY fd.created_at DESC LIMIT 1`,[lessonId,userId,generationKey]);return rows[0]??null;};

export const insertDeck=async(input:{id:string;lessonId:string;title:string;difficulty:DeckRecord['difficulty'];sourceVersion:string;generationKey:string;cards:FlashcardOutput['flashcards']})=>{
  const connection=await db.getConnection();try{await connection.beginTransaction();await connection.execute(`INSERT INTO flashcard_decks (id,lesson_id,title,difficulty,card_count,source_version,generation_key) VALUES (?,?,?,?,?,?,?)`,[input.id,input.lessonId,input.title,input.difficulty,input.cards.length,input.sourceVersion,input.generationKey]);
    for(const card of input.cards){const [existing]=await connection.query<(RowDataPacket&{id:string})[]>('SELECT id FROM topics WHERE lesson_id=? AND name=? LIMIT 1',[input.lessonId,card.topic]);let topicId=existing[0]?.id;if(!topicId){topicId=randomUUID();await connection.execute('INSERT IGNORE INTO topics (id,lesson_id,name) VALUES (?,?,?)',[topicId,input.lessonId,card.topic]);const [resolved]=await connection.query<(RowDataPacket&{id:string})[]>('SELECT id FROM topics WHERE lesson_id=? AND name=? LIMIT 1',[input.lessonId,card.topic]);topicId=resolved[0]!.id;}
      await connection.execute(`INSERT INTO flashcards (id,deck_id,lesson_id,topic_id,front,back,difficulty) VALUES (UUID(),?,?,?,?,?,?)`,[input.id,input.lessonId,topicId,card.front,card.back,card.difficulty]);}
    await connection.commit();
  }catch(error){await connection.rollback();throw error;}finally{connection.release();}
};

export const listDecks=async(userId:string,lessonId?:string)=>{const values:string[]=[userId];const filter=lessonId?' AND fd.lesson_id=?':'';if(lessonId)values.push(lessonId);const [rows]=await db.query<(RowDataPacket&DeckRecord)[]>(`SELECT fd.*,l.title lesson_title,s.name subject_name,
  (SELECT COUNT(DISTINCT fr.flashcard_id) FROM flashcard_reviews fr JOIN flashcards fc ON fc.id=fr.flashcard_id WHERE fc.deck_id=fd.id AND fr.user_id=?) reviewed_count,
  (SELECT COUNT(*) FROM flashcards fc2 WHERE fc2.deck_id=fd.id AND NOT EXISTS (SELECT 1 FROM flashcard_reviews fr2 WHERE fr2.flashcard_id=fc2.id AND fr2.user_id=? AND fr2.due_at>UTC_TIMESTAMP())) due_count
  FROM flashcard_decks fd JOIN lessons l ON l.id=fd.lesson_id JOIN subjects s ON s.id=l.subject_id WHERE s.user_id=?${filter} ORDER BY fd.updated_at DESC`,[userId,userId,...values]);return rows.map(row=>({...row,card_count:Number(row.card_count),reviewed_count:Number(row.reviewed_count??0),due_count:Number(row.due_count??0)}));};

export const getDeck=async(deckId:string,userId:string)=>{const [decks]=await db.query<(RowDataPacket&DeckRecord)[]>(`SELECT fd.*,l.title lesson_title,s.name subject_name FROM flashcard_decks fd JOIN lessons l ON l.id=fd.lesson_id JOIN subjects s ON s.id=l.subject_id WHERE fd.id=? AND s.user_id=? LIMIT 1`,[deckId,userId]);const deck=decks[0];if(!deck)return null;const [cards]=await db.query<(RowDataPacket&{id:string;front:string;back:string;difficulty:string;topic:string|null;last_rating:string|null;due_at:Date|null;review_count:number})[]>(`SELECT fc.id,fc.front,fc.back,fc.difficulty,t.name topic,latest.rating last_rating,latest.due_at,
  (SELECT COUNT(*) FROM flashcard_reviews r WHERE r.flashcard_id=fc.id AND r.user_id=?) review_count
  FROM flashcards fc LEFT JOIN topics t ON t.id=fc.topic_id LEFT JOIN flashcard_reviews latest ON latest.id=(SELECT r2.id FROM flashcard_reviews r2 WHERE r2.flashcard_id=fc.id AND r2.user_id=? ORDER BY r2.reviewed_at DESC LIMIT 1)
  WHERE fc.deck_id=? ORDER BY fc.created_at,fc.id`,[userId,userId,deckId]);return {deck:{...deck,card_count:Number(deck.card_count)},cards:cards.map(card=>({...card,review_count:Number(card.review_count)}))};};

export const findOwnedCard=async(cardId:string,userId:string)=>{const [rows]=await db.query<(RowDataPacket&{id:string;deck_id:string})[]>(`SELECT fc.id,fc.deck_id FROM flashcards fc JOIN lessons l ON l.id=fc.lesson_id JOIN subjects s ON s.id=l.subject_id WHERE fc.id=? AND s.user_id=? LIMIT 1`,[cardId,userId]);return rows[0]??null;};
export const insertReview=async(input:{cardId:string;userId:string;rating:'again'|'hard'|'good'|'easy';dueAt:Date})=>{const id=randomUUID();await db.execute<ResultSetHeader>('INSERT INTO flashcard_reviews (id,flashcard_id,user_id,rating,due_at) VALUES (?,?,?,?,?)',[id,input.cardId,input.userId,input.rating,input.dueAt]);return{id,rating:input.rating,due_at:input.dueAt,reviewed_at:new Date()};};
export const deleteDeck=async(deckId:string,userId:string)=>{const [result]=await db.execute<ResultSetHeader>(`DELETE fd FROM flashcard_decks fd JOIN lessons l ON l.id=fd.lesson_id JOIN subjects s ON s.id=l.subject_id WHERE fd.id=? AND s.user_id=?`,[deckId,userId]);return result.affectedRows>0;};
