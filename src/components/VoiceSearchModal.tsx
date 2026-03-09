import { useState, useEffect, useCallback } from 'react';
import { Mic, MicOff, X, Loader2 } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface VoiceSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResult: (text: string) => void;
}

// Type definitions for Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

const VoiceSearchModal = ({ open, onOpenChange, onResult }: VoiceSearchModalProps) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognitionInstance = new SpeechRecognition();
        recognitionInstance.continuous = false;
        recognitionInstance.interimResults = true;
        recognitionInstance.lang = 'en-IN';
        setRecognition(recognitionInstance);
      }
    }
  }, []);

  useEffect(() => {
    if (!recognition) return;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const results = event.results;
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < results.length; i++) {
        const result = results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      setTranscript(finalTranscript || interimTranscript);

      if (finalTranscript) {
        setTimeout(() => {
          onResult(finalTranscript.trim());
          onOpenChange(false);
        }, 500);
      }
    };

    recognition.onerror = () => {
      setError('Could not recognize speech. Please try again.');
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };
  }, [recognition, onResult, onOpenChange]);

  useEffect(() => {
    if (open && recognition) {
      setTranscript('');
      setError(null);
      startListening();
    } else if (!open && recognition && isListening) {
      recognition.stop();
    }
  }, [open]);

  const startListening = useCallback(() => {
    if (!recognition) {
      setError('Voice search is not supported in your browser');
      return;
    }

    setError(null);
    setTranscript('');
    setIsListening(true);

    try {
      recognition.start();
    } catch (e) {
      // Recognition might already be running
      console.error('Speech recognition error:', e);
    }
  }, [recognition]);

  const stopListening = useCallback(() => {
    if (recognition) {
      recognition.stop();
    }
    setIsListening(false);
  }, [recognition]);

  const handleClose = () => {
    stopListening();
    onOpenChange(false);
  };

  const isSupported = !!recognition;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <div className="flex flex-col items-center py-6">
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 p-1 rounded-full hover:bg-secondary"
          >
            <X size={20} className="text-muted-foreground" />
          </button>

          {!isSupported ? (
            <div className="text-center">
              <MicOff size={48} className="mx-auto text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">
                Voice search is not supported in your browser.
                <br />
                Please try Chrome, Edge, or Safari.
              </p>
            </div>
          ) : (
            <>
              {/* Animated mic button */}
              <div className="relative mb-6">
                <button
                  onClick={isListening ? stopListening : startListening}
                  className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${
                    isListening
                      ? 'bg-primary text-primary-foreground animate-pulse'
                      : 'bg-secondary hover:bg-secondary/80'
                  }`}
                >
                  {isListening ? (
                    <Mic size={40} className="animate-bounce" />
                  ) : (
                    <Mic size={40} className="text-muted-foreground" />
                  )}
                </button>
                {isListening && (
                  <div className="absolute inset-0 rounded-full border-4 border-primary animate-ping opacity-30" />
                )}
              </div>

              {/* Status text */}
              <div className="text-center min-h-[60px]">
                {isListening ? (
                  <div className="flex items-center gap-2 text-primary">
                    <Loader2 size={16} className="animate-spin" />
                    <span className="text-sm font-medium">Listening...</span>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Tap the microphone to start speaking
                  </p>
                )}

                {transcript && (
                  <p className="mt-3 text-lg font-medium text-foreground">
                    "{transcript}"
                  </p>
                )}

                {error && (
                  <p className="mt-3 text-sm text-destructive">{error}</p>
                )}
              </div>

              {/* Retry button */}
              {!isListening && transcript && (
                <Button
                  variant="outline"
                  onClick={startListening}
                  className="mt-4"
                >
                  Try again
                </Button>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VoiceSearchModal;
