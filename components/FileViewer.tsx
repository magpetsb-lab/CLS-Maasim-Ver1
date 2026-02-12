
import React from 'react';

interface FileViewerProps {
  filePath: string;
  fileName: string;
  onClose: () => void;
}

const FileViewer: React.FC<FileViewerProps> = ({ filePath, fileName, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="file-viewer-title">
      <div className="bg-white rounded-lg shadow-2xl w-full h-full max-w-6xl flex flex-col">
        <header className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50 rounded-t-lg">
          <h2 id="file-viewer-title" className="text-lg font-semibold text-brand-dark truncate pr-4" title={fileName}>
            {fileName}
          </h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="p-2 rounded-full text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors"
              aria-label="Close viewer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </header>
        <div className="flex-grow">
          <iframe
            src={filePath}
            title={fileName}
            className="w-full h-full border-0"
          />
        </div>
      </div>
    </div>
  );
};

export default FileViewer;
