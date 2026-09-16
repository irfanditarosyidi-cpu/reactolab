// RTDB path helpers — single source of truth for the data layout (PRD §28)

export const P = {
  users: "users",
  user: (uid: string) => `users/${uid}`,
  classes: "classes",
  class: (cid: string) => `classes/${cid}`,
  orientationMedia: (cid: string, moduleId: number) =>
    `classes/${cid}/orientationMedia/${moduleId}`,
  classCodes: "classCodes",
  classCode: (code: string) => `classCodes/${code}`,
  members: (cid: string) => `classMemberships/${cid}`,
  member: (cid: string, uid: string) => `classMemberships/${cid}/${uid}`,
  progressClass: (cid: string) => `progress/${cid}`,
  progress: (cid: string, uid: string) => `progress/${cid}/${uid}`,
  responses: (cid: string, uid: string) => `responses/${cid}/${uid}`,
  moduleResponses: (cid: string, uid: string, m: number) =>
    `responses/${cid}/${uid}/m${m}`,
  sectionResponse: (cid: string, uid: string, m: number, s: string) =>
    `responses/${cid}/${uid}/m${m}/${s}`,
  experiment: (cid: string, uid: string) => `experimentData/${cid}/${uid}`,
  expRuns: (cid: string, uid: string, m: number) =>
    `experimentData/${cid}/${uid}/m${m}/runs`,
  lkpd: (cid: string, uid: string) => `lkpdSnapshots/${cid}/${uid}`,
  cases: (cid: string) => `discussionCases/${cid}`,
  caseItem: (cid: string, caseId: string) => `discussionCases/${cid}/${caseId}`,
  posts: (cid: string, caseId: string) => `forumPosts/${cid}/${caseId}`,
  post: (cid: string, caseId: string, uid: string) =>
    `forumPosts/${cid}/${caseId}/${uid}`,
  comments: (cid: string, caseId: string) => `forumComments/${cid}/${caseId}`,
  discussionProgress: (cid: string, uid: string) =>
    `discussionProgress/${cid}/${uid}`,
  conclusion: (cid: string) => `teacherConclusions/${cid}`,
  grades: (cid: string) => `grades/${cid}`,
  grade: (cid: string, uid: string) => `grades/${cid}/${uid}`,
  moduleGrade: (cid: string, uid: string, m: number) =>
    `grades/${cid}/${uid}/m${m}`,
  practiceConfigs: "practiceConfigs",
  practiceConfig: (cid: string) => `practiceConfigs/${cid}`,
  resetRequests: "passwordResetRequests",
  audit: "auditLogs",
};
