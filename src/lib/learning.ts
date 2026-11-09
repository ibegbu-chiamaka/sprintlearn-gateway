export const REQUIRED_QUIZ_SCORE = 65;

export function isQuizPassed(score: number, passingScore = REQUIRED_QUIZ_SCORE) {
  return score >= passingScore;
}

export function isCourseComplete(input: {
  allSessionsComplete: boolean;
  allQuizzesPassed: boolean;
  practicalRequired: boolean;
  practicalPassed: boolean;
}) {
  return input.allSessionsComplete && input.allQuizzesPassed && (!input.practicalRequired || input.practicalPassed);
}