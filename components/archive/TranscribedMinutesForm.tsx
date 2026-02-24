import React, { useState, useEffect, useMemo } from 'react';
import type { SessionMinute, Term } from '../../types';
import { AnalysisType } from '../../types';
import { transcribeAudio, transcribeAudioSummarized, analyzeText } from '../../services/geminiService';
import LiveTranscriptionModal from './LiveTranscriptionModal';
import Spinner from '../Spinner';

interface TranscribedMinutesFormProps {
    initialData?: SessionMinute | null;
    onSubmit: (data: Omit<SessionMinute, 'id'> | SessionMinute) => void;
    onCancel: () => void;
    terms: Term[];
}

const FONT_FAMILIES = [
    { name: 'Serif (Standard)', value: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif' },
    { name: 'Sans-Serif', value: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' },
    { name: 'Monospace', value: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace' },
];

const FONT_SIZES = ['10pt', '11pt', '12pt', '14pt', '16pt', '18pt'];

const TranscribedMinutesForm: React.FC<TranscribedMinutesFormProps> = ({ initialData, onSubmit, onCancel, terms }) => {
    const [formData, setFormData] = useState<SessionMinute | any>({
        sessionNumber: `TRS-${new Date().getFullYear()}-`,
        sessionDate: '',
        sessionType: 'Regular',
        term: '',
        minutesContent: '',
        filePath: undefined,
        audioFilePath: undefined,
    });
    
    const [isPreviewMode, setIsPreviewMode] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [isSummarizing, setIsSummarizing] = useState(false);
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [finalDocFile, setFinalDocFile] = useState<File | null>(null);
    const [aiStatus, setAiStatus] = useState<string>('');
    const [showLiveModal, setShowLiveModal] = useState(false);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    
    // UI Personalization for the editor
    const [fontFamily, setFontFamily] = useState(FONT_FAMILIES[0].value);
    const [fontSize, setFontSize] = useState('12pt');

    useEffect(() => {
        if (initialData) {
            setFormData({ 
                ...initialData, 
                minutesContent: initialData.minutesContent || '',
                sessionType: initialData.sessionType || 'Regular'
            });
            if (initialData.audioFilePath) setAudioUrl(initialData.audioFilePath);
        }
    }, [initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        if (name === 'sessionType') {
            const year = new Date().getFullYear();
            const newPrefix = value === 'Special' ? 'TSS' : 'TRS';
            setFormData((prev: any) => {
                let currentSuffix = '';
                const parts = prev.sessionNumber.split('-');
                if (parts.length > 2) {
                    currentSuffix = parts.slice(2).join('-');
                }
                
                return {
                    ...prev,
                    sessionType: value as any,
                    sessionNumber: `${newPrefix}-${year}-${currentSuffix}`
                };
            });
        } else {
            setFormData((prev: any) => ({ ...prev, [name]: value as any }));
        }
    };

    const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setAudioFile(file);
            const url = URL.createObjectURL(file);
            setAudioUrl(url);
            setAiStatus(`Audio loaded: ${file.name}`);
        }
    };

    const handleFinalDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFinalDocFile(file);
            setAiStatus(`Official file attached: ${file.name}`);
        }
    };

    const handleTranscribeAudio = async (summarized: boolean = false) => {
        if (!audioFile && !audioUrl) return alert("Please upload session audio first.");
        setIsTranscribing(true);
        setAiStatus(summarized ? 'AI is generating summarized journal...' : 'AI is generating time-based journal...');
        
        try {
            let base64 = '';
            if (audioFile) {
                base64 = await new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.readAsDataURL(audioFile);
                    reader.onload = () => resolve((reader.result as string).split(',')[1]);
                });
                
                const transcription = summarized 
                    ? await transcribeAudioSummarized(base64, audioFile.type)
                    : await transcribeAudio(base64, audioFile.type);

                setFormData((prev: any) => ({ 
                    ...prev, 
                    minutesContent: (prev.minutesContent ? prev.minutesContent + '\n\n' : '') + transcription 
                }));
                setAiStatus('Process successful.');
            } else {
                throw new Error("New audio file required for processing.");
            }
        } catch (error: any) { 
            setAiStatus(`Process failed: ${error.message}`);
        } finally { 
            setIsTranscribing(false); 
            setTimeout(() => setAiStatus(''), 5000);
        }
    };

    const handleSummarizeTranscription = async () => {
        if (!formData.minutesContent || formData.minutesContent.trim().length < 50) {
            return alert("Not enough content to summarize. Please transcribe or type proceedings first.");
        }
        setIsSummarizing(true);
        setAiStatus('AI is summarizing the journal...');
        
        try {
            const summary = await analyzeText(formData.minutesContent, AnalysisType.Summary);
            setFormData((prev: any) => ({ 
                ...prev, 
                minutesContent: (prev.minutesContent ? prev.minutesContent + '\n\n' : '') + 
                                '### EXECUTIVE SUMMARY (AI GENERATED)\n\n' + summary 
            }));
            setAiStatus('Summary successfully appended.');
        } catch (error: any) { 
            setAiStatus(`Summarization failed: ${error.message}`);
        } finally { 
            setIsSummarizing(false); 
            setTimeout(() => setAiStatus(''), 5000);
        }
    };

    const getBase64Logo = async (): Promise<string | null> => {
        try {
            const response = await fetch('./maasim-logo.png');
            if (response.ok) {
                const blob = await response.blob();
                return await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.readAsDataURL(blob);
                });
            }
        } catch (error) {}
        return null;
    };

    const handlePdfExport = async (shouldPrint: boolean) => {
        try {
            if (!(window as any).jspdf) return alert("PDF library not loaded.");
            const { jsPDF } = (window as any).jspdf;
            const logoData = await getBase64Logo();
            
            const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            const margin = 25, pageWidth = 210, pageHeight = 297, contentWidth = pageWidth - (margin * 2);
            let cursorY = margin;

            const addHeader = (pageNum: number) => {
                if (logoData) {
                    doc.addImage(logoData, 'PNG', margin, 12, 22, 22);
                }
                
                doc.setFontSize(10).setFont('helvetica', 'bold').text("MUNICIPALITY OF MAASIM", pageWidth/2 + 12, 16, { align: 'center' });
                doc.setFontSize(12).text("OFFICE OF THE SANGGUNIANG BAYAN", pageWidth/2 + 12, 22, { align: 'center' });
                doc.setFontSize(9).setFont('helvetica', 'normal').text("Province of Sarangani", pageWidth/2 + 12, 27, { align: 'center' });
                
                doc.setDrawColor(30, 58, 138).setLineWidth(0.6).line(margin, 35, pageWidth - margin, 35);
                
                if (pageNum > 1) {
                    doc.setFontSize(8).setFont('helvetica', 'italic').text(`(Continuation of ${formData.sessionNumber}) - Page ${pageNum}`, margin, 42);
                    cursorY = 50;
                } else {
                    doc.setFontSize(14).setFont('helvetica', 'bold').text(`JOURNAL OF PROCEEDINGS`, pageWidth/2, 50, { align: 'center' });
                    doc.setFontSize(10).setFont('helvetica', 'normal').text(`${formData.sessionType} Session No: ${formData.sessionNumber} | Date: ${formData.sessionDate}`, pageWidth/2, 56, { align: 'center' });
                    cursorY = 70;
                }
            };

            addHeader(1);
            const splitText = doc.splitTextToSize(formData.minutesContent || "No content transcribed.", contentWidth);
            doc.setFontSize(11).setFont('times', 'normal');

            splitText.forEach((line: string) => {
                if (cursorY > pageHeight - 25) {
                    doc.addPage();
                    addHeader(doc.internal.getNumberOfPages());
                    doc.setFontSize(11).setFont('times', 'normal');
                }
                doc.text(line, margin, cursorY);
                cursorY += 7;
            });

            const totalPages = doc.internal.getNumberOfPages();
            for(let i = 1; i <= totalPages; i++) {
                doc.setPage(i);
                doc.setFontSize(8).setFont('helvetica', 'normal').text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
                doc.text(`Maasim Legislative System - Official Report`, margin, pageHeight - 10);
            }

            if (shouldPrint) doc.autoPrint();
            window.open(doc.output('bloburl'), '_blank');
        } catch (e: any) {
            console.error("PDF Generation Error:", e);
            alert(`PDF Error: ${e.message || e}`);
        }
    };

    const handleSave = () => {
        const dataToSave = { ...formData };
        if (audioFile) dataToSave.audioFilePath = URL.createObjectURL(audioFile);
        if (finalDocFile) dataToSave.filePath = URL.createObjectURL(finalDocFile);
        onSubmit(dataToSave);
    };

    const pagedContent = useMemo(() => {
        const lines = (formData.minutesContent || "").split('\n');
        const pages: string[][] = [];
        let currentPage: string[] = [];
        let lineCount = 0;
        const LINES_PER_PAGE = 38;

        lines.forEach((line: string) => {
            const wrapCount = Math.max(1, Math.ceil(line.length / 90));
            if (lineCount + wrapCount > LINES_PER_PAGE) {
                pages.push(currentPage);
                currentPage = [line];
                lineCount = wrapCount;
            } else {
                currentPage.push(line);
                lineCount += wrapCount;
            }
        });
        if (currentPage.length > 0) pages.push(currentPage);
        return pages.length > 0 ? pages : [["No content detected."]];
    }, [formData.minutesContent]);

    return (
        <div className="bg-white p-6 sm:p-10 rounded-2xl shadow-xl max-w-7xl mx-auto border border-slate-200">
            {showLiveModal && (
                <LiveTranscriptionModal 
                    onClose={() => setShowLiveModal(false)} 
                    onFinish={(t) => { setFormData((p: any) => ({...p, minutesContent: (p.minutesContent ? p.minutesContent + '\n\n' : '') + t})); setShowLiveModal(false); }}
                />
            )}

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-slate-100 pb-6">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800 tracking-tight leading-none">Legislative Journal</h2>
                    <p className="text-slate-500 text-sm mt-1">Official Session Records & AI-Powered Documentation</p>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setIsPreviewMode(!isPreviewMode)} 
                        className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all border flex items-center gap-2 ${isPreviewMode ? 'bg-slate-800 text-white border-slate-800 shadow-md' : 'bg-white text-slate-600 border-slate-300 hover:border-slate-800 hover:text-slate-800'}`}
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                        {isPreviewMode ? 'Edit Mode' : 'Page View Preview'}
                    </button>
                </div>
            </div>

            {!isPreviewMode ? (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 p-6 rounded-xl border border-slate-200">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Session Type</label>
                            <select name="sessionType" value={formData.sessionType} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-slate-400 outline-none text-sm text-slate-700">
                                <option value="Regular">Regular Session</option>
                                <option value="Special">Special Session</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Session No. (Title)</label>
                            <input name="sessionNumber" value={formData.sessionNumber} onChange={handleChange} placeholder="e.g. 1st Regular" className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-slate-400 outline-none text-sm text-slate-700" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Session Date</label>
                            <input type="date" name="sessionDate" value={formData.sessionDate} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-slate-400 outline-none text-sm text-slate-700" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Legislative Term</label>
                            <select name="term" value={formData.term} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-slate-400 outline-none text-sm text-slate-700">
                                <option value="">-- Select Term --</option>
                                {terms.map(t => <option key={t.id} value={`${t.yearFrom}-${t.yearTo}`}>{`${t.yearFrom.split('-')[0]}-${t.yearTo.split('-')[0]}`}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white p-6 rounded-xl border border-slate-200 flex flex-col justify-between">
                            <div>
                                <h3 className="text-sm font-bold uppercase text-slate-800 mb-4 flex items-center gap-2">
                                    <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/></svg>
                                    AI Journaling & Audio Tools
                                </h3>

                                <div className="flex flex-wrap gap-2 mb-6">
                                    <button type="button" onClick={() => setShowLiveModal(true)} className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg text-[10px] font-bold uppercase flex items-center gap-2 hover:bg-slate-200 transition-all border border-slate-300">
                                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div> Live Capture
                                    </button>
                                    <label className="cursor-pointer bg-slate-100 text-slate-700 px-4 py-2 rounded-lg text-[10px] font-bold uppercase flex items-center gap-2 hover:bg-slate-200 transition-all border border-slate-300">
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg> Load Audio <input type="file" accept="audio/*" onChange={handleAudioUpload} className="hidden" />
                                    </label>
                                </div>
                            </div>

                            {audioUrl || formData.minutesContent ? (
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                    <p className="text-[10px] font-bold uppercase text-slate-400 mb-2">Documentation Actions</p>
                                    {audioUrl && <audio controls src={audioUrl} className="w-full h-8 mb-4" />}
                                    <div className="flex flex-wrap gap-2">
                                        {audioUrl && (
                                            <>
                                                <button 
                                                    type="button" 
                                                    onClick={() => handleTranscribeAudio(false)} 
                                                    disabled={isTranscribing} 
                                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-[10px] font-bold uppercase flex items-center gap-2 hover:bg-blue-700 disabled:opacity-50"
                                                >
                                                    {isTranscribing ? <Spinner /> : <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"/></svg>}
                                                    {isTranscribing ? 'Processing...' : 'Run AI Transcription'}
                                                </button>
                                                <button 
                                                    type="button" 
                                                    onClick={() => handleTranscribeAudio(true)} 
                                                    disabled={isTranscribing} 
                                                    className="bg-indigo-700 text-white px-4 py-2 rounded-lg text-[10px] font-bold uppercase flex items-center gap-2 hover:bg-indigo-800 disabled:opacity-50"
                                                >
                                                    {isTranscribing ? <Spinner /> : <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
                                                    {isTranscribing ? 'Processing...' : 'AI Transcription Summarized'}
                                                </button>
                                            </>
                                        )}
                                        {formData.minutesContent && (
                                            <button 
                                                type="button" 
                                                onClick={handleSummarizeTranscription} 
                                                disabled={isSummarizing} 
                                                className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-[10px] font-bold uppercase flex items-center gap-2 hover:bg-emerald-700 disabled:opacity-50"
                                            >
                                                {isSummarizing ? <Spinner /> : <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
                                                {isSummarizing ? 'Summarizing...' : 'Summarize Text'}
                                            </button>
                                        )}
                                        {audioUrl && (
                                            <button onClick={() => {setAudioFile(null); setAudioUrl(null);}} className="text-slate-400 hover:text-red-500 p-1 ml-auto">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="py-8 text-center border border-dashed border-slate-300 rounded-xl bg-slate-50">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase italic">No source data for AI tools</p>
                                </div>
                            )}
                        </div>

                        <div className="bg-white p-6 rounded-xl border border-slate-200 flex flex-col justify-between">
                            <div>
                                <h3 className="text-sm font-bold uppercase text-slate-800 mb-4 flex items-center gap-2">
                                    <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                                    Final Journal Attachment
                                </h3>

                                {formData.filePath && !finalDocFile && (
                                    <div className="mb-4 flex items-center gap-3 bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                                        <div className="bg-emerald-500 p-1.5 rounded text-white"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg></div>
                                        <div className="flex-grow min-w-0">
                                            <p className="text-[9px] font-black uppercase text-emerald-700 leading-none">Validated Record</p>
                                            <a href={formData.filePath} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-slate-700 underline truncate block">Attached_Journal_Signed.pdf</a>
                                        </div>
                                    </div>
                                )}

                                <label className="block group">
                                    <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:border-emerald-400 bg-slate-50 rounded-xl p-6 cursor-pointer transition-all">
                                        <svg className="w-8 h-8 text-slate-300 group-hover:text-emerald-500 mb-2 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>
                                        <span className="text-[10px] font-bold uppercase text-slate-400 text-center tracking-wider">Browse Scanned Journal (PDF/Doc)</span>
                                        <input type="file" accept=".pdf,.doc,.docx" onChange={handleFinalDocUpload} className="hidden" />
                                    </div>
                                </label>
                            </div>
                            
                            {finalDocFile && (
                                <div className="mt-3 flex items-center justify-between bg-slate-800 p-2 rounded-lg text-white">
                                    <p className="text-[10px] truncate pr-4 italic">{finalDocFile.name}</p>
                                    <button onClick={() => setFinalDocFile(null)} className="text-slate-400 hover:text-white"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg></button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-4 bg-slate-100 p-3 rounded-t-xl border-x border-t border-slate-200">
                             <div className="flex items-center gap-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Style:</label>
                                <select 
                                    value={fontFamily} 
                                    onChange={(e) => setFontFamily(e.target.value)}
                                    className="text-xs border border-slate-300 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-slate-400"
                                >
                                    {FONT_FAMILIES.map(f => <option key={f.value} value={f.value}>{f.name}</option>)}
                                </select>
                             </div>
                             <div className="flex items-center gap-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Size:</label>
                                <select 
                                    value={fontSize} 
                                    onChange={(e) => setFontSize(e.target.value)}
                                    className="text-xs border border-slate-300 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-slate-400"
                                >
                                    {FONT_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                             </div>
                             {aiStatus && <div className="ml-auto text-[10px] font-mono text-blue-600 animate-pulse">&gt;&gt; {aiStatus}</div>}
                        </div>
                        <div className="relative">
                            <textarea 
                                name="minutesContent" 
                                value={formData.minutesContent} 
                                onChange={handleChange} 
                                placeholder="Session proceedings begin here..."
                                style={{ fontFamily, fontSize }}
                                className="w-full min-h-[500px] p-10 border border-slate-200 rounded-b-xl bg-white shadow-inner focus:ring-0 outline-none leading-relaxed text-slate-800 placeholder-slate-300 transition-all"
                            />
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-slate-100 p-8 rounded-xl flex flex-col gap-10 items-center max-h-[850px] overflow-y-auto border border-slate-200 shadow-inner">
                    {pagedContent.map((pageLines, idx) => (
                        <div key={idx} className="bg-white w-[210mm] min-h-[297mm] shadow-lg p-[25mm] relative flex flex-col border border-slate-300">
                            <div className="flex items-center gap-6 mb-8 border-b-2 border-slate-900 pb-6">
                                <img 
                                    src="./maasim-logo.png" 
                                    alt="Seal" 
                                    className="w-20 h-20"
                                />
                                <div className="text-left">
                                    <h4 className="font-bold text-sm uppercase text-slate-900 leading-tight">Municipality of Maasim</h4>
                                    <h4 className="font-extrabold text-lg uppercase text-slate-800 leading-tight">Office of the Sangguniang Bayan</h4>
                                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mt-1">Province of Sarangani</p>
                                </div>
                            </div>

                            {idx > 0 && <p className="text-[10px] italic font-bold text-slate-500 mb-6 border-l-4 border-slate-300 pl-3">Continuation: {formData.sessionType} Session No: {formData.sessionNumber}</p>}
                            
                            <div className="flex-grow text-justify" style={{ fontFamily, fontSize }}>
                                {pageLines.map((line, lIdx) => (
                                    <p key={lIdx} className="mb-4">{line || '\u00A0'}</p>
                                ))}
                            </div>
                            
                            <div className="mt-10 flex justify-between items-end text-[9px] text-slate-400 uppercase font-bold tracking-widest border-t border-slate-100 pt-6">
                                <div>
                                    <p>Legislative Archives - LGU Maasim</p>
                                    <p className="text-[7px] mt-0.5 opacity-50">Authorized Official Transcript</p>
                                </div>
                                <div className="bg-slate-50 px-3 py-1 rounded text-slate-500">Page {idx + 1} of {pagedContent.length}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8 pt-8 border-t border-slate-100">
                <div className="flex gap-2 w-full sm:w-auto">
                    <button type="button" onClick={() => handlePdfExport(false)} className="flex-grow px-6 py-2.5 bg-white text-slate-700 font-bold text-xs uppercase rounded-lg border border-slate-300 hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                        PDF Report
                    </button>
                    <button type="button" onClick={() => handlePdfExport(true)} className="flex-grow px-6 py-2.5 bg-slate-800 text-white font-bold text-xs uppercase rounded-lg shadow hover:bg-slate-900 transition-all flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 002 2v4a2 2 0 00-2 2v4h10z" /></svg>
                        Print
                    </button>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <button type="button" onClick={onCancel} className="flex-grow px-8 py-2.5 bg-slate-100 text-slate-500 font-bold text-xs uppercase rounded-lg hover:bg-slate-200 transition-all border border-slate-200">Cancel</button>
                    <button type="button" onClick={handleSave} className="flex-grow px-10 py-2.5 bg-blue-600 text-white font-bold text-xs uppercase rounded-lg shadow-lg hover:bg-blue-700 transition-all">Save Record</button>
                </div>
            </div>
        </div>
    );
};

export default TranscribedMinutesForm;