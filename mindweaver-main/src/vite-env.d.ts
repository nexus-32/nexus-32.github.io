/// <reference types="vite/client" />

 interface SpeechRecognitionAlternative {
   transcript: string;
   confidence: number;
 }

 interface SpeechRecognitionResult {
   readonly length: number;
   readonly isFinal: boolean;
   [index: number]: SpeechRecognitionAlternative;
 }

 interface SpeechRecognitionResultList {
   readonly length: number;
   [index: number]: SpeechRecognitionResult;
 }

 interface SpeechRecognitionEvent extends Event {
   readonly results: SpeechRecognitionResultList;
 }

 interface SpeechRecognitionErrorEvent extends Event {
   readonly error: string;
   readonly message: string;
 }

 interface SpeechRecognition extends EventTarget {
   continuous: boolean;
   interimResults: boolean;
   onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
   onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
   start(): void;
   stop(): void;
 }

 declare var SpeechRecognition: {
   prototype: SpeechRecognition;
   new (): SpeechRecognition;
 };

 interface Window {
   SpeechRecognition?: typeof SpeechRecognition;
   webkitSpeechRecognition?: typeof SpeechRecognition;
 }
