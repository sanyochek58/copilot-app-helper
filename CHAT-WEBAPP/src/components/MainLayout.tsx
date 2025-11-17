import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import BurgerMenu from './BurgerMenu';

const MainLayout: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="app-root">
      <header className="app-header">
        <button
          className="burger-button"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label="Меню"
        >
          ☰
        </button>
        <h1 className="app-title">Chat для бизнеса</h1>
      </header>

      <BurgerMenu open={menuOpen} onClose={() => setMenuOpen(false)} />

      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
