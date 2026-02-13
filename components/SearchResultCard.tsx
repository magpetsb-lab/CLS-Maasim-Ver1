import React from 'react';

interface SearchResult {
    id: string;
    type: 'Resolution' | 'Ordinance';
    title: string;
    number: string;
    date: string;
    filePath?: string;
}

interface SearchResultCardProps {
    result: SearchResult;
}

const SearchResultCard: React.FC<SearchResultCardProps> = ({ result }) => {
    const typeColor = result.type === 'Resolution' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800';

    const handlePrint = () => {
        if (!result.filePath) {
            alert("There is no file attached to print.");
            return;
        }
        // The most reliable way to handle printing across all browsers and security settings
        // is to open the file in a new tab. The user can then use the browser's
        // native print functionality (Ctrl+P or Cmd+P). This avoids cross-origin errors.
        window.open(result.filePath, '_blank');
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                <div className="flex-grow">
                    <div className="flex items-center flex-wrap gap-4 mb-2">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${typeColor}`}>
                            {result.type}
                        </span>
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-800">
                           File Record No: {result.number}
                        </span>
                    </div>
                    <h3 className="text-lg font-bold text-brand-primary">{result.title}</h3>
                </div>
                <div className="flex-shrink-0 mt-2 sm:mt-0 flex items-center flex-wrap justify-end gap-2">
                     <p className="text-sm text-slate-500 whitespace-nowrap mr-2">Approved: {result.date}</p>
                     {result.filePath && (
                        <>
                            <a
                                href={result.filePath}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1 text-sm font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200 transition-colors inline-flex items-center"
                                aria-label="View attached file"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                </svg>
                                View File
                            </a>
                            <button
                                onClick={handlePrint}
                                className="px-3 py-1 text-sm font-medium text-brand-secondary bg-blue-100 rounded-md hover:bg-blue-200 transition-colors inline-flex items-center"
                                aria-label="Print attached file (opens in new tab)"
                                title="Print attached file (opens in new tab)"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M5 4v3h10V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm10 5H5a2 2 0 00-2 2v3a2 2 0 002 2h1v-2a1 1 0 011-1h6a1 1 0 011 1v2h1a2 2 0 002-2v-3a2 2 0 00-2-2zm-3 4H8v2h4v-2z" clipRule="evenodd" />
                                </svg>
                                Print File
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SearchResultCard;