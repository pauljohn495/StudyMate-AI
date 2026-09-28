import { topicThresholds } from '../config/env.js';

export type TopicStatus='strong'|'good'|'needs_review'|'weak';

export const classifyAccuracy=(percentage:number):TopicStatus=>percentage>=topicThresholds.strong?'strong':percentage>=topicThresholds.good?'good':percentage>=topicThresholds.needsReview?'needs_review':'weak';

export const recommendationFor=(input:{topic:string;status:TopicStatus;lessonId:string})=>{
  if(input.status==='weak')return{title:`Rebuild ${input.topic}`,description:'Review the lesson, study its flashcards, then take a focused 10-question quiz.',action:'Review lesson',href:`/app/lessons/${input.lessonId}/study-tools`};
  if(input.status==='needs_review')return{title:`Strengthen ${input.topic}`,description:'Revisit the key concepts and retake a short quiz while the material is fresh.',action:'Practice again',href:`/app/lessons/${input.lessonId}/quizzes`};
  if(input.status==='good')return{title:`Push ${input.topic} to strong`,description:'Use a focused practice quiz to close the remaining gaps.',action:'Take a quiz',href:`/app/lessons/${input.lessonId}/quizzes`};
  return{title:`Maintain ${input.topic}`,description:'Keep this topic active with spaced flashcard reviews.',action:'Study cards',href:`/app/lessons/${input.lessonId}/flashcards`};
};
