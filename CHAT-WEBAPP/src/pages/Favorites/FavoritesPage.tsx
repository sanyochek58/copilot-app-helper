import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import type { ChatSession } from '../../context/AppContext';
import copyIcon from '../../assets/copy.png';
import crossIcon from '../../assets/cross.png';

const FavoritesPage: React.FC = () => {
  const { chatSessions, toggleFavoriteMessage } = useAppContext();
  const navigate = useNavigate();

  const favorites = chatSessions
    .flatMap((session) =>
      session.messages
        .filter((m) => m.isFavorite)
        .map((m) => ({
          sessionId: session.id,
          messageId: m.id,
          createdAt: m.createdAt,
          content: m.content,
          title: getSessionTitle(session),
        })),
    )
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  const handleOpenChat = (sessionId: string) => {
    navigate(`/chat/${sessionId}`);
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // тут можно позже прокинуть глобальный тост
    } catch {
      // ignore
    }
  };

  const handleRemoveFavorite = (sessionId: string, messageId: string) => {
    toggleFavoriteMessage(sessionId, messageId);
  };

  if (!favorites.length) {
    return (
      <div className="favorites-empty">
        <h2>Избранное</h2>
        <p>
          Пока нет избранных сообщений. Нажмите ⭐ в ответе бота, чтобы
          добавить.
        </p>
      </div>
    );
  }

  return (
    <div className="favorites-page">
      <h2 className="favorites-title">Избранное</h2>
      <div className="favorites-list">
        {favorites.map((fav) => (
          <div key={fav.messageId} className="favorite-item">
            <div className="favorite-item__header">
              <button
                type="button"
                className="favorite-chat-link"
                onClick={() => handleOpenChat(fav.sessionId)}
              >
                {fav.title}
              </button>
              <span className="favorite-date">
                {new Date(fav.createdAt).toLocaleString('ru-RU', {
                  day: '2-digit',
                  month: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>

            <div className="favorite-content">{fav.content}</div>

            <div className="favorite-actions">
              <button
                type="button"
                className="icon-button"
                onClick={() => handleCopy(fav.content)}
              >
                <img src={copyIcon} className="icon" alt="copy" />
              </button>
              <button
                type="button"
                className="icon-button icon-button--danger"
                onClick={() =>
                  handleRemoveFavorite(fav.sessionId, fav.messageId)
                }
              >
                <img src={crossIcon} className="icon" alt="remove" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FavoritesPage;

function getSessionTitle(session: ChatSession): string {
  const firstUserMessage = session.messages.find((m) => m.role === 'user');

  if (firstUserMessage?.content) {
    const text = firstUserMessage.content.trim();
    if (text.length > 50) return text.slice(0, 50) + '…';
    return text;
  }

  const date = new Date(session.createdAt);
  return (
    'Чат от ' +
    date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  );
}
