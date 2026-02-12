
import type { Bill, Ordinance, Resolution, SessionMinute, SessionAgenda, CommitteeReport, Legislator, CommitteeMembership, Term, UserAccount, Sector, LegislativeMeasure, IncomingDocument, DocumentType, DocumentStatus } from './types';

export const POSITIONS = [
    'Mayor',
    'Vice Mayor',
    'Councilor',
    'LIGA President',
    'IP Mandatory Representative',
    'SK Federation President'
];

export const COUNCILOR_RANKS = ['1', '2', '3', '4', '5', '6', '7', '8'];

export const MOCK_BILLS: Bill[] = [
  {
    id: 'HR-302',
    title: 'National Data Privacy & Protection Act',
    summary: 'A bill to establish a national framework for the privacy and protection of personal data for individuals under the jurisdiction of the United States.',
    fullText: `
Be it enacted by the Senate and House of Representatives of the United States of America in Congress assembled,

SECTION 1. SHORT TITLE.
This Act may be cited as the "National Data Privacy & Protection Act".

SECTION 2. DEFINITIONS.
In this Act:
(1) COVERED ENTITY.—The term "covered entity" means any person, library, or other organization that collects, processes, or stores covered data.
(2) COVERED DATA.—The term "covered data" means any information that is linked or reasonably linkable to an individual or a device that is linked or reasonably linkable to an individual.
(3) DATA MINIMIZATION.—The term "data minimization" means the practice of limiting the collection of personal information to that which is directly relevant and necessary to accomplish a specified purpose.

SECTION 3. DATA PRIVACY AND SECURITY REQUIREMENTS.
(a) Data Minimization.—A covered entity shall not collect, process, or retain covered data beyond what is reasonably necessary and proportionate to provide or maintain a specific product or service requested by the individual to whom the data pertains.
(b) Data Security.—A covered entity shall establish, implement, and maintain reasonable administrative, technical, and physical data security policies and practices to protect the security and confidentiality of covered data.
(c) Individual Ownership.—An individual retains full ownership rights to their covered data. A covered entity shall provide individuals with a clear and conspicuous means to access, correct, delete, and port their data.
    `,
    status: 'In Committee',
    sponsors: ['Rep. Anna Eshoo', 'Rep. Jan Schakowsky'],
    dateIntroduced: '2023-01-15',
  },
  {
    id: 'S-1199',
    title: 'Renewable Energy Advancement Act',
    summary: 'To amend the Internal Revenue Code of 1986 to provide for a comprehensive system of tax incentives for renewable energy and energy efficiency.',
    fullText: `
A BILL to amend the Internal Revenue Code of 1986 to provide for a comprehensive system of tax incentives for renewable energy and energy efficiency.

SECTION 1. SHORT TITLE.
This Act may be cited as the "Renewable Energy Advancement Act".

SECTION 2. RENEWABLE ELECTRICITY PRODUCTION CREDIT.
(a) In General.—For purposes of section 38, the renewable electricity production credit for any taxable year is an amount equal to the product of—
(1) 2.5 cents, multiplied by
(2) the kilowatt hours of electricity—
(A) produced by the taxpayer from qualified energy resources, and
(B) during the 10-year period beginning on the date the facility was originally placed in service, sold by the taxpayer to an unrelated person during the taxable year.

SECTION 3. ENERGY INVESTMENT TAX CREDIT.
(a) Extension of Credit for Solar Energy Property.—Section 48(a)(3)(A)(i) is amended by striking "January 1, 2024" and inserting "January 1, 2034".
(b) Extension of Credit for Geothermal Energy Property.—Section 48(a)(3)(A)(iii) is amended by striking "January 1, 2024" and inserting "January 1, 2034".
    `,
    status: 'Introduced',
    sponsors: ['Sen. Maria Cantwell', 'Sen. Chuck Grassley'],
    dateIntroduced: '2023-03-22',
  },
  {
    id: 'HR-5011',
    title: 'American AI Leadership Act',
    summary: 'To establish a national strategy for artificial intelligence, and to ensure the United States maintains a global leadership position in AI research and development.',
    fullText: `
To establish a national strategy for the development and deployment of artificial intelligence, and for other purposes.

SECTION 1. SHORT TITLE.
This Act may be cited as the "American AI Leadership Act".

SECTION 2. NATIONAL ARTIFICIAL INTELLIGENCE STRATEGY.
(a) In General.—The Director of the Office of Science and Technology Policy, in coordination with the National Science and Technology Council's Select Committee on Artificial Intelligence, shall develop and implement a National Artificial Intelligence Strategy.
(b) Goals.—The goals of the Strategy shall be to—
(1) increase research and development in AI for the economic and national security of the United States;
(2) improve the education of students in AI-related subjects;
(3) create a workforce that is prepared for the integration of AI systems across all sectors of the economy and society; and
(4) promote public-private partnerships to accelerate the adoption of AI technologies.

SECTION 3. AI RESEARCH INITIATIVE.
The Director of the National Science Foundation shall establish a national AI Research Initiative to support long-term, high-impact research in artificial intelligence. The Initiative will fund university research, graduate fellowships, and the creation of multidisciplinary AI research centers.
    `,
    status: 'Passed House',
    sponsors: ['Rep. Will Hurd', 'Rep. Robin Kelly'],
    dateIntroduced: '2022-09-01',
  },
];

