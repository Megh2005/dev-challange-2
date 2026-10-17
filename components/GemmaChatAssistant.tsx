"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  initGemmaEngine,
  resetGemmaConversation,
  isGemmaEngineLoaded,
  streamGemmaChat,
  cancelGemmaGeneration,
  checkWebGpuSupport,
} from "@/lib/gemmaLiteRtEngine";
import { ModelState, ChatMessage, GEMMA_MODEL_CONFIG } from "@/types/gemma";
import {
  CpuIcon,
  MessageSquareIcon,
  CloseIcon,
  SendIcon,
  AlertCircleIcon,
  HardDriveIcon,
  RefreshCwIcon,
} from "./icons";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  contextTitle?: string;
  clinicalContext?: string | null;
  suggestedQuestions?: string[];
}

export default function GemmaChatAssistant({
  isOpen,
  onClose,
  contextTitle = "Clinical Consultation",
  clinicalContext,
  suggestedQuestions = [
    "Explain the food timing and dosage safety rules for these medicines.",
    "Are there any drug-drug interactions or contraindications to watch out for?",
    "Explain what the out-of-range lab markers portray about my health.",
    "What specific questions should I ask my doctor during follow-up?",
  ],
}: Props) {
  const [modelState, setModelState] = useState<ModelState>("unloaded");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [webGpuStatus, setWebGpuStatus] = useState<{
    supported: boolean;
    message: string;
  }>({ supported: true, message: "Checking WebGPU..." });

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const localFileInputRef = useRef<HTMLInputElement>(null);

  // Check WebGPU state on mount
  useEffect(() => {
    checkWebGpuSupport().then((status) => {
      setWebGpuStatus(status);
    });

    if (isGemmaEngineLoaded()) {
      setModelState("ready");
    }
  }, []);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle Local File Selection
  const handleSelectLocalModelFile = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];

    setErrorMessage(null);
    setModelState("loading");

    try {
      await initGemmaEngine(file);
      setModelState("ready");

      setMessages([
        {
          id: `msg_${Date.now()}`,
          role: "assistant",
          content: `Gemma 4 E2B loaded locally from ${file.name}. Your on-device session is ready with full privacy.`,
          timestamp: Date.now(),
        },
      ]);
    } catch (err: any) {
      console.error("Local file loading error:", err);
      setModelState("error");
      setErrorMessage(
        err?.message ||
          "Failed to initialize LiteRT LM WebGPU engine with selected file."
      );
    }
  };

  // Send Chat Message
  const handleSendMessage = async (textToSend?: string) => {
    const prompt = (textToSend || inputText).trim();
    if (!prompt) return;

    if (modelState !== "ready") {
      setErrorMessage("Please load the Gemma model first to begin on-device chat.");
      return;
    }

    const userMessage: ChatMessage = {
      id: `usr_${Date.now()}`,
      role: "user",
      content: prompt,
      timestamp: Date.now(),
    };

    const assistantMsgId = `ast_${Date.now()}`;
    const initialAssistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: "assistant",
      content: "",
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage, initialAssistantMsg]);
    setInputText("");
    setModelState("generating");
    setErrorMessage(null);

    try {
      const generator = streamGemmaChat(prompt, clinicalContext);

      for await (const chunk of generator) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId ? { ...msg, content: chunk.text } : msg
          )
        );
      }

      setModelState("ready");
    } catch (err: any) {
      console.error("Inference generation error:", err);
      setModelState("ready");
      setErrorMessage(
        err?.message ||
          "An error occurred during Gemma inference. Conversation context was preserved."
      );
    }
  };

  // Cancel generation
  const handleCancelGeneration = () => {
    cancelGemmaGeneration();
    setModelState("ready");
  };

  // Reset conversation
  const handleResetConversation = async () => {
    await resetGemmaConversation();
    setMessages([
      {
        id: `msg_${Date.now()}`,
        role: "assistant",
        content:
          "Conversation history has been reset. The Gemma engine remains loaded in WebGPU memory.",
        timestamp: Date.now(),
      },
    ]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl h-full bg-white text-black flex flex-col shadow-2xl border-l-2 border-slate-300">
        {/* Header Bar */}
        <div className="p-4 sm:p-5 border-b-2 border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-700 text-white flex items-center justify-center font-bold">
              <CpuIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-extrabold text-black">
                  Gemma On-Device Clinical Assistant
                </h2>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-blue-100 text-blue-900 border border-blue-300 uppercase tracking-wider">
                  WebGPU On-Device
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Gemma 4 E2B via @litert-lm/core - Zero Cloud Data Leakage
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {modelState === "ready" && (
              <button
                type="button"
                onClick={handleResetConversation}
                title="Reset conversation"
                className="p-2 rounded-lg text-slate-600 hover:text-black hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <RefreshCwIcon className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              title="Close Assistant"
              className="p-2 rounded-lg text-slate-600 hover:text-black hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <CloseIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Model State & Engine Loader Banner */}
        {modelState !== "ready" && modelState !== "generating" && (
          <div className="p-6 bg-slate-100 border-b border-slate-200 space-y-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Model Status: {modelState.toUpperCase()}
                </span>
              </div>
              <h3 className="text-base font-extrabold text-black">
                Load Gemma 4 E2B into Browser WebGPU
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                MediScan executes Google&apos;s open-weights Gemma 4 E2B model
                directly on your device using LiteRT LM and WebGPU. Select your
                downloaded .litertlm file below to activate on-device inference.
              </p>
            </div>

            {modelState === "loading" && (
              <div className="p-3 bg-white border border-slate-300 rounded-xl flex items-center space-x-3 text-xs font-bold text-slate-700">
                <span className="w-4 h-4 border-2 border-blue-700 border-t-transparent rounded-full animate-spin"></span>
                <span>
                  Initializing WebGPU execution pipelines and allocating KV
                  cache...
                </span>
              </div>
            )}

            {/* Action Buttons to Load */}
            {modelState === "unloaded" && (
              <div className="space-y-3 pt-1">
                <input
                  type="file"
                  ref={localFileInputRef}
                  accept=".litertlm"
                  onChange={handleSelectLocalModelFile}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => localFileInputRef.current?.click()}
                  disabled={!webGpuStatus.supported}
                  className="w-full py-3.5 px-4 rounded-xl bg-slate-900 text-white font-extrabold text-sm hover:bg-black disabled:opacity-50 transition-colors flex items-center justify-center space-x-2 shadow-sm cursor-pointer"
                >
                  <HardDriveIcon className="w-4 h-4 text-blue-400" />
                  <span>Select Local Gemma 4 E2B (.litertlm)</span>
                </button>

                <div className="text-center pt-1">
                  <a
                    href={GEMMA_MODEL_CONFIG.huggingFaceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-blue-700 hover:text-blue-900 underline inline-flex items-center space-x-1"
                  >
                    <span>Download Gemma 4 E2B model binary from website</span>
                  </a>
                </div>
              </div>
            )}

            {/* WebGPU Status Check */}
            {!webGpuStatus.supported && (
              <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs font-medium flex items-start space-x-2">
                <AlertCircleIcon className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{webGpuStatus.message}</span>
              </div>
            )}
          </div>
        )}

        {/* Clinical Context Reference Header */}
        {clinicalContext && (
          <div className="px-4 py-2.5 bg-blue-50 border-b border-blue-200 text-xs text-blue-900 flex items-center justify-between">
            <span className="font-bold truncate">
              Active Context: {contextTitle}
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-200 text-blue-950 rounded">
              Report Data Loaded
            </span>
          </div>
        )}

        {/* Conversation Message List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-white">
          {messages.length === 0 && (
            <div className="text-center py-10 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-300 text-slate-600 mx-auto flex items-center justify-center">
                <MessageSquareIcon className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-black">
                {modelState === "ready"
                  ? "Ask your on-device Gemma assistant anything."
                  : "Load Gemma 4 E2B above to start your private consultation."}
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                You can inquire about medicine interactions, food timing, lab
                parameter interpretations, or safe home-care habits.
              </p>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.role === "user" ? "items-end" : "items-start"
              }`}
            >
              <div className="flex items-center space-x-1.5 mb-1 px-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                  {msg.role === "user" ? "You" : "Gemma Clinical Companion"}
                </span>
                <span className="text-[10px] text-slate-400">
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              <div
                className={`max-w-[88%] p-4 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-sans ${
                  msg.role === "user"
                    ? "bg-blue-700 text-white font-medium rounded-tr-none shadow-sm"
                    : "bg-slate-100 text-black border border-slate-200 rounded-tl-none font-normal"
                }`}
              >
                {msg.content || (
                  <span className="inline-flex items-center space-x-1.5 text-slate-500 italic">
                    <span className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></span>
                    <span>Formulating clinical response...</span>
                  </span>
                )}
              </div>
            </div>
          ))}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Quick Questions */}
        {modelState === "ready" && suggestedQuestions.length > 0 && (
          <div className="p-3 border-t border-slate-200 bg-slate-50 overflow-x-auto">
            <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">
              Suggested Clinical Inquiries
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(q)}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-200 hover:text-black text-left transition-colors truncate max-w-xs cursor-pointer"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Error message banner */}
        {errorMessage && (
          <div className="px-4 py-2.5 bg-red-50 border-t border-red-200 text-red-900 text-xs font-medium flex items-center justify-between">
            <span className="truncate pr-2">{errorMessage}</span>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-xs font-bold underline shrink-0 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Input Bar */}
        <div className="p-3 sm:p-4 border-t-2 border-slate-200 bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center space-x-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={modelState !== "ready" && modelState !== "generating"}
              placeholder={
                modelState === "ready"
                  ? "Ask about dosage, interactions, or test markers..."
                  : "Please load Gemma model above to ask questions..."
              }
              className="flex-1 py-3 px-4 rounded-xl border border-slate-300 bg-white text-black text-xs sm:text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-slate-100 disabled:text-slate-400"
            />

            {modelState === "generating" ? (
              <button
                type="button"
                onClick={handleCancelGeneration}
                className="py-3 px-4 rounded-xl bg-red-600 text-white font-bold text-xs hover:bg-red-700 transition-colors cursor-pointer"
              >
                Stop
              </button>
            ) : (
              <button
                type="submit"
                disabled={modelState !== "ready" || !inputText.trim()}
                className="p-3 rounded-xl bg-blue-700 text-white font-bold text-sm hover:bg-blue-800 disabled:opacity-40 transition-colors cursor-pointer"
                title="Send Message"
              >
                <SendIcon className="w-4 h-4" />
              </button>
            )}
          </form>

          <p className="text-[10px] text-slate-400 text-center mt-2">
            Clinical AI responses are informational. Always verify medication
            changes with your physician.
          </p>
        </div>
      </div>
    </div>
  );
}
