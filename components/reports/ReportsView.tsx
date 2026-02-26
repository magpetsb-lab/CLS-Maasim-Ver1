import React, { useState, useMemo } from 'react';
import type { Resolution, Ordinance, SessionMinute, SessionAgenda, CommitteeReport, Term, Sector, LegislativeMeasure, Legislator, AttendanceStatus, CommitteeMembership } from '../../types';

interface ReportsViewProps {
    resolutions: Resolution[];
    ordinances: Ordinance[];
    sessionMinutes: SessionMinute[];
    sessionAgendas: SessionAgenda[];
    committeeReports: CommitteeReport[];
    committeeMemberships: CommitteeMembership[];
    terms: Term[];
    sectors: Sector[];
    legislativeMeasures: LegislativeMeasure[];
    legislators: Legislator[];
}

interface ReportItem {
    type: 'Resolution' | 'Ordinance' | 'Session' | 'SessionAgenda' | 'CommitteeReport';
    number: string;
    title: string;
    date: string; 
    author?: string;
    sector?: string;
    term: string;
    sessionType?: string;
    committeeType?: string;
    timeStarted?: string;
    timeFinished?: string;
}

interface AttendanceStats {
    legislatorId: string;
    name: string;
    present: number;
    absent: number;
    ob: number;
    leave: number;
    total: number;
}

interface CommitteeAttendanceStats {
    name: string;
    meetings: number;
    hearings: number;
    total: number;
}

interface ElectiveOfficialItem {
    name: string;
    title: string;
    rank: string;
    term: string;
}

interface StandingCommitteeItem {
    committeeName: string;
    chairman: string;
    viceChairman: string;
    members: string;
    term: string;
}

const formatTerm = (term: string) => {
    const matches = term.match(/^(\d{4}).*?(\d{4})/);
    return matches ? `${matches[1]}-${matches[2]}` : term;
};

