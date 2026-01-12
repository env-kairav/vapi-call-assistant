# VAPI Call Assistant - Setup Guide

A comprehensive web application for managing AI-powered voice calls using VAPI.ai integration with n8n workflow automation. This guide will walk you through the complete setup process.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Twilio Phone Number Setup](#twilio-phone-number-setup)
3. [VAPI.ai Configuration](#vapiai-configuration)
4. [n8n Workflow Setup](#n8n-workflow-setup)
5. [Code Configuration](#code-configuration)
6. [Running the Application](#running-the-application)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, ensure you have:

- **Node.js** (version 16 or higher)
- **npm** or **yarn** package manager
- **VAPI.ai account** - Sign up at [https://vapi.ai](https://vapi.ai)
- **Twilio account** - Sign up at [https://www.twilio.com](https://www.twilio.com)
- **n8n account** (Cloud or self-hosted) - Sign up at [https://n8n.io](https://n8n.io)
- Modern web browser with microphone access

---

## Twilio Phone Number Setup

### Step 1: Purchase a Phone Number from Twilio

1. **Log in to Twilio Console**
   - Go to [https://console.twilio.com](https://console.twilio.com)
   - Navigate to **Phone Numbers** > **Buy a number**

2. **Select Your Number**
   - Choose your country/region
   - Select number capabilities (Voice, SMS if needed)
   - Purchase the number

3. **Note Your Credentials**
   - Go to **Account** > **API Keys & Tokens**
   - Save your **Account SID** and **Auth Token**
   - You'll need these for VAPI configuration

---

## VAPI.ai Configuration

### Step 1: Add Twilio Number to VAPI

1. **Log in to VAPI Dashboard**
   - Go to [https://dashboard.vapi.ai](https://dashboard.vapi.ai)
   - Navigate to **Phone Numbers** section

2. **Import Twilio Number**
   - Click **Add Phone Number** or **Import from Twilio**
   - Enter your Twilio credentials:
     - **Account SID**: Your Twilio Account SID
     - **Auth Token**: Your Twilio Auth Token
     - **Phone Number**: The E.164 format number (e.g., +1234567890)
   - Give it a name (e.g., "HR Interview Line")
   - Click **Save**

3. **Verify Number Status**
   - Ensure the number shows as **Active** in VAPI dashboard
   - Note the **Phone Number ID** for later use

### Step 2: Create an Assistant in VAPI

1. **Navigate to Assistants**
   - Go to **Assistants** section in VAPI dashboard
   - Click **Create Assistant** or **New Assistant**

2. **Configure Assistant Settings**

   **Basic Information:**
   - **Name**: Give your assistant a name (e.g., "HR Interview Assistant")
   - **Description**: Optional description

   **First Message:**
   - Set the greeting message, for example:
     ```
     Hi! You've reached Envisage Infotech HR. How may I assist you today?
     ```

   **System Prompt:**
   - Configure your system prompt based on your use case. Example:
     ```
     You are a professional HR assistant for Envisage Infotech. Your role is to:
     - Conduct initial candidate screening interviews
     - Collect candidate information (name, phone, email, role, experience)
     - Check calendar availability for interview scheduling
     - Schedule interviews using the calendar tools
     - Be friendly, professional, and efficient
     ```

3. **Save Assistant**
   - Click **Save** or **Create**
   - **Copy the Assistant ID** - You'll need this for code configuration

### Step 3: Get VAPI API Keys

1. **Navigate to API Keys**
   - Go to **Settings** > **API Keys** in VAPI dashboard

2. **Copy Your Keys**
   - **Public Key**: Used for client-side Web SDK calls
   - **Private Key**: Used for server-side API calls
   - **⚠️ Important**: Keep your private key secure and never expose it in client-side code

---

## n8n Workflow Setup

### Step 1: Create Your n8n Workflows

1. **Log in to n8n**
   - Go to your n8n instance (Cloud or self-hosted)
   - Create a new workflow

2. **Create Calendar Availability Workflow**

   **Workflow Name**: `calendar_availability`

   **Nodes Setup:**
   - **Webhook Node** (Trigger)
     - Method: `POST`
     - Path: `calendar_availability`
     - Authentication: None (or configure as needed)
   
   - **Google Calendar Node** (or your calendar provider)
     - Action: Check availability for a specific date
     - Configure your calendar credentials
   
   - **Respond to Webhook Node**
     - Return availability status (available/busy)

   **Save the workflow** and note the webhook URL:
   ```
   https://your-n8n-domain.com/webhook/calendar_availability
   ```

3. **Create Calendar Appointment Workflow**

   **Workflow Name**: `calendar_set_appointment`

   **Nodes Setup:**
   - **Webhook Node** (Trigger)
     - Method: `POST`
     - Path: `calendar_set_appointment`
     - Authentication: None (or configure as needed)
   
   - **Google Calendar Node** (or your calendar provider)
     - Action: Create event
     - Map incoming data (name, phone, date, time, role, experience, email, note)
     - Set event duration (e.g., 1 hour)
   
   - **Respond to Webhook Node**
     - Return success/error status

   **Save the workflow** and note the webhook URL:
   ```
   https://your-n8n-domain.com/webhook/calendar_set_appointment
   ```

4. **Activate Workflows**
   - Toggle the **Active** switch on both workflows
   - Ensure they are running and accessible

### Step 2: Get n8n Webhook URLs

1. **For each workflow:**
   - Click on the **Webhook** node
   - Copy the **Production URL** (or Test URL if in development)
   - Format: `https://your-subdomain.n8n.cloud/webhook/workflow-path`

2. **Note the Base URL:**
   - Extract the base URL: `https://your-subdomain.n8n.cloud/webhook`
   - You'll need this for code configuration

---

## Adding Tools to VAPI Assistant

### Step 1: Create Tools in VAPI Dashboard

1. **Navigate to Tools Section**
   - Go to your assistant in VAPI dashboard
   - Click on **Tools** tab
   - Click **Add Tool** or **Create Tool**

2. **Create Calendar Availability Tool**

   **Tool Configuration:**
   - **Type**: `webhook`
   - **Name**: `calendar_availability`
   - **URL**: Your n8n webhook URL
     ```
     https://your-subdomain.n8n.cloud/webhook/calendar_availability
     ```
   - **Method**: `POST`
   - **Headers**: Add if needed (authentication, etc.)

   **Input Schema:**
   ```json
   {
     "type": "object",
     "properties": {
       "date": {
         "type": "string",
         "description": "Preferred interview date in dd-mm-yyyy format (e.g., 15-09-2025).",
         "format": "date"
       }
     },
     "required": ["date"]
   }
   ```

   - Click **Save**

3. **Create Calendar Appointment Tool**

   **Tool Configuration:**
   - **Type**: `webhook`
   - **Name**: `calendar_set_appointment`
   - **URL**: Your n8n webhook URL
     ```
     https://your-subdomain.n8n.cloud/webhook/calendar_set_appointment
     ```
   - **Method**: `POST`
   - **Headers**: Add if needed

   **Input Schema:**
   ```json
   {
     "type": "object",
     "properties": {
       "name": {
         "type": "string",
         "description": "Full name of the candidate."
       },
       "phone": {
         "type": "string",
         "description": "Candidate mobile number with country code if possible."
       },
       "date": {
         "type": "string",
         "description": "Interview date in dd-mm-yyyy format (e.g., 15-09-2025).",
         "format": "date"
       },
       "time": {
         "type": "string",
         "description": "Interview time in 12-hour format (e.g., 3:15 PM)."
       },
       "role": {
         "type": "string",
         "description": "Role/position the candidate is applying for."
       },
       "experience": {
         "type": "string",
         "description": "Years of experience in the role."
       },
       "note": {
         "type": "string",
         "description": "Additional notes or information from the candidate."
       },
       "email": {
         "type": "string",
         "description": "Candidate's email address."
       }
     },
     "required": ["name", "phone", "date", "time", "role", "experience", "email"]
   }
   ```

   - Click **Save**

4. **Verify Tools are Added**
   - Ensure both tools appear in the assistant's tools list
   - Tools should show as **Active**

### Step 2: Link Tools to Assistant

1. **In Assistant Settings:**
   - Go back to your assistant's main settings
   - Scroll to **Tools** section
   - Ensure both tools are selected/enabled
   - Save the assistant

---

## Code Configuration

Now that you have everything set up in VAPI and n8n, you need to configure the codebase with your credentials.

### Step 1: Update VAPI Configuration

Open `src/lib/vapi-config.ts` and update the following:

```typescript
// Vapi configuration
export const VAPI_PUBLIC_KEY = "your-vapi-public-key-here";
// NOTE: You need to replace this with your actual Vapi PRIVATE key for API calls
// The public key above is only for client-side Web SDK calls
export const VAPI_API_KEY = "your-vapi-private-key-here"; // Replace with your actual private key
export const VAPI_ASSISTANT_ID = "your-assistant-id-here";
```

**Where to find these values:**
- **VAPI_PUBLIC_KEY**: VAPI Dashboard > Settings > API Keys > Public Key
- **VAPI_API_KEY**: VAPI Dashboard > Settings > API Keys > Private Key
- **VAPI_ASSISTANT_ID**: VAPI Dashboard > Assistants > Your Assistant > ID (copy from URL or assistant details)

### Step 2: Update n8n Configuration

Open `src/lib/vapi-tools.ts` and update the following:

```typescript
// IMPORTANT: Set this to your n8n deployment base URL
// Example (self-hosted): https://your-n8n-domain.com/webhook
// Example (n8n Cloud): https://<your-subdomain>.n8n.cloud/webhook
export const N8N_WEBHOOK_BASE_URL = "https://your-subdomain.n8n.cloud/webhook";
```

**Where to find this value:**
- From your n8n webhook node, copy the base URL (everything before the workflow path)
- Example: If your webhook URL is `https://envnewsunil.app.n8n.cloud/webhook/calendar_availability`
- Then base URL is: `https://envnewsunil.app.n8n.cloud/webhook`

### Step 3: Match Assistant Configuration in Code

Open `src/lib/vapi-config.ts` and ensure the `getVapiConfig` function matches your VAPI assistant settings:

```typescript
export const getVapiConfig = (currentTime: string) => ({
  variableValues: {
    now: currentTime,
  },
  voice: {
    provider: "11labs", // Must match your VAPI assistant
    voiceId: "21m00Tcm4TlvDq8ikWAM", // Must match your VAPI assistant
  },
  transcriber: {
    provider: "deepgram", // Must match your VAPI assistant
    model: "nova-2", // Must match your VAPI assistant
    language: "en",
    smartFormat: true,
  },
  interruptible: true, // Must match your VAPI assistant
  firstMessage: "Hi! You've reached Envisage Infotech HR. How may I assist you today?", // Must match your VAPI assistant
});
```

**Important**: These values must exactly match what you configured in your VAPI assistant dashboard. If you used different settings in VAPI, update this code accordingly.

### Step 4: Verify Tool Configuration

The tools are already configured in `src/lib/vapi-tools.ts`. They will automatically use your `N8N_WEBHOOK_BASE_URL`. The tool definitions should match what you created in VAPI:

- `calendar_availability` tool
- `calendar_set_appointment` tool

**Note**: Tools are configured in VAPI dashboard, not in code. The code definitions are for reference and local development.

---

## Running the Application

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Start Development Server

```bash
npm run dev
```

### Step 3: Test the Integration

1. **Test Assistant Settings**
   - Navigate to **Assistant** page
   - Verify your assistant ID, n8n URL, and configuration are displayed correctly

2. **Test Phone Number**
   - Navigate to **Phone Numbers** page
   - Verify your Twilio number appears in the list

3. **Test Call Functionality**
   - Use the live call interface to test voice interactions
   - Verify tools are being called correctly (check n8n workflow execution logs)

---

## Configuration Summary Checklist

Use this checklist to ensure everything is configured correctly:

### VAPI Configuration
- [ ] Twilio phone number added to VAPI
- [ ] Assistant created in VAPI with all settings
- [ ] Assistant ID copied
- [ ] VAPI Public Key copied
- [ ] VAPI Private Key copied
- [ ] Tools created in VAPI (calendar_availability, calendar_set_appointment)
- [ ] Tools linked to assistant

### n8n Configuration
- [ ] Calendar availability workflow created
- [ ] Calendar appointment workflow created
- [ ] Both workflows activated
- [ ] n8n webhook base URL noted

### Code Configuration
- [ ] `VAPI_PUBLIC_KEY` updated in `src/lib/vapi-config.ts`
- [ ] `VAPI_API_KEY` updated in `src/lib/vapi-config.ts`
- [ ] `VAPI_ASSISTANT_ID` updated in `src/lib/vapi-config.ts`
- [ ] `N8N_WEBHOOK_BASE_URL` updated in `src/lib/vapi-tools.ts`
- [ ] Assistant config in code matches VAPI dashboard settings

---

## Troubleshooting

### Common Issues

**1. "API Connection Failed"**
- Verify your VAPI private key is correct in `src/lib/vapi-config.ts`
- Check that the API key has proper permissions
- Ensure network connectivity

**2. "Assistant not found"**
- Verify the Assistant ID matches exactly (no extra spaces)
- Check that the assistant exists in your VAPI dashboard
- Ensure you're using the correct VAPI account

**3. "Tools not working"**
- Verify tools are created in VAPI dashboard and linked to assistant
- Check n8n workflow URLs are correct and workflows are active
- Test n8n webhooks directly using a tool like Postman
- Check n8n workflow execution logs for errors

**4. "Phone number not showing"**
- Verify Twilio credentials are correct in VAPI
- Check phone number status in VAPI dashboard
- Ensure phone number is properly imported

**5. "Microphone not working"**
- Grant microphone permissions in browser
- Check browser compatibility (Chrome, Firefox, Safari, Edge)
- Verify HTTPS connection (required for microphone access)

**6. "n8n webhook not receiving requests"**
- Verify n8n workflow is active
- Check webhook URL is correct (no trailing slashes)
- Test webhook directly with a POST request
- Check n8n logs for incoming requests

### Debug Mode

Enable detailed logging by checking the browser console:
- API request/response details
- Voice recognition status
- Error messages and stack traces
- Performance metrics

### Getting Help

1. Check VAPI documentation: [https://docs.vapi.ai](https://docs.vapi.ai)
2. Check n8n documentation: [https://docs.n8n.io](https://docs.n8n.io)
3. Review browser console for specific error messages
4. Check n8n workflow execution logs
5. Verify all configuration values match between VAPI dashboard and code

---

## Additional Resources

- **VAPI Documentation**: [https://docs.vapi.ai](https://docs.vapi.ai)
- **VAPI Dashboard**: [https://dashboard.vapi.ai](https://dashboard.vapi.ai)
- **Twilio Documentation**: [https://www.twilio.com/docs](https://www.twilio.com/docs)
- **n8n Documentation**: [https://docs.n8n.io](https://docs.n8n.io)
- **n8n Community**: [https://community.n8n.io](https://community.n8n.io)

---
