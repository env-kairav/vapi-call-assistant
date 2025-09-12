// Speech recognition setup
export const setupSpeechRecognition = (options: {
  onStart: () => void;
  onEnd: () => void;
  onResult: (transcript: string, isFinal: boolean) => void;
  onError: (error: string) => void;
}) => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    console.error('Speech recognition not supported in this browser');
    options.onError('Speech recognition not supported in this browser');
    return null;
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';

  // Configure recognition settings for better voice detection
  recognition.maxAlternatives = 1;

  let isRecognitionActive = false;

  recognition.onstart = () => {
    console.log('🎤 Voice recognition started');
    isRecognitionActive = true;
    options.onStart();
  };

  recognition.onend = () => {
    console.log('🎤 Voice recognition ended');
    isRecognitionActive = false;
    options.onEnd();
  };

  recognition.onresult = (event: any) => {
    try {
      const results: any = Array.from(event.results);
      const lastResult = results[results.length - 1];
      const transcript = lastResult[0].transcript;

      console.log('🗣️ Recognition result:', transcript, 'Final:', lastResult.isFinal);
      options.onResult(transcript, lastResult.isFinal);
    } catch (error) {
      console.error('Error processing speech result:', error);
    }
  };

  recognition.onerror = (event: any) => {
    console.error('🔇 Recognition error:', event.error);
    isRecognitionActive = false;
    options.onError(event.error);
  };

  return {
    recognition,
    isActive: () => isRecognitionActive,
    start: () => {
      if (!isRecognitionActive) {
        try {
          recognition.start();
        } catch (e) {
          console.error('Failed to start recognition:', e);
        }
      } else {
        console.log('🎤 Recognition is already active');
      }
    },
    stop: () => {
      if (isRecognitionActive) {
        try {
          recognition.stop();
        } catch (e) {
          console.error('Failed to stop recognition:', e);
        }
      }
    }
  };
};
