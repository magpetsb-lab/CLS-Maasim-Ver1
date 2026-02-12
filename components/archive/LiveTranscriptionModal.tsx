
import React, { useState, useEffect, useRef } from 'react';
import { connectToLiveTranscription } from '../../services/geminiService';
import { LiveServerMessage } from '@google/genai';

interface LiveTranscriptionModalProps {
  onClose: () => void;
  onFinish: (transcript: string) => void;
}

const LiveTranscriptionModal: React.FC<LiveTranscriptionModalProps> = ({ onClose, onFinish }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Auto-start microphone on mount
  useEffect(() => {
    startLiveSession();
    return () => stopLiveSession();
  }, []);

  const startLiveSession = async () => {
    try {
      setError(null);
      // Trigger native permission prompt immediately
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextRef.current = audioContext;

      const sessionPromise = connectToLiveTranscription({
        onopen: () => {
          setIsRecording(true);
          const source = audioContext.createMediaStreamSource(stream);
          const scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1);
          
          scriptProcessor.onaudioprocess = (e) => {
            const inputData = e.inputBuffer.getChannelData(0);
            const l = inputData.length;
            const int16 = new Int16Array(l);
            for (let i = 0; i < l; i++) {
              int16[i] = inputData[i] * 32768;
            }
            
            const encode = (bytes: Uint8Array) => {
              let binary = '';
              for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
              return btoa(binary);
            };

            const pcmBlob = {
              data: encode(new Uint8Array(int16.buffer)),
              mimeType: 'audio/pcm;rate=16000',
            };

            sessionPromise.then((session) => {
              session.sendRealtimeInput({ media: pcmBlob });
            });
          };

          source.connect(scriptProcessor);
          scriptProcessor.connect(audioContext.destination);
        },
        onmessage: (message: LiveServerMessage) => {
          if (message.serverContent?.inputTranscription) {
            setTranscript(prev => prev + ' ' + message.serverContent?.inputTranscription?.text);
          }
        },
        onerror: (e: any) => {
          console.error("Live AI Error:", e);
          setError("Connection to AI lost. Ensure Internet is stable.");
        },
        onclose: () => setIsRecording(false)
      });

      sessionRef.current = await sessionPromise;
    } catch (err: any) {
      setError("Microphone Access Required: " + (err.message || "Unknown error."));
    }
  };

  const stopLiveSession = () => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setIsRecording(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh] border border-white/10">
        <div className="bg-brand-primary p-8 text-white flex justify-between items-center border-b border-white/10">
          <div className="flex items-center gap-4">
            <div className={`w-4 h-4 rounded-full ${isRecording ? 'bg-rose-500 animate-pulse ring-4 ring-rose-500/20' : 'bg-slate-400'}`}></div>
            <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-300 leading-none mb-1">Status: {isRecording ? 'Capturing Session' : 'Ready'}</p>
                <h3 className="text-xl font-black uppercase tracking-tighter italic leading-none">Live AI Journaling</h3>
            </div>
          </div>
          <button onClick={onClose} className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-8 flex-grow overflow-y-auto bg-slate-50 font-serif leading-relaxed text-lg">
          {error ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-10">
              <div className="bg-rose-100 p-4 rounded-full mb-4"><svg className="h-10 w-10 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg></div>
              <p className="text-rose-700 font-bold uppercase text-xs tracking-widest">{error}</p>
              <button onClick={startLiveSession} className="mt-4 bg-brand-primary text-white px-6 py-2 rounded-xl text-xs font-black uppercase">Retry Connection</button>
            </div>
          ) : (
            <div className="space-y-6">
              {!transcript && isRecording && (
                <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                    <div className="w-16 h-1 w-16 bg-brand-secondary rounded-full mb-4"></div>
                    <p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.2em]">Listening to Session Audio...</p>
                </div>
              )}
              {transcript && (
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative">
                  <div className="absolute -top-3 left-6 bg-brand-secondary text-white px-3 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest">Real-time Feed</div>
                  <p className="text-slate-800 whitespace-pre-wrap">{transcript}</p>
                  {isRecording && <span className="inline-block w-2 h-5 bg-brand-secondary animate-pulse ml-2 -mb-1"></span>}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-8 bg-white border-t border-slate-100 flex justify-between gap-4">
          <button onClick={onClose} className="px-6 py-4 bg-slate-100 text-slate-500 font-black text-xs uppercase rounded-2xl hover:bg-slate-200 transition-all">Cancel</button>
          <div className="flex gap-3">
            {isRecording ? (
              <button onClick={stopLiveSession} className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase shadow-lg hover:bg-black transition-all active:scale-95 flex items-center gap-2">
                <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse"></span> Stop Capture
              </button>
            ) : (
              transcript && (
                <button onClick={() => onFinish(transcript)} className="bg-emerald-500 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase shadow-lg hover:bg-emerald-600 transition-all active:scale-95">
                  Append to Journal
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveTranscriptionModal;
