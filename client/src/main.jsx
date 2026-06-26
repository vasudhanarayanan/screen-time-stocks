import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App.jsx';
import Dashboard from './pages/Dashboard.jsx';
import LogTime from './pages/LogTime.jsx';
import StockDetail from './pages/StockDetail.jsx';
import Leaderboard from './pages/Leaderboard.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<Dashboard />} />
          <Route path="log" element={<LogTime />} />
          <Route path="stock/:appId" element={<StockDetail />} />
          <Route path="leaderboard/:marketId" element={<Leaderboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
