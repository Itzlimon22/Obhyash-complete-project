import { renderToString } from 'react-dom/server';
import React from 'react';
import DashboardPage from './app/(admin)/admin/dashboard/page.tsx';
import ClientLayout from './components/admin/layout/ClientLayout.tsx';
import { Sidebar } from './components/layout/sidebar.tsx';

try {
  renderToString(React.createElement(Sidebar, { isOpen: true, setIsOpen: () => {}, isMobile: false }));
  console.log("Sidebar rendered successfully.");
} catch (e) {
  console.error("Sidebar Error:", e);
}

try {
  renderToString(React.createElement(DashboardPage));
  console.log("Dashboard rendered successfully.");
} catch (e) {
  console.error("Dashboard Error:", e);
}

