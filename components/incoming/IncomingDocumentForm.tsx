
import React, { useState, useEffect, useMemo } from 'react';
import type { IncomingDocument, DocumentType, DocumentStatus, CommitteeMembership, Legislator } from '../../types';
import { getAIAssistantResponse } from '../../services/geminiService';

interface IncomingDocumentFormProps {
    initialData?: IncomingDocument | null;
    documentTypes: DocumentType[];
    documentStatuses: DocumentStatus[];
    existingDocuments: IncomingDocument[];
    committeeMemberships: CommitteeMembership[];
    legislators: Legislator[];
    onSubmit: (data: Omit<IncomingDocument, 'id'> | IncomingDocument) => void;
    onCancel: () => void;
}

const getInitialFormData = (): Omit<IncomingDocument, 'id'> => ({
    referenceNumber: '',
    dateReceived: '',
    timeReceived: '',
    sender: '',
    subject: '',
    type: '',
    category: undefined,
    status: 'Pending',
    statusDate: '',
    
    // Calendar of Business / Legislative Actions
    urgentMattersDate: '',
    unfinishedBusinessDate: '',
    unassignedBusinessDate: '',
    agendaItemNumber: '',
    
    firstReadingDate: '',
    firstReadingRemarks: '',
    concernedCommittee: '',
    committeeReferralChairman: '',

    // Committee Report
    committeeReportNumber: '',
    committeeReportDate: '',

    secondReadingDate: '',
    secondReadingRemarks: '',

    thirdReadingDate: '',
    thirdReadingRemarks: '',

    // Legislative Output
    outputType: undefined,
    outputNumber: '',
    sponsor: '',
    seconder: '',

    // Executive Action (Mayor)
    dateTransmittedToMayor: '',
    dateApprovedByMayor: '',
    dateVetoedByMayor: '',

    // Provincial Review (Sangguniang Panlalawigan)
    dateTransmittedToSP: '',
    spResolutionNumber: '',
    dateReceivedFromSP: '',

    // Records Management
    datePosted: '',
    datePublished: '',
    dateFiled: '',

    // Action & Remarks
    recommendedActions: [],
    remarks: '', 
    secretarySignature: '',
    viceMayorRemarks: '',
    viceMayorSignature: '',

    filePath: undefined,
});

const RECOMMENDED_ACTIONS = [
    "For Information",
    "For Approval/Disapproval",
    "For Indorsement",
    "For Calendar/Inclusion in the Order of Business",
    "For Signature",
    "For Comment",
    "For Legislative Action",
    "Others"
];

