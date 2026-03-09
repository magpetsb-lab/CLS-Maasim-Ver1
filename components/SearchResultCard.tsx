import React from 'react';
import type { Attachment } from '../types';

interface SearchResult {
    id: string;
    type: 'Resolution' | 'Ordinance';
    title: string;
    number: string;
    date: string;
    filePath?: string;
    attachments?: Attachment[];
}

interface SearchResultCardProps {
    result: SearchResult;
}

const SearchResultCard: React.FC<SearchResultCardProps> = ({ result }) => {
    const typeColor = result.type === 'Resolution' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800';

    const openFile = (fileData: string | undefined) => {
        if (!fileData) {
            alert("There is no file attached.");
            return;
        }

        // Browsers block opening data: URLs directly in a new tab.
        // We need to convert the base64 string to a Blob and open the Blob URL.
        if (fileData.startsWith('data:')) {
            try {
                const arr = fileData.split(',');
                const mimeMatch = arr[0].match(/:(.*?);/);
                const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
                const bstr = atob(arr[1]);
                let n = bstr.length;
                const u8arr = new Uint8Array(n);
                while (n--) {
                    u8arr[n] = bstr.charCodeAt(n);
                }
                const blob = new Blob([u8arr], { type: mime });
                const blobUrl = URL.createObjectURL(blob);
                window.open(blobUrl, '_blank');
            } catch (e) {
                console.error("Failed to open file", e);
                // Fallback to downloading the file
                const a = document.createElement('a');
                a.href = fileData;
                a.download = 'document';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            }
        } else {
            // If it's a regular URL or an active blob URL
            window.open(fileData, '_blank');
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow duration-300">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                <div className="flex-grow">
                    <div className="flex items-center flex-wrap gap-3 mb-1">
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${typeColor}`}>
                            {result.type}
                        </span>
                        <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-100 text-slate-800">
                           {result.type === 'Resolution' ? 'Res. No:' : 'Ord. No:'} {result.number}
                        </span>
                    </div>
                    <h3 className="text-sm font-bold text-brand-primary leading-tight">{result.title}</h3>
                </div>
                <div className="flex-shrink-0 mt-2 sm:mt-0 flex flex-col items-end gap-2">
                     <p className="text-xs text-slate-500 whitespace-nowrap mr-2">Approved: {result.date}</p>
                     
                     <div className="flex flex-col items-end gap-1">
                         {/* Legacy File Path */}
                         {result.filePath && !result.attachments?.length && (
                            <div className="flex gap-1">
                                <button
                                    onClick={() => openFile(result.filePath)}
                                    className="px-2 py-0.5 text-xs font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200 transition-colors inline-flex items-center"
                                    aria-label="View attached file"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                    </svg>
                                    View File
                                </button>
                                <button
                                    onClick={() => openFile(result.filePath)}
                                    className="px-2 py-0.5 text-xs font-medium text-brand-secondary bg-blue-100 rounded-md hover:bg-blue-200 transition-colors inline-flex items-center"
                                    aria-label="Print attached file (opens in new tab)"
                                    title="Print attached file (opens in new tab)"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M5 4v3h10V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm10 5H5a2 2 0 00-2 2v3a2 2 0 002 2h1v-2a1 1 0 011-1h6a1 1 0 011 1v2h1a2 2 0 002-2v-3a2 2 0 00-2-2zm-3 4H8v2h4v-2z" clipRule="evenodd" />
                                    </svg>
                                    Print File
                                </button>
                            </div>
                        )}

                        {/* Multiple Attachments */}
                        {result.attachments && result.attachments.length > 0 && (
                            <div className="flex flex-col gap-1 items-end">
                                {result.attachments.map((att, idx) => (
                                    <div key={att.id || idx} className="flex gap-1">
                                        <button
                                            onClick={() => openFile(att.data)}
                                            className="px-2 py-0.5 text-xs font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200 transition-colors inline-flex items-center max-w-[150px] truncate"
                                            title={att.name}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                            </svg>
                                            <span className="truncate">{att.name}</span>
                                        </button>
                                        <button
                                            onClick={() => openFile(att.data)}
                                            className="px-2 py-0.5 text-xs font-medium text-brand-secondary bg-blue-100 rounded-md hover:bg-blue-200 transition-colors inline-flex items-center"
                                            aria-label="Print attached file (opens in new tab)"
                                            title="Print attached file (opens in new tab)"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M5 4v3h10V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm10 5H5a2 2 0 00-2 2v3a2 2 0 002 2h1v-2a1 1 0 011-1h6a1 1 0 011 1v2h1a2 2 0 002-2v-3a2 2 0 00-2-2zm-3 4H8v2h4v-2z" clipRule="evenodd" />
                                            </svg>
                                            Print
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                     </div>
                </div>
            </div>
        </div>
    );
};

export default SearchResultCard;