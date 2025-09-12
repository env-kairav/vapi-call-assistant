import { useState, useEffect, useRef, useCallback } from 'react';
import Vapi from '@vapi-ai/web';
import { VAPI_PUBLIC_KEY, VAPI_ASSISTANT_ID, getVapiConfig } from '@/lib/vapi-config';
import { setupSpeechRecognition } from '@/lib/speech-recognition';

interface Message {
  time: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
}

interface UseVapiReturn {
  // State
  connected: boolean;
  assistantIsSpeaking: boolean;
  volumeLevel: number;
  isMuted: boolean;
  messages: Message[];
  userSpeaking: boolean;
  currentSpeech: string;
  isListening: boolean;
  microphoneStatus: 'inactive' | 'listening' | 'speaking';
  
  // Actions
  startCall: () => Promise<void>;
  stopCall: () => void;
  toggleMute: () => void;
  sendMessage: (message: string) => void;
  addMessage: (type: 'user' | 'assistant' | 'system', content: string) => void;
}

export const useVapi = (): UseVapiReturn => {
  const [vapi] = useState(() => new Vapi(VAPI_PUBLIC_KEY));
  const [connected, setConnected] = useState(false);
  const [assistantIsSpeaking, setAssistantIsSpeaking] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userSpeaking, setUserSpeaking] = useState(false);
  const [currentSpeech, setCurrentSpeech] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [microphoneStatus, setMicrophoneStatus] = useState<'inactive' | 'listening' | 'speaking'>('inactive');
  
  const recognitionRef = useRef<any>(null);

  const addMessage = useCallback((type: 'user' | 'assistant' | 'system', content: string) => {
    setMessages(prev => [...prev, {
      time: new Date().toLocaleTimeString(),
      type,
      content
    }]);
  }, []);

  // Initialize speech recognition
  useEffect(() => {
    recognitionRef.current = setupSpeechRecognition({
      onStart: () => {
        console.log('🎤 Voice recognition started');
        setMicrophoneStatus('listening');
        setIsListening(true);
      },
      onEnd: () => {
        console.log('🎤 Voice recognition ended');
        setIsListening(false);
        setMicrophoneStatus('inactive');
        if (connected) {
          setTimeout(() => {
            recognitionRef.current?.start();
          }, 100);
        }
      },
      onResult: (transcript, isFinal) => {
        console.log('🗣️ Recognition result:', transcript, 'Final:', isFinal);
        setMicrophoneStatus('speaking');
        setUserSpeaking(true);
        setCurrentSpeech(transcript);
        
        if (isFinal) {
          vapi.send({
            type: 'add-message',
            message: {
              role: 'user',
              content: transcript
            }
          });
          console.log('✉️ Sent to assistant:', transcript);
          setMicrophoneStatus('listening');
          setUserSpeaking(false);
          setCurrentSpeech('');
        }
      },
      onError: (error) => {
        if (error === 'no-speech') {
          console.log('🎤 No speech detected, continuing to listen...');
          setMicrophoneStatus('listening');
          return;
        }
        
        console.error('🔇 Recognition error:', error);
        setMicrophoneStatus('inactive');
        
        if (connected) {
          setTimeout(() => {
            recognitionRef.current?.start();
          }, 1000);
        }
      }
    });

    return () => {
      recognitionRef.current?.stop();
    };
  }, [connected, vapi]);

  // Set up Vapi event listeners
  useEffect(() => {
    vapi.on('call-start', () => {
      console.log('📞 Call started');
      setConnected(true);
      addMessage('system', 'Call connected successfully!');
      // Start voice recognition
      setTimeout(() => {
        recognitionRef.current?.start();
      }, 1000);
    });

    vapi.on('call-end', () => {
      console.log('📞 Call ended');
      setConnected(false);
      setAssistantIsSpeaking(false);
      setVolumeLevel(0);
      setUserSpeaking(false);
      setCurrentSpeech('');
      recognitionRef.current?.stop();
      addMessage('system', 'Call ended');
    });

    vapi.on('speech-start', () => {
      console.log('🤖 Assistant started speaking');
      setAssistantIsSpeaking(true);
      // Temporarily stop recognition while assistant is speaking
      recognitionRef.current?.stop();
    });

    vapi.on('speech-end', () => {
      console.log('🤖 Assistant finished speaking');
      setAssistantIsSpeaking(false);
      // Resume recognition after assistant finishes speaking
      if (connected) {
        setTimeout(() => {
          recognitionRef.current?.start();
        }, 500);
      }
    });

    vapi.on('volume-level', (volume) => {
      setVolumeLevel(volume);
    });

    vapi.on('message', (message) => {
      console.log('📨 Message received:', message);
      
      if (message.type === 'transcript') {
        if (message.role === 'user') {
          console.log('🎤 User:', message.transcript);
          if (message.transcriptType === 'final') {
            addMessage('user', message.transcript);
          }
        } else if (message.role === 'assistant') {
          console.log('🤖 Assistant:', message.transcript);
          if (message.transcriptType === 'final') {
            addMessage('assistant', message.transcript);
          }
        }
      } else if (message.type === 'error') {
        console.error('❌ Error:', message);
        addMessage('system', `Error: ${message.error?.message || 'Unknown error'}`);
      }
    });

    vapi.on('error', (error) => {
      console.error('❌ Vapi error:', error);
      addMessage('system', `Vapi Error: ${error.message || 'Unknown error'}`);
    });

    return () => {
      recognitionRef.current?.stop();
      vapi.stop();
    };
  }, [vapi, addMessage]);

  const startCall = useCallback(async () => {
    try {
      console.log('Starting call initialization...');
      addMessage('system', 'Starting call...');
      
      // Request microphone access with specific settings
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
          sampleRate: 48000
        }
      });

      console.log('🎤 Microphone access granted');
      addMessage('system', 'Microphone connected successfully');

      // Get current time for the config
      const currentTime = new Date().toLocaleString();

      // Start the call with configuration
      await vapi.start(VAPI_ASSISTANT_ID, {
        firstMessage: "Good afternoon, you've reached Envisage Infotech HR. How may I assist you today?",
        voice: {
          provider: "11labs",
          voiceId: "21m00Tcm4TlvDq8ikWAM" // Rachel voice - professional female
        },
        transcriber: {
          provider: "deepgram",
          model: "nova-2",
          language: "en",
          smartFormat: true
        },
        model: {
          provider: "openai",
          model: "gpt-4",
          temperature: 0.7,
          messages: [
            {
              role: "system",
              content: `Current date and time: ${currentTime}

[CRITICAL INSTRUCTION]
YOU MUST ASK ONLY ONE QUESTION AT A TIME AND WAIT FOR THE RESPONSE.

[Identity & Purpose]
You are the HR representative for Envisage Infotech. Your role is to answer employee and candidate questions clearly and politely about:
- Job openings
- Recruitment process
- Company policies
- Employee benefits
- HR-related notices

[Knowledge Base]
- Services: Recruitment, onboarding, employee relations, payroll assistance, policy guidance
- Hours: Mon–Fri 10:30 AM – 7:30 PM
- Contact Number: 1231231231 (share only if asked)
- Job Application: Accepts online and in-person applications
- Remote Work Policy: No remote or work-from-home options available
- Office Location: Dev Aurum Commercial Complex, A-609, Prahlad Nagar, Ahmedabad, Gujarat 380015

[Company Summary]
Envisage Infotech, founded in 2020, is a fast-growing web and mobile development company. Technologies include Angular, React, Node.js, Next.js, Vue.js, .NET, iOS, and Ionic. They deliver scalable, high-performance solutions to clients worldwide across industries like entertainment, education, finance, healthcare, retail, and logistics.

[Current Hiring Needs]
- 2 Angular developers (2+ years experience)
- 2 React developers (2+ years experience)
- 3 Node.js developers (3+ years experience)
- 2 .NET developers (3+ years experience)
- 1 Next.js developer (2+ years experience)
- 1 Vue.js developer (2+ years experience)
- 1 iOS developer (3+ years experience)
- 1 Ionic developer (2+ years experience)

[Interview Scheduling Process]
IMPORTANT: Ask only ONE question at a time and wait for the response.

1. First ask ONLY: "Can I have your full name, please?"
   Wait for response.
   Then confirm: "Thank you, [Name]. "

2. Then ask ONLY: "Can I get your mobile number?"
   Wait for response.
   Then confirm: "I have your number as [number]. "

3. Then ask ONLY: "What date would you prefer for your interview?"
   Wait for response.
   Then confirm: "Alright, [date]. "

4. Then ask ONLY: "And what time works best for you?"
   Wait for response.
   Then confirm: "Got it, [time]. "

5. Then ask ONLY: "Which role are you applying for?"
   Wait for response.
   Then confirm: "I see, you're applying for [role]. "

6. Then ask ONLY: "How many years of experience do you have in this role?"
   Wait for response.
   Then confirm: "Thank you, [X] years of experience noted. "

7. Optional - ask ONLY: "Do you want to share any additional notes or information?"
   Wait for response.
   If provided, confirm: "I've noted: [notes]. "

After collecting all information, summarize:
"Just to confirm, here's what I have:
Name: [name]
Mobile: [number]
Date: [date]
Time: [time]
Role: [role]
Experience: [years]
Notes: [if any]
Is everything correct?"

[Response Guidelines]
- Ask only ONE question at a time
- Wait for the response before asking the next question
- Keep responses under 30 words
- Confirm each piece of information before moving on
- Use polite, professional language
- End with: "Thank you for contacting Envisage Infotech HR. Have a great day."

[IMPORTANT REMINDER]
- Never ask multiple questions at once
- Always wait for and confirm each response
- Process information one piece at a time
- If user provides multiple details, still confirm them one by one`
            }
          ]
        }
      });

      setConnected(true);
      addMessage('system', 'Call connected successfully!');

      // Start speech recognition
      setTimeout(() => {
        recognitionRef.current?.start();
      }, 1000);

    } catch (error: any) {
      console.error('Error starting call:', error);
      addMessage('system', `Failed to start call: ${error.message || error}`);
    }
  }, [vapi, addMessage]);

  const stopCall = useCallback(() => {
    console.log('🛑 Stopping call...');
    recognitionRef.current?.stop();
    vapi.stop();
  }, [vapi]);

  const toggleMute = useCallback(() => {
    const newMutedState = !isMuted;
    console.log(newMutedState ? '🔇 Muting microphone' : '🔊 Unmuting microphone');
    vapi.setMuted(newMutedState);
    setIsMuted(newMutedState);
    addMessage('system', newMutedState ? 'Microphone muted' : 'Microphone unmuted');
  }, [vapi, isMuted, addMessage]);

  const sendMessage = useCallback((message: string) => {
    if (!message.trim()) return;
    
    console.log('💬 Sending message:', message);
    vapi.send({
      type: 'add-message',
      message: {
        role: 'user',
        content: message
      }
    });

    addMessage('user', message);
  }, [vapi, addMessage]);

  return {
    // State
    connected,
    assistantIsSpeaking,
    volumeLevel,
    isMuted,
    messages,
    userSpeaking,
    currentSpeech,
    isListening,
    microphoneStatus,
    
    // Actions
    startCall,
    stopCall,
    toggleMute,
    sendMessage,
    addMessage
  };
};
