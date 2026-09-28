import assert from 'node:assert/strict';
import test from 'node:test';
import { flashcardOutputSchema, quizOutputSchema, selectionOutputSchema } from './aiService.js';
import { nextDueDate } from './flashcardService.js';
import { classifyAccuracy, normalizeAnswer, scoreQuestions } from './quizService.js';
import { calculateStreaks } from './progressService.js';
import { recommendationFor } from './progressRules.js';
import { paragraphMap } from './studyContentService.js';
import { rankChunks } from './tutorService.js';
import { generationSchema as examGenerationSchema, submissionSchema as examSubmissionSchema } from './examService.js';
import type { SourceChunk } from '../repositories/aiRepository.js';
import { buildSchedule, rankLessons } from './plannerService.js';
import type { LessonSignal } from '../repositories/plannerRepository.js';

test('uses deterministic spaced-review intervals for every rating', () => {
  const now = new Date('2026-01-15T08:00:00.000Z');
  assert.equal(nextDueDate('again', now).toISOString(), '2026-01-15T08:10:00.000Z');
  assert.equal(nextDueDate('hard', now).toISOString(), '2026-01-16T08:00:00.000Z');
  assert.equal(nextDueDate('good', now).toISOString(), '2026-01-18T08:00:00.000Z');
  assert.equal(nextDueDate('easy', now).toISOString(), '2026-01-22T08:00:00.000Z');
});

test('accepts grounded flashcard structure and rejects unsupported difficulty values', () => {
  const valid = {
    title: 'Network Security Essentials',
    flashcards: [{
      front: 'What does authentication verify?',
      back: 'Authentication verifies identity.',
      topic: 'Authentication',
      difficulty: 'easy'
    }]
  };
  assert.equal(flashcardOutputSchema.safeParse(valid).success, true);
  assert.equal(flashcardOutputSchema.safeParse({ ...valid, flashcards: [{ ...valid.flashcards[0], difficulty: 'expert' }] }).success, false);
});

test('only permits reviewer selections that use stable paragraph identifiers', () => {
  const valid = { title: 'Selected notes', groups: [{ heading: 'Core idea', paragraphIds: ['P0001', 'P0002'] }] };
  assert.equal(selectionOutputSchema.safeParse(valid).success, true);
  assert.equal(selectionOutputSchema.safeParse({ ...valid, groups: [{ heading: 'Core idea', paragraphIds: ['paragraph-1'] }] }).success, false);
});

test('builds ordered paragraph IDs after removing source headers', () => {
  const context = '[SOURCE 1 | notes.txt]\nAuthentication verifies a claimed identity and protects access.\n\n[SOURCE 2 | notes.txt]\nAuthorization determines which resources that identity may use.';
  assert.deepEqual(paragraphMap(context), [
    { id: 'P0001', text: 'Authentication verifies a claimed identity and protects access.' },
    { id: 'P0002', text: 'Authorization determines which resources that identity may use.' }
  ]);
});

test('validates quiz structure and requires four matching multiple-choice options', () => {
  const question={questionType:'multiple_choice',prompt:'Which principle protects accuracy?',choices:['Availability','Integrity','Authentication','Authorization'],correctAnswer:'Integrity',acceptableAnswers:[],explanation:'Integrity keeps information accurate and complete.',topic:'CIA Triad'};
  assert.equal(quizOutputSchema.safeParse({title:'Security Quiz',questions:[question]}).success,true);
  assert.equal(quizOutputSchema.safeParse({title:'Security Quiz',questions:[{...question,choices:['Availability','Integrity']}]}).success,false);
  assert.equal(quizOutputSchema.safeParse({title:'Security Quiz',questions:[{...question,correctAnswer:'Confidentiality'}]}).success,false);
});

test('normalizes punctuation and case without fuzzy AI scoring', () => {
  assert.equal(normalizeAnswer('  AUTHENTICATION. '),'authentication');
  assert.notEqual(normalizeAnswer('authenticate'),'authentication');
});

test('scores submitted and unanswered quiz questions deterministically by topic', () => {
  const questions=[
    {id:'q1',quiz_id:'quiz',topic_id:'t1',topic:'Access Control',position:1,question_type:'identification' as const,prompt:'Identity process?',choices:[],correct_answer:'Authentication',acceptable_answers:['Identity authentication'],explanation:'Authentication verifies identity.'},
    {id:'q2',quiz_id:'quiz',topic_id:'t1',topic:'Access Control',position:2,question_type:'true_false' as const,prompt:'Authorization verifies identity.',choices:[],correct_answer:'False',acceptable_answers:[],explanation:'Authorization assigns access.'},
    {id:'q3',quiz_id:'quiz',topic_id:'t2',topic:'CIA Triad',position:3,question_type:'multiple_choice' as const,prompt:'Accuracy principle?',choices:['Integrity','Availability','Confidentiality','Authentication'],correct_answer:'Integrity',acceptable_answers:[],explanation:'Integrity protects accuracy.'}
  ];
  const score=scoreQuestions(questions,[{questionId:'q1',answer:'identity authentication'},{questionId:'q2',answer:'TRUE'}]);
  assert.equal(score.correctCount,1);
  assert.equal(score.totalCount,3);
  assert.equal(score.percentage,33.33);
  assert.deepEqual(score.topics.map(topic=>[topic.topic,topic.accuracy,topic.status]),[['Access Control',50,'needs_review'],['CIA Triad',0,'weak']]);
});