const DEFAULT_TERM = '2024-07-01-2027-06-30';
const PREVIOUS_TERM = '2021-07-01-2024-06-30';

export const MOCK_RESOLUTIONS: Resolution[] = [
    {
        id: 'res-001',
        resolutionNumber: '2024-05',
        dateEnacted: '2024-05-15',
        dateApproved: '2024-05-20',
        term: DEFAULT_TERM,
        sector: 'Public Safety',
        resolutionTitle: 'Resolution to Increase Funding for Community Policing Initiatives',
        committee: 'Public Safety and Justice Committee',
        author: 'Jane Doe',
        filePath: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    },
    {
        id: 'res-002',
        resolutionNumber: '2024-06',
        dateEnacted: '2024-06-01',
        dateApproved: '2024-06-05',
        term: DEFAULT_TERM,
        sector: 'Infrastructure',
        resolutionTitle: 'A Resolution Authorizing the Repair of the Main Street Bridge',
        committee: 'Transportation and Infrastructure Committee',
        author: 'John Smith',
        filePath: undefined,
    }
];

export const MOCK_ORDINANCES: Ordinance[] = [
    {
        id: 'ord-001',
        ordinanceNumber: '2024-A12',
        dateEnacted: '2024-07-10',
        dateApproved: '2024-07-15',
        ordinanceTitle: 'An Ordinance Regulating Short-Term Rentals',
        author: 'Alex Ray',
        committee: 'Housing and Urban Development',
        term: DEFAULT_TERM,
        sector: 'Economic Development',
        fullText: 'This ordinance establishes licensing requirements, safety standards, and tax obligations for all short-term rental properties operating within the city limits. It aims to balance tourism with residential quality of life.',
        filePath: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    },
    {
        id: 'ord-002',
        ordinanceNumber: '2024-B05',
        dateEnacted: '2024-08-01',
        dateApproved: '2024-08-08',
        ordinanceTitle: 'Ordinance for the Creation of a Downtown Historic District',
        author: 'Maria Garcia',
        committee: 'Cultural Affairs and Historic Preservation',
        term: DEFAULT_TERM,
        sector: 'Infrastructure',
        fullText: 'This ordinance officially designates the area bounded by Elm St, Oak Ave, 1st St, and 5th St as a historic district. It introduces guidelines for building modifications to preserve the architectural character of the area.',
        filePath: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    }
];

export const MOCK_SESSION_MINUTES: SessionMinute[] = [
    {
        id: 'sm-001',
        sessionNumber: '15th Regular Session',
        sessionDate: '2024-09-01',
        sessionType: 'Regular',
        term: DEFAULT_TERM,
        sessionAttendance: [
            { legislatorId: 'leg-001', status: 'Present' },
            { legislatorId: 'leg-002', status: 'Present' },
            { legislatorId: 'leg-003', status: 'Absent' },
            { legislatorId: 'leg-004', status: 'OB' },
        ],
        minutesContent: 'Call to Order: The session was called to order at 10:00 AM.\n\nRoll Call: The Secretary called the roll.\n\nApproval of Minutes: The minutes of the previous session were approved.\n\nBusiness of the Day: Discussion on local infrastructure projects.',
        filePath: undefined,
    },
    {
        id: 'sm-002',
        sessionNumber: 'Special Session 2024-03',
        sessionDate: '2024-09-10',
        sessionType: 'Special',
        term: DEFAULT_TERM,
        sessionAttendance: [
            { legislatorId: 'leg-001', status: 'Present' },
            { legislatorId: 'leg-002', status: 'Present' },
            { legislatorId: 'leg-003', status: 'Present' },
            { legislatorId: 'leg-004', status: 'Leave' },
        ],
        minutesContent: 'Call to Order: 2:00 PM.\n\nAgenda: Urgent disaster relief appropriation.\n\nResolution passed approving the release of calamity funds.',
        filePath: undefined,
    }
];

