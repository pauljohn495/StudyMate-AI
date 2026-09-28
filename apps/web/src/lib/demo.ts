import type { ExamAttemptDetail, ExamDetail, FlashcardDeckDetail, Lesson, LessonTopic, QuizAttemptDetail, QuizDetail, ReviewerResource, StudyDocument, StudyPlanDetail, Subject, SummaryResource } from '../types';

const subjectsSeed: Subject[] = [
  { id:'demo-network', name:'Network Security', description:'Core security principles, network defenses, and access control.', icon:'shield', color:'indigo', lesson_count:4 },
  { id:'demo-programming', name:'Web Programming', description:'Modern JavaScript, React patterns, and backend fundamentals.', icon:'code', color:'violet', lesson_count:3 },
  { id:'demo-ethics', name:'Ethics in Technology', description:'Privacy, responsibility, and ethical decision-making.', icon:'scale', color:'emerald', lesson_count:2 },
  { id:'demo-marketing', name:'Digital Marketing', description:'Audience strategy, content, campaigns, and analytics.', icon:'sparkles', color:'amber', lesson_count:1 }
];

const lessonSeed: Record<string, Lesson[]> = {
  'demo-network': [
    { id:'net-1', subject_id:'demo-network', title:'Security Fundamentals', description:'CIA triad, threats, vulnerabilities, and risk.', processing_status:'ready' },
    { id:'net-2', subject_id:'demo-network', title:'Firewalls & Access Control', description:'Firewall types, ACLs, and policy design.', processing_status:'ready' },
    { id:'net-3', subject_id:'demo-network', title:'Cryptography Basics', description:'Encryption, hashing, and digital signatures.', processing_status:'processing' },
    { id:'net-4', subject_id:'demo-network', title:'Network Monitoring', description:'Logs, IDS/IPS, and incident indicators.', processing_status:'empty' }
  ],
  'demo-programming': [
    { id:'web-1', subject_id:'demo-programming', title:'TypeScript Essentials', description:'Types, interfaces, generics, and narrowing.', processing_status:'ready' },
    { id:'web-2', subject_id:'demo-programming', title:'React Architecture', description:'Components, state, data fetching, and routing.', processing_status:'ready' },
    { id:'web-3', subject_id:'demo-programming', title:'REST API Design', description:'Resources, validation, errors, and security.', processing_status:'empty' }
  ],
  'demo-ethics': [
    { id:'eth-1', subject_id:'demo-ethics', title:'Data Privacy', description:'Consent, collection, retention, and user rights.', processing_status:'ready' },
    { id:'eth-2', subject_id:'demo-ethics', title:'Responsible AI', description:'Bias, transparency, accountability, and safety.', processing_status:'ready' }
  ],
  'demo-marketing': [{ id:'mkt-1', subject_id:'demo-marketing', title:'Audience Research', description:'Personas, segmentation, and intent.', processing_status:'empty' }]
};

