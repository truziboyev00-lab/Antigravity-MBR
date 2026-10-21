import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Mic,
  MicOff,
  Search,
  Send,
  Sparkles,
  Volume2,
  VolumeX,
  Radio,
  Globe,
  RefreshCw,
  Trash2,
  Copy,
  Check,
  Zap,
  Cpu,
  AlertTriangle,
  ExternalLink,
  Sliders,
  ShieldCheck,
  ChevronRight,
  Terminal,
  Activity,
  Layers,
  StopCircle
} from 'lucide-react';

export type ChatModel = 'gemini-3.8-flash' | 'gemini-3.5-flash' | 'gemini-3.1-pro-preview' | 'gemini-3.1-flash-lite';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  modelUsed?: string;
  groundingChunks?: Array<{ web?: { uri?: string; title?: string } }>;
  webSearchQueries?: string[];
  latencyMs?: number;
  searchNotice?: string;
  proNotice?: string;
}

interface VoiceSessionState {
  status: 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'LISTENING' | 'SPEAKING' | 'PERMISSION_DENIED' | 'ERROR';
  errorMessage?: string;
  userTranscript: string;
  modelTranscript: string;
  audioLevels: number[];
  sessionMode: 'FULL_VOICE' | 'TEXT_TO_AUDIO';
}

