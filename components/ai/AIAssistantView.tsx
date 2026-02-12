
import React, { useState, useRef, useEffect } from 'react';
import { getAIAssistantResponse } from '../../services/geminiService';
import { DraftForCreation } from '../../App';
import ChatMessage from './ChatMessage';
import Spinner from '../Spinner';

interface AIAssistantViewProps {
  onStartDraft: (draft: DraftForCreation) => void;
}

interface Message {
  id: number;
  sender: 'user' | 'ai';
  text: string;
  draftData?: DraftForCreation;
}

const suggestionChips = [
    "Draft a Resolution",
    "Draft an Ordinance",
    "Summarize Text",
    "Check Grammar"
];

const AIAssistantView: React.FC<AIAssistantViewProps> = ({ onStartDraft }) => {
    const [messages, setMessages] = useState<Message[]>([
        { id: 1, sender: 'ai', text: 'Welcome to the AI Legislative Assistant. How can I help you today? You can ask me to draft documents, summarize text, or check grammar.' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSendMessage = async (prompt?: string) => {
        const userMessage = prompt || input;
        if (!userMessage.trim()) return;

        const newUserMessage: Message = { id: Date.now(), sender: 'user', text: userMessage };
        setMessages(prev => [...prev, newUserMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const aiResponseText = await getAIAssistantResponse(userMessage);
            let draftData: DraftForCreation | undefined;

            // Attempt to parse JSON for drafts
            try {
                const json = JSON.parse(aiResponseText);
                if (json.resolutionTitle) {
                    draftData = { type: 'resolution', data: json };
                } else if (json.ordinanceTitle) {
                    draftData = { type: 'ordinance', data: json };
                }
            } catch (e) {
                // Not a JSON response, treat as plain text
            }

            const newAiMessage: Message = { id: Date.now() + 1, sender: 'ai', text: aiResponseText, draftData };
            setMessages(prev => [...prev, newAiMessage]);
        } catch (error) {
            const errorMessage: Message = { id: Date.now() + 1, sender: 'ai', text: 'Sorry, I encountered an error. Please try again.' };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSuggestionClick = (suggestion: string) => {
        if (suggestion.startsWith('Draft')) {
            setInput(`${suggestion} about `);
        } else if (suggestion.startsWith('Summarize')) {
            setInput(`${suggestion}: `);
        } else if (suggestion.startsWith('Check')) {
            setInput(`${suggestion} for this text: `);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md flex flex-col h-[75vh]">
            <h2 className="text-2xl font-bold text-brand-primary mb-4 border-b pb-4">AI Legislative Assistant</h2>
            
            <div className="flex-grow overflow-y-auto space-y-4 p-4 bg-slate-50/50 rounded-lg">
                {messages.map(msg => (
                    <ChatMessage key={msg.id} message={msg} onStartDraft={onStartDraft} />
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-slate-200 p-3 rounded-lg flex items-center gap-2">
                           <Spinner/>
                           <span className="text-sm text-slate-600">Assistant is thinking...</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="mt-4 pt-4 border-t">
                 <div className="flex flex-wrap gap-2 mb-3">
                    {suggestionChips.map(chip => (
                        <button 
                            key={chip} 
                            onClick={() => handleSuggestionClick(chip)}
                            className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-semibold hover:bg-slate-200 transition-colors"
                        >
                            {chip}
                        </button>
                    ))}
                </div>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
                        placeholder="Ask the assistant to draft a resolution, summarize text, etc."
                        className="flex-grow w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-secondary"
                        disabled={isLoading}
                    />
                    <button
                        onClick={() => handleSendMessage()}
                        disabled={isLoading || !input.trim()}
                        className="bg-brand-secondary text-white font-bold px-6 py-3 rounded-lg hover:bg-brand-primary transition-colors disabled:bg-slate-300"
                    >
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AIAssistantView;
