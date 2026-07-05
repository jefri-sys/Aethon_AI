import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Calendar, FileText, MessageSquare, DollarSign, Target, CheckSquare, BrainCircuit, BarChart2 } from 'lucide-react';
import './WatchDemoSection.css';

import { CinematicDeviceDemo } from './CinematicDeviceDemo.jsx';

const WatchDemoSection = ({ onWatchDemoClick }) => {
  const navigate = useNavigate();

  return (
    <section id="demo" className="demo-section">
      <div className="demo-container">
        <div className="demo-left">
          <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
            <h2 className="demo-heading">Stop Switching<br/>Between Apps</h2>
            <p className="demo-subtitle">
              Students waste time moving between disconnected tools every day. Synapse brings everything into one unified, AI-powered workspace across all your devices.
            </p>
            <ul className="demo-list">
              <li><FileText size={16}/> Notes</li>
              <li><Calendar size={16}/> Calendar</li>
              <li><MessageSquare size={16}/> Chat</li>
              <li><DollarSign size={16}/> Expenses</li>
              <li><Target size={16}/> Habits</li>
              <li><BrainCircuit size={16}/> AI</li>
              <li><CheckSquare size={16}/> Planner</li>
            </ul>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '2.5rem' }}>
              <button className="btn-primary" onClick={onWatchDemoClick}>
                Watch Demo
              </button>
              <button className="btn-secondary" onClick={() => navigate('/register')}>
                Experience Synapse <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>

        <div className="demo-right">
           <CinematicDeviceDemo />
        </div>
      </div>
    </section>
  );
};

export default WatchDemoSection;