export function GeminiAICopilot() {
  const [activeSubTab, setActiveSubTab] = useState<'CHAT' | 'VOICE' | 'SEARCH_GROUNDING'>('CHAT');

  // --- CHAT STATE ---
  const [selectedModel, setSelectedModel] = useState<ChatModel>('gemini-3.8-flash');
  const [enableSearchGrounding, setEnableSearchGrounding] = useState<boolean>(false);
  const [inputQuery, setInputQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-msg',
      role: 'assistant',
      content: `### Welcome to the MBR Super Expert AI Copilot\n\nI am your **AI Process Automation & Chemical Engineering Specialist**, integrated directly into Unit 77 and the Universal Multi-Plant Fleet (T01–T07).\n\n**Capabilities:**\n- **Flagship Fast Intelligence**: **gemini-3.8-flash** (recommended standard for sub-second operational diagnostics), with auto-failover to **gemini-3.5-flash**, **gemini-3.1-pro-preview** (advanced STEM), or **gemini-3.1-flash-lite**.\n- **Real-Time Live Voice**: Switch to the **Live Voice** tab to talk verbally with **gemini-3.8-live** with bidirectional audio or direct text-to-audio.\n- **Google Search Grounding**: Live retrieval of up-to-date vendor specifications, EPA/EU water reuse standards, and chemical cleaning protocols.\n\nHow can I assist your plant operations today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      modelUsed: 'gemini-3.8-flash'
    }
  ]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // --- VOICE / LIVE API STATE ---
  const [voiceState, setVoiceState] = useState<VoiceSessionState>({
    status: 'DISCONNECTED',
    userTranscript: '',
    modelTranscript: '',
    audioLevels: [15, 25, 40, 60, 30, 20, 50, 75, 45, 20, 35, 60],
    sessionMode: 'FULL_VOICE'
  });
  const [isMuted, setIsMuted] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState('Aoede');
  const [liveTextInput, setLiveTextInput] = useState('');

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const playbackContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const animFrameRef = useRef<number | null>(null);

  // --- DEDICATED SEARCH GROUNDING STATE ---
  const [searchTopicQuery, setSearchTopicQuery] = useState('Optimal citric acid soaking duration and pH for inorganic scaling in PVDF hollow fiber MBR');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<{
    answer: string;
    sources: Array<{ uri: string; title: string }>;
    queries: string[];
    searchNotice?: string;
  } | null>(null);

  // Scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  // Handle Send Chat
  const handleSendMessage = async (customPrompt?: string, overrideModel?: ChatModel) => {
    const textToSend = customPrompt || inputQuery.trim();
    if (!textToSend || isGenerating) return;

    const modelToUse = overrideModel || selectedModel;

    const userMsg: Message = {
      id: `usr_${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    if (!customPrompt) setInputQuery('');
    setIsGenerating(true);

    const startTime = Date.now();

    try {
      // Map history for backend
      const apiMessages = newHistory.map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          model: modelToUse,
          enableSearch: enableSearchGrounding
        })
      });

      const data = await res.json();
      const latencyMs = Date.now() - startTime;

      if (!res.ok) {
        throw new Error(data.error || `Server error HTTP ${res.status}`);
      }

      const assistantMsg: Message = {
        id: `ast_${Date.now()}`,
        role: 'assistant',
        content: data.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: data.modelUsed || modelToUse,
        groundingChunks: data.groundingChunks || [],
        webSearchQueries: data.webSearchQueries || [],
        latencyMs,
        searchNotice: data.searchQuotaExceeded
          ? 'Live Google Search API quota limit reached; response generated with core industrial engineering domain knowledge.'
          : undefined,
        proNotice: data.proQuotaExceeded
          ? 'Switched to gemini-3.5-flash (gemini-3.1-pro requires a paid API billing project).'
          : undefined
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMsg: Message = {
        id: `err_${Date.now()}`,
        role: 'assistant',
        content: `⚠️ **Request Notice**: ${err.message}\n\n*Suggestion*: You can re-try immediately with **gemini-3.5-flash** or without Search Grounding.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: modelToUse
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Convert Float32Array PCM from mic to base64 16-bit PCM little-endian
  const floatTo16BitPCMBase64 = (input: Float32Array): string => {
    const buffer = new ArrayBuffer(input.length * 2);
    const view = new DataView(buffer);
    for (let i = 0; i < input.length; i++) {
      const s = Math.max(-1, Math.min(1, input[i]));
      view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  // Play base64 24kHz 16-bit PCM chunk from Live API
  const play24kHzAudioChunk = (base64Data: string) => {
    try {
      if (!playbackContextRef.current) {
        playbackContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
          sampleRate: 24000
        });
      }
      const ctx = playbackContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const binary = atob(base64Data);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const int16 = new Int16Array(bytes.buffer);
      const float32 = new Float32Array(int16.length);
      for (let i = 0; i < int16.length; i++) {
        float32[i] = int16[i] / 32768.0;
      }

      const audioBuffer = ctx.createBuffer(1, float32.length, 24000);
      audioBuffer.getChannelData(0).set(float32);

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);

      const currentTime = ctx.currentTime;
      if (nextStartTimeRef.current < currentTime) {
        nextStartTimeRef.current = currentTime;
      }

      source.start(nextStartTimeRef.current);
      nextStartTimeRef.current += audioBuffer.duration;

      activeSourcesRef.current.push(source);
      source.onended = () => {
        activeSourcesRef.current = activeSourcesRef.current.filter(s => s !== source);
        if (activeSourcesRef.current.length === 0) {
          setVoiceState(prev => ({ ...prev, status: 'LISTENING' }));
        }
      };

      setVoiceState(prev => ({ ...prev, status: 'SPEAKING' }));
    } catch (e) {
      console.warn('Playback error:', e);
    }
  };

  // Stop active playback and clear audio queue
  const stopPlayback = () => {
    activeSourcesRef.current.forEach(s => {
      try { s.stop(); } catch (_) {}
    });
    activeSourcesRef.current = [];
    if (playbackContextRef.current) {
      nextStartTimeRef.current = playbackContextRef.current.currentTime;
    }
    setVoiceState(prev => ({ ...prev, status: 'LISTENING' }));
  };

  // Connect to Live API WebSocket (Full Voice or Text-to-Audio)
  const startVoiceSession = async (mode: 'FULL_VOICE' | 'TEXT_TO_AUDIO' = 'FULL_VOICE') => {
    // If an existing session is running, clean it up first
    stopVoiceSession();

    setVoiceState(prev => ({
      ...prev,
      status: 'CONNECTING',
      errorMessage: undefined,
      sessionMode: mode
    }));

    try {
      let micStream: MediaStream | null = null;
      let inputCtx: AudioContext | null = null;

      // 1. If Full Voice mode requested, initialize Microphone stream
      if (mode === 'FULL_VOICE') {
        try {
          micStream = await navigator.mediaDevices.getUserMedia({
            audio: {
              channelCount: 1,
              sampleRate: 16000,
              echoCancellation: true,
              noiseSuppression: true
            }
          });
          mediaStreamRef.current = micStream;

          inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({
            sampleRate: 16000
          });
          audioContextRef.current = inputCtx;
        } catch (micErr: any) {
          const isDenied =
            micErr?.name === 'NotAllowedError' ||
            micErr?.name === 'SecurityError' ||
            micErr?.message?.toLowerCase().includes('permission') ||
            micErr?.message?.toLowerCase().includes('denied');

          if (isDenied) {
            console.warn('Microphone permission was denied or restricted by user/browser:', micErr?.message);
            setVoiceState(prev => ({
              ...prev,
              status: 'PERMISSION_DENIED',
              sessionMode: 'TEXT_TO_AUDIO',
              errorMessage: 'Microphone permission was denied. You can continue in Text-to-Audio mode (no mic required) or enable microphone in browser settings.'
            }));
            return;
          }
          throw micErr;
        }
      }

      // 2. Initialize Playback Context for 24kHz Live API output
      if (!playbackContextRef.current) {
        playbackContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
          sampleRate: 24000
        });
      }
      if (playbackContextRef.current.state === 'suspended') {
        playbackContextRef.current.resume();
      }

      // 3. Open WebSocket to server with selected voice persona
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/live?voice=${encodeURIComponent(selectedVoice)}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setVoiceState(prev => ({ ...prev, status: 'CONNECTED' }));

        // If mic stream is active, process & stream 16kHz audio chunks
        if (micStream && inputCtx) {
          const source = inputCtx.createMediaStreamSource(micStream);
          const processor = inputCtx.createScriptProcessor(2048, 1, 1);
          scriptProcessorRef.current = processor;

          source.connect(processor);
          processor.connect(inputCtx.destination);

          processor.onaudioprocess = (e) => {
            if (isMuted) return;
            const channelData = e.inputBuffer.getChannelData(0);

            // Compute audio level visualization
            let sum = 0;
            for (let i = 0; i < channelData.length; i += 32) {
              sum += Math.abs(channelData[i]);
            }
            const avg = sum / (channelData.length / 32);
            const scaled = Math.min(100, Math.max(10, Math.round(avg * 250)));

            setVoiceState(prev => {
              const nextLevels = [...prev.audioLevels.slice(1), scaled];
              return {
                ...prev,
                audioLevels: nextLevels,
                status: prev.status === 'SPEAKING' ? 'SPEAKING' : scaled > 20 ? 'LISTENING' : prev.status
              };
            });

            // Send chunk to server
            if (ws.readyState === WebSocket.OPEN) {
              const base64Audio = floatTo16BitPCMBase64(channelData);
              ws.send(JSON.stringify({ audio: base64Audio }));
            }
          };
        }
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.error) {
            console.warn('Server Live API Notice:', msg.error);
            setVoiceState(prev => ({ ...prev, status: 'ERROR', errorMessage: msg.error }));
          }

          if (msg.interrupted) {
            stopPlayback();
          }

          if (msg.audio) {
            play24kHzAudioChunk(msg.audio);
          }

          if (msg.outputTranscription) {
            setVoiceState(prev => ({
              ...prev,
              modelTranscript: prev.modelTranscript + msg.outputTranscription
            }));
          }

          if (msg.inputTranscription) {
            setVoiceState(prev => ({
              ...prev,
              userTranscript: prev.userTranscript + ' ' + msg.inputTranscription
            }));
          }
        } catch (e) {
          console.warn('Live message parse note:', e);
        }
      };

      ws.onerror = (_err) => {
        console.warn('Live WebSocket stream closed or interrupted.');
        setVoiceState(prev => ({
          ...prev,
          status: 'ERROR',
          errorMessage: 'Live WebSocket session ended. You can reconnect or use text chat.'
        }));
      };

      ws.onclose = () => {
        setVoiceState(prev => ({ ...prev, status: 'DISCONNECTED' }));
      };
    } catch (err: any) {
      console.warn('Live session initialization notice:', err?.message);
      setVoiceState(prev => ({
        ...prev,
        status: 'ERROR',
        errorMessage: err.message || 'Unable to establish real-time voice stream.'
      }));
    }
  };

  // Disconnect voice session
  const stopVoiceSession = () => {
    stopPlayback();
    if (wsRef.current) {
      try { wsRef.current.close(); } catch (_) {}
      wsRef.current = null;
    }
    if (mediaStreamRef.current) {
      try {
        mediaStreamRef.current.getTracks().forEach(t => t.stop());
      } catch (_) {}
      mediaStreamRef.current = null;
    }
    if (scriptProcessorRef.current) {
      try { scriptProcessorRef.current.disconnect(); } catch (_) {}
      scriptProcessorRef.current = null;
    }
    if (audioContextRef.current) {
      try { audioContextRef.current.close(); } catch (_) {}
      audioContextRef.current = null;
    }
    if (playbackContextRef.current) {
      try { playbackContextRef.current.close(); } catch (_) {}
      playbackContextRef.current = null;
    }
    setVoiceState(prev => ({ ...prev, status: 'DISCONNECTED' }));
  };

  // Send text into the Live session stream
  const sendLiveTextMessage = () => {
    if (!liveTextInput.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ text: liveTextInput.trim() }));
    setVoiceState(prev => ({
      ...prev,
      userTranscript: prev.userTranscript + ` [Typed: ${liveTextInput.trim()}]`
    }));
    setLiveTextInput('');
  };

  // Dedicated Search Grounding execution
  const executeSearchGrounding = async () => {
    if (!searchTopicQuery.trim() || searchLoading) return;
    setSearchLoading(true);
    try {
      const res = await fetch('/api/gemini/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchTopicQuery,
          topic: 'Industrial MBR Water Standards & Chemical Operations'
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Search request failed');

      const extractedSources: Array<{ uri: string; title: string }> = [];
      if (data.groundingChunks) {
        data.groundingChunks.forEach((c: any) => {
          if (c.web?.uri) {
            extractedSources.push({
              uri: c.web.uri,
              title: c.web.title || c.web.uri
            });
          }
        });
      }

      setSearchResult({
        answer: data.answer,
        sources: extractedSources,
        queries: data.webSearchQueries || [],
        searchNotice: data.searchNotice
      });
    } catch (err: any) {
      console.error('Search grounding error:', err);
    } finally {
      setSearchLoading(false);
    }
  };

  // Sample prompt chips
  const promptSuggestions = [
    {
      label: 'Diagnose T03 TMP Spike',
      prompt: 'Train 03 is showing a TMP increase from 16 kPa to 26 kPa within 48 hours at constant 24 LMH flux. Diagnose possible cake fouling vs pore blocking, and specify a recovery CIP sequence.'
    },
    {
      label: 'NaOCl CIP Recipe for 4,800 m²',
      prompt: 'Calculate exact 12% industrial sodium hypochlorite dosage needed for a 4,800 m² PVDF hollow fiber membrane tank (volume 180 m³) targeting 1,000 mg/L free chlorine and pH 10.5.'
    },
    {
      label: 'Cyclic Relaxation Energy Savings',
      prompt: 'Compare 10 min suction / 1 min relaxation cycle vs continuous suction at 24 LMH in terms of specific energy consumption (kWh/m³) and net flux loss.'
    },
    {
      label: 'T05 Diurnal Peak Swing Strategy',
      prompt: 'Explain the automated engagement sequence for Train 05 during morning peak flow (08:00–12:00) to protect biological MLSS and prevent hydraulic shock.'
    }
  ];

  return (
    <div id="gemini-ai-copilot-root" className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-emerald-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-inner flex-shrink-0">
              <Bot className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-emerald-400 font-semibold uppercase tracking-wider">
                  AI Studio Gemini Architecture
                </span>
                <span className="text-slate-600">·</span>
                <span className="text-xs text-slate-400">Multi-Model Engine</span>
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight mt-0.5 flex items-center gap-2">
                MBR Super Expert AI Copilot & Real-Time Voice Assistant
              </h2>
              <p className="text-xs text-slate-400 mt-1 max-w-3xl">
                Integrated reasoning suite powered by <strong>gemini-3.1-pro-preview</strong> (complex STEM & process modeling), <strong>gemini-3.5-flash</strong> (general operations & search grounding), <strong>gemini-3.1-flash-lite</strong> (sub-second queries), and <strong>gemini-3.8-live</strong> (low-latency voice conversations).
              </p>
            </div>
          </div>

          {/* Sub-tab Navigation */}
          <div className="flex items-center bg-slate-950 p-1.5 rounded-lg border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setActiveSubTab('CHAT')}
              className={`px-3 py-1.5 rounded-md font-medium transition flex items-center gap-1.5 ${
                activeSubTab === 'CHAT'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Multi-Turn Chat</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('VOICE')}
              className={`px-3 py-1.5 rounded-md font-medium transition flex items-center gap-1.5 ${
                activeSubTab === 'VOICE'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Live Voice (3.8-Live)</span>
              {voiceState.status !== 'DISCONNECTED' && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('SEARCH_GROUNDING')}
              className={`px-3 py-1.5 rounded-md font-medium transition flex items-center gap-1.5 ${
                activeSubTab === 'SEARCH_GROUNDING'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Google Search Grounding</span>
            </button>
          </div>
        </div>
      </div>

      {/* SUB-TAB 1: MULTI-TURN CHAT */}
      {activeSubTab === 'CHAT' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Chat Thread (3 cols) */}
          <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-xl flex flex-col h-[650px] shadow-lg overflow-hidden">
            {/* Thread Header & Controls */}
            <div className="p-3.5 border-b border-slate-800/80 bg-slate-950/70 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Model:</span>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value as ChatModel)}
                  className="bg-slate-900 border border-slate-700 rounded-md px-2.5 py-1 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
                >
                  <option value="gemini-3.8-flash">gemini-3.8-flash (Standard & Fastest · Recommended)</option>
                  <option value="gemini-3.5-flash">gemini-3.5-flash (Standard Operational Reasoning)</option>
                  <option value="gemini-3.1-pro-preview">gemini-3.1-pro-preview (Deep STEM Reasoning · Auto-fallback)</option>
                  <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Ultra-Low Latency)</option>
                </select>
              </div>

              <div className="flex items-center gap-3">
                {/* Search Grounding Toggle */}
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={enableSearchGrounding}
                    onChange={(e) => setEnableSearchGrounding(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-0 w-3.5 h-3.5"
                  />
                  <span className="flex items-center gap-1 text-[11px] font-mono">
                    <Globe className="w-3 h-3 text-cyan-400" /> Google Search Grounding
                  </span>
                </label>

                {/* Clear Conversation */}
                <button
                  type="button"
                  onClick={() => setMessages([])}
                  className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                  title="Clear conversation history"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Scrollable Message List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans text-xs">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 space-y-2">
                  <Bot className="w-8 h-8 text-slate-600" />
                  <p className="text-sm font-medium text-slate-400">Conversation Cleared</p>
                  <p className="text-xs max-w-sm">Select an engineering prompt suggestion on the right or type a custom inquiry below.</p>
                </div>
              ) : (
                messages.map((m) => {
                  const isUser = m.role === 'user';
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1`}
                    >
                      <div className="flex items-center gap-2 px-1 text-[10px] text-slate-500 font-mono">
                        <span>{isUser ? 'Field Engineer' : 'MBR Super Expert AI'}</span>
                        <span>·</span>
                        <span>{m.timestamp}</span>
                        {m.modelUsed && (
                          <>
                            <span>·</span>
                            <span className="text-emerald-400 font-semibold">{m.modelUsed}</span>
                          </>
                        )}
                        {m.latencyMs && (
                          <>
                            <span>·</span>
                            <span className="text-slate-400">{m.latencyMs}ms</span>
                          </>
                        )}
                      </div>

                      <div
                        className={`rounded-xl p-4 max-w-2xl relative group ${
                          isUser
                            ? 'bg-emerald-600 text-white rounded-br-none shadow-md'
                            : 'bg-slate-950/90 border border-slate-800/90 text-slate-200 rounded-bl-none shadow-inner'
                        }`}
                      >
                        {/* Copy Button */}
                        <button
                          type="button"
                          onClick={() => copyToClipboard(m.id, m.content)}
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition p-1 rounded bg-slate-800 text-slate-300 hover:text-white"
                          title="Copy text"
                        >
                          {copiedId === m.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>

                        {/* Pro Fallback Notice */}
                        {m.proNotice && (
                          <div className="mb-2 px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-mono flex items-center gap-1.5">
                            <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                            <span>{m.proNotice}</span>
                          </div>
                        )}

                        {/* Search Quota Notice */}
                        {m.searchNotice && (
                          <div className="mb-2 px-2.5 py-1 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[10px] font-mono flex items-center gap-1.5">
                            <Globe className="w-3 h-3 text-cyan-400 shrink-0" />
                            <span>{m.searchNotice}</span>
                          </div>
                        )}

                        {/* Content text */}
                        <div className="whitespace-pre-wrap leading-relaxed text-xs space-y-2">
                          {m.content}
                        </div>

                        {/* If Error message, show quick Retry with Flash button */}
                        {m.id.startsWith('err_') && (
                          <div className="mt-3 pt-2 border-t border-rose-500/20">
                            <button
                              type="button"
                              onClick={() => {
                                const lastUser = [...messages].reverse().find(msg => msg.role === 'user');
                                if (lastUser) {
                                  setSelectedModel('gemini-3.8-flash');
                                  setEnableSearchGrounding(false);
                                  handleSendMessage(lastUser.content, 'gemini-3.8-flash');
                                }
                              }}
                              className="px-3 py-1 rounded bg-emerald-600/80 hover:bg-emerald-500 text-white font-mono text-[10px] flex items-center gap-1.5 transition"
                            >
                              <RefreshCw className="w-3 h-3" />
                              <span>Auto-Retry with Recommended Fast Flash (gemini-3.8-flash)</span>
                            </button>
                          </div>
                        )}

                        {/* Search Grounding Citations */}
                        {m.groundingChunks && m.groundingChunks.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-slate-800/80 text-[11px] space-y-1.5">
                            <div className="text-[10px] font-mono text-cyan-400 flex items-center gap-1 font-semibold">
                              <Globe className="w-3 h-3" /> Grounded Web Sources ({m.groundingChunks.length}):
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {m.groundingChunks.map((chunk, idx) => {
                                const uri = chunk.web?.uri;
                                const title = chunk.web?.title || uri;
                                if (!uri) return null;
                                return (
                                  <a
                                    key={idx}
                                    href={uri}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-cyan-300 hover:border-cyan-500/50 flex items-center gap-1 transition text-[10px]"
                                  >
                                    <span className="truncate max-w-44">{title}</span>
                                    <ExternalLink className="w-2.5 h-2.5 flex-shrink-0 text-slate-500" />
                                  </a>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              {isGenerating && (
                <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono py-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Generating engineering reasoning via {selectedModel}...</span>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Chat Input Bar */}
            <div className="p-3 border-t border-slate-800 bg-slate-950">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  placeholder={`Ask engineering question (e.g. "Optimal NaOCl concentration for T03 recovery CIP")...`}
                  disabled={isGenerating}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  disabled={!inputQuery.trim() || isGenerating}
                  className="px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:hover:bg-emerald-600 text-white font-medium text-xs flex items-center gap-1.5 transition shadow"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </form>
            </div>
          </div>

          {/* Side Panel: Prompt Chips & System Context (1 col) */}
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 shadow">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Process Engineering Inquiries</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Click any pre-formulated engineering question to immediately query the selected model:
              </p>
              <div className="space-y-2">
                {promptSuggestions.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(item.prompt)}
                    disabled={isGenerating}
                    className="w-full text-left p-2.5 rounded-lg bg-slate-950/70 hover:bg-slate-800 border border-slate-800/80 hover:border-slate-700 transition space-y-1 group"
                  >
                    <div className="text-xs font-semibold text-slate-200 group-hover:text-emerald-400 flex items-center justify-between">
                      <span>{item.label}</span>
                      <ChevronRight className="w-3 h-3 text-slate-500 group-hover:translate-x-0.5 transition" />
                    </div>
                    <p className="text-[10px] text-slate-400 line-clamp-2">
                      {item.prompt}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Plant Context Summary */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2.5 shadow">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Active Model Context</span>
              </h3>
              <div className="space-y-1.5 text-[11px] font-mono text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Fleet Area:</span>
                  <span>33,600 m² (7 trains)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Design Flux:</span>
                  <span className="text-emerald-400">24.0 LMH (115 m³/h)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Biological SRT:</span>
                  <span>25 Days (8,200 mg/L)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">CIP Reagent:</span>
                  <span className="text-amber-400">NaOCl 1,000 ppm</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: REAL-TIME LIVE VOICE (gemini-3.8-live) */}
      {activeSubTab === 'VOICE' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                  MODEL: gemini-3.8-live
                </span>
                <span className="text-xs text-slate-400">Real-Time Two-Way Audio (Live API)</span>
              </div>
              <h3 className="text-base font-bold text-white mt-1">
                Field Operations Voice Communicator
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Speak directly into your microphone to consult the digital twin hands-free while inspecting treatment trains on-site.
              </p>
            </div>

            {/* Voice persona selector & connection button */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400">Voice Persona:</span>
                <select
                  value={selectedVoice}
                  onChange={(e) => setSelectedVoice(e.target.value)}
                  disabled={voiceState.status !== 'DISCONNECTED'}
                  className="bg-slate-950 border border-slate-800 rounded-md px-2.5 py-1.5 text-xs text-slate-200 font-mono"
                >
                  <option value="Aoede">Aoede (Clear British-English)</option>
                  <option value="Puck">Puck (Energetic / Dynamic)</option>
                  <option value="Charon">Charon (Authoritative Senior)</option>
                  <option value="Kore">Kore (Warm / Calm)</option>
                  <option value="Fenrir">Fenrir (Deep / Direct)</option>
                </select>
              </div>

              {voiceState.status === 'DISCONNECTED' || voiceState.status === 'PERMISSION_DENIED' ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => startVoiceSession('FULL_VOICE')}
                    className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-2 transition shadow-lg"
                    title="Speak into your microphone and hear 24kHz audio from Gemini Live"
                  >
                    <Mic className="w-4 h-4" />
                    <span>Live Call (Mic + Audio)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => startVoiceSession('TEXT_TO_AUDIO')}
                    className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-2 transition shadow"
                    title="Type text and hear Gemini Live respond with spoken 24kHz audio (No Mic Required)"
                  >
                    <Volume2 className="w-4 h-4 text-emerald-400" />
                    <span>Text-to-Audio (No Mic)</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={stopVoiceSession}
                  className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs flex items-center gap-2 transition shadow-lg"
                >
                  <StopCircle className="w-4 h-4" />
                  <span>End Session</span>
                </button>
              )}
            </div>
          </div>

          {/* Voice Interface Stage */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Visualizer & Mic Controls (2 cols) */}
            <div className="lg:col-span-2 bg-slate-950 border border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center space-y-5 min-h-[360px] relative overflow-hidden">
              {/* Status Badge & Mode */}
              <div className="flex flex-wrap items-center justify-center gap-2.5">
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      voiceState.status === 'SPEAKING'
                        ? 'bg-indigo-400 animate-pulse'
                        : voiceState.status === 'LISTENING'
                        ? 'bg-emerald-400 animate-pulse'
                        : voiceState.status === 'CONNECTING'
                        ? 'bg-amber-400 animate-ping'
                        : voiceState.status === 'PERMISSION_DENIED'
                        ? 'bg-amber-500'
                        : voiceState.status === 'ERROR'
                        ? 'bg-rose-500'
                        : 'bg-slate-600'
                    }`}
                  />
                  <span className="font-mono text-xs font-bold text-white tracking-wider uppercase">
                    STATUS: {voiceState.status}
                  </span>
                </div>

                {voiceState.status !== 'DISCONNECTED' && (
                  <span className={`text-[10px] font-mono px-2.5 py-1 rounded-full border ${
                    voiceState.sessionMode === 'TEXT_TO_AUDIO'
                      ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40'
                      : 'bg-indigo-950/40 text-indigo-300 border-indigo-800/40'
                  }`}>
                    {voiceState.sessionMode === 'TEXT_TO_AUDIO' ? '🎧 MODE: Text-to-Audio (Speaker Only)' : '🎙️ MODE: Full Bidirectional Voice'}
                  </span>
                )}
              </div>

              {/* Dynamic Waveform Visualizer */}
              <div className="flex items-center justify-center gap-1.5 h-24 w-full px-8">
                {voiceState.audioLevels.map((lvl, idx) => (
                  <div
                    key={idx}
                    className={`w-2.5 rounded-full transition-all duration-75 ${
                      voiceState.status === 'SPEAKING'
                        ? 'bg-gradient-to-t from-indigo-500 to-purple-400 shadow-md shadow-indigo-500/30'
                        : voiceState.status === 'LISTENING'
                        ? 'bg-gradient-to-t from-emerald-500 to-cyan-400 shadow-md shadow-emerald-500/30'
                        : 'bg-slate-800'
                    }`}
                    style={{
                      height: voiceState.status !== 'DISCONNECTED' ? `${lvl}%` : '8%'
                    }}
                  />
                ))}
              </div>

              {/* Permission Denied Guidance Banner */}
              {voiceState.status === 'PERMISSION_DENIED' && (
                <div className="w-full max-w-lg p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-200 text-xs space-y-2.5 shadow-lg">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-400 mt-0.5" />
                    <div className="space-y-1">
                      <div className="font-semibold text-white">Mikrofon ruxsati berilmadi / Microphone Access Restricted</div>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        Brauzeringiz yoki xavfsizlik sozlamalari mikrofon kirishiga ruxsat bermadi. Mikrofonsiz ham tizimdan foydalanishingiz mumkin:
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-amber-500/20">
                    <button
                      type="button"
                      onClick={() => startVoiceSession('TEXT_TO_AUDIO')}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 transition shadow"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Mikrofonsiz davom etish (Matn + Jonli Ovoz)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => startVoiceSession('FULL_VOICE')}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1.5 transition border border-slate-700"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Qaytadan urinish (Retry Mic)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveSubTab('CHAT')}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white text-xs transition"
                    >
                      <span>Chatga o&apos;tish</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Error Notification if any */}
              {voiceState.errorMessage && voiceState.status === 'ERROR' && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-300 text-xs flex items-center gap-2 max-w-md">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                  <span>{voiceState.errorMessage}</span>
                </div>
              )}

              {/* Action Bar (Mute, Interrupt, Mode Switch) */}
              <div className="flex flex-wrap items-center gap-3">
                {voiceState.sessionMode === 'FULL_VOICE' && (
                  <button
                    type="button"
                    disabled={voiceState.status === 'DISCONNECTED'}
                    onClick={() => setIsMuted(!isMuted)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition ${
                      isMuted
                        ? 'bg-rose-600/20 border-rose-500 text-rose-300'
                        : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                    }`}
                  >
                    {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5 text-emerald-400" />}
                    <span>{isMuted ? 'Muted' : 'Mute Mic'}</span>
                  </button>
                )}

                <button
                  type="button"
                  disabled={voiceState.status !== 'SPEAKING'}
                  onClick={stopPlayback}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition disabled:opacity-40"
                  title="Interrupt model speech playback"
                >
                  <VolumeX className="w-3.5 h-3.5 text-amber-400" />
                  <span>Interrupt Speech</span>
                </button>
              </div>

              {/* Quick Spoken Prompt Pills */}
              <div className="w-full max-w-md space-y-1.5 pt-1">
                <span className="text-[10px] font-mono text-slate-500 block text-center">QUICK VOICE INQUIRIES:</span>
                <div className="flex flex-wrap items-center justify-center gap-1.5">
                  {[
                    'What is the design flux of Train 01?',
                    'Explain the citric acid cleaning soak protocol.',
                    'Check Unit 77 TMP threshold and fouling.'
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        if (voiceState.status === 'DISCONNECTED' || voiceState.status === 'PERMISSION_DENIED') {
                          startVoiceSession('TEXT_TO_AUDIO').then(() => {
                            setTimeout(() => {
                              if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                                wsRef.current.send(JSON.stringify({ text: preset }));
                                setVoiceState(p => ({ ...p, userTranscript: p.userTranscript + ` [Typed: ${preset}]` }));
                              }
                            }, 500);
                          });
                        } else if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                          wsRef.current.send(JSON.stringify({ text: preset }));
                          setVoiceState(p => ({ ...p, userTranscript: p.userTranscript + ` [Typed: ${preset}]` }));
                        }
                      }}
                      className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 hover:border-indigo-500/60 text-slate-300 hover:text-white text-[10px] font-mono transition"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Text-to-Live Stream Input */}
              <div className="w-full max-w-md pt-2 border-t border-slate-800/80">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={liveTextInput}
                    onChange={(e) => setLiveTextInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        if (voiceState.status === 'DISCONNECTED' || voiceState.status === 'PERMISSION_DENIED') {
                          startVoiceSession('TEXT_TO_AUDIO').then(() => {
                            setTimeout(sendLiveTextMessage, 500);
                          });
                        } else {
                          sendLiveTextMessage();
                        }
                      }
                    }}
                    placeholder={
                      voiceState.status === 'DISCONNECTED'
                        ? "Type a query and press Enter to start Text-to-Audio stream..."
                        : "Type prompt (e.g. 'What is the design flux of Train 01?')..."
                    }
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (voiceState.status === 'DISCONNECTED' || voiceState.status === 'PERMISSION_DENIED') {
                        startVoiceSession('TEXT_TO_AUDIO').then(() => {
                          setTimeout(sendLiveTextMessage, 500);
                        });
                      } else {
                        sendLiveTextMessage();
                      }
                    }}
                    disabled={!liveTextInput.trim()}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-medium text-xs flex items-center gap-1 transition"
                  >
                    <Send className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* Live Real-Time Transcription Stream (1 col) */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col h-[340px] space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h4 className="font-semibold text-xs text-white flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Live Spoken Transcription</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setVoiceState(prev => ({ ...prev, userTranscript: '', modelTranscript: '' }))}
                  className="text-[10px] text-slate-500 hover:text-slate-300"
                >
                  Clear
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 font-mono text-[11px]">
                {voiceState.userTranscript && (
                  <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-emerald-200">
                    <span className="text-[9px] text-emerald-400 block font-sans font-semibold mb-0.5">YOU SPOKE:</span>
                    {voiceState.userTranscript}
                  </div>
                )}

                {voiceState.modelTranscript ? (
                  <div className="p-2.5 rounded-lg bg-indigo-950/40 border border-indigo-800/40 text-indigo-200">
                    <span className="text-[9px] text-indigo-400 block font-sans font-semibold mb-0.5">AI SPOKE:</span>
                    {voiceState.modelTranscript}
                  </div>
                ) : (
                  <div className="text-slate-600 text-center text-xs py-10 font-sans">
                    Spoken transcripts from Gemini Live API will appear here in real-time.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: GOOGLE SEARCH DATA GROUNDING */}
      {activeSubTab === 'SEARCH_GROUNDING' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6 shadow-xl">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                MODEL: gemini-3.5-flash + googleSearch Tool
              </span>
              <span className="text-xs text-slate-400">Live Web Grounding & Standards Research</span>
            </div>
            <h3 className="text-base font-bold text-white mt-1">
              Industrial MBR Knowledge & Regulations Grounding
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Query real-time water quality regulations (EPA Title 22, EU Water Reuse), membrane vendor autopsy procedures, and chemical cleaning formulation benchmarks.
            </p>
          </div>

          {/* Search Query Input */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                value={searchTopicQuery}
                onChange={(e) => setSearchTopicQuery(e.target.value)}
                placeholder="Enter MBR research topic or technical standard query..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <button
              type="button"
              onClick={executeSearchGrounding}
              disabled={!searchTopicQuery.trim() || searchLoading}
              className="px-5 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-medium text-xs flex items-center justify-center gap-2 transition shadow"
            >
              {searchLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Globe className="w-3.5 h-3.5" />}
              <span>Execute Grounded Search</span>
            </button>
          </div>

          {/* Search Results Display */}
          {searchResult && (
            <div className="space-y-4">
              {/* Notice Banner if Live Search Quota Exceeded */}
              {searchResult.searchNotice && (
                <div className="p-3 rounded-lg bg-cyan-950/40 border border-cyan-800/50 text-cyan-300 text-xs font-mono flex items-center gap-2">
                  <Globe className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>{searchResult.searchNotice}</span>
                </div>
              )}

              {/* Web Sources Grid */}
              {searchResult.sources.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-cyan-300 flex items-center gap-1.5 font-mono">
                    <Globe className="w-3.5 h-3.5 text-cyan-400" />
                    <span>GROUNDED CITATIONS & WEB EVIDENCE ({searchResult.sources.length}):</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {searchResult.sources.map((src, i) => (
                      <a
                        key={i}
                        href={src.uri}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-cyan-500/50 transition flex items-start justify-between gap-2 group"
                      >
                        <div className="space-y-0.5 overflow-hidden">
                          <p className="text-xs font-medium text-slate-200 group-hover:text-cyan-300 truncate">
                            {src.title}
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono truncate">{src.uri}</p>
                        </div>
                        <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-cyan-400 flex-shrink-0 mt-0.5" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Synthesized Grounded Analysis */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Synthesized Grounded Technical Response</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    Model: gemini-3.5-flash
                  </span>
                </div>
                <div className="whitespace-pre-wrap leading-relaxed text-xs text-slate-200 space-y-2">
                  {searchResult.answer}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