const ReportsView: React.FC<ReportsViewProps> = ({ resolutions, ordinances, sessionMinutes, sessionAgendas, committeeReports, committeeMemberships, terms, sectors, legislativeMeasures, legislators }) => {
    const [selectedTerm, setSelectedTerm] = useState<string>('');
    const [selectedSector, setSelectedSector] = useState<string>('');
    const [selectedMeasure, setSelectedMeasure] = useState<string>('');
    const [selectedAuthor, setSelectedAuthor] = useState<string>('');
    const [selectedCommittee, setSelectedCommittee] = useState<string>('');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [reportType, setReportType] = useState<'All' | 'Resolutions' | 'Ordinances' | 'Sessions' | 'SessionAgendas' | 'CommitteeReports' | 'Attendance' | 'CommitteeAttendance' | 'ElectiveOfficials' | 'StandingCommittees'>('All');
    const [sessionTypeFilter, setSessionTypeFilter] = useState<'All' | 'Regular' | 'Special' | 'Meeting' | 'Hearing'>('All');
    const [categoryFilterType, setCategoryFilterType] = useState<'None' | 'Measure' | 'Sector'>('None');

    const filteredData = useMemo(() => {
        if (reportType === 'Attendance' || reportType === 'CommitteeAttendance' || reportType === 'ElectiveOfficials' || reportType === 'StandingCommittees') return [];

        let data: ReportItem[] = [];

        if (reportType === 'Sessions') {
            data = sessionMinutes.map(sm => ({
                type: 'Session',
                number: sm.sessionNumber,
                title: `Minutes of the ${sm.sessionType} Session`,
                date: sm.sessionDate,
                term: sm.term,
                sessionType: sm.sessionType,
                author: '',
                sector: ''
            }));
        } 
        else if (reportType === 'SessionAgendas') {
            data = sessionAgendas.map(sa => ({
                type: 'SessionAgenda',
                number: sa.seriesNumber,
                title: `Agenda for ${sa.sessionType} Session`,
                date: sa.sessionDate,
                term: sa.term,
                sessionType: sa.sessionType,
                timeStarted: sa.timeStarted,
                timeFinished: sa.timeFinished,
                author: '',
                sector: ''
            }));
        }
        else if (reportType === 'CommitteeReports') {
            data = committeeReports.map(cr => ({
                type: 'CommitteeReport',
                number: cr.reportNumber,
                title: cr.committee,
                date: cr.date,
                term: cr.term,
                committeeType: cr.committeeType,
                author: '',
                sector: ''
            }));
        }
        else {
            if (reportType !== 'Ordinances') {
                 data.push(...resolutions.map(r => ({
                    type: 'Resolution' as const,
                    number: r.resolutionNumber,
                    title: r.resolutionTitle,
                    date: r.dateApproved,
                    author: r.author,
                    sector: r.sector,
                    term: r.term
                })));
            }
            
            if (reportType !== 'Resolutions') {
                data.push(...ordinances.map(o => ({
                    type: 'Ordinance' as const,
                    number: o.ordinanceNumber,
                    title: o.ordinanceTitle,
                    date: o.dateApproved,
                    author: o.author,
                    sector: o.sector,
                    term: o.term
                })));
            }
        }

        return data.filter(doc => {
            if (selectedTerm && doc.term !== selectedTerm) return false;
            if (startDate && doc.date < startDate) return false;
            if (endDate && doc.date > endDate) return false;
            if ((reportType === 'Sessions' || reportType === 'SessionAgendas') && sessionTypeFilter !== 'All') {
                if (doc.sessionType !== sessionTypeFilter) return false;
            }
            if (reportType === 'CommitteeReports') {
                if (sessionTypeFilter !== 'All' && doc.committeeType !== sessionTypeFilter) return false;
                if (selectedCommittee && doc.title !== selectedCommittee) return false;
            }
            if (reportType !== 'Sessions' && reportType !== 'SessionAgendas' && reportType !== 'CommitteeReports') {
                if (selectedAuthor && doc.author !== selectedAuthor) return false;
                if (selectedMeasure) {
                    const measure = legislativeMeasures.find(m => m.id === selectedMeasure);
                    if (measure) {
                        const allowedSectorNames = measure.sectorIds
                            .map(id => sectors.find(s => s.id === id)?.name)
                            .filter(Boolean);
                        if (doc.sector && !allowedSectorNames.includes(doc.sector)) return false;
                    }
                } else if (selectedSector) {
                    if (doc.sector !== selectedSector) return false;
                }
            }
            return true;
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    }, [resolutions, ordinances, sessionMinutes, sessionAgendas, committeeReports, selectedTerm, selectedSector, selectedMeasure, selectedAuthor, selectedCommittee, startDate, endDate, reportType, sessionTypeFilter, legislativeMeasures, sectors]);

    const attendanceData = useMemo(() => {
        if (reportType !== 'Attendance') return [];
        const relevantSessions = sessionMinutes.filter(sm => {
            if (selectedTerm && sm.term !== selectedTerm) return false;
            if (startDate && sm.sessionDate < startDate) return false;
            if (endDate && sm.sessionDate > endDate) return false;
            if (sessionTypeFilter !== 'All' && (sessionTypeFilter === 'Regular' || sessionTypeFilter === 'Special')) {
                 if (sm.sessionType !== sessionTypeFilter) return false;
            }
            return true;
        });
        const statsMap: Record<string, AttendanceStats> = {};
        relevantSessions.forEach(session => {
            if (session.sessionAttendance) {
                session.sessionAttendance.forEach(record => {
                    if (!statsMap[record.legislatorId]) {
                        const legislator = legislators.find(l => l.id === record.legislatorId);
                        statsMap[record.legislatorId] = {
                            legislatorId: record.legislatorId,
                            name: legislator ? legislator.name : 'Unknown Legislator',
                            present: 0,
                            absent: 0,
                            ob: 0,
                            leave: 0,
                            total: 0
                        };
                    }
                    const stats = statsMap[record.legislatorId];
                    if (record.status === 'Present') stats.present++;
                    if (record.status === 'Absent') stats.absent++;
                    if (record.status === 'OB') stats.ob++;
                    if (record.status === 'Leave') stats.leave++;
                    stats.total++;
                });
            }
        });
        let results = Object.values(statsMap).sort((a, b) => a.name.localeCompare(b.name));
        if (selectedAuthor) {
            results = results.filter(stat => stat.name === selectedAuthor);
        }
        return results;
    }, [sessionMinutes, legislators, reportType, selectedTerm, startDate, endDate, sessionTypeFilter, selectedAuthor]);

    const committeeAttendanceData = useMemo(() => {
        if (reportType !== 'CommitteeAttendance') return [];
        const relevantReports = committeeReports.filter(cr => {
            if (selectedTerm && cr.term !== selectedTerm) return false;
            if (startDate && cr.date < startDate) return false;
            if (endDate && cr.date > endDate) return false;
            if (selectedCommittee && cr.committee !== selectedCommittee) return false;
            if (sessionTypeFilter !== 'All' && cr.committeeType !== sessionTypeFilter) return false;
            return true;
        });
        const statsMap: Record<string, CommitteeAttendanceStats> = {};
        relevantReports.forEach(report => {
            const attendees = [
                ...(report.attendance?.chairman || []),
                ...(report.attendance?.viceChairman || []),
                ...(report.attendance?.members || []),
            ];
            attendees.forEach(name => {
                const trimmedName = name.trim();
                if (!statsMap[trimmedName]) {
                    statsMap[trimmedName] = {
                        name: trimmedName,
                        meetings: 0,
                        hearings: 0,
                        total: 0
                    };
                }
                if (report.committeeType === 'Meeting') {
                    statsMap[trimmedName].meetings++;
                } else {
                    statsMap[trimmedName].hearings++;
                }
                statsMap[trimmedName].total++;
            });
        });
        let results = Object.values(statsMap).sort((a, b) => a.name.localeCompare(b.name));
        if (selectedAuthor) {
            results = results.filter(stat => stat.name === selectedAuthor);
        }
        return results;
    }, [committeeReports, reportType, selectedTerm, startDate, endDate, selectedCommittee, sessionTypeFilter, selectedAuthor]);

    const electiveOfficialsData = useMemo(() => {
        if (reportType !== 'ElectiveOfficials') return [];
        const data: ElectiveOfficialItem[] = [];
        legislators.forEach(leg => {
            leg.positions.forEach(pos => {
                if (selectedTerm && pos.term !== selectedTerm) return;
                data.push({
                    name: leg.name,
                    title: pos.title,
                    rank: pos.rank,
                    term: pos.term
                });
            });
        });
        const POSITION_ORDER: Record<string, number> = { 
            'Mayor': 0, 
            'Vice Mayor': 1, 
            'Councilor': 2, 
            'LIGA President': 3, 
            'IP Mandatory Representative': 4, 
            'SK Federation President': 5 
        };
        return data.sort((a, b) => {
            const orderA = POSITION_ORDER[a.title] ?? 99;
            const orderB = POSITION_ORDER[b.title] ?? 99;
            if (orderA !== orderB) return orderA - orderB;
            if (a.title === 'Councilor' && b.title === 'Councilor') {
                return (Number(a.rank) || 99) - (Number(b.rank) || 99);
            }
            return a.name.localeCompare(b.name);
        });
    }, [legislators, selectedTerm, reportType]);

    const standingCommitteesData = useMemo(() => {
        if (reportType !== 'StandingCommittees') return [];
        const legislatorMap = new Map(legislators.map(l => [l.id, l.name]));
        let data: StandingCommitteeItem[] = committeeMemberships
            .filter(cm => !selectedTerm || cm.termYear === selectedTerm)
            .map(cm => ({
                committeeName: cm.committeeName,
                chairman: cm.chairman ? legislatorMap.get(cm.chairman) || 'N/A' : 'N/A',
                viceChairman: cm.viceChairman ? legislatorMap.get(cm.viceChairman) || 'N/A' : 'N/A',
                members: cm.members.map(id => legislatorMap.get(id) || '').filter(Boolean).join(', '),
                term: cm.termYear
            }));
        if (selectedAuthor) {
            data = data.filter(com => com.chairman === selectedAuthor);
        }
        return data.sort((a, b) => a.committeeName.localeCompare(b.committeeName));
    }, [committeeMemberships, legislators, selectedTerm, reportType, selectedAuthor]);

    const summaryStats = useMemo(() => {
        if (reportType === 'Sessions') {
            const regularCount = filteredData.filter(d => d.sessionType === 'Regular').length;
            const specialCount = filteredData.filter(d => d.sessionType === 'Special').length;
            const totalCount = filteredData.length;
            return { label1: 'Regular Sessions', count1: regularCount, label2: 'Special Sessions', count2: specialCount, total: totalCount };
        } 
        if (reportType === 'SessionAgendas') {
            const regularCount = filteredData.filter(d => d.sessionType === 'Regular').length;
            const specialCount = filteredData.filter(d => d.sessionType === 'Special').length;
            const totalCount = filteredData.length;
            return { label1: 'Regular Agendas', count1: regularCount, label2: 'Special Agendas', count2: specialCount, total: totalCount };
        }
        if (reportType === 'CommitteeReports') {
             const meetingCount = filteredData.filter(d => d.committeeType === 'Meeting').length;
             const hearingCount = filteredData.filter(d => d.committeeType === 'Hearing').length;
             const totalCount = filteredData.length;
             return { label1: 'Committee Meetings', count1: meetingCount, label2: 'Committee Hearings', count2: hearingCount, total: totalCount };
        }
        return null;
    }, [filteredData, reportType]);

    const uniqueCommittees = useMemo(() => {
        const names = committeeMemberships.map(cm => cm.committeeName);
        return Array.from(new Set(names)).sort();
    }, [committeeMemberships]);

    const getReportTitle = () => {
        let baseTitle = 'Legislative Documents Report';
        if (reportType === 'Resolutions') baseTitle = 'List of Resolutions';
        if (reportType === 'Ordinances') baseTitle = 'List of Ordinances';
        if (reportType === 'ElectiveOfficials') baseTitle = 'List of Elective Officials';
        if (reportType === 'StandingCommittees') {
            baseTitle = 'List of Standing Committees';
            if (selectedAuthor) baseTitle += ` Chaired by Hon. ${selectedAuthor}`;
        }
        if (reportType === 'CommitteeReports') {
             baseTitle = sessionTypeFilter !== 'All' 
                ? `List of Committee Reports (${sessionTypeFilter}s)`
                : 'List of Committee Reports';
            if (selectedCommittee) baseTitle += ` of the ${selectedCommittee}`;
        }
        if (reportType === 'CommitteeAttendance') {
            baseTitle = 'Committee Attendance Profile';
            if (selectedCommittee) baseTitle += ` - ${selectedCommittee}`;
            if (selectedAuthor) baseTitle += ` of Hon. ${selectedAuthor}`;
        }
        if (reportType === 'Sessions') {
            baseTitle = sessionTypeFilter !== 'All' ? `List of Conducted ${sessionTypeFilter} Sessions` : 'List of Conducted Sessions';
        }
        if (reportType === 'SessionAgendas') {
            baseTitle = sessionTypeFilter !== 'All' ? `List of Session's Agenda (${sessionTypeFilter})` : "List of Session's Agenda";
        }
        if (reportType === 'Attendance') {
            const typeLabel = (sessionTypeFilter === 'Regular' || sessionTypeFilter === 'Special') ? `${sessionTypeFilter} Sessions` : 'Sessions';
            baseTitle = sessionTypeFilter !== 'All' ? `Sanggunian Attendance Profile (${typeLabel})` : 'Sanggunian Attendance Profile';
            if (selectedAuthor) {
                baseTitle = `Sanggunian Attendance Profile of Hon. ${selectedAuthor}`;
                if (sessionTypeFilter !== 'All') baseTitle += ` (${typeLabel})`;
            }
        }
        if (['Resolutions', 'Ordinances', 'All'].includes(reportType)) {
            let suffixParts = [];
            if (selectedAuthor) suffixParts.push(`Authored by ${selectedAuthor}`);
            if (selectedMeasure) {
                const measure = legislativeMeasures.find(m => m.id === selectedMeasure);
                suffixParts.push(`on ${measure?.title || ''}`);
            } else if (selectedSector) {
                suffixParts.push(`on ${selectedSector} Sector`);
            }
            if (suffixParts.length > 0) baseTitle += ' ' + suffixParts.join(' ');
        }
        return baseTitle;
    };

    const getBase64Logo = async (): Promise<string | null> => {
        // Updated to try multiple paths for robustness on GitHub Pages
        const candidates = [
            '/CLS-Maasim-Ver1/maasim-logo.png', // GitHub Pages default
            '/maasim-logo.png', // Root
            'maasim-logo.png' // Relative
        ];
        
        for (const url of candidates) {
            try {
                const response = await fetch(url);
                const contentType = response.headers.get('content-type');
                if (response.ok && contentType && contentType.startsWith('image/')) {
                    const blob = await response.blob();
                    return await new Promise((resolve) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(reader.result as string);
                        reader.readAsDataURL(blob);
                    });
                }
            } catch (e) {
                // Ignore error and try next candidate
            }
        }
        return null;
    };

    const handleDownloadExcel = () => {
        if (!(window as any).XLSX) return alert("Excel library not loaded.");
        const XLSX = (window as any).XLSX;
        const wb = XLSX.utils.book_new();
        let wsData: any[][] = [
            ["OFFICE OF THE SANGGUNIANG BAYAN"],
            ["Municipality of Maasim, Province of Sarangani"],
            [getReportTitle().toUpperCase()]
        ];
        let filterText = "";
        if (selectedTerm) filterText += `Term: ${formatTerm(selectedTerm)}   `;
        if ((startDate || endDate) && reportType !== 'ElectiveOfficials' && reportType !== 'StandingCommittees') filterText += `Period: ${startDate || 'Start'} - ${endDate || 'Present'}`;
        wsData.push([filterText], []);

        if (reportType === 'Attendance') {
            wsData.push(["Official Name", "Present", "Absent", "OB", "Leave", "Total"]);
            attendanceData.forEach(stat => wsData.push([stat.name, stat.present, stat.absent, stat.ob, stat.leave, stat.total]));
        } else if (reportType === 'CommitteeAttendance') {
            wsData.push(["Official Name", "Meetings Attended", "Hearings Attended", "Total"]);
            committeeAttendanceData.forEach(stat => wsData.push([stat.name, stat.meetings, stat.hearings, stat.total]));
        } else if (reportType === 'ElectiveOfficials') {
            wsData.push(["Official Name", "Position", "Rank", "Term"]);
            electiveOfficialsData.forEach(off => wsData.push([off.name, off.title, off.rank, formatTerm(off.term)]));
        } else if (reportType === 'StandingCommittees') {
            wsData.push(["Committee Name", "Chairman", "Vice-Chairman", "Member/s"]);
            standingCommitteesData.forEach(com => wsData.push([com.committeeName, com.chairman, com.viceChairman, com.members]));
        } else if (reportType === 'Sessions' || reportType === 'SessionAgendas' || reportType === 'CommitteeReports') {
            if (summaryStats) wsData.push([`${summaryStats.label1}: ${summaryStats.count1} | ${summaryStats.label2}: ${summaryStats.count2} | Total: ${summaryStats.total}`], []);
            if (reportType === 'Sessions') {
                wsData.push(["Term", "Date", "Session No.", "Session Type"]);
                filteredData.forEach(item => wsData.push([formatTerm(item.term), item.date, item.number, item.sessionType]));
            } else if (reportType === 'SessionAgendas') {
                wsData.push(["Term", "Date", "Series No.", "Session Type", "Time"]);
                filteredData.forEach(item => wsData.push([formatTerm(item.term), item.date, item.number, item.sessionType, `${item.timeStarted} - ${item.timeFinished}`]));
            } else {
                wsData.push(["Term", "Date", "Report No.", "Committee Name", "Type"]);
                filteredData.forEach(item => wsData.push([formatTerm(item.term), item.date, item.number, item.title, item.committeeType]));
            }
        } else {
            wsData.push(["Term", "Date Approved", "Doc No.", "Title", "Author", "Sector"]);
            filteredData.forEach(item => wsData.push([formatTerm(item.term), item.date, item.type === 'Resolution' ? `Res. ${item.number}` : `Ord. ${item.number}`, item.title, item.author, item.sector]));
        }
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(wb, ws, "Report");
        XLSX.writeFile(wb, "legislative_report.xlsx");
    };

    const handleDownloadWord = async () => {
        const logoData = await getBase64Logo();
        let contentTable = "";
        if (reportType === 'Attendance') {
            contentTable = `
                <table style="width:100%; border-collapse: collapse; font-family: Arial, sans-serif; font-size: 10pt;">
                    <tr style="background-color: #f0f0f0;">
                        <th style="border: 1px solid black; padding: 5px; text-align: left;">Official Name</th>
                        <th style="border: 1px solid black; padding: 5px; text-align: center;">Present</th>
                        <th style="border: 1px solid black; padding: 5px; text-align: center;">Absent</th>
                        <th style="border: 1px solid black; padding: 5px; text-align: center;">OB</th>
                        <th style="border: 1px solid black; padding: 5px; text-align: center;">Leave</th>
                        <th style="border: 1px solid black; padding: 5px; text-align: center;">Total</th>
                    </tr>
                    ${attendanceData.map(stat => `
                        <tr>
                            <td style="border: 1px solid black; padding: 5px;">${stat.name}</td>
                            <td style="border: 1px solid black; padding: 5px; text-align: center; font-weight: bold;">${stat.present}</td>
                            <td style="border: 1px solid black; padding: 5px; text-align: center;">${stat.absent}</td>
                            <td style="border: 1px solid black; padding: 5px; text-align: center;">${stat.ob}</td>
                            <td style="border: 1px solid black; padding: 5px; text-align: center;">${stat.leave}</td>
                            <td style="border: 1px solid black; padding: 5px; text-align: center; font-weight: bold;">${stat.total}</td>
                        </tr>
                    `).join('')}
                </table>
            `;
        } else if (reportType === 'CommitteeAttendance') {
            contentTable = `
                <table style="width:100%; border-collapse: collapse; font-family: Arial, sans-serif; font-size: 10pt;">
                    <tr style="background-color: #f0f0f0;">
                        <th style="border: 1px solid black; padding: 5px; text-align: left;">Official Name</th>
                        <th style="border: 1px solid black; padding: 5px; text-align: center;">Meetings Attended</th>
                        <th style="border: 1px solid black; padding: 5px; text-align: center;">Hearings Attended</th>
                        <th style="border: 1px solid black; padding: 5px; text-align: center;">Total</th>
                    </tr>
                    ${committeeAttendanceData.map(stat => `
                        <tr>
                            <td style="border: 1px solid black; padding: 5px;">${stat.name}</td>
                            <td style="border: 1px solid black; padding: 5px; text-align: center;">${stat.meetings}</td>
                            <td style="border: 1px solid black; padding: 5px; text-align: center;">${stat.hearings}</td>
                            <td style="border: 1px solid black; padding: 5px; text-align: center; font-weight: bold;">${stat.total}</td>
                        </tr>
                    `).join('')}
                </table>
            `;
        } else if (reportType === 'ElectiveOfficials') {
            contentTable = `
                <table style="width:100%; border-collapse: collapse; font-family: Arial, sans-serif; font-size: 10pt;">
                    <tr style="background-color: #f0f0f0;">
                        <th style="border: 1px solid black; padding: 5px; text-align: left;">Official Name</th>
                        <th style="border: 1px solid black; padding: 5px; text-align: left;">Position</th>
                        <th style="border: 1px solid black; padding: 5px; text-align: left;">Rank</th>
                        <th style="border: 1px solid black; padding: 5px; text-align: left;">Term</th>
                    </tr>
                    ${electiveOfficialsData.map(off => `
                        <tr>
                            <td style="border: 1px solid black; padding: 5px;">${off.name}</td>
                            <td style="border: 1px solid black; padding: 5px;">${off.title}</td>
                            <td style="border: 1px solid black; padding: 5px;">${off.rank}</td>
                            <td style="border: 1px solid black; padding: 5px;">${formatTerm(off.term)}</td>
                        </tr>
                    `).join('')}
                </table>
            `;
        } else if (reportType === 'StandingCommittees') {
            contentTable = `
                <table style="width:100%; border-collapse: collapse; font-family: Arial, sans-serif; font-size: 10pt;">
                    <tr style="background-color: #f0f0f0;">
                        <th style="border: 1px solid black; padding: 5px; text-align: left;">Committee Name</th>
                        <th style="border: 1px solid black; padding: 5px; text-align: left;">Chairman</th>
                        <th style="border: 1px solid black; padding: 5px; text-align: left;">Vice-Chairman</th>
                        <th style="border: 1px solid black; padding: 5px; text-align: left;">Member/s</th>
                    </tr>
                    ${standingCommitteesData.map(com => `
                        <tr>
                            <td style="border: 1px solid black; padding: 5px;">${com.committeeName}</td>
                            <td style="border: 1px solid black; padding: 5px;">${com.chairman}</td>
                            <td style="border: 1px solid black; padding: 5px;">${com.viceChairman}</td>
                            <td style="border: 1px solid black; padding: 5px;">${com.members}</td>
                        </tr>
                    `).join('')}
                </table>
            `;
        } else if (reportType === 'Sessions' || reportType === 'SessionAgendas' || reportType === 'CommitteeReports') {
            const summary = summaryStats ? `<p style="text-align:center; font-weight:bold; margin-bottom:5px;">${summaryStats.label1}: ${summaryStats.count1} | ${summaryStats.label2}: ${summaryStats.count2} | Total: ${summaryStats.total}</p>` : '';
            if (reportType === 'Sessions') {
                contentTable = summary + `
                    <table style="width:100%; border-collapse: collapse; font-family: Arial, sans-serif; font-size: 10pt;">
                        <tr style="background-color: #f0f0f0;">
                            <th style="border: 1px solid black; padding: 5px; text-align: left;">Term</th>
                            <th style="border: 1px solid black; padding: 5px; text-align: left;">Date</th>
                            <th style="border: 1px solid black; padding: 5px; text-align: left;">Session No.</th>
                            <th style="border: 1px solid black; padding: 5px; text-align: left;">Session Type</th>
                        </tr>
                        ${filteredData.map(item => `
                            <tr>
                                <td style="border: 1px solid black; padding: 5px;">${formatTerm(item.term)}</td>
                                <td style="border: 1px solid black; padding: 5px;">${item.date}</td>
                                <td style="border: 1px solid black; padding: 5px;">${item.number}</td>
                                <td style="border: 1px solid black; padding: 5px;">${item.sessionType}</td>
                            </tr>
                        `).join('')}
                    </table>
                `;
            } else if (reportType === 'SessionAgendas') {
                contentTable = summary + `
                    <table style="width:100%; border-collapse: collapse; font-family: Arial, sans-serif; font-size: 10pt;">
                        <tr style="background-color: #f0f0f0;">
                            <th style="border: 1px solid black; padding: 5px; text-align: left;">Term</th>
                            <th style="border: 1px solid black; padding: 5px; text-align: left;">Date</th>
                            <th style="border: 1px solid black; padding: 5px; text-align: left;">Series No.</th>
                            <th style="border: 1px solid black; padding: 5px; text-align: left;">Session Type</th>
                            <th style="border: 1px solid black; padding: 5px; text-align: left;">Time</th>
                        </tr>
                        ${filteredData.map(item => `
                            <tr>
                                <td style="border: 1px solid black; padding: 5px;">${formatTerm(item.term)}</td>
                                <td style="border: 1px solid black; padding: 5px;">${item.date}</td>
                                <td style="border: 1px solid black; padding: 5px;">${item.number}</td>
                                <td style="border: 1px solid black; padding: 5px;">${item.sessionType}</td>
                                <td style="border: 1px solid black; padding: 5px;">${item.timeStarted} - ${item.timeFinished}</td>
                            </tr>
                        `).join('')}
                    </table>
                `;
            } else {
                 contentTable = summary + `
                    <table style="width:100%; border-collapse: collapse; font-family: Arial, sans-serif; font-size: 10pt;">
                        <tr style="background-color: #f0f0f0;">
                            <th style="border: 1px solid black; padding: 5px; text-align: left;">Term</th>
                            <th style="border: 1px solid black; padding: 5px; text-align: left;">Date</th>
                            <th style="border: 1px solid black; padding: 5px; text-align: left;">Report No.</th>
                            <th style="border: 1px solid black; padding: 5px; text-align: left;">Committee Name</th>
                             <th style="border: 1px solid black; padding: 5px; text-align: left;">Type</th>
                        </tr>
                        ${filteredData.map(item => `
                            <tr>
                                <td style="border: 1px solid black; padding: 5px;">${formatTerm(item.term)}</td>
                                <td style="border: 1px solid black; padding: 5px;">${item.date}</td>
                                <td style="border: 1px solid black; padding: 5px;">${item.number}</td>
                                <td style="border: 1px solid black; padding: 5px;">${item.title}</td>
                                <td style="border: 1px solid black; padding: 5px;">${item.committeeType}</td>
                            </tr>
                        `).join('')}
                    </table>
                `;
            }
        } else {
             contentTable = `
                <table style="width:100%; border-collapse: collapse; font-family: Arial, sans-serif; font-size: 10pt;">
                    <tr style="background-color: #f0f0f0;">
                        <th style="border: 1px solid black; padding: 5px; text-align: left;">Term</th>
                        <th style="border: 1px solid black; padding: 5px; text-align: left;">Date Approved</th>
                        <th style="border: 1px solid black; padding: 5px; text-align: left;">Doc No.</th>
                        <th style="border: 1px solid black; padding: 5px; text-align: left;">Title</th>
                        <th style="border: 1px solid black; padding: 5px; text-align: left;">Author</th>
                        <th style="border: 1px solid black; padding: 5px; text-align: left;">Sector</th>
                    </tr>
                    ${filteredData.map(item => `
                        <tr>
                            <td style="border: 1px solid black; padding: 5px;">${formatTerm(item.term)}</td>
                            <td style="border: 1px solid black; padding: 5px;">${item.date}</td>
                            <td style="border: 1px solid black; padding: 5px;">${item.type === 'Resolution' ? `Res. ${item.number}` : `Ord. ${item.number}`}</td>
                            <td style="border: 1px solid black; padding: 5px;">${item.title}</td>
                            <td style="border: 1px solid black; padding: 5px;">${item.author}</td>
                            <td style="border: 1px solid black; padding: 5px;">${item.sector}</td>
                        </tr>
                    `).join('')}
                </table>
            `;
        }
        let filterText = "";
        if (selectedTerm) filterText += `Term: ${formatTerm(selectedTerm)}   `;
        if ((startDate || endDate) && reportType !== 'ElectiveOfficials' && reportType !== 'StandingCommittees') filterText += `Period: ${startDate || 'Start'} - ${endDate || 'Present'}`;
        const htmlContent = `
            <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
            <head><meta charset='utf-8'><title>${getReportTitle()}</title></head>
            <body style="font-family: Arial, sans-serif;">
                <div style="text-align:center; margin-bottom: 15px;">
                    <table style="margin: 0 auto; border:none;">
                        <tr style="border:none;">
                            <td style="padding-right: 2px; border:none;">
                                ${logoData ? `<img src="${logoData}" width="75" height="75" />` : ''}
                            </td>
                            <td style="text-align: center; border:none;">
                                <p style="font-size: 13pt; margin: 0; font-weight: bold;">OFFICE OF THE SANGGUNIANG BAYAN</p>
                                <p style="font-size: 9pt; margin: 0;">Municipality of Maasim, Province of Sarangani</p>
                            </td>
                        </tr>
                    </table>
                    <p style="font-size: 11pt; margin-top: 8px; font-weight: bold; text-decoration: underline; text-transform: uppercase;">${getReportTitle()}</p>
                    <p style="font-size: 8pt; margin-top: 2px;">${filterText}</p>
                </div>
                ${contentTable}
                <div style="margin-top: 20px; font-size: 8pt; text-align: right; color: #555;">Generated by Computerized Legislative Tracking System</div>
            </body>
            </html>
        `;
        const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'legislative_report.doc';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleGeneratePDF = async (action: 'save' | 'preview') => {
        try {
            if (!(window as any).jspdf) return alert("PDF library not loaded.");
            const logoData = await getBase64Logo();
            const { jsPDF } = (window as any).jspdf;
            const pageHeight = 215.9, pageWidth = 330.2, centerX = pageWidth / 2;
            const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [pageHeight, pageWidth] });
            
            if (logoData) {
                try {
                    doc.addImage(logoData, 'PNG', centerX - 62, 4, 20, 20);
                } catch (imgErr) {
                    console.warn("Failed to add logo to PDF:", imgErr);
                }
            }
            
            doc.setFontSize(13).setFont(undefined, 'bold').text("OFFICE OF THE SANGGUNIANG BAYAN", centerX + 12, 12, { align: 'center' });
            doc.setFontSize(9).setFont(undefined, 'normal').text("Municipality of Maasim, Province of Sarangani", centerX + 12, 17, { align: 'center' });
            
            doc.setFontSize(11).setFont(undefined, 'bold').text(getReportTitle().toUpperCase(), centerX, 30, { align: 'center' });
            doc.setFontSize(8.5).setFont(undefined, 'normal');
            let filterText = "";
            if (selectedTerm) filterText += `Term: ${formatTerm(selectedTerm)}   `;
            if ((startDate || endDate) && reportType !== 'ElectiveOfficials' && reportType !== 'StandingCommittees') filterText += `Period: ${startDate || 'Start'} - ${endDate || 'Present'}`;
            if (filterText) doc.text(filterText, centerX, 35, { align: 'center' });
            
            let tableColumn: string[] = [], tableRows: any[] = [], columnStyles: any = {}, startY = 42;
            if (reportType === 'Attendance') {
                tableColumn = ["Official Name", "Present", "Absent", "OB", "Leave", "Total"];
                tableRows = attendanceData.map(stat => [stat.name, stat.present, stat.absent, stat.ob, stat.leave, stat.total]);
            } else if (reportType === 'CommitteeAttendance') {
                tableColumn = ["Official Name", "Meetings Attended", "Hearings Attended", "Total"];
                tableRows = committeeAttendanceData.map(stat => [stat.name, stat.meetings, stat.hearings, stat.total]);
            } else if (reportType === 'ElectiveOfficials') {
                tableColumn = ["Official Name", "Position", "Rank", "Term"];
                tableRows = electiveOfficialsData.map(off => [off.name, off.title, off.rank, formatTerm(off.term)]);
            } else if (reportType === 'StandingCommittees') {
                tableColumn = ["Committee Name", "Chairman", "Vice-Chairman", "Member/s"];
                tableRows = standingCommitteesData.map(com => [com.committeeName, com.chairman, com.viceChairman, com.members]);
            } else if (reportType === 'Sessions' || reportType === 'SessionAgendas' || reportType === 'CommitteeReports') {
                if (summaryStats) {
                    doc.setFontSize(9).setFont(undefined, 'bold').text(`${summaryStats.label1}: ${summaryStats.count1}    ${summaryStats.label2}: ${summaryStats.count2}    Total: ${summaryStats.total}`, centerX, 40, { align: 'center' });
                    doc.setFont(undefined, 'normal');
                }
                startY = 44;
                if (reportType === 'Sessions') {
                    tableColumn = ["Term", "Date", "Session No.", "Session Type"];
                    tableRows = filteredData.map(item => [formatTerm(item.term), item.date, item.number, item.sessionType]);
                } else if (reportType === 'SessionAgendas') {
                    tableColumn = ["Term", "Date", "Series No.", "Session Type", "Time"];
                    tableRows = filteredData.map(item => [formatTerm(item.term), item.date, item.number, item.sessionType, `${item.timeStarted} - ${item.timeFinished}`]);
                } else {
                    tableColumn = ["Term", "Date", "Report No.", "Committee Name", "Type"];
                    tableRows = filteredData.map(item => [formatTerm(item.term), item.date, item.number, item.title, item.committeeType]);
                }
            } else {
                tableColumn = ["Term", "Date Approved", "Doc No.", "Title", "Author", "Sector"];
                tableRows = filteredData.map(item => [formatTerm(item.term), item.date, item.type === 'Resolution' ? `Res. ${item.number}` : `Ord. ${item.number}`, item.title, item.author, item.sector]);
            }
            if (!(doc as any).autoTable) return alert("AutoTable plugin not loaded.");
            (doc as any).autoTable({ head: [tableColumn], body: tableRows, startY: startY, theme: 'grid', headStyles: { fillColor: [30, 58, 138] }, styles: { fontSize: 8 }, didDrawPage: function (data: any) {
                var str = "Page " + doc.internal.getNumberOfPages();
                doc.setFontSize(7);
                doc.text(str, data.settings.margin.left, doc.internal.pageSize.height - 8);
                doc.text("Generated by Computerized Legislative Tracking System", doc.internal.pageSize.width - data.settings.margin.right, doc.internal.pageSize.height - 8, { align: 'right' });
            }});
            
            if (action === 'save') {
                doc.save('legislative_report.pdf');
            } else {
                window.open(doc.output('bloburl'), '_blank');
            }
        } catch (e: any) { 
            console.error("PDF Generation Error:", e);
            alert(`PDF Error: ${e.message || e}`); 
        }
    };

    const inputClasses = "block w-full px-3 py-2 border border-slate-300 rounded-md leading-5 bg-white placeholder-slate-500 focus:outline-none focus:placeholder-slate-400 focus:ring-1 focus:ring-brand-secondary focus:border-brand-secondary sm:text-sm";
    const labelClasses = "block text-sm font-medium text-slate-700 mb-1";

    return (
        <div className="flex flex-col lg:flex-row gap-6">
            <div className="w-full lg:w-80 flex-shrink-0">
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-bold text-brand-primary mb-4">Report Filters</h2>
                    <div className="space-y-4">
                         <div>
                            <label className={labelClasses}>Document Type</label>
                            <select value={reportType} onChange={(e) => { setReportType(e.target.value as any); setSessionTypeFilter('All'); setSelectedCommittee(''); }} className={inputClasses}>
                                <option value="All">All Documents</option>
                                <option value="Resolutions">Resolutions Only</option>
                                <option value="Ordinances">Ordinances Only</option>
                                <option value="Sessions">List of Conducted Sessions</option>
                                <option value="SessionAgendas">List of Session's Agenda</option>
                                <option value="CommitteeReports">List of Committee Reports</option>
                                <option value="CommitteeAttendance">Committee Attendance Profile</option>
                                <option value="Attendance">Sanggunian Attendance Profile</option>
                                <option value="ElectiveOfficials">List of Elective Officials</option>
                                <option value="StandingCommittees">List of Standing Committees</option>
                            </select>
                        </div>
                        {(reportType === 'Sessions' || reportType === 'SessionAgendas' || reportType === 'Attendance') && (
                            <div>
                                <label className={labelClasses}>Session Type</label>
                                <select value={sessionTypeFilter} onChange={(e) => setSessionTypeFilter(e.target.value as any)} className={inputClasses}>
                                    <option value="All">All Types</option>
                                    <option value="Regular">Regular</option>
                                    <option value="Special">Special</option>
                                </select>
                            </div>
                        )}
                        {(reportType === 'CommitteeReports' || reportType === 'CommitteeAttendance') && (
                            <>
                                <div>
                                    <label className={labelClasses}>Committee Type</label>
                                    <select value={sessionTypeFilter} onChange={(e) => setSessionTypeFilter(e.target.value as any)} className={inputClasses}>
                                        <option value="All">All Types</option>
                                        <option value="Meeting">Meeting</option>
                                        <option value="Hearing">Hearing</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={labelClasses}>Filter by Committee</label>
                                    <select value={selectedCommittee} onChange={(e) => setSelectedCommittee(e.target.value)} className={inputClasses}>
                                        <option value="">All Committees</option>
                                        {uniqueCommittees.map(name => <option key={name} value={name}>{name}</option>)}
                                    </select>
                                </div>
                            </>
                        )}
                        <div>
                            <label className={labelClasses}>Legislative Term</label>
                            <select value={selectedTerm} onChange={(e) => setSelectedTerm(e.target.value)} className={inputClasses}>
                                <option value="">{(reportType === 'ElectiveOfficials' || reportType === 'StandingCommittees') ? '-- Select Term --' : 'All Terms'}</option>
                                {terms.map(term => <option key={term.id} value={`${term.yearFrom}-${term.yearTo}`}>{`${term.yearFrom.split('-')[0]}-${term.yearTo.split('-')[0]}`}</option>)}
                            </select>
                        </div>
                        {reportType !== 'ElectiveOfficials' && reportType !== 'StandingCommittees' && (
                            <>
                                <div><label className={labelClasses}>Date From</label><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputClasses} /></div>
                                <div><label className={labelClasses}>Date To</label><input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputClasses} /></div>
                            </>
                        )}
                        {reportType !== 'Sessions' && reportType !== 'SessionAgendas' && reportType !== 'CommitteeReports' && reportType !== 'ElectiveOfficials' && (
                            <div className="border-t border-slate-200 pt-4 mt-4">
                                <label className={labelClasses}>{reportType === 'Attendance' || reportType === 'CommitteeAttendance' ? 'Select Official' : reportType === 'StandingCommittees' ? 'Select Chairman' : 'Author'}</label>
                                <select value={selectedAuthor} onChange={(e) => setSelectedAuthor(e.target.value)} className={inputClasses}>
                                    <option value="">{reportType === 'Attendance' || reportType === 'CommitteeAttendance' ? 'All Officials' : reportType === 'StandingCommittees' ? 'All Chairmen' : 'All Authors'}</option>
                                    {legislators.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}
                                </select>
                            </div>
                        )}
                        {reportType !== 'Sessions' && reportType !== 'SessionAgendas' && reportType !== 'CommitteeReports' && reportType !== 'ElectiveOfficials' && reportType !== 'StandingCommittees' && reportType !== 'Attendance' && reportType !== 'CommitteeAttendance' && (
                            <div className="border-t border-slate-200 pt-4 mt-4">
                                <label className={labelClasses}>Filter by Category</label>
                                <select 
                                    value={categoryFilterType} 
                                    onChange={(e) => {
                                        setCategoryFilterType(e.target.value as any);
                                        setSelectedMeasure('');
                                        setSelectedSector('');
                                    }} 
                                    className={inputClasses}
                                >
                                    <option value="None">None</option>
                                    <option value="Measure">By Legislative Measure (Group)</option>
                                    <option value="Sector">By Individual Sector</option>
                                </select>

                                {categoryFilterType === 'Measure' && (
                                    <div className="mt-2">
                                        <select value={selectedMeasure} onChange={(e) => setSelectedMeasure(e.target.value)} className={inputClasses}>
                                            <option value="">-- Select Legislative Measure --</option>
                                            {legislativeMeasures.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                                        </select>
                                    </div>
                                )}

                                {categoryFilterType === 'Sector' && (
                                    <div className="mt-2">
                                        <select value={selectedSector} onChange={(e) => setSelectedSector(e.target.value)} className={inputClasses}>
                                            <option value="">-- Select Sector --</option>
                                            {sectors.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                                        </select>
                                    </div>
                                )}
                            </div>
                        )}
                        <div className="pt-4 mt-4 border-t border-slate-200 space-y-3">
                             <button onClick={() => handleGeneratePDF('preview')} className="w-full py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition-colors flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                Preview Report
                            </button>
                             <button onClick={() => handleGeneratePDF('save')} className="w-full py-2 bg-brand-secondary text-white font-semibold rounded-lg shadow-md hover:bg-brand-primary transition-colors flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 4v3h10V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm10 5H5a2 2 0 00-2 2v3a2 2 0 002 2h1v-2a1 1 0 011-1h6a1 1 0 011 1v2h1a2 2 0 002-2v-3a2 2 0 00-2-2zm-3 4H8v2h4v-2z" clipRule="evenodd" /></svg>Print Report (PDF)</button>
                            <button onClick={handleDownloadExcel} className="w-full py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition-colors flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>Export to Excel</button>
                             <button onClick={handleDownloadWord} className="w-full py-2 bg-blue-700 text-white font-semibold rounded-lg shadow-md hover:bg-blue-800 transition-colors flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>Export to Word</button>
                        </div>
                    </div>
                </div>
            </div>
            <div className="flex-grow bg-white p-8 rounded-lg shadow-md min-h-screen flex flex-col justify-between">
                <div className="flex-grow">
                    <div className="flex flex-col items-center mb-6">
                        <div className="flex items-center gap-2 mb-2">
                            <img 
                              src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/Seal_of_the_Municipality_of_Maasim.png/720px-Seal_of_the_Municipality_of_Maasim.png" 
                              alt="Municipality of Maasim Seal" 
                              className="object-contain"
                              style={{ width: '1.2in', height: '1.2in' }}
                              onError={(e) => {
                                  const target = e.currentTarget;
                                  if (target.src.includes('wikimedia')) {
                                      // First fallback: GitHub Pages path
                                      target.src = "/CLS-Maasim-Ver1/maasim-logo.png";
                                  } else if (target.src.includes('CLS-Maasim-Ver1')) {
                                      // Second fallback: Local/Relative path
                                      target.src = "maasim-logo.png";
                                  } else {
                                      // Give up to prevent infinite loop
                                      target.onerror = null;
                                  }
                              }}
                            />
                            <div className="text-center sm:text-left border-l-2 border-slate-200 pl-4">
                                <h1 className="text-xl font-bold text-black uppercase tracking-tight">Office of the Sangguniang Bayan</h1>
                                <p className="text-[12px] text-slate-600 font-medium">Municipality of Maasim, Province of Sarangani</p>
                            </div>
                        </div>
                        <div className="w-full border-t border-slate-100 my-2"></div>
                        <h2 className="text-lg font-bold text-brand-primary underline decoration-2 underline-offset-4 uppercase text-center w-full">{getReportTitle()}</h2>
                        {selectedTerm && <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-widest">Term: {formatTerm(selectedTerm)}</p>}
                    </div>
                    
                    {summaryStats && <div className="mb-4 p-2 bg-slate-50 rounded-md border border-slate-200 flex flex-wrap gap-4 justify-center text-xs shadow-sm"><span className="font-semibold text-sky-800">{summaryStats.label1}: <span className="font-bold">{summaryStats.count1}</span></span><span className="text-slate-400">|</span><span className="font-semibold text-amber-800">{summaryStats.label2}: <span className="font-bold">{summaryStats.count2}</span></span><span className="text-slate-400">|</span><span className="font-bold text-slate-800 uppercase">Total Items: {summaryStats.total}</span></div>}
                    
                    {filteredData.length > 0 || attendanceData.length > 0 || committeeAttendanceData.length > 0 || electiveOfficialsData.length > 0 || standingCommitteesData.length > 0 ? (
                        <div className="overflow-x-auto shadow-sm border border-slate-200 rounded-lg">
                            <table className="min-w-full border-collapse">
                                <thead>
                                    <tr className="bg-slate-100">
                                        {reportType === 'Attendance' ? (
                                            <>
                                                <th className="border-b border-slate-200 px-4 py-2 text-left text-xs font-bold text-slate-700 uppercase">Official Name</th>
                                                <th className="border-b border-slate-200 px-4 py-2 text-center text-xs font-bold text-slate-700 uppercase w-24">Present</th>
                                                <th className="border-b border-slate-200 px-4 py-2 text-center text-xs font-bold text-slate-700 uppercase w-24">Absent</th>
                                                <th className="border-b border-slate-200 px-4 py-2 text-center text-xs font-bold text-slate-700 uppercase w-24">OB</th>
                                                <th className="border-b border-slate-200 px-4 py-2 text-center text-xs font-bold text-slate-700 uppercase w-24">Leave</th>
                                                <th className="border-b border-slate-200 px-4 py-2 text-center text-xs font-bold text-slate-700 uppercase w-24">Total</th>
                                            </>
                                        ) : reportType === 'CommitteeAttendance' ? (
                                            <>
                                                <th className="border-b border-slate-200 px-4 py-2 text-left text-xs font-bold text-slate-700 uppercase">Official Name</th>
                                                <th className="border-b border-slate-200 px-4 py-2 text-center text-xs font-bold text-slate-700 uppercase w-48">Meetings Attended</th>
                                                <th className="border-b border-slate-200 px-4 py-2 text-center text-xs font-bold text-slate-700 uppercase w-48">Hearings Attended</th>
                                                <th className="border-b border-slate-200 px-4 py-2 text-center text-xs font-bold text-slate-700 uppercase w-32">Total</th>
                                            </>
                                        ) : (
                                            <th className="border-b border-slate-200 px-4 py-2 text-left text-xs font-bold text-slate-700 uppercase">Document/Record Summary</th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredData.slice(0, 15).map((item, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50 transition-colors"><td className="border-b border-slate-100 px-4 py-2 text-sm text-slate-700 font-medium"><span className="text-brand-secondary font-bold mr-2">[{item.number}]</span> {item.title}</td></tr>
                                    ))}
                                    {attendanceData.slice(0, 15).map((stat, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                            <td className="border-b border-slate-100 px-4 py-2 text-sm text-slate-700">{stat.name}</td>
                                            <td className="border-b border-slate-100 px-4 py-2 text-center text-sm font-bold text-emerald-600">{stat.present}</td>
                                            <td className="border-b border-slate-100 px-4 py-2 text-center text-sm text-rose-600">{stat.absent}</td>
                                            <td className="border-b border-slate-100 px-4 py-2 text-center text-sm text-blue-600">{stat.ob}</td>
                                            <td className="border-b border-slate-100 px-4 py-2 text-center text-sm text-amber-600">{stat.leave}</td>
                                            <td className="border-b border-slate-100 px-4 py-2 text-center text-sm font-black text-slate-900 bg-slate-50">{stat.total}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="bg-slate-50 p-2 text-[10px] text-center text-slate-400 italic">Previewing up to 15 records. Download Full Report for complete dataset.</div>
                        </div>
                    ) : <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-[2rem] bg-slate-50"><p className="text-slate-400 font-bold italic">No records found matching the specified filters.</p></div>}
                </div>
                <div className="mt-8 pt-2 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-500 uppercase font-black tracking-widest"><span>Page 1 of 1</span><span>Maasim CLS - Generated Report</span></div>
            </div>
        </div>
    );
};

export default ReportsView;