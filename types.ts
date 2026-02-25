
export interface Bill {
  id: string;
  title: string;
  summary: string;
  fullText: string;
  status: 'Introduced' | 'In Committee' | 'Passed House' | 'Law';
  sponsors: string[];
  dateIntroduced: string;
}

export interface Document {
  id: string;
  title: string;
  summary: string;
  fullText: string;
  dateAdded: string;
}

export enum AnalysisType {
  Summary = 'summary',
  Explanation = 'explanation',
  Impact = 'impact',
  GrammarCheck = 'grammar_check',
}

export interface Resolution {
  id:string;
  resolutionNumber: string;
  dateEnacted: string;
  dateApproved: string;
  term: string;
  sector: string;
  resolutionTitle: string;
  committee: string;
  author: string;
  filePath?: string;
}

export interface Ordinance {
  id: string;
  ordinanceNumber: string;
  dateEnacted: string;
  dateApproved: string;
  ordinanceTitle: string;
  author: string;
  committee: string;
  term: string;
  sector: string;
  fullText: string;
  filePath?: string;
}

export type AttendanceStatus = 'Present' | 'Absent' | 'OB' | 'Leave';

export interface SessionAttendance {
  legislatorId: string;
  status: AttendanceStatus;
}

export interface SessionMinute {
  id: string;
  sessionNumber: string;
  sessionDate: string;
  sessionType: 'Regular' | 'Special';
  term: string;
  sessionAttendance: SessionAttendance[];
  minutesContent?: string;
  filePath?: string;
  audioFilePath?: string;
}

export interface SessionAgenda {
  id: string;
  seriesNumber: string;
  sessionDate: string;
  timeStarted: string;
  timeFinished: string;
  sessionType: 'Regular' | 'Special';
  term: string;
  filePath?: string;
}

export interface Attendance {
  chairman: string[];
  viceChairman: string[];
  members: string[];
  others: string[];
}

export interface CommitteeReport {
  id: string;
  reportNumber: string;
  date: string;
  term: string;
  committee: string;
  committeeType: 'Meeting' | 'Hearing';
  attendance: Attendance;
  filePath?: string;
}

export interface IncomingDocument {
  id: string;
  referenceNumber: string;
  dateReceived: string;
  timeReceived: string;
  sender: string;
  subject: string;
  type: string;
  category?: 'General' | 'Annual Budget' | 'Supplemental Budget';
  status: string;
  statusDate?: string;
  remarks?: string;
  filePath?: string;

  // Calendar of Business / Legislative Actions
  urgentMattersDate?: string;
  unfinishedBusinessDate?: string;
  unassignedBusinessDate?: string;
  agendaItemNumber?: string;
  
  // First Reading
  firstReadingDate?: string;
  firstReadingRemarks?: string;
  concernedCommittee?: string;
  committeeReferralChairman?: string;

  // Committee Report
  committeeReportNumber?: string;
  committeeReportDate?: string;

  // Second Reading
  secondReadingDate?: string;
  secondReadingRemarks?: string;

  // Third Reading
  thirdReadingDate?: string;
  thirdReadingRemarks?: string;

  // Legislative Output
  outputType?: 'Resolution' | 'Ordinance';
  outputNumber?: string;
  sponsor?: string;
  seconder?: string;

  // Executive Action (Mayor)
  dateTransmittedToMayor?: string;
  dateApprovedByMayor?: string;
  dateVetoedByMayor?: string;

  // Provincial Review (Sangguniang Panlalawigan)
  dateTransmittedToSP?: string;
  spResolutionNumber?: string;
  dateReceivedFromSP?: string;

  // Records Management
  datePosted?: string;
  datePublished?: string;
  dateFiled?: string;

  // Recommended Actions & Signatures
  recommendedActions?: string[];
  secretarySignature?: string;
  viceMayorRemarks?: string;
  viceMayorSignature?: string;
}

export interface Position {
  id: string;
  title: string;
  term: string;
  rank: string;
}

export interface Legislator {
  id: string;
  name: string;
  dateOfBirth: string;
  positions: Position[];
  profileImageUrl?: string;
}

export interface CommitteeMembership {
  id: string;
  committeeName: string;
  termYear: string;
  chairman: Legislator['id'] | null;
  viceChairman: Legislator['id'] | null;
  members: Legislator['id'][];
}

export interface Term {
  id: string;
  yearFrom: string;
  yearTo: string;
}

export interface Sector {
  id: string;
  name: string;
}

export interface LegislativeMeasure {
  id: string;
  title: string;
  sectorIds: string[]; 
}

export interface DocumentType {
  id: string;
  name: string;
  code: string;
}

export interface DocumentStatus {
  id: string;
  name: string;
}

export type UserRole = 'admin' | 'user' | 'developer';

export interface UserAccount {
  id: string;
  userId: string;
  name: string;
  position: string;
  email: string;
  password?: string;
  role: UserRole;
  status: 'Active' | 'Inactive';
}