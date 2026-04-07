import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';

// SVG Icons matching Breeze design
const IconCards = ({ active }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5}>
    <rect x="3" y="3" width="8" height="10" rx="2"/>
    <rect x="13" y="3" width="8" height="10" rx="2"/>
    <rect x="3" y="16" width="8" height="5" rx="2"/>
    <rect x="13" y="16" width="8" height="5" rx="2"/>
  </svg>
);

const IconHeart = ({ active }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 2 : 1.5}>
    <path d="M12 21C12 21 3 14.5 3 8.5C3 5.42 5.42 3 8.5 3C10.24 3 11.91 3.81 13 5.08C14.09 3.81 15.76 3 17.5 3C20.58 3 23 5.42 23 8.5C23 14.5 14 21 12 21Z"/>
    {!active && <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none"/>}
  </svg>
);

const IconPerson = ({ active }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5}>
    <circle cx="12" cy="8" r="4"/>
    <path d="M4 20c0-4 3.58-7 8-7s8 3 8 7"/>
  </svg>
);

export default function Layout() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
      <div className="page-content">
        <Outlet />
      </div>

      <nav className="bottom-nav">
        <NavLink to="/home" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          {({ isActive }) => (
            <>
              <IconCards active={isActive} />
              {isActive && <span className="nav-dot" />}
            </>
          )}
        </NavLink>

        <NavLink to="/likes" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          {({ isActive }) => (
            <>
              <IconHeart active={isActive} />
              {isActive && <span className="nav-dot" />}
            </>
          )}
        </NavLink>

        <NavLink to="/profile" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          {({ isActive }) => (
            <>
              <IconPerson active={isActive} />
              {isActive && <span className="nav-dot" />}
            </>
          )}
        </NavLink>
      </nav>
    </div>
  );
}