export const MOCK_SESSION_AGENDAS: SessionAgenda[] = [
    {
        id: 'sa-001',
        seriesNumber: '2024-001',
        sessionDate: '2024-09-15',
        timeStarted: '10:00',
        timeFinished: '12:00',
        sessionType: 'Regular',
        term: DEFAULT_TERM,
        filePath: undefined,
    },
    {
        id: 'sa-002',
        seriesNumber: '2024-002',
        sessionDate: '2024-09-22',
        timeStarted: '14:30',
        timeFinished: '16:30',
        sessionType: 'Special',
        term: DEFAULT_TERM,
        filePath: undefined,
    }
];

export const MOCK_COMMITTEE_REPORTS: CommitteeReport[] = [
    {
        id: 'cr-001',
        reportNumber: 'CR-2024-01',
        date: '2024-10-01',
        term: DEFAULT_TERM,
        committee: 'Transportation and Infrastructure Committee',
        committeeType: 'Meeting',
        attendance: {
            chairman: ['John Doe'],
            viceChairman: ['Jane Smith'],
            members: ['Alex Ray', 'Maria Garcia'],
            others: []
        },
        filePath: undefined,
    },
    {
        id: 'cr-002',
        reportNumber: 'CR-2024-02',
        date: '2024-10-15',
        term: DEFAULT_TERM,
        committee: 'Public Safety and Justice Committee',
        committeeType: 'Hearing',
        attendance: {
            chairman: ['Councilmember Jane Doe'],
            viceChairman: [],
            members: ['John Smith', 'Alex Ray'],
            others: ['Police Chief Miller']
        },
        filePath: undefined,
    }
];

export const MOCK_INCOMING_DOCUMENTS: IncomingDocument[] = [
    {
        id: 'inc-001',
        referenceNumber: 'REF-2024-100',
        dateReceived: '2024-10-05',
        timeReceived: '09:30',
        sender: 'Office of the Mayor',
        subject: 'Proposed Budget for 2025',
        type: 'Proposed Ordinance',
        category: 'Annual Budget',
        status: 'Referred to Committee',
        concernedCommittee: 'Public Safety and Justice Committee',
        firstReadingDate: '2024-10-12',
        remarks: 'Referred to Committee on Public Safety',
        filePath: undefined,
        outputType: 'Ordinance',
        outputNumber: 'ORD-2024-001',
    },
    {
        id: 'inc-002',
        referenceNumber: 'REF-2024-101',
        dateReceived: '2024-10-08',
        timeReceived: '14:15',
        sender: 'Barangay Poblacion',
        subject: 'Request for Fiesta Support',
        type: 'Letter',
        status: 'Pending',
        filePath: undefined,
    }
];

export const MOCK_LEGISLATORS: Legislator[] = [
    {
        id: 'leg-001',
        name: 'Jane Doe',
        dateOfBirth: '1980-05-15',
        positions: [
            { id: 'pos-1', title: 'Councilor', term: DEFAULT_TERM, rank: '1' },
            { id: 'pos-2', title: 'Councilor', term: PREVIOUS_TERM, rank: '2' },
        ],
    },
    {
        id: 'leg-002',
        name: 'John Smith',
        dateOfBirth: '1975-11-20',
        positions: [
            { id: 'pos-3', title: 'Councilor', term: DEFAULT_TERM, rank: '3' }
        ],
    },
    {
        id: 'leg-003',
        name: 'Alex Ray',
        dateOfBirth: '1990-02-10',
        positions: [
            { id: 'pos-4', title: 'Councilor', term: DEFAULT_TERM, rank: '4' }
        ],
    },
    {
        id: 'leg-004',
        name: 'Maria Garcia',
        dateOfBirth: '1968-09-01',
        positions: [
            { id: 'pos-5', title: 'Vice Mayor', term: DEFAULT_TERM, rank: 'N/A' }
        ],
    }
];