test('classifies topic accuracy at documented boundaries', () => {
  assert.equal(classifyAccuracy(80),'strong');
  assert.equal(classifyAccuracy(60),'good');
  assert.equal(classifyAccuracy(40),'needs_review');
  assert.equal(classifyAccuracy(39.99),'weak');
});

test('calculates current and best study streaks across date gaps', () => {
  assert.deepEqual(calculateStreaks(['2026-01-01','2026-01-02','2026-01-04','2026-01-05','2026-01-06'],'2026-01-06'),{current:3,best:3});
  assert.deepEqual(calculateStreaks(['2026-01-01','2026-01-02','2026-01-05'],'2026-01-06'),{current:1,best:2});
  assert.deepEqual(calculateStreaks(['2026-01-01','2026-01-02'],'2026-01-06'),{current:0,best:2});
});

test('maps weak-topic status to a deterministic lesson recommendation', () => {
  const recommendation=recommendationFor({topic:'Cryptography',status:'weak',lessonId:'lesson-1'});
  assert.equal(recommendation.title,'Rebuild Cryptography');
  assert.equal(recommendation.href,'/app/lessons/lesson-1/study-tools');
});

test('ranks tutor excerpts by exact keyword overlap and preserves source order for ties', () => {
  const chunks=[
    {id:'1',content:'Availability keeps systems accessible.',heading:'CIA triad',page_number:1,chunk_index:0,document_name:'notes.pdf'},
    {id:'2',content:'Authentication verifies identity. Authorization controls access.',heading:'Access control',page_number:2,chunk_index:1,document_name:'notes.pdf'},
    {id:'3',content:'Encryption protects data.',heading:'Cryptography',page_number:3,chunk_index:2,document_name:'notes.pdf'}
  ] as SourceChunk[];
  assert.deepEqual(rankChunks('How does authentication control access?',chunks).map(chunk=>chunk.id),['2','1','3']);
});

test('validates multi-lesson exam options and rejects duplicate submitted answers', () => {
  const lessonIds=['11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222'];
  assert.equal(examGenerationSchema.safeParse({lessonIds,count:20,questionType:'mixed',difficulty:'hard',timeLimitMinutes:45}).success,true);
  assert.equal(examGenerationSchema.safeParse({lessonIds:[],count:2,questionType:'mixed',difficulty:'hard',timeLimitMinutes:null}).success,false);
  const duplicate={startedAt:'2026-01-15T08:00:00.000Z',answers:[{questionId:lessonIds[0],answer:'A'},{questionId:lessonIds[0],answer:'B'}]};
  assert.equal(examSubmissionSchema.safeParse(duplicate).success,false);
});

test('ranks unstudied and weak lessons ahead of strong lessons deterministically', () => {
  const lessons:LessonSignal[]=[
    {subject_id:'subject',subject_name:'Security',processing_status:'ready',weak_topics:[],id:'strong',title:'Strong lesson',accuracy:88,weak_topic_count:0},
    {subject_id:'subject',subject_name:'Security',processing_status:'ready',weak_topics:['ACL','VLAN'],id:'weak',title:'Weak lesson',accuracy:35,weak_topic_count:2},
    {subject_id:'subject',subject_name:'Security',processing_status:'ready',weak_topics:[],id:'new',title:'New lesson',accuracy:null,weak_topic_count:0}
  ];
  const ranked=rankLessons(lessons);
  assert.deepEqual(ranked.map(item=>item.id),['new','weak','strong']);
  assert.deepEqual(ranked.map(item=>item.status),['not_studied','weak','strong']);
  assert.deepEqual(ranked.map(item=>item.priority),[100,75,12]);
});

test('builds a paced plan before the deadline with reinforcement and a final exam', () => {
  const now=new Date('2026-09-26T00:00:00.000Z');
  const dueAt=new Date('2026-10-06T09:00:00.000Z');
  const lessons:LessonSignal[]=[
    {id:'one',title:'Lesson One',subject_id:'subject',subject_name:'Security',processing_status:'ready',accuracy:null,weak_topic_count:0,weak_topics:[]},
    {id:'two',title:'Lesson Two',subject_id:'subject',subject_name:'Security',processing_status:'ready',accuracy:52,weak_topic_count:1,weak_topics:['Firewalls']}
  ];
  const tasks=buildSchedule(lessons,'exam',dueAt,now);
  assert.equal(tasks.length,5);
  assert.equal(tasks.at(-1)?.taskType,'practice_exam');
  assert.ok(tasks.every((task,index)=>task.position===index+1&&task.dueAt>now&&task.dueAt<dueAt));
  assert.ok(tasks.every((task,index)=>index===0||task.dueAt>tasks[index-1]!.dueAt));
});
