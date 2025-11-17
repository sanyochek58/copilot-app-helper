// src/pages/Chat/ChatPage.tsx
import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  useAppContext,
  type ChatMessage,
} from '../../context/AppContext';
import { aiAPI } from '../../services/api';

const ChatPage: React.FC = () => {
  const {
    createChatSession,
    chatSessions,
    addMessageToSession,
    toggleFavoriteMessage,
  } = useAppContext();

  const { id: routeSessionId } = useParams<{ id: string }>();

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);

  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const pendingVoiceSendRef = useRef(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const [toastVisible, setToastVisible] = useState(false);
  const [toastText, setToastText] = useState('');
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const showToast = (text: string) => {
    setToastText(text);
    setToastVisible(true);
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = setTimeout(() => {
      setToastVisible(false);
    }, 2000);
  };

  /* СОЗДАНИЕ ИЛИ ПОЛУЧЕНИЕ ЧАТА */
  useEffect(() => {
    if (routeSessionId) {
      setSessionId(routeSessionId);
      return;
    }

    if (!sessionId) {
      const id = createChatSession();
      setSessionId(id);
    }
  }, [routeSessionId, sessionId, createChatSession]);

  /* АВТОСКРОЛЛ */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatSessions, sessionId]);

  const currentSession =
    sessionId != null
      ? chatSessions.find((s) => s.id === sessionId) ?? null
      : null;

  /* ОТПРАВКА СООБЩЕНИЯ (реальный AI сервис) */
  const handleSend = async () => {
    const text = input.trim();
    if (!text || !sessionId || isSending || isListening) return;

    const now = new Date().toISOString();

    const userMessage: ChatMessage = {
      id: crypto.randomUUID ? crypto.randomUUID() : `${now}-u`,
      role: 'user',
      content: text,
      createdAt: now,
    };

    setInput('');
    addMessageToSession(sessionId, userMessage);

    // проверим, что токен вообще есть (иначе AI-сервис вернёт 401)
    const token = localStorage.getItem('auth_token');
    if (!token) {
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID ? crypto.randomUUID() : `${now}-noauth`,
        role: 'assistant',
        content:
          'Вы не авторизованы. Пожалуйста, войдите в систему ещё раз.',
        createdAt: new Date().toISOString(),
      };
      addMessageToSession(sessionId, errorMessage);
      return;
    }

    setIsSending(true);
    try {
      const response = await aiAPI.chat({
        message: text,
        mode: 'copilot', // режим, который ты используешь в ChatService
      });

      const replyText =
        response.data?.reply ||
        'Модель не вернула текст ответа, попробуйте ещё раз.';

      const botMessage: ChatMessage = {
        id: crypto.randomUUID ? crypto.randomUUID() : `${now}-a`,
        role: 'assistant',
        content: replyText,
        createdAt: new Date().toISOString(),
      };
      addMessageToSession(sessionId, botMessage);
    } catch (error: any) {
      console.error('Chat error:', error);

      const backendMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        null;

      const errorText =
        backendMessage ??
        'Произошла ошибка при обращении к AI-сервису. Попробуйте позже.';

      const errorMessage: ChatMessage = {
        id: crypto.randomUUID ? crypto.randomUUID() : `${now}-e`,
        role: 'assistant',
        content: errorText,
        createdAt: new Date().toISOString(),
      };
      addMessageToSession(sessionId, errorMessage);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (
    e,
  ) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  /* КОПИРОВАНИЕ */
  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast('Сообщение скопировано');
    } catch {
      // опционально можно добавить обработку
    }
  };

  /* ИЗБРАННОЕ */
  const handleToggleFavorite = (messageId: string) => {
    if (!sessionId) return;

    const msg = currentSession?.messages.find((m) => m.id === messageId);
    const wasFavorite = !!msg?.isFavorite;

    toggleFavoriteMessage(sessionId, messageId);

    showToast(
      wasFavorite ? 'Удалено из избранного' : 'Добавлено в избранное',
    );
  };

  /* ГОЛОСОВОЙ ВВОД */
  const initRecognition = () => {
    if (recognitionRef.current) return recognitionRef.current;

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) return null;

    const recognition = new SpeechRecognition();
    recognition.lang = 'ru-RU';
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
    };

    recognition.onerror = () => {
      setIsListening(false);
      pendingVoiceSendRef.current = false;
    };

    recognition.onend = () => {
      setIsListening(false);
      if (pendingVoiceSendRef.current) {
        pendingVoiceSendRef.current = false;
        handleSend();
      }
    };

    recognitionRef.current = recognition;
    return recognition;
  };

  const startListening = () => {
    const recognition = initRecognition();
    if (!recognition) {
      alert('Голосовой ввод не поддерживается в этом браузере');
      return;
    }

    pendingVoiceSendRef.current = false;
    setInput('');
    try {
      recognition.start();
      setIsListening(true);
    } catch {
      // может бросить, если уже запущен
    }
  };

  const stopListening = (shouldSend: boolean) => {
    const recognition = initRecognition();
    if (!recognition) return;

    pendingVoiceSendRef.current = shouldSend;
    try {
      recognition.stop();
    } catch {
      pendingVoiceSendRef.current = false;
    }
  };

  // мышь (desktop)
  const handleMicMouseDown: React.MouseEventHandler<HTMLButtonElement> = (
    e,
  ) => {
    if ('ontouchstart' in window) return;
    e.preventDefault();
    startListening();
  };

  const handleMicMouseUp: React.MouseEventHandler<HTMLButtonElement> = (
    e,
  ) => {
    if ('ontouchstart' in window) return;
    e.preventDefault();
    if (isListening) stopListening(true);
  };

  // тач (мобильные / Telegram WebView)
  const handleMicTouchStart: React.TouchEventHandler<HTMLButtonElement> = (
    e,
  ) => {
    e.preventDefault();
    startListening();
  };

  const handleMicTouchEnd: React.TouchEventHandler<HTMLButtonElement> = (
    e,
  ) => {
    e.preventDefault();
    if (isListening) stopListening(true);
  };

  return (
    <div className="chat-page">
      {/* СООБЩЕНИЯ */}
      <div className="chat-messages">
        {currentSession?.messages.map((m) => (
          <div
            key={m.id}
            className={`chat-message chat-message--${m.role}`}
          >
            <div className="chat-message__bubble">
              <div className="chat-message__content">{m.content}</div>

              {m.role === 'assistant' && (
                <div className="chat-message__actions">
                  <button
                    type="button"
                    className="icon-button"
                    onClick={() => handleCopy(m.content)}
                    title="Скопировать текст"
                  >
                    📋
                  </button>

                  <button
                    type="button"
                    className="icon-button"
                    onClick={() => handleToggleFavorite(m.id)}
                    title="В избранное"
                  >
                    {m.isFavorite ? '⭐' : '☆'}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* ПАНЕЛЬ ВВОДА / СЛУШАЮ */}
      <div className="chat-input-bar">
        <button
          type="button"
          className={`icon-button mic-button ${
            isListening ? 'mic-button--active' : ''
          }`}
          onMouseDown={handleMicMouseDown}
          onMouseUp={handleMicMouseUp}
          onTouchStart={handleMicTouchStart}
          onTouchEnd={handleMicTouchEnd}
          title="Удерживайте, чтобы говорить"
        >
          🎤
        </button>

        {isListening ? (
          <div className="chat-input chat-input--listening">
            <span className="listening-text">Говорите…</span>
            <div className="listening-dots">
              <span />
              <span />
              <span />
            </div>
          </div>
        ) : (
          <textarea
            className="chat-input"
            placeholder="Опишите задачу или задайте вопрос..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
          />
        )}

        <button
          type="button"
          className="primary-button send-button"
          onClick={handleSend}
          disabled={!input.trim() || isSending || isListening}
        >
          ➤
        </button>
      </div>

      {/* ТОСТ */}
      {toastVisible && <div className="toast">{toastText}</div>}
    </div>
  );
};

export default ChatPage;
