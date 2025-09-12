# HR Interview Assistant

A modern web application for managing HR interviews with AI-powered voice assistance using Vapi integration. This application provides a comprehensive dashboard for tracking call records, conducting live interviews, and managing candidate information.

## Features

### Core Functionality
- **Live Interview Interface**: Real-time voice interaction with AI assistant
- **Call Records Management**: Track and manage interview history
- **Candidate Information**: Automatic extraction of candidate details from conversations
- **Vapi Integration**: Seamless AI voice assistant integration
- **Responsive Design**: Modern UI with dark/light theme support

### Technical Features
- **React + TypeScript**: Modern frontend development
- **Tailwind CSS**: Utility-first styling
- **Vapi AI**: Professional voice assistant integration
- **Speech Recognition**: Real-time voice input processing
- **API Integration**: Fetch call records from Vapi API
- **Error Handling**: Graceful fallbacks and error recovery

## Prerequisites

Before running this application, ensure you have:

- Node.js (version 16 or higher)
- npm or yarn package manager
- Vapi account with API credentials
- Modern web browser with microphone access

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd vapi-pilot-dash-main
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Vapi API**
   - Open `src/lib/vapi-config.ts`
   - Replace `YOUR_VAPI_PRIVATE_KEY_HERE` with your actual Vapi private key
   - Update other configuration values as needed

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173`

## Configuration

### Vapi API Setup

1. **Get your Vapi credentials**:
   - Sign up at [Vapi Dashboard](https://dashboard.vapi.ai)
   - Navigate to Settings > API Keys
   - Copy your Private Key (not Public Key)

2. **Update configuration**:
   ```typescript
   // src/lib/vapi-config.ts
   export const VAPI_PUBLIC_KEY = 'your-public-key-here';
   export const VAPI_API_KEY = 'your-private-key-here';
   export const VAPI_ASSISTANT_ID = 'your-assistant-id';
   ```

### Environment Variables

For production deployment, consider using environment variables:

```bash
VITE_VAPI_PUBLIC_KEY=your-public-key
VITE_VAPI_API_KEY=your-private-key
VITE_VAPI_ASSISTANT_ID=your-assistant-id
```

## Usage

### Starting an Interview

1. **Click the floating call button** in the bottom-right corner
2. **Grant microphone permissions** when prompted
3. **Click "Start Vapi Interview"** to begin
4. **Speak naturally** with the AI assistant
5. **Use controls** to mute/unmute or end the call

### Managing Call Records

- **View Records**: All call records are displayed in the main table
- **Search**: Use the search bar to find specific candidates
- **Filter**: Filter records by position or status
- **Refresh**: Click the refresh button to update records from Vapi API
- **View Details**: Click the eye icon to see detailed call information

### Call Summary

After each interview:
- **Automatic Extraction**: Candidate information is extracted from the conversation
- **Summary Modal**: Review collected information
- **Add to Records**: Confirm and add the interview to your records

## API Integration

### Vapi API Endpoints

The application integrates with the following Vapi API endpoints:

- `GET /call?limit=100` - Fetch call logs
- `GET /call/{id}` - Get specific call details
- `POST /call` - Start new calls (via Web SDK)

### Data Extraction

The application automatically extracts:
- **Candidate Name**: From conversation messages
- **Phone Number**: From user input
- **Position**: Job role mentioned
- **Experience**: Years of experience
- **Interview Date**: Call timestamp

### Error Handling

- **API Failures**: Graceful fallback to mock data
- **Network Issues**: Clear error messages with retry options
- **Invalid Responses**: Robust parsing with fallbacks
- **Authentication**: Clear guidance for API key issues

## Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # Reusable UI components
│   ├── Header.tsx      # Application header
│   ├── LiveCallInterface.tsx  # Main interview interface
│   ├── CallRecordsTable.tsx   # Records display
│   ├── CallSummaryModal.tsx   # Interview summary
│   └── RecordDetailsModal.tsx # Record details
├── hooks/              # Custom React hooks
│   ├── useVapi.ts     # Vapi integration hook
│   └── use-toast.ts   # Toast notifications
├── lib/               # Utility libraries
│   ├── vapi-config.ts # Vapi configuration
│   ├── vapi-api.ts    # API service
│   ├── speech-recognition.ts # Voice recognition
│   └── utils.ts       # General utilities
├── pages/             # Page components
│   └── Index.tsx      # Main dashboard
└── main.tsx           # Application entry point
```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Code Style

- **TypeScript**: Strict type checking enabled
- **ESLint**: Code quality and consistency
- **Prettier**: Code formatting (if configured)
- **Tailwind CSS**: Utility-first styling approach

### Adding New Features

1. **Components**: Add new components in `src/components/`
2. **Hooks**: Create custom hooks in `src/hooks/`
3. **API**: Extend API services in `src/lib/`
4. **Pages**: Add new pages in `src/pages/`

## Troubleshooting

### Common Issues

**API Connection Failed**
- Verify your Vapi private key is correct
- Check that the API key has proper permissions
- Ensure network connectivity

**Microphone Not Working**
- Grant microphone permissions in browser
- Check browser compatibility
- Verify HTTPS connection (required for microphone access)

**Call Records Not Loading**
- Check Vapi API key configuration
- Verify API endpoint availability
- Review browser console for error messages

**Voice Recognition Issues**
- Ensure stable internet connection
- Check browser speech recognition support
- Try refreshing the page

### Debug Mode

Enable detailed logging by checking the browser console:
- API request/response details
- Voice recognition status
- Error messages and stack traces
- Performance metrics

## Deployment

### Production Build

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Deploy the dist folder** to your hosting provider

3. **Configure environment variables** for production

### Hosting Requirements

- **HTTPS**: Required for microphone access
- **Modern Browser Support**: Chrome, Firefox, Safari, Edge
- **Node.js**: For build process (not required for static hosting)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Check the troubleshooting section
- Review Vapi documentation
- Open an issue in the repository

## Changelog

### Version 1.0.0
- Initial release
- Vapi AI integration
- Call records management
- Live interview interface
- Responsive design
- Error handling and fallbacks
