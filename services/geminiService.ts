
import { GoogleGenAI, Modality } from "@google/genai";
import { AnalysisType } from "../types";

const sanitizeMimeType = (mimeType: string): string => {
    if (mimeType.includes('audio/x-m4a') || mimeType.includes('audio/m4a')) return 'audio/mp4';
    if (mimeType.includes('audio/mpeg')) return 'audio/mpeg';
    if (mimeType.includes('audio/wav')) return 'audio/wav';
    if (mimeType.includes('audio/webm')) return 'audio/webm';
    if (mimeType.includes('audio/mp4')) return 'audio/mp4';
    return mimeType;
};

/**
 * Gets a conversational response from the AI assistant.
 */
export const getAIAssistantResponse = async (prompt: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: `You are an expert legislative assistant for the Sangguniang Bayan of Maasim, a local government unit in the Philippines. You are formal, precise, and helpful.
- When asked to draft a resolution or ordinance, you MUST respond with only a valid JSON object.
- The JSON object for a resolution should contain: resolutionTitle, resolutionNumber (use "XXXX-XX" as placeholder), author, committee, and sector.
- The JSON object for an ordinance should contain: ordinanceTitle, ordinanceNumber (use "XXXX-XX" as placeholder), author, committee, sector, and fullText.
- For all other requests, respond in well-formatted markdown.`,
      }
    });
    return response.text || "I am unable to provide a response at this time.";
  } catch (error) {
    console.error(`Error with AI Assistant:`, error);
    return 'An error occurred while contacting the AI. Please check your connection and API key.';
  }
};


/**
 * Analyzes legislative text using Gemini AI.
 */
export const analyzeText = async (text: string, type: AnalysisType): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    let prompt = '';
    
    switch (type) {
      case AnalysisType.Summary:
        prompt = `Summarize the following legislative text into a concise, formal Executive Summary Form. 
        Focus on:
        1. Main Subject of Discussion
        2. Key Motions Raised
        3. Final Decisions/Voting Results
        4. Tasks assigned to specific individuals.
        \n\n${text}`;
        break;
      case AnalysisType.Explanation:
        prompt = `Explain this legislative text in simple language using bullet points: \n\n${text}`;
        break;
      case AnalysisType.Impact:
        prompt = `Analyze the potential impacts (positive and negative) of this legislation: \n\n${text}`;
        break;
      case AnalysisType.GrammarCheck:
        prompt = `Check and fix the grammar and punctuation of this text. Return only the corrected version: \n\n${text}`;
        break;
      default:
        throw new Error('Invalid analysis type');
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "No response generated.";
  } catch (error) {
    console.error(`Error analyzing text:`, error);
    return 'An error occurred while analyzing the text.';
  }
};

/**
 * Transcribes audio from a base64 string with TIME-BASED logic.
 */
export const transcribeAudio = async (base64Audio: string, mimeType: string): Promise<string> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const sanitizedMime = sanitizeMimeType(mimeType);
        
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: [
                {
                    parts: [
                        {
                            inlineData: {
                                mimeType: sanitizedMime,
                                data: base64Audio
                            }
                        },
                        {
                            text: `You are a professional Legislative Reporter. Transcribe this audio recording of a legislative session into a formal, TIME-BASED Journal of Proceedings. 
                            
Format Requirements:
1. Every speaker change or new paragraph MUST start with a timestamp in brackets, e.g., [00:00:15], [00:01:30].
2. Identify speakers clearly (e.g., '[00:05:20] Hon. Chairperson: ...').
3. Structure the text with headings: 'CALL TO ORDER', 'ROLL CALL', 'BUSINESS OF THE DAY', 'ADJOURNMENT'.
4. Verify names and terms where possible. Maintain formal verbatim accuracy.`
                        }
                    ]
                }
            ]
        });

        return response.text || "Transcription failed: Empty response.";
    } catch (error: any) {
        console.error("Gemini Transcription Error:", error);
        return `An error occurred while transcribing: ${error.message || 'Unknown API Error'}`;
    }
};

/**
 * Transcribes audio and immediately summarizes it into a formal minute form.
 */
export const transcribeAudioSummarized = async (base64Audio: string, mimeType: string): Promise<string> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const sanitizedMime = sanitizeMimeType(mimeType);
        
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: [
                {
                    parts: [
                        {
                            inlineData: {
                                mimeType: sanitizedMime,
                                data: base64Audio
                            }
                        },
                        {
                            text: `You are a professional Legislative Clerk. Process this audio and produce a condensed SUMMARIZED JOURNAL FORM.
                            
Structure your response as follows:
- SUMMARY OF PROCEEDINGS: (General overview)
- KEY MOTIONS & PROPOSALS: (List who moved what)
- OFFICIAL DECISIONS: (Resolutions approved or tabled)
- MATTERS FOR NEXT SESSION: (Unfinished business)

Bypass all small talk and repetitive filler. Focus on official legislative actions.`
                        }
                    ]
                }
            ]
        });

        return response.text || "Transcription failed: Empty response.";
    } catch (error: any) {
        console.error("Gemini Summarized Transcription Error:", error);
        return `An error occurred while generating summarized journal: ${error.message || 'Unknown API Error'}`;
    }
};

/**
 * Connects to the Live API for real-time transcription.
 */
export const connectToLiveTranscription = (callbacks: any) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  return ai.live.connect({
    model: 'gemini-2.5-flash-native-audio-preview-12-2025',
    callbacks,
    config: {
      responseModalities: [Modality.AUDIO],
      systemInstruction: 'You are a professional legislative recorder. Transcribe the user audio into a highly accurate, formal text journal. CRITICAL: Provide approximate timestamps for every speaker turn.',
      inputAudioTranscription: {},
    },
  });
};
