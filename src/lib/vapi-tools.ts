// Vapi webhook tools configuration for n8n calendar flow

// IMPORTANT: Set this to your n8n deployment base URL
// Example (self-hosted): https://your-n8n-domain.com/webhook
// Example (n8n Cloud): https://<your-subdomain>.n8n.cloud/webhook
export const N8N_WEBHOOK_BASE_URL =
  "https://envsarvaiyasunil.app.n8n.cloud/webhook";

// Webhook paths from the provided n8n flow
const CALENDAR_AVAILABILITY_PATH = "982fc29b-e89a-484d-b9e8-fa69ef336dc4";
const CALENDAR_SET_APPOINTMENT_PATH = "2469bb34-9b73-4e74-a3f7-10d2e6ef850c";

export const CALENDAR_AVAILABILITY_TOOL = {
  type: "webhook",
  name: "calendar_availability",
  description:
    "Check if a given ISO 8601 datetime is available on the HR interview calendar.",
  inputSchema: {
    type: "object",
    properties: {
      date: {
        type: "string",
        description:
          "Preferred interview start datetime in ISO 8601 (e.g., 2025-09-15T15:00:00Z).",
        format: "date-time",
      },
    },
    required: ["date"],
  },
  url: `${N8N_WEBHOOK_BASE_URL}/${CALENDAR_AVAILABILITY_PATH}`,
  method: "POST",
} as const;

export const CALENDAR_SET_APPOINTMENT_TOOL = {
  type: "webhook",
  name: "calendar_set_appointment",
  description:
    "Create a 1-hour interview event in Google Calendar with candidate details.",
  inputSchema: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "Full name of the candidate.",
      },
      Phone: {
        type: "string",
        description: "Candidate mobile number with country code if possible.",
      },
      date: {
        type: "string",
        description:
          "Interview start datetime in ISO 8601 (e.g., 2025-09-15T15:00:00Z).",
        format: "date-time",
      },
    },
    required: ["name", "Phone", "date"],
  },
  url: `${N8N_WEBHOOK_BASE_URL}/${CALENDAR_SET_APPOINTMENT_PATH}`,
  method: "POST",
} as const;

export const VAPI_TOOLS = [
  CALENDAR_AVAILABILITY_TOOL,
  CALENDAR_SET_APPOINTMENT_TOOL,
] as const;
