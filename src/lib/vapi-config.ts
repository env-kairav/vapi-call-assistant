// Vapi configuration
export const VAPI_PUBLIC_KEY = "2d3d2169-6263-4e43-85ec-c58af328590e";
// NOTE: You need to replace this with your actual Vapi PRIVATE key for API calls
// The public key above is only for client-side Web SDK calls
export const VAPI_API_KEY = "75a3adf4-7e9d-47aa-892a-20fa23dae5e5"; // Replace with your actual private key
export const VAPI_ASSISTANT_ID = "2e724a2f-84d8-4042-a5be-7ec705403e67";

// Vapi API endpoints
export const VAPI_API_BASE_URL = "https://api.vapi.ai";

export const getVapiConfig = (currentTime: string) => ({
  variableValues: {
    now: currentTime,
  },
  voice: {
    provider: "11labs",
    voiceId: "21m00Tcm4TlvDq8ikWAM", // Rachel voice - professional female
  },
  transcriber: {
    provider: "deepgram",
    model: "nova-2",
    language: "en",
    smartFormat: true,
  },
  // Remove problematic settings that cause immediate call ending
  // silenceTimeoutMs: 5000, // This was causing calls to end
  // endCallOnSilence: false, // This was causing issues
  interruptible: true, // Allow interrupting the assistant
  firstMessage:
    "Yoo you reached here congs brotherss You've reached Envisage Infotech HR. How may I assist you today?",
  // Remove endCallMessage to prevent immediate ending
});