export const MOCK_COMMITTEE_MEMBERSHIPS: CommitteeMembership[] = [
    {
        id: 'cm-001',
        committeeName: 'Public Safety and Justice Committee',
        termYear: DEFAULT_TERM,
        chairman: 'leg-001',
        viceChairman: null,
        members: ['leg-003'],
    },
    {
        id: 'cm-002',
        committeeName: 'Transportation and Infrastructure Committee',
        termYear: DEFAULT_TERM,
        chairman: 'leg-002',
        viceChairman: 'leg-004',
        members: ['leg-001', 'leg-003'],
    }
];

export const MOCK_TERMS: Term[] = [
    {
        id: 'term-001',
        yearFrom: '2021-07-01',
        yearTo: '2024-06-30',
    },
    {
        id: 'term-002',
        yearFrom: '2024-07-01',
        yearTo: '2027-06-30',
    }
];

export const MOCK_SECTORS: Sector[] = [
  { id: 'sec-001', name: 'Public Safety' },
  { id: 'sec-002', name: 'Infrastructure' },
  { id: 'sec-003', name: 'Health and Human Services' },
  { id: 'sec-004', name: 'Education' },
  { id: 'sec-005', name: 'Economic Development' },
];

export const MOCK_LEGISLATIVE_MEASURES: LegislativeMeasure[] = [
    { id: 'lm-001', title: 'Budget Appropriation', sectorIds: ['sec-005'] },
    { id: 'lm-002', title: 'Road Maintenance', sectorIds: ['sec-002'] },
    { id: 'lm-003', title: 'Traffic Regulation', sectorIds: ['sec-001', 'sec-002'] },
];

export const MOCK_DOCUMENT_TYPES: DocumentType[] = [
    { id: 'dt-001', name: 'Letter', code: 'LTR' },
    { id: 'dt-002', name: 'Indorsement', code: 'IND' },
    { id: 'dt-003', name: 'Memorandum', code: 'MEM' },
    { id: 'dt-004', name: 'Order', code: 'ORD' },
    { id: 'dt-005', name: 'Proposed Ordinance', code: 'PO' },
    { id: 'dt-006', name: 'Barangay Ordinance', code: 'BO' },
];

export const MOCK_DOCUMENT_STATUSES: DocumentStatus[] = [
    { id: 'ds-001', name: 'Pending' },
    { id: 'ds-002', name: 'Referred to Committee' },
    { id: 'ds-003', name: 'Acted Upon' },
    { id: 'ds-004', name: 'Filed' },
    { id: 'ds-005', name: 'Returned to Sender' },
    { id: 'ds-006', name: 'First Reading' },
    { id: 'ds-007', name: 'Second Reading' },
    { id: 'ds-008', name: 'Third/Final Reading' },
    { id: 'ds-009', name: 'To be Calendared' },
    { id: 'ds-010', name: 'Approved' },
];

export const MOCK_USER_ACCOUNTS: UserAccount[] = [
  {
    id: 'user-001',
    userId: 'admin',
    name: 'Admin User',
    position: 'System Administrator',
    email: 'admin@example.com',
    password: 'password123',
    role: 'admin',
    status: 'Active',
  },
  {
    id: 'user-002',
    userId: 'user1',
    name: 'Regular User',
    position: 'Legislative Staff',
    email: 'user@example.com',
    password: 'password123',
    role: 'user',
    status: 'Active',
  },
  {
    id: 'user-003',
    userId: 'inactive1',
    name: 'Inactive User',
    position: 'Former Staff',
    email: 'inactive@example.com',
    password: 'password123',
    role: 'user',
    status: 'Inactive',
  },
  {
    id: 'user-angel',
    userId: 'angel',
    name: 'Angel Jr. L. Pines',
    position: 'Administrative Assistant III',
    email: 'angeladmin@example.com',
    password: 'ii88',
    role: 'admin',
    status: 'Active',
  }
];