const documentSeed: Record<string, StudyDocument[]> = {
  'net-1': [
    { id:'doc-cia', lesson_id:'net-1', original_name:'Module 1 - Security Fundamentals.pdf', mime_type:'application/pdf', size_bytes:1843200, status:'ready', error_message:null, chunk_count:12, created_at:'2026-09-18T08:30:00.000Z', lesson_title:'Security Fundamentals', subject_id:'demo-network', subject_name:'Network Security', preview_text:'Information security protects information and information systems from unauthorized access, use, disclosure, disruption, modification, or destruction.\n\nThe CIA triad consists of confidentiality, integrity, and availability. Confidentiality limits information access to authorized users. Integrity ensures information remains accurate and complete. Availability ensures authorized users can access systems and data when needed.' },
  ],
  'net-2': [{ id:'doc-firewalls', lesson_id:'net-2', original_name:'Firewalls and ACL Notes.docx', mime_type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document', size_bytes:642000, status:'ready', error_message:null, chunk_count:7, created_at:'2026-09-16T11:00:00.000Z', lesson_title:'Firewalls & Access Control', subject_id:'demo-network', subject_name:'Network Security', preview_text:'A firewall monitors and controls incoming and outgoing network traffic according to established security rules.\n\nPacket-filtering firewalls examine packet headers. Stateful firewalls track active connections. Application firewalls inspect traffic at the application layer.' }],
  'web-1': [{ id:'doc-typescript', lesson_id:'web-1', original_name:'TypeScript Essentials.pptx', mime_type:'application/vnd.openxmlformats-officedocument.presentationml.presentation', size_bytes:2210000, status:'ready', error_message:null, chunk_count:9, created_at:'2026-09-14T03:15:00.000Z', lesson_title:'TypeScript Essentials', subject_id:'demo-programming', subject_name:'Web Programming', preview_text:'TypeScript is a statically typed superset of JavaScript. It adds type annotations, interfaces, generics, and compile-time checking while emitting standard JavaScript.' }]
};

const read = <T,>(key: string, fallback: T): T => JSON.parse(localStorage.getItem(key) ?? JSON.stringify(fallback));
const write = (key: string, value: unknown) => localStorage.setItem(key, JSON.stringify(value));
export const demoSubjects = () => read('studymate_demo_subjects', subjectsSeed);
export const saveDemoSubjects = (value: Subject[]) => write('studymate_demo_subjects', value);
export const demoLessons = () => read('studymate_demo_lessons', lessonSeed);
export const saveDemoLessons = (value: Record<string, Lesson[]>) => write('studymate_demo_lessons', value);
export const demoDocuments = () => read('studymate_demo_documents', documentSeed);
export const saveDemoDocuments = (value: Record<string, StudyDocument[]>) => write('studymate_demo_documents', value);

const reviewerSeed: ReviewerResource[] = [{id:'reviewer-demo-1',lesson_id:'net-1',title:'Security Fundamentals — Quick Reviewer',reviewer_type:'quick',difficulty:'standard',original_wording:false,created_at:'2026-09-19T09:00:00.000Z',updated_at:'2026-09-19T09:00:00.000Z',lesson_title:'Security Fundamentals',subject_name:'Network Security',content:{title:'Security Fundamentals — Quick Reviewer',sections:[{heading:'CIA Triad',bullets:['Confidentiality limits information access to authorized users.','Integrity keeps information accurate and complete.','Availability ensures systems and data remain accessible when needed.']},{heading:'Identity and Access',bullets:['Authentication verifies an identity.','Authorization determines which resources an authenticated identity may access.']}],keyTakeaways:['Security balances confidentiality, integrity, and availability.','Authentication and authorization solve different access-control problems.']}}];
const summarySeed: SummaryResource[] = [];
const topicSeed: Record<string,LessonTopic[]> = {'net-1':[{id:'topic-cia',name:'CIA Triad'},{id:'topic-access',name:'Authentication and Authorization'},{id:'topic-risk',name:'Threats and Risk'}]};
export const demoReviewers=()=>read('studymate_demo_reviewers',reviewerSeed);
export const saveDemoReviewers=(value:ReviewerResource[])=>write('studymate_demo_reviewers',value);
export const demoSummaries=()=>read('studymate_demo_summaries',summarySeed);
export const saveDemoSummaries=(value:SummaryResource[])=>write('studymate_demo_summaries',value);
export const demoTopics=()=>read('studymate_demo_topics',topicSeed);
export const saveDemoTopics=(value:Record<string,LessonTopic[]>)=>write('studymate_demo_topics',value);

const flashcardSeed:Record<string,FlashcardDeckDetail>={'deck-network-basics':{deck:{id:'deck-network-basics',lesson_id:'net-1',title:'Network Security Essentials',difficulty:'mixed',card_count:5,created_at:'2026-09-20T07:30:00.000Z',updated_at:'2026-09-20T07:30:00.000Z',lesson_title:'Security Fundamentals',subject_name:'Network Security',reviewed_count:2,due_count:5},cards:[
  {id:'card-cia',front:'What does the CIA triad stand for?',back:'Confidentiality, integrity, and availability.',topic:'CIA Triad',difficulty:'easy',last_rating:null,due_at:null,review_count:0},
  {id:'card-confidentiality',front:'What is the goal of confidentiality?',back:'To prevent unauthorized disclosure of information.',topic:'CIA Triad',difficulty:'easy',last_rating:'good',due_at:null,review_count:1},
  {id:'card-auth',front:'How do authentication and authorization differ?',back:'Authentication verifies identity; authorization determines which resources that identity may access.',topic:'Access Control',difficulty:'medium',last_rating:null,due_at:null,review_count:0},
  {id:'card-firewall',front:'What does a firewall enforce?',back:'Network security policy by allowing or blocking traffic according to configured rules.',topic:'Firewalls',difficulty:'medium',last_rating:null,due_at:null,review_count:0},
  {id:'card-risk',front:'Which factors are used to evaluate risk?',back:'Threats, vulnerabilities, likelihood, and impact.',topic:'Risk Management',difficulty:'hard',last_rating:'hard',due_at:null,review_count:1}
]}};
export const demoFlashcardDecks=()=>read('studymate_demo_flashcards',flashcardSeed);
export const saveDemoFlashcardDecks=(value:Record<string,FlashcardDeckDetail>)=>write('studymate_demo_flashcards',value);

const quizSeed:Record<string,QuizDetail>={'quiz-network-basics':{quiz:{id:'quiz-network-basics',lesson_id:'net-1',title:'Security Fundamentals Check',question_type:'mixed',difficulty:'medium',question_count:5,created_at:'2026-09-21T09:00:00.000Z',updated_at:'2026-09-21T09:00:00.000Z',lesson_title:'Security Fundamentals',subject_name:'Network Security',attempt_count:0,best_percentage:null,latest_percentage:null},questions:[
  {id:'quiz-q1',quiz_id:'quiz-network-basics',topic_id:'topic-cia',topic:'CIA Triad',position:1,question_type:'multiple_choice',prompt:'Which CIA triad principle ensures authorized users can access systems and data when needed?',choices:['Confidentiality','Integrity','Availability','Authentication']},
  {id:'quiz-q2',quiz_id:'quiz-network-basics',topic_id:'topic-cia',topic:'CIA Triad',position:2,question_type:'true_false',prompt:'Integrity means information remains accurate and complete.',choices:[]},
  {id:'quiz-q3',quiz_id:'quiz-network-basics',topic_id:'topic-access',topic:'Access Control',position:3,question_type:'identification',prompt:'What process verifies a claimed identity?',choices:[]},
  {id:'quiz-q4',quiz_id:'quiz-network-basics',topic_id:'topic-access',topic:'Access Control',position:4,question_type:'multiple_choice',prompt:'What determines which resources an authenticated identity may access?',choices:['Encryption','Availability','Authorization','Hashing']},
  {id:'quiz-q5',quiz_id:'quiz-network-basics',topic_id:'topic-risk',topic:'Risk Management',position:5,question_type:'true_false',prompt:'A threat and a vulnerability mean exactly the same thing.',choices:[]}
]}};
export const demoQuizzes=()=>read('studymate_demo_quizzes',quizSeed);
export const saveDemoQuizzes=(value:Record<string,QuizDetail>)=>write('studymate_demo_quizzes',value);
export interface DemoQuizAnswer {answer:string;acceptableAnswers:string[];explanation:string}
const quizAnswerSeed:Record<string,DemoQuizAnswer>={
  'quiz-q1':{answer:'Availability',acceptableAnswers:[],explanation:'Availability ensures authorized users can access systems and data when needed.'},
  'quiz-q2':{answer:'True',acceptableAnswers:[],explanation:'The lesson defines integrity as keeping information accurate and complete.'},
  'quiz-q3':{answer:'Authentication',acceptableAnswers:['identity authentication'],explanation:'Authentication verifies a claimed identity.'},
  'quiz-q4':{answer:'Authorization',acceptableAnswers:[],explanation:'Authorization determines which resources an authenticated identity may access.'},
  'quiz-q5':{answer:'False',acceptableAnswers:[],explanation:'A threat can exploit a vulnerability, but the terms describe different concepts.'}
};
export const demoQuizAnswers=()=>read('studymate_demo_quiz_answers',quizAnswerSeed);
export const saveDemoQuizAnswers=(value:Record<string,DemoQuizAnswer>)=>write('studymate_demo_quiz_answers',value);
export const demoQuizAttempts=()=>read<Record<string,QuizAttemptDetail>>('studymate_demo_quiz_attempts',{});
export const saveDemoQuizAttempts=(value:Record<string,QuizAttemptDetail>)=>write('studymate_demo_quiz_attempts',value);

const examSeed:Record<string,ExamDetail>={'exam-security-foundations':{exam:{id:'exam-security-foundations',title:'Security Foundations Practice Exam',question_type:'mixed',difficulty:'medium',question_count:5,time_limit_minutes:20,lesson_count:2,created_at:'2026-09-22T09:00:00.000Z',attempt_count:0,best_percentage:null},questions:[
  {id:'exam-q1',quiz_id:'exam-security-foundations',lesson_id:'net-1',lesson_title:'Security Fundamentals',topic_id:'topic-cia',topic:'CIA Triad',position:1,question_type:'multiple_choice',prompt:'Which principle keeps information accurate and complete?',choices:['Availability','Integrity','Confidentiality','Authentication']},
  {id:'exam-q2',quiz_id:'exam-security-foundations',lesson_id:'net-1',lesson_title:'Security Fundamentals',topic_id:'topic-access',topic:'Access Control',position:2,question_type:'identification',prompt:'What process determines which resources an authenticated identity can access?',choices:[]},
  {id:'exam-q3',quiz_id:'exam-security-foundations',lesson_id:'net-2',lesson_title:'Firewalls & Access Control',topic_id:null,topic:'Firewalls',position:3,question_type:'true_false',prompt:'A stateful firewall tracks active network connections.',choices:[]},
  {id:'exam-q4',quiz_id:'exam-security-foundations',lesson_id:'net-2',lesson_title:'Firewalls & Access Control',topic_id:null,topic:'Firewalls',position:4,question_type:'multiple_choice',prompt:'Which firewall type examines traffic at the application layer?',choices:['Packet-filtering firewall','Application firewall','Stateless router','Access point']},
  {id:'exam-q5',quiz_id:'exam-security-foundations',lesson_id:'net-1',lesson_title:'Security Fundamentals',topic_id:'topic-cia',topic:'CIA Triad',position:5,question_type:'true_false',prompt:'Availability limits information access to authorized users.',choices:[]}
]}};
export const demoExams=()=>read('studymate_demo_exams',examSeed);
export const saveDemoExams=(value:Record<string,ExamDetail>)=>write('studymate_demo_exams',value);
export const demoExamAnswers=()=>read<Record<string,DemoQuizAnswer>>('studymate_demo_exam_answers',{
  'exam-q1':{answer:'Integrity',acceptableAnswers:[],explanation:'Integrity is the CIA principle that preserves accuracy and completeness.'},
  'exam-q2':{answer:'Authorization',acceptableAnswers:['access authorization'],explanation:'Authorization determines what an authenticated identity may access.'},
  'exam-q3':{answer:'True',acceptableAnswers:[],explanation:'Stateful firewalls maintain awareness of active connections.'},
  'exam-q4':{answer:'Application firewall',acceptableAnswers:[],explanation:'Application firewalls inspect traffic at the application layer.'},
  'exam-q5':{answer:'False',acceptableAnswers:[],explanation:'Confidentiality limits access; availability keeps resources accessible when needed.'}
});
export const saveDemoExamAnswers=(value:Record<string,DemoQuizAnswer>)=>write('studymate_demo_exam_answers',value);
export const demoExamAttempts=()=>read<Record<string,ExamAttemptDetail>>('studymate_demo_exam_attempts',{});
export const saveDemoExamAttempts=(value:Record<string,ExamAttemptDetail>)=>write('studymate_demo_exam_attempts',value);

const future=(days:number,hour=18)=>{const value=new Date();value.setDate(value.getDate()+days);value.setHours(hour,0,0,0);return value.toISOString();};
const plannerSeed:Record<string,StudyPlanDetail>={'plan-network-midterm':{plan:{id:'plan-network-midterm',subject_id:'demo-network',subject_name:'Network Security',title:'Network Security Midterm',event_type:'exam',due_at:future(12,9),coverage:'Security Fundamentals and Firewalls & Access Control',notes:'Focus on terminology and compare firewall types.',created_at:new Date().toISOString(),updated_at:new Date().toISOString()},priorities:[
  {id:'net-2',title:'Firewalls & Access Control',subject_id:'demo-network',subject_name:'Network Security',processing_status:'ready',accuracy:52,weak_topic_count:1,weak_topics:['Firewall Types'],priority:53,status:'needs_review'},
  {id:'net-1',title:'Security Fundamentals',subject_id:'demo-network',subject_name:'Network Security',processing_status:'ready',accuracy:78,weak_topic_count:0,weak_topics:[],priority:22,status:'good'}
],tasks:[
  {id:'plan-task-1',plan_id:'plan-network-midterm',lesson_id:'net-2',lesson_title:'Firewalls & Access Control',title:'Review Firewalls & Access Control with flashcards',task_type:'flashcards',rationale:'Current accuracy is 52%, so focused recall should come before another assessment.',estimated_minutes:25,priority:53,position:1,due_at:future(2),completed_at:null},
  {id:'plan-task-2',plan_id:'plan-network-midterm',lesson_id:'net-1',lesson_title:'Security Fundamentals',title:'Take a focused quiz on Security Fundamentals',task_type:'quiz',rationale:'Current accuracy is 78%; use a short check to confirm retention.',estimated_minutes:20,priority:22,position:2,due_at:future(5),completed_at:null},
  {id:'plan-task-3',plan_id:'plan-network-midterm',lesson_id:null,lesson_title:null,title:'Complete a cumulative practice exam',task_type:'practice_exam',rationale:'A final mixed assessment checks coverage across every selected lesson before the deadline.',estimated_minutes:45,priority:55,position:3,due_at:future(9),completed_at:null}
]}};
export const demoStudyPlans=()=>read('studymate_demo_study_plans',plannerSeed);
export const saveDemoStudyPlans=(value:Record<string,StudyPlanDetail>)=>write('studymate_demo_study_plans',value);
