import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

type Props = {
  open: boolean;
  onClose: () => void;
};

const BurgerMenu: React.FC<Props> = ({ open, onClose }) => {
  const navigate = useNavigate();

  const handleNewChat = () => {
    navigate('/chat');
    onClose();
  };

  return (
    <div
      className={`burger-menu ${open ? 'open' : ''}`}
      onClick={onClose}
    >
      <div
        className="burger-menu__panel"
        onClick={(e) => e.stopPropagation()}
      >
        <nav className="burger-nav">
          <ul className="burger-nav__list">
            <li>
              <Link to="/profile" onClick={onClose}>
                Профиль
              </Link>
            </li>
            <li>
              <Link to="/companies" onClick={onClose}>
                Мои компании
              </Link>
            </li>
            <li>
              <Link to="/calendar" onClick={onClose}>
                Мой календарь
              </Link>
            </li>
            <li>
              <Link to="/favorites" onClick={onClose}>
                Избранное
              </Link>
            </li>
          </ul>
        </nav>

        <button
          type="button"
          className="secondary-button burger-new-chat"
          onClick={handleNewChat}
        >
          Новый чат
        </button>
      </div>
    </div>
  );
};

export default BurgerMenu;