const IncomingDocumentForm: React.FC<IncomingDocumentFormProps> = ({ initialData, documentTypes = [], documentStatuses = [], existingDocuments = [], committeeMemberships = [], legislators = [], onSubmit, onCancel }) => {
    const [formData, setFormData] = useState(getInitialFormData());
    const [attachment, setAttachment] = useState<File | null>(null);
    
    const [showSenderSuggestions, setShowSenderSuggestions] = useState(false);
    const [filteredSenders, setFilteredSenders] = useState<string[]>([]);

    const [showSecretarySuggestions, setShowSecretarySuggestions] = useState(false);
    const [filteredSecretaries, setFilteredSecretaries] = useState<string[]>([]);

    // Findings Report State
    const [findingsContent, setFindingsContent] = useState('');
    const [isGeneratingFindings, setIsGeneratingFindings] = useState(false);

    // Draft Resolution State
    const [draftResolutionContent, setDraftResolutionContent] = useState('');
    const [isGeneratingResolution, setIsGeneratingResolution] = useState(false);

    useEffect(() => {
        if (initialData) {
            setFormData({ ...getInitialFormData(), ...initialData });
        } else {
             setFormData(getInitialFormData());
        }
        setAttachment(null);
        setFindingsContent('');
        setDraftResolutionContent('');
    }, [initialData]);

    const uniqueSenders = useMemo(() => {
        const senders = (existingDocuments || [])
            .map(doc => doc.sender)
            .filter((s): s is string => !!s);
        return Array.from(new Set(senders)).sort();
    }, [existingDocuments]);

    // Available Signatories (Legislators active in the document's term)
    const availableSignatories = useMemo(() => {
        const legis = legislators || [];
        if (!formData.dateReceived) return legis;
        
        const receivedDate = new Date(formData.dateReceived);
        receivedDate.setHours(0,0,0,0);
        
        return legis.filter(l => {
            return (l.positions || []).some(p => {
                if (!p.term) return false;
                
                // Parse Term: YYYY-MM-DD-YYYY-MM-DD
                const parts = p.term.split('-');
                if (parts.length >= 6) {
                    const startDate = new Date(`${parts[0]}-${parts[1]}-${parts[2]}`);
                    const endDate = new Date(`${parts[3]}-${parts[4]}-${parts[5]}`);
                    startDate.setHours(0,0,0,0);
                    endDate.setHours(0,0,0,0);
                    return receivedDate >= startDate && receivedDate <= endDate;
                }
                
                // Fallback: Check years
                const years = p.term.match(/(\d{4})/g);
                if (years && years.length >= 2) {
                    const startYear = parseInt(years[0]);
                    const endYear = parseInt(years[1]);
                    const receivedYear = receivedDate.getFullYear();
                    return receivedYear >= startYear && receivedYear <= endYear;
                }
                return false;
            });
        });
    }, [legislators, formData.dateReceived]);

    // Suggestions for Secretary Signature: Mix of term legislators and previously used names
    const secretarySuggestions = useMemo(() => {
        const fromHistory = (existingDocuments || []).map(doc => doc.secretarySignature).filter(Boolean);
        const fromLegislators = availableSignatories.map(l => l.name);
        return Array.from(new Set([...fromHistory, ...fromLegislators])).sort() as string[];
    }, [existingDocuments, availableSignatories]);

    const availableCommittees = useMemo(() => {
        const memberships = committeeMemberships || [];
        if (formData.dateReceived) {
            const receivedDate = new Date(formData.dateReceived);
            receivedDate.setHours(0, 0, 0, 0);

            const validMemberships = memberships.filter(cm => {
                const years = cm.termYear ? cm.termYear.match(/(\d{4})/g) : null;
                if (years && years.length >= 2) {
                    const startYear = parseInt(years[0]);
                    const endYear = parseInt(years[years.length - 1]);
                    const receivedYear = receivedDate.getFullYear();
                    return receivedYear >= startYear && receivedYear <= endYear;
                }
                return false;
            });
            return Array.from(new Set(validMemberships.map(cm => cm.committeeName))).sort();
        }
        return Array.from(new Set(memberships.map(cm => cm.committeeName))).sort();
    }, [committeeMemberships, formData.dateReceived]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCommitteeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const committeeName = e.target.value;
        let chairmanName = '';

        if (committeeName) {
            // Prefer memberships matching the received date if available
            let relevantMemberships = committeeMemberships.filter(cm => cm.committeeName === committeeName);
            
            if (formData.dateReceived) {
                 const receivedDate = new Date(formData.dateReceived);
                 receivedDate.setHours(0, 0, 0, 0);
                 
                 const termMatch = relevantMemberships.find(cm => {
                    const years = cm.termYear ? cm.termYear.match(/(\d{4})/g) : null;
                    if (years && years.length >= 2) {
                        const startYear = parseInt(years[0]);
                        const endYear = parseInt(years[years.length - 1]);
                        const receivedYear = receivedDate.getFullYear();
                        return receivedYear >= startYear && receivedYear <= endYear;
                    }
                    return false;
                 });
                 
                 if (termMatch) relevantMemberships = [termMatch];
            }

            // Use the most relevant membership found (or first one)
            const membership = relevantMemberships[0];

            if (membership && membership.chairman) {
                const chairman = legislators.find(l => l.id === membership.chairman);
                if (chairman) chairmanName = chairman.name;
            }
        }

        setFormData(prev => ({ 
            ...prev, 
            concernedCommittee: committeeName,
            committeeReferralChairman: chairmanName,
            sponsor: chairmanName // Auto-populate sponsor in legislative output
        }));
    };

    const handleActionCheckboxChange = (action: string, checked: boolean) => {
        setFormData(prev => {
            const currentActions = prev.recommendedActions || [];
            if (checked) {
                return { ...prev, recommendedActions: [...currentActions, action] };
            } else {
                return { ...prev, recommendedActions: currentActions.filter(a => a !== action) };
            }
        });
    };

    const handleOutputCheck = (type: 'Resolution' | 'Ordinance') => {
        setFormData(prev => {
            if (prev.outputType === type) return { ...prev, outputType: undefined, outputNumber: '' };
            
            const prefix = type === 'Resolution' ? 'RES' : 'ORD';
            const year = new Date().getFullYear();
            const formatPrefix = `${prefix}-${year}-`;
            
            let maxSeq = 0;
            (existingDocuments || []).forEach(doc => {
                if (doc.outputNumber && doc.outputNumber.startsWith(formatPrefix)) {
                    const parts = doc.outputNumber.split('-');
                    // Expected format: PRE-YYYY-SEQ. SEQ is at index 2.
                    const seq = parts.length >= 3 ? parseInt(parts[2], 10) : 0;
                    if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
                }
            });
            
            const nextSeq = String(maxSeq + 1).padStart(3, '0');
            return { ...prev, outputType: type, outputNumber: `${formatPrefix}${nextSeq}` };
        });
    };

    const handleSenderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setFormData(prev => ({ ...prev, sender: value }));
        if (value.trim()) {
            const matches = uniqueSenders.filter(s => s.toLowerCase().includes(value.toLowerCase()) && s.toLowerCase() !== value.toLowerCase());
            setFilteredSenders(matches);
            setShowSenderSuggestions(matches.length > 0);
        } else {
            setShowSenderSuggestions(false);
        }
    };

    const handleSenderSelect = (sender: string) => {
        setFormData(prev => ({ ...prev, sender }));
        setShowSenderSuggestions(false);
    };

    const handleSecretaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setFormData(prev => ({ ...prev, secretarySignature: value }));
        if (value.trim()) {
            const matches = secretarySuggestions.filter(s => s.toLowerCase().includes(value.toLowerCase()) && s.toLowerCase() !== value.toLowerCase());
            setFilteredSecretaries(matches);
            setShowSecretarySuggestions(matches.length > 0);
        } else {
            setShowSecretarySuggestions(false);
        }
    };

    const handleSecretarySelect = (name: string) => {
        setFormData(prev => ({ ...prev, secretarySignature: name }));
        setShowSecretarySuggestions(false);
    };

    const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const typeName = e.target.value;
        const selectedType = (documentTypes || []).find(dt => dt.name === typeName);
        let newReferenceNumber = formData.referenceNumber;

        if (!initialData && selectedType) {
            const code = selectedType.code;
            const today = new Date();
            const dateStr = `${String(today.getDate()).padStart(2, '0')}${String(today.getMonth() + 1).padStart(2, '0')}${today.getFullYear()}`;
            let maxSeq = 0;
            (existingDocuments || []).forEach(doc => {
                if (doc.referenceNumber && doc.referenceNumber.startsWith(`${code}-`)) {
                    const parts = doc.referenceNumber.split('-');
                    const seq = parts.length >= 3 ? parseInt(parts[parts.length - 1], 10) : 0;
                    if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
                }
            });
            newReferenceNumber = `${code}-${dateStr}-${String(maxSeq + 1).padStart(3, '0')}`;
        }

        setFormData(prev => ({ 
            ...prev, 
            type: typeName, 
            referenceNumber: newReferenceNumber,
            category: ['Proposed Ordinance', 'Barangay Ordinance'].includes(typeName) ? prev.category : undefined 
        }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setAttachment(e.target.files[0]);
            setFormData(prev => ({...prev, filePath: undefined}));
        }
    };

    const handleRemoveAttachment = () => {
        setFormData(prev => ({...prev, filePath: undefined}));
        setAttachment(null);
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.referenceNumber.trim() || !formData.dateReceived || !formData.timeReceived || !formData.sender.trim() || !formData.subject.trim()) {
            alert('Required fields are missing.');
            return;
        }

        const finalData = { ...formData };
        if (attachment) {
            if (initialData?.filePath?.startsWith('blob:')) URL.revokeObjectURL(initialData.filePath);
            finalData.filePath = URL.createObjectURL(attachment);
        }
        if(initialData) onSubmit({ ...initialData, ...finalData });
        else onSubmit(finalData);
    };

    const deadlineInfo = useMemo(() => {
        if (!formData.dateReceived || !formData.timeReceived || !formData.category || !['Barangay Ordinance', 'Proposed Ordinance'].includes(formData.type)) return null;
        
        let dayLimit = 0;
        let legalBasis = '';

        if (formData.type === 'Barangay Ordinance') {
            if (formData.category === 'General') {
                dayLimit = 30;
                legalBasis = 'Sec. 56, RA 7160';
            } else if (['Annual Budget', 'Supplemental Budget'].includes(formData.category)) {
                dayLimit = 60;
                legalBasis = 'Sec. 333, RA 7160';
            }
        } else if (formData.type === 'Proposed Ordinance') {
            if (formData.category === 'General') {
                dayLimit = 30;
                legalBasis = 'Sec. 56, RA 7160';
            } else if (['Annual Budget', 'Supplemental Budget'].includes(formData.category)) {
                dayLimit = 90;
                legalBasis = 'Sec. 327, RA 7160';
            }
        }
        
        if (dayLimit === 0) return null;
        
        const received = new Date(`${formData.dateReceived}T${formData.timeReceived}`);
        const deadline = new Date(received);
        deadline.setDate(received.getDate() + dayLimit);
        const daysRemaining = Math.round((deadline.getTime() - new Date().setHours(0,0,0,0)) / (1000 * 60 * 60 * 24));
        
        return { dayLimit, deadlineDate: deadline, daysRemaining, legalBasis };
    }, [formData.dateReceived, formData.timeReceived, formData.type, formData.category]);

    // --- AI Findings Report Logic ---
    const generateFindings = async () => {
        if (!deadlineInfo) return;
        setIsGeneratingFindings(true);
        
        const isBudget = ['Annual Budget', 'Supplemental Budget'].includes(formData.category || '');
        const isBarangayOrMunicipal = ['Barangay Ordinance', 'Proposed Ordinance'].includes(formData.type);

        let specificLegalInstruction = '';
        
        if (isBudget && isBarangayOrMunicipal && formData.dateReceived) {
             // Parse YYYY-MM-DD
             const parts = formData.dateReceived.split('-');
             if (parts.length === 3) {
                 const month = parseInt(parts[1], 10);
                 const day = parseInt(parts[2], 10);
                 
                 // Check if beyond October 16
                 const isLate = month > 10 || (month === 10 && day > 16);

                 if (isLate) {
                     specificLegalInstruction = `
                     CRITICAL OBSERVATION: This Annual Budget was submitted/received on ${formData.dateReceived}, which is BEYOND the October 16th submission period.
                     You MUST cite **Section 329 of RA 7160** in the findings specifically noting this non-compliance with the prescribed submission date.
                     `;
                 } else {
                     specificLegalInstruction = `
                     Cite **Section 329 of RA 7160** as the pertinent legal basis for the enactment and review timeline.
                     `;
                 }
             }
        }

        // Construct Legislative Action Summary
        const legislativeActions = [];
        if (formData.firstReadingDate) legislativeActions.push(`First Reading on ${formData.firstReadingDate} (Ref to: ${formData.concernedCommittee || 'Unspecified'}) - Remarks: ${formData.firstReadingRemarks || 'None'}`);
        if (formData.secondReadingDate) legislativeActions.push(`Second Reading on ${formData.secondReadingDate} - Remarks: ${formData.secondReadingRemarks || 'None'}`);
        if (formData.thirdReadingDate) legislativeActions.push(`Third Reading on ${formData.thirdReadingDate} - Remarks: ${formData.thirdReadingRemarks || 'None'}`);
        
        const hasLegislativeActions = legislativeActions.length > 0;
        const actionsText = hasLegislativeActions ? legislativeActions.join('\n') : "No legislative actions recorded yet.";

        const prompt = `
        You are a legislative legal officer of the Sangguniang Bayan of Maasim. Draft a formal "Report of Findings and Recommendations" for the review of a local ordinance.
        
        Document Details:
        - Type: ${formData.type}
        - Category: ${formData.category || 'General'}
        - Reference Number: ${formData.referenceNumber}
        - Subject: ${formData.subject}
        - Sender/Origin: ${formData.sender}
        - Date Received: ${formData.dateReceived}
        - Reglementary Period Requirement: ${deadlineInfo.dayLimit} Days
        - Legal Basis: ${deadlineInfo.legalBasis}
        - Target Action Date (Deadline): ${deadlineInfo.deadlineDate.toLocaleDateString()}
        
        Legislative Output Record:
        - Output Type: ${formData.outputType || 'None'}
        - Output Number: ${formData.outputNumber || 'None'}

        Legislative Action History (from Form):
        ${actionsText}
        
        General Remarks: ${formData.remarks || 'None'}

        Current Status:
        - Days Remaining: ${deadlineInfo.daysRemaining}
        - Condition: ${deadlineInfo.daysRemaining < 0 ? 'Review Period Lapsed' : 'Within Review Period'}
        
        Instructions:
        1. **PRIORITY CHECK (Legislative Output):**
           - IF "Legislative Output Record" indicates a Resolution or Ordinance was issued (Output Type and Number are not "None"), you MUST conclude that the Sangguniang Bayan **HAS TAKEN FINAL ACTION** on the matter.
           - Cite the specific output (${formData.outputType} No. ${formData.outputNumber}) as the proof of review and approval/action.
           - Explicitly stated that because this output exists, the measure is **NOT** deemed approved by inaction, but rather approved/enacted via the legislative process.

        2. **IF NO Legislative Output exists:**
           - Check 'Legislative Action History'.
           - IF any legislative actions (e.g., First Reading, Second Reading) are recorded, state that the subject ordinance/resolution WAS TAKEN UP and acted upon by the body. Use the specific dates and remarks provided.
           - IF 'Legislative Action History' is empty AND the review period has lapsed (Days Remaining < 0), THEN state that the ordinance is DEEMED APPROVED by operation of law due to inaction/no action taken within the reglementary period.
           - IF 'Legislative Action History' is empty AND it is within the period, state the urgency of the review.
        
        ${specificLegalInstruction}
        
        3. Use a formal, legalistic tone suitable for the Sangguniang Bayan records.
        4. Structure the report as follows:
           I. PRELIMINARY INFORMATION (Summary of document)
           II. FINDINGS OF FACT (Dates, computation of period, **Action Taken (Output)** or lapse status${isBudget && specificLegalInstruction.includes('BEYOND') ? ', including late submission analysis' : ''})
           III. LEGAL ANALYSIS (Application of ${deadlineInfo.legalBasis} ${isBudget ? 'and Section 329 of RA 7160' : ''})
           IV. RECOMMENDATIONS
        5. Do NOT use markdown formatting (like ** or ##). Use plain text with clear spacing and UPPERCASE for main headers.
        `;

        try {
            const response = await getAIAssistantResponse(prompt);
            setFindingsContent(response);
        } catch (e) {
            alert('Failed to generate findings. Please check your connection.');
        } finally {
            setIsGeneratingFindings(false);
        }
    };

    const generateDraftResolution = async () => {
        setIsGeneratingResolution(true);
        
        const outputType = formData.outputType || 'Resolution';
        const outputNumber = formData.outputNumber || '_____';
        const sponsor = formData.sponsor || '[Sponsor Name]';
        const seconder = formData.seconder || '[Seconder Name]';
        
        let specificFormatInstructions = '';

        if (outputType === 'Resolution') {
            specificFormatInstructions = `
            **Format for Resolution:**
            1.  **Header:** Centered. Republic of the Philippines, Province of Sarangani, Municipality of Maasim, Office of the Sangguniang Bayan.
            2.  **Meta Information:**
                *   "Resolution No.: ${outputNumber}"
                *   "Sponsored by: ${sponsor}"
            3.  **Title:** "${formData.subject}" (Uppercase, Centered)
            4.  **Body (Preamble):** Use "WHEREAS" clauses.
                *   Summarize the incoming document details (Sender: ${formData.sender}, Date: ${formData.dateReceived}).
                *   Summarize the findings: ${findingsContent ? 'Referencing the findings report...' : 'Based on committee review.'}.
                *   State the legal basis.
            5.  **Enacting Clause:** EXACTLY: "NOW THEREFORE, the body on joint sponsorship;"
            6.  **Resolutory Clause:** EXACTLY: "RESOLVED, as it hereby resolves to adopt: ${formData.subject}"
            7.  **Closing:** "RESOLVED FINALLY, that copies of this resolution be furnished to..."
            8.  **Signatories:**
                *   Prepared by: ${formData.secretarySignature || '[Secretary Name]'}, Secretary to the Sanggunian.
                *   Attested by: ${formData.viceMayorSignature || '[Vice Mayor Name]'}, Municipal Vice Mayor / Presiding Officer.
            `;
        } else {
            // Ordinance
            specificFormatInstructions = `
            **Format for Ordinance:**
            1.  **Header:** Centered. Republic of the Philippines, Province of Sarangani, Municipality of Maasim, Office of the Sangguniang Bayan.
            2.  **Title:** Centered, Uppercase. "MUNICIPAL ORDINANCE NO. ${outputNumber}" followed by the title "${formData.subject}".
            3.  **Author/Sponsor:** "Authored by: Hon. ${sponsor}".
            4.  **Enacting Clause:** "Be it ordained by the Sangguniang Bayan of Maasim, Sarangani Province, in session assembled, that:"
            5.  **Body (Sections):** Organize content into formal Sections.
                *   **SECTION 1. Title.** (Short title of the ordinance).
                *   **SECTION 2. Scope/Purpose.** (Based on: ${formData.remarks || 'the subject matter'}).
                *   **SECTION 3. Findings/Basis.** (Incorporate findings: ${findingsContent ? 'Referencing the findings report...' : 'Committee recommendations'}).
                *   **SECTION 4. Provisions.** (Draft standard provisions relevant to the subject "${formData.subject}").
                *   **SECTION 5. Separability Clause.**
                *   **SECTION 6. Repealing Clause.**
                *   **SECTION 7. Effectivity Clause.**
            6.  **Signatories:**
                *   Certified Correct: ${formData.secretarySignature || '[Secretary Name]'}, Secretary to the Sanggunian.
                *   Attested: ${formData.viceMayorSignature || '[Vice Mayor Name]'}, Municipal Vice Mayor / Presiding Officer.
                *   Approved: [Mayor Name], Municipal Mayor.
            `;
        }

        const prompt = `
        You are the Secretary to the Sangguniang Bayan of Maasim. Draft a formal legislative document based on the requirements below.
        
        **Document Type:** ${outputType}
        **Subject:** ${formData.subject}
        **Drafting Instructions:**
        Generate the full text of the ${outputType} strictly adhering to the format structure below. 
        Do NOT include markdown formatting (like **bold** or *italic*) inside the main text block, use plain text layout (spacing and uppercase) suitable for a legal document.

        ${specificFormatInstructions}
        `;

        try {
            const response = await getAIAssistantResponse(prompt);
            setDraftResolutionContent(response);
        } catch (e) {
            alert('Failed to generate draft. Please check your connection.');
        } finally {
            setIsGeneratingResolution(false);
        }
    };

    const getBase64Logo = async (): Promise<string | null> => {
        try {
            const candidates = ['/maasim-logo.png', 'maasim-logo.png', '/CLS-Maasim-Ver1/maasim-logo.png'];
            for (const src of candidates) {
                const response = await fetch(src);
                if (response.ok) {
                    const blob = await response.blob();
                    return await new Promise((resolve) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(reader.result as string);
                        reader.readAsDataURL(blob);
                    });
                }
            }
        } catch (error) {}
        return null;
    };

    const handleDownloadWord = async () => {
        if (!draftResolutionContent) return;
        
        try {
            const logoData = await getBase64Logo();
            const title = `DRAFT ${formData.outputType || 'RESOLUTION'}`.toUpperCase();
            // Simple newline to break conversion for word
            const formattedContent = draftResolutionContent.replace(/\n/g, '<br />');

            const htmlContent = `
                <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
                <head><meta charset='utf-8'><title>${title}</title></head>
                <body style="font-family: 'Times New Roman', serif; font-size: 12pt;">
                    <div style="text-align:center; margin-bottom: 20px;">
                        <table style="margin: 0 auto; border:none; width: 100%;">
                            <tr style="border:none;">
                                <td style="width: 20%; text-align: right; border:none; vertical-align: top;">
                                    ${logoData ? `<img src="${logoData}" width="80" height="80" />` : ''}
                                </td>
                                <td style="width: 60%; text-align: center; border:none; vertical-align: middle;">
                                    <p style="font-size: 11pt; font-weight: bold; margin: 0; font-family: Arial, sans-serif;">Republic of the Philippines</p>
                                    <p style="font-size: 11pt; margin: 0; font-family: Arial, sans-serif;">Province of Sarangani</p>
                                    <p style="font-size: 12pt; font-weight: bold; margin: 0; font-family: Arial, sans-serif;">MUNICIPALITY OF MAASIM</p>
                                    <br/>
                                    <p style="font-size: 14pt; font-weight: bold; margin: 0; font-family: 'Times New Roman', serif;">OFFICE OF THE SANGGUNIANG BAYAN</p>
                                </td>
                                <td style="width: 20%; border:none;"></td>
                            </tr>
                        </table>
                        <hr style="border: 1px solid black;" />
                        <br />
                        <p style="font-size: 14pt; font-weight: bold; text-decoration: underline;">${title}</p>
                    </div>
                    <div style="text-align: justify; line-height: 1.5;">
                        ${formattedContent}
                    </div>
                    <br /><br />
                    <div style="margin-top: 50px; font-size: 9pt; text-align: center; color: #555;">
                        <p>Generated by Computerized Legislative Tracking System - AI Assistant</p>
                    </div>
                </body>
                </html>
            `;

            const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            const filename = `${(formData.outputType || 'Document').replace(/\s+/g, '_')}_Draft_${Date.now()}.doc`;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error(e);
            alert("Error generating Word document.");
        }
    };

    const handlePrintContent = async (title: string, content: string, action: 'preview' | 'print') => {
        if (!content) return;
        if (!(window as any).jspdf) return alert("PDF library not loaded.");
        
        try {
            const { jsPDF } = (window as any).jspdf;
            const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            const logoData = await getBase64Logo();
            const pageWidth = 210;
            const margin = 25;
            const contentWidth = pageWidth - (margin * 2);

            // Header
            if (logoData) {
                doc.addImage(logoData, 'PNG', margin, 10, 20, 20);
            }
            doc.setFontSize(10).setFont('helvetica', 'bold').text("MUNICIPALITY OF MAASIM", pageWidth/2 + 10, 15, { align: 'center' });
            doc.setFontSize(12).text("OFFICE OF THE SANGGUNIANG BAYAN", pageWidth/2 + 10, 20, { align: 'center' });
            doc.setFontSize(9).setFont('helvetica', 'normal').text("Province of Sarangani", pageWidth/2 + 10, 25, { align: 'center' });
            
            doc.setLineWidth(0.5).line(margin, 32, pageWidth - margin, 32);

            // Title
            doc.setFontSize(14).setFont('helvetica', 'bold').text(title, pageWidth/2, 45, { align: 'center' });
            
            // Content
            doc.setFontSize(11).setFont('times', 'normal');
            const splitText = doc.splitTextToSize(content, contentWidth);
            
            let cursorY = 55;
            const pageHeight = 297;

            splitText.forEach((line: string) => {
                if (cursorY > pageHeight - 20) {
                    doc.addPage();
                    cursorY = 25;
                }
                doc.text(line, margin, cursorY);
                cursorY += 6;
            });

            // Footer
            const pageCount = doc.internal.getNumberOfPages();
            for(let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8).setFont('helvetica', 'italic').text(`Generated via Maasim CLS - Page ${i} of ${pageCount}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
            }

            if (action === 'print') doc.autoPrint();
            window.open(doc.output('bloburl'), '_blank');

        } catch (e) {
            console.error(e);
            alert("Error generating PDF.");
        }
    };

    const handlePrintFindings = (action: 'preview' | 'print') => {
        handlePrintContent("COMMITTEE FINDINGS REPORT", findingsContent, action);
    };

    const handlePrintDraft = (action: 'preview' | 'print') => {
        const title = `DRAFT ${formData.outputType || 'RESOLUTION'}`.toUpperCase();
        handlePrintContent(title, draftResolutionContent, action);
    };

    const handlePrintTrackingSlip = async () => {
        if (!(window as any).jspdf) return alert("PDF library not loaded.");
        
        try {
            const { jsPDF } = (window as any).jspdf;
            const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            const logoData = await getBase64Logo();
            const pageWidth = 210;
            const margin = 15;
            
            // Header
            if (logoData) {
                doc.addImage(logoData, 'PNG', margin, 10, 20, 20);
            }
            doc.setFontSize(10).setFont('helvetica', 'bold').text("Republic of the Philippines", pageWidth/2, 15, { align: 'center' });
            doc.setFontSize(10).text("Province of Sarangani", pageWidth/2, 20, { align: 'center' });
            doc.setFontSize(12).text("MUNICIPALITY OF MAASIM", pageWidth/2, 25, { align: 'center' });
            doc.setFontSize(11).text("OFFICE OF THE SANGGUNIANG BAYAN", pageWidth/2, 30, { align: 'center' });
            
            doc.setLineWidth(0.5).line(margin, 35, pageWidth - margin, 35);
            
            doc.setFontSize(14).text("LEGISLATIVE DOCUMENT TRACKING SLIP", pageWidth/2, 45, { align: 'center' });
            
            // Document Info
            let y = 55;
            doc.setFontSize(10).setFont('helvetica', 'bold');
            doc.text(`Reference No.: ${formData.referenceNumber || 'N/A'}`, margin, y);
            doc.text(`Date Received: ${formData.dateReceived || 'N/A'} ${formData.timeReceived || ''}`, pageWidth - margin, y, { align: 'right' });
            
            y += 6;
            doc.text(`Sender:`, margin, y);
            doc.setFont('helvetica', 'normal').text(formData.sender || 'N/A', margin + 25, y);
            
            y += 6;
            doc.setFont('helvetica', 'bold').text(`Type:`, margin, y);
            doc.setFont('helvetica', 'normal').text(formData.type || 'N/A', margin + 25, y);
            
            if (formData.category) {
                doc.setFont('helvetica', 'bold').text(`Category:`, pageWidth/2, y);
                doc.setFont('helvetica', 'normal').text(formData.category, pageWidth/2 + 25, y);
            }

            y += 6;
            doc.setFont('helvetica', 'bold').text(`Subject:`, margin, y);
            const subjectLines = doc.splitTextToSize(formData.subject || 'N/A', pageWidth - margin - 30);
            doc.setFont('helvetica', 'normal').text(subjectLines, margin + 25, y);
            y += (subjectLines.length * 5) + 5;

            // Tracking Table
            const columns = ["Stage / Activity", "Date / Details", "Remarks / Status"];
            const rows = [
                ["Receipt", `${formData.dateReceived} ${formData.timeReceived}`, "Received by Office"],
                ["Calendar of Business", 
                 `Urgent: ${formData.urgentMattersDate || '-'}\nUnfinished: ${formData.unfinishedBusinessDate || '-'}\nUnassigned: ${formData.unassignedBusinessDate || '-'}`, 
                 `Agenda Item No.: ${formData.agendaItemNumber || '-'}`],
                ["First Reading", `${formData.firstReadingDate || '-'}`, `Ref to: ${formData.concernedCommittee || '-'}\nChair: ${formData.committeeReferralChairman || '-'}\nRemarks: ${formData.firstReadingRemarks || '-'}`],
                ["Committee Report", `Date: ${formData.committeeReportDate || '-'}`, `Report No.: ${formData.committeeReportNumber || '-'}`],
                ["Second Reading", `${formData.secondReadingDate || '-'}`, `${formData.secondReadingRemarks || '-'}`],
                ["Third Reading", `${formData.thirdReadingDate || '-'}`, `${formData.thirdReadingRemarks || '-'}`],
                ["Legislative Output", 
                 `${formData.outputType || '-'}\nNo.: ${formData.outputNumber || '-'}`, 
                 `Sponsor: ${formData.sponsor || '-'}\nSeconder: ${formData.seconder || '-'}`],
                ["Executive Action", 
                 `Transmitted: ${formData.dateTransmittedToMayor || '-'}\nApproved: ${formData.dateApprovedByMayor || '-'}\nVetoed: ${formData.dateVetoedByMayor || '-'}`, 
                 "-"],
                ["Provincial Review", 
                 `Transmitted: ${formData.dateTransmittedToSP || '-'}\nReceived: ${formData.dateReceivedFromSP || '-'}`, 
                 `SP Res No.: ${formData.spResolutionNumber || '-'}`],
                ["Records", 
                 `Posted: ${formData.datePosted || '-'}\nPublished: ${formData.datePublished || '-'}\nFiled: ${formData.dateFiled || '-'}`, 
                 "-"]
            ];

            (doc as any).autoTable({
                startY: y,
                head: [columns],
                body: rows,
                theme: 'grid',
                headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold' },
                styles: { fontSize: 9, cellPadding: 3 },
                columnStyles: {
                    0: { cellWidth: 40, fontStyle: 'bold' },
                    1: { cellWidth: 60 },
                    2: { cellWidth: 'auto' }
                }
            });

            // Signatories
            let finalY = (doc as any).lastAutoTable.finalY + 20;
            
            if (finalY > 250) {
                doc.addPage();
                finalY = 30;
            }

            doc.setFontSize(10).setFont('helvetica', 'normal');
            
            doc.text("Certified Correct:", margin, finalY);
            doc.text("Attested:", pageWidth/2 + 10, finalY);
            
            finalY += 15;
            
            doc.setFont('helvetica', 'bold');
            doc.text((formData.secretarySignature || "_______________________").toUpperCase(), margin, finalY);
            doc.text((formData.viceMayorSignature || "_______________________").toUpperCase(), pageWidth/2 + 10, finalY);
            
            finalY += 5;
            doc.setFont('helvetica', 'normal').setFontSize(8);
            doc.text("Secretary to the Sanggunian", margin, finalY);
            doc.text("Municipal Vice Mayor / Presiding Officer", pageWidth/2 + 10, finalY);

            // Footer
            const pageCount = doc.internal.getNumberOfPages();
            for(let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8).setFont('helvetica', 'italic').text(`Generated via Maasim CLS - ${new Date().toLocaleString()}`, pageWidth - margin, 285, { align: 'right' });
            }

            window.open(doc.output('bloburl'), '_blank');

        } catch (e) {
            console.error(e);
            alert("Error generating tracking slip.");
        }
    };

    const inputClasses = "block w-full px-3 py-2 border border-slate-300 rounded-md leading-5 bg-white placeholder-slate-500 focus:outline-none focus:placeholder-slate-400 focus:ring-1 focus:ring-brand-secondary focus:border-brand-secondary sm:text-sm disabled:bg-slate-100 disabled:text-slate-400";
    const labelClasses = "block text-sm font-medium text-slate-700 mb-1";

    return (
        <div className="bg-white p-6 sm:p-8 rounded-lg shadow-lg max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-brand-primary mb-6">
                {initialData ? 'Edit Incoming Document' : 'Register Incoming Document'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="type" className={labelClasses}>Document Type</label>
                        <select id="type" name="type" value={formData.type} onChange={handleTypeChange} className={inputClasses} required autoFocus>
                            <option value="">-- Select Type --</option>
                            {(documentTypes || []).map(dt => <option key={dt.id} value={dt.name}>{dt.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="category" className={labelClasses}>Document Category</label>
                        <select id="category" name="category" value={formData.category || ''} onChange={handleChange} className={inputClasses} disabled={!['Proposed Ordinance', 'Barangay Ordinance'].includes(formData.type)}>
                            <option value="">-- Select Category --</option>
                            <option value="General">General</option>
                            <option value="Annual Budget">Annual Budget</option>
                            <option value="Supplemental Budget">Supplemental Budget</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="referenceNumber" className={labelClasses}>Document Tracking Code</label>
                        <input type="text" id="referenceNumber" name="referenceNumber" value={formData.referenceNumber} onChange={handleChange} className={inputClasses} placeholder="Auto-generated or manual" required />
                    </div>
                    <div>
                        <label className={labelClasses}>Date & Time Received</label>
                        <div className="flex gap-2">
                            <input type="date" id="dateReceived" name="dateReceived" value={formData.dateReceived} onChange={handleChange} className={inputClasses} required />
                            <input type="time" id="timeReceived" name="timeReceived" value={formData.timeReceived} onChange={handleChange} className={inputClasses} required />
                        </div>
                    </div>
                    <div className="md:col-span-2 relative">
                        <label htmlFor="sender" className={labelClasses}>Sender / Origin</label>
                        <input type="text" id="sender" name="sender" value={formData.sender} onChange={handleSenderChange} onFocus={() => formData.sender && setFilteredSenders(uniqueSenders.filter(s => s.toLowerCase().includes(formData.sender.toLowerCase())))} onBlur={() => setTimeout(() => setShowSenderSuggestions(false), 200)} className={inputClasses} placeholder="e.g. Office of the Mayor..." required autoComplete="off" />
                        {showSenderSuggestions && (
                            <ul className="absolute z-10 w-full bg-white border border-slate-300 rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg">
                                {filteredSenders.map((sender, index) => <li key={index} className="px-3 py-2 hover:bg-slate-100 cursor-pointer text-sm text-slate-700" onClick={() => handleSenderSelect(sender)}>{sender}</li>)}
                            </ul>
                        )}
                    </div>
                    <div className="md:col-span-2">
                        <label htmlFor="subject" className={labelClasses}>Subject / Matter</label>
                        <input type="text" id="subject" name="subject" value={formData.subject} onChange={handleChange} className={inputClasses} required />
                    </div>

                    {/* ACTION & REMARKS (Moved per request) */}
                    <div className="md:col-span-2 border rounded-md p-4 bg-amber-50 border-amber-200">
                        <p className="font-semibold text-amber-800 mb-3 text-sm uppercase tracking-wide">ACTION & REMARKS</p>
                        
                        <div className="mb-4">
                            <label className={labelClasses}>Recommended Actions</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {RECOMMENDED_ACTIONS.map(action => (
                                    <label key={action} className="flex items-center space-x-2 cursor-pointer hover:bg-amber-100/50 p-1 rounded transition-colors">
                                        <input type="checkbox" checked={(formData.recommendedActions || []).includes(action)} onChange={(e) => handleActionCheckboxChange(action, e.target.checked)} className="rounded text-amber-600" />
                                        <span className="text-xs text-slate-700">{action}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="remarks" className={labelClasses}>Optional Notes</label>
                                <textarea id="remarks" name="remarks" value={formData.remarks} onChange={handleChange} className={inputClasses} rows={2} placeholder="Notes for Secretary..." />
                            </div>
                            <div className="relative">
                                <label htmlFor="secretarySignature" className={labelClasses}>Signature of Secretary</label>
                                <input 
                                    type="text" 
                                    id="secretarySignature" 
                                    name="secretarySignature" 
                                    value={formData.secretarySignature || ''} 
                                    onChange={handleSecretaryChange}
                                    onFocus={() => formData.secretarySignature && setShowSecretarySuggestions(true)}
                                    onBlur={() => setTimeout(() => setShowSecretarySuggestions(false), 200)}
                                    className={inputClasses} 
                                    placeholder="Type or select name..." 
                                    autoComplete="off"
                                />
                                {showSecretarySuggestions && (
                                    <ul className="absolute z-10 w-full bg-white border border-slate-300 rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg">
                                        {filteredSecretaries.map((name, index) => <li key={index} className="px-3 py-2 hover:bg-slate-100 cursor-pointer text-sm text-slate-700" onClick={() => handleSecretarySelect(name)}>{name}</li>)}
                                    </ul>
                                )}
                            </div>
                        </div>

                        <div className="border-t border-amber-200 my-4"></div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="viceMayorRemarks" className={labelClasses}>Vice Mayor Remarks</label>
                                <textarea id="viceMayorRemarks" name="viceMayorRemarks" value={formData.viceMayorRemarks || ''} onChange={handleChange} className={inputClasses} rows={2} placeholder="Notes for Presiding Officer..." />
                            </div>
                            <div>
                                <label htmlFor="viceMayorSignature" className={labelClasses}>Signature of Vice Mayor / Presiding Officer</label>
                                <select id="viceMayorSignature" name="viceMayorSignature" value={formData.viceMayorSignature || ''} onChange={handleChange} className={inputClasses}>
                                    <option value="">-- Select Official --</option>
                                    {availableSignatories.map(leg => <option key={leg.id} value={leg.name}>{leg.name}</option>)}
                                </select>
                                <p className="text-[10px] text-amber-700 mt-1 italic font-medium">Filtered by term matching Date Received: {formData.dateReceived || 'N/A'}</p>
                            </div>
                        </div>
                    </div>
                    
                    {/* LEGISLATIVE ACTIONS (REPLACED OLD 'STATUS' & 'CALENDAR OF BUSINESS') */}
                    <div className="md:col-span-2 border rounded-md p-4 bg-slate-50 border-slate-200">
                        <p className="font-semibold text-slate-700 mb-3 text-sm uppercase tracking-wide">LEGISLATIVE ACTIONS</p>
                        
                        <div className="space-y-4">
                            {/* Current Status Row */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end bg-white p-3 rounded border border-slate-100 shadow-sm">
                                <div>
                                    <label htmlFor="status" className={labelClasses}>Update Status</label>
                                    <select id="status" name="status" value={formData.status} onChange={handleChange} className={inputClasses}>
                                        {(documentStatuses || []).map(status => <option key={status.id} value={status.name}>{status.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="statusDate" className={labelClasses}>Date of Action / Update</label>
                                    <input type="date" id="statusDate" name="statusDate" value={formData.statusDate || ''} onChange={handleChange} className={inputClasses} />
                                </div>
                            </div>

                            {/* Calendar of Business Dates */}
                            <div className="bg-white p-3 rounded border border-slate-100 shadow-sm">
                                <p className="text-xs font-bold text-slate-500 uppercase mb-2">Calendar of Business Inclusion</p>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                    <div>
                                        <label className={labelClasses}>Urgent Matters Date</label>
                                        <input type="date" name="urgentMattersDate" value={formData.urgentMattersDate || ''} onChange={handleChange} className={inputClasses} />
                                    </div>
                                    <div>
                                        <label className={labelClasses}>Unfinished Business Date</label>
                                        <input type="date" name="unfinishedBusinessDate" value={formData.unfinishedBusinessDate || ''} onChange={handleChange} className={inputClasses} />
                                    </div>
                                    <div>
                                        <label className={labelClasses}>Unassigned Business Date</label>
                                        <input type="date" name="unassignedBusinessDate" value={formData.unassignedBusinessDate || ''} onChange={handleChange} className={inputClasses} />
                                    </div>
                                    <div>
                                        <label className={labelClasses}>Agenda Item No.</label>
                                        <input type="text" name="agendaItemNumber" value={formData.agendaItemNumber || ''} onChange={handleChange} className={inputClasses} placeholder="Item #" />
                                    </div>
                                </div>
                            </div>

                            {/* First Reading */}
                            <div className="bg-white p-3 rounded border border-slate-100 shadow-sm">
                                <p className="text-xs font-bold text-slate-500 uppercase mb-2">First Reading</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                                    <div>
                                        <label className={labelClasses}>Date</label>
                                        <input type="date" name="firstReadingDate" value={formData.firstReadingDate || ''} onChange={handleChange} className={inputClasses} />
                                    </div>
                                    <div>
                                        <label className={labelClasses}>Remarks</label>
                                        <input type="text" name="firstReadingRemarks" value={formData.firstReadingRemarks || ''} onChange={handleChange} className={inputClasses} placeholder="Remarks..." />
                                    </div>
                                    <div>
                                        <label className={labelClasses}>Committee Referral</label>
                                        <select name="concernedCommittee" value={formData.concernedCommittee || ''} onChange={handleCommitteeChange} className={inputClasses}>
                                            <option value="">-- Select Committee --</option>
                                            {availableCommittees.map(name => <option key={name} value={name}>{name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className={labelClasses}>Chairman</label>
                                        <input type="text" name="committeeReferralChairman" value={formData.committeeReferralChairman || ''} onChange={handleChange} className={inputClasses} placeholder="Chairman Name" readOnly title="Auto-filled based on selected committee" />
                                    </div>
                                </div>
                            </div>

                            {/* Committee Report */}
                            <div className="bg-white p-3 rounded border border-slate-100 shadow-sm">
                                <p className="text-xs font-bold text-slate-500 uppercase mb-2">Committee Report</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                        <label className={labelClasses}>Committee Report No.</label>
                                        <input type="text" name="committeeReportNumber" value={formData.committeeReportNumber || ''} onChange={handleChange} className={inputClasses} placeholder="CR No." />
                                    </div>
                                    <div>
                                        <label className={labelClasses}>Date Reported</label>
                                        <input type="date" name="committeeReportDate" value={formData.committeeReportDate || ''} onChange={handleChange} className={inputClasses} />
                                    </div>
                                </div>
                            </div>

                            {/* Second Reading */}
                            <div className="bg-white p-3 rounded border border-slate-100 shadow-sm">
                                <p className="text-xs font-bold text-slate-500 uppercase mb-2">Second Reading</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                        <label className={labelClasses}>Date</label>
                                        <input type="date" name="secondReadingDate" value={formData.secondReadingDate || ''} onChange={handleChange} className={inputClasses} />
                                    </div>
                                    <div>
                                        <label className={labelClasses}>Remarks</label>
                                        <input type="text" name="secondReadingRemarks" value={formData.secondReadingRemarks || ''} onChange={handleChange} className={inputClasses} placeholder="Remarks..." />
                                    </div>
                                </div>
                            </div>

                            {/* Third Reading */}
                            <div className="bg-white p-3 rounded border border-slate-100 shadow-sm">
                                <p className="text-xs font-bold text-slate-500 uppercase mb-2">Third / Final Reading</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                        <label className={labelClasses}>Date</label>
                                        <input type="date" name="thirdReadingDate" value={formData.thirdReadingDate || ''} onChange={handleChange} className={inputClasses} />
                                    </div>
                                    <div>
                                        <label className={labelClasses}>Remarks</label>
                                        <input type="text" name="thirdReadingRemarks" value={formData.thirdReadingRemarks || ''} onChange={handleChange} className={inputClasses} placeholder="Remarks..." />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* LEGISLATIVE OUTPUT */}
                    <div className="md:col-span-2 border rounded-md p-4 bg-sky-50 border-sky-200">
                        <p className="font-semibold text-sky-800 mb-3 text-sm uppercase tracking-wide">LEGISLATIVE OUTPUT</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex gap-4 items-center">
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input type="checkbox" checked={formData.outputType === 'Resolution'} onChange={() => handleOutputCheck('Resolution')} className="rounded text-sky-600" />
                                    <span className="text-sm">Resolution</span>
                                </label>
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input type="checkbox" checked={formData.outputType === 'Ordinance'} onChange={() => handleOutputCheck('Ordinance')} className="rounded text-sky-600" />
                                    <span className="text-sm">Ordinance</span>
                                </label>
                            </div>
                            <input type="text" name="outputNumber" value={formData.outputNumber || ''} onChange={handleChange} className={inputClasses} placeholder="Output Number" disabled={!formData.outputType} />
                            <select name="sponsor" value={formData.sponsor || ''} onChange={handleChange} className={inputClasses}>
                                <option value="">-- Select Sponsor --</option>
                                {availableSignatories.map(leg => <option key={leg.id} value={leg.name}>{leg.name}</option>)}
                            </select>
                            <select name="seconder" value={formData.seconder || ''} onChange={handleChange} className={inputClasses}>
                                <option value="">-- Select Seconder --</option>
                                {availableSignatories.map(leg => <option key={leg.id} value={leg.name}>{leg.name}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* EXECUTIVE & PROVINCIAL REVIEW */}
                    <div className="md:col-span-2 border rounded-md p-4 bg-purple-50 border-purple-200">
                        <p className="font-semibold text-purple-800 mb-3 text-sm uppercase tracking-wide">EXECUTIVE & PROVINCIAL REVIEW</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Executive Action */}
                            <div className="space-y-3">
                                <p className="text-xs font-bold text-purple-600 uppercase">Executive Action (Mayor)</p>
                                <div>
                                    <label className={labelClasses}>Date Transmitted to Mayor</label>
                                    <input type="date" name="dateTransmittedToMayor" value={formData.dateTransmittedToMayor || ''} onChange={handleChange} className={inputClasses} />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className={labelClasses}>Date Approved</label>
                                        <input type="date" name="dateApprovedByMayor" value={formData.dateApprovedByMayor || ''} onChange={handleChange} className={inputClasses} />
                                    </div>
                                    <div>
                                        <label className={labelClasses}>Date Vetoed</label>
                                        <input type="date" name="dateVetoedByMayor" value={formData.dateVetoedByMayor || ''} onChange={handleChange} className={inputClasses} />
                                    </div>
                                </div>
                            </div>

                            {/* Provincial Review */}
                            <div className="space-y-3">
                                <p className="text-xs font-bold text-purple-600 uppercase">Provincial Review (SP)</p>
                                <div>
                                    <label className={labelClasses}>Date Transmitted to SP</label>
                                    <input type="date" name="dateTransmittedToSP" value={formData.dateTransmittedToSP || ''} onChange={handleChange} className={inputClasses} />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className={labelClasses}>SP Resolution No.</label>
                                        <input type="text" name="spResolutionNumber" value={formData.spResolutionNumber || ''} onChange={handleChange} className={inputClasses} placeholder="Res. No." />
                                    </div>
                                    <div>
                                        <label className={labelClasses}>Date Received from SP</label>
                                        <input type="date" name="dateReceivedFromSP" value={formData.dateReceivedFromSP || ''} onChange={handleChange} className={inputClasses} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RECORDS MANAGEMENT */}
                    <div className="md:col-span-2 border rounded-md p-4 bg-gray-50 border-gray-200">
                        <p className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">RECORDS MANAGEMENT</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className={labelClasses}>Date Posted</label>
                                <input type="date" name="datePosted" value={formData.datePosted || ''} onChange={handleChange} className={inputClasses} />
                            </div>
                            <div>
                                <label className={labelClasses}>Date Published</label>
                                <input type="date" name="datePublished" value={formData.datePublished || ''} onChange={handleChange} className={inputClasses} />
                            </div>
                            <div>
                                <label className={labelClasses}>Date Filed</label>
                                <input type="date" name="dateFiled" value={formData.dateFiled || ''} onChange={handleChange} className={inputClasses} />
                            </div>
                        </div>
                    </div>

                    <div className="md:col-span-2">
                        <label className={labelClasses}>Scanned Attachment</label>
                        <input type="file" onChange={handleFileChange} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-brand-light file:text-brand-primary hover:file:bg-blue-200" accept=".pdf,.jpg,.jpeg,.png" />
                        {attachment && <p className="text-xs text-slate-500 mt-1">Selected: {attachment.name}</p>}
                        {formData.filePath && <button type="button" onClick={handleRemoveAttachment} className="text-xs text-red-600 mt-1 font-bold underline">Remove Current Attachment</button>}
                    </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-slate-200">
                    <button type="button" onClick={handlePrintTrackingSlip} className="px-4 py-2 bg-slate-600 text-white font-semibold rounded-lg shadow-md hover:bg-slate-700 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                        Print Tracking Slip
                    </button>
                    <div className="flex gap-3">
                        <button type="button" onClick={onCancel} className="px-4 py-2 bg-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-300">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-brand-secondary text-white font-semibold rounded-lg shadow-md hover:bg-brand-primary">Save Document</button>
                    </div>
                </div>
            </form>
            
            {deadlineInfo && (
                <>
                    <div className={`mt-6 p-4 rounded-lg border-2 flex justify-between items-center ${deadlineInfo.daysRemaining < 0 ? 'bg-gray-100 border-gray-300' : deadlineInfo.daysRemaining <= 10 ? 'bg-amber-50 border-amber-300' : 'bg-green-50 border-green-300'}`}>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="font-bold text-slate-800 text-lg">Deadline Tracker</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-bold text-brand-primary uppercase tracking-wide bg-white/50 px-2 py-1 rounded inline-block">
                                    Reglementary Period Requirement: {deadlineInfo.dayLimit} Days
                                </p>
                                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest ml-1">
                                    Legal Basis: {deadlineInfo.legalBasis}
                                </p>
                                <p className="text-xs text-slate-600">
                                    Target Action Date: <span className="font-mono font-semibold">{deadlineInfo.deadlineDate.toLocaleDateString()}</span>
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className={`text-4xl font-black ${deadlineInfo.daysRemaining < 0 ? 'text-red-500' : 'text-slate-800'}`}>
                                {deadlineInfo.daysRemaining}
                            </span>
                            <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Days Remaining</p>
                        </div>
                    </div>

                    <div className="mt-4 p-6 bg-indigo-50 rounded-lg border-2 border-indigo-200">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-bold text-indigo-900 flex items-center gap-2">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                                    Findings Report (AI)
                                </h3>
                                <p className="text-xs text-indigo-700 mt-1">Review analysis based on lapse status and legal provisions.</p>
                            </div>
                            <button 
                                type="button" 
                                onClick={generateFindings} 
                                disabled={isGeneratingFindings}
                                className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold uppercase rounded-lg shadow-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                            >
                                {isGeneratingFindings ? 'Analyzing...' : 'Generate Findings Report'}
                            </button>
                        </div>

                        {findingsContent && (
                            <div className="animate-fade-in-down">
                                <div className="bg-white p-4 rounded-md border border-indigo-100 shadow-sm max-h-60 overflow-y-auto mb-4">
                                    <p className="text-sm text-slate-800 whitespace-pre-wrap font-serif leading-relaxed">
                                        {findingsContent}
                                    </p>
                                </div>
                                <div className="flex justify-end gap-2">
                                    <button 
                                        type="button" 
                                        onClick={() => handlePrintFindings('preview')}
                                        className="px-3 py-1.5 bg-white text-indigo-600 border border-indigo-200 text-xs font-bold uppercase rounded hover:bg-indigo-50 transition-colors"
                                    >
                                        Preview PDF
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={() => handlePrintFindings('print')}
                                        className="px-3 py-1.5 bg-indigo-800 text-white text-xs font-bold uppercase rounded shadow hover:bg-indigo-900 transition-colors"
                                    >
                                        Print Findings
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-4 p-6 bg-teal-50 rounded-lg border-2 border-teal-200">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-bold text-teal-900 flex items-center gap-2">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                                    Draft {formData.outputType || 'Resolution'} (AI)
                                </h3>
                                <p className="text-xs text-teal-700 mt-1">Generate a draft legislative measure based on findings and output data.</p>
                            </div>
                            <button 
                                type="button" 
                                onClick={generateDraftResolution} 
                                disabled={isGeneratingResolution}
                                className="px-4 py-2 bg-teal-600 text-white text-xs font-bold uppercase rounded-lg shadow-md hover:bg-teal-700 disabled:opacity-50 transition-colors"
                            >
                                {isGeneratingResolution ? 'Drafting...' : 'Generate Draft'}
                            </button>
                        </div>

                        {draftResolutionContent && (
                            <div className="animate-fade-in-down">
                                <div className="bg-white p-4 rounded-md border border-teal-100 shadow-sm max-h-96 overflow-y-auto mb-4">
                                    <p className="text-sm text-slate-800 whitespace-pre-wrap font-serif leading-relaxed">
                                        {draftResolutionContent}
                                    </p>
                                </div>
                                <div className="flex justify-end gap-2">
                                    <button 
                                        type="button" 
                                        onClick={handleDownloadWord}
                                        className="px-3 py-1.5 bg-white text-teal-700 border border-teal-200 text-xs font-bold uppercase rounded hover:bg-teal-50 transition-colors flex items-center gap-1"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                        Download Word
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={() => handlePrintDraft('preview')}
                                        className="px-3 py-1.5 bg-white text-teal-600 border border-teal-200 text-xs font-bold uppercase rounded hover:bg-teal-50 transition-colors"
                                    >
                                        Preview PDF
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={() => handlePrintDraft('print')}
                                        className="px-3 py-1.5 bg-teal-800 text-white text-xs font-bold uppercase rounded shadow hover:bg-teal-900 transition-colors"
                                    >
                                        Print Draft
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default IncomingDocumentForm;