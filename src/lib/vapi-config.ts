// Vapi configuration
export const VAPI_PUBLIC_KEY = '949529bb-5709-4874-9003-dcf4a9558811';
// NOTE: You need to replace this with your actual Vapi PRIVATE key for API calls
// The public key above is only for client-side Web SDK calls
export const VAPI_API_KEY = '99d6be07-ad21-4c67-bb1a-1a7b7f0727b1'; // Replace with your actual private key
export const VAPI_ASSISTANT_ID = 'cf4c0666-166e-46b0-9e88-e50663afec26';
export const VAPI_TOOL_ID = '299742b8-5d6c-4b57-bbe7-7f14345fcc8e';

// Vapi API endpoints
export const VAPI_API_BASE_URL = 'https://api.vapi.ai';

export const getVapiConfig = (currentTime: string) => ({
  variableValues: {
    now: currentTime
  },
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
  silenceTimeoutMs: 5000, // Wait 5 seconds of silence before ending
  endCallOnSilence: false, // Don't end call on silence
  interruptible: true, // Allow interrupting the assistant
  firstMessage: "Good afternoon, you've reached Envisage Infotech. I'm the HR here. How may I assist you today?",
  endCallMessage: "Thank you for contacting Envisage Infotech HR. Have a great day.",
  voicemailMessage: "Please call back when you're available."
});
