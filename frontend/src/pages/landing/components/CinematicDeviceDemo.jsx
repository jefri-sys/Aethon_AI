import React, { useEffect, useState } from 'react';
import { 
  ArrowRight, Calendar, FileText, MessageSquare, DollarSign, 
  Target, CheckSquare, BrainCircuit, BarChart2, Globe, Sparkles 
} from 'lucide-react';
import './CinematicDeviceDemo.css';

export const CinematicDeviceDemo = () => {
  const [scene, setScene] = useState(1);

  useEffect(() => {
    let timers = [];
    const runSequence = () => {
      setScene(1);
      timers.push(setTimeout(() => setScene(2), 5000));
      timers.push(setTimeout(() => setScene(3), 8000));
      timers.push(setTimeout(() => setScene(4), 14000));
      timers.push(setTimeout(() => setScene(5), 20000));
      timers.push(setTimeout(() => setScene(6), 28000));
      timers.push(setTimeout(() => setScene(7), 32000));
      timers.push(setTimeout(() => setScene(8), 35000));
      timers.push(setTimeout(() => setScene(9), 39000));
      timers.push(setTimeout(() => setScene(10), 46000));
      timers.push(setTimeout(() => setScene(11), 50000));
      timers.push(setTimeout(() => setScene(12), 55000));
      timers.push(setTimeout(runSequence, 60000));
    };
    runSequence();
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className={`device-animation-container scene-${scene}`}>
      {/* Subtle Slow Parallax Camera Effect */}
      <div className="camera-rig">
        {/* Ambient Glows */}
        <div className="ambient-glow glow-blue"></div>
        <div className="ambient-glow glow-violet"></div>

        {/* Laptop Device */}
        <div className="device-laptop">
          <div className="laptop-screen">
            <div className="laptop-inner-screen">
              
              {/* Scene 1: Boot & Dashboard */}
              <div className="laptop-content layer-boot">
                <div className="boot-logo">◎</div>
                <div className="boot-text">Synapse</div>
                <div className="boot-subtext">Student Operating System</div>
              </div>

              <div className="laptop-content layer-dashboard">
                <div className="dash-header">
                  <div className="dash-greeting">Good Morning, Jefri 👋</div>
                </div>
                <div className="dash-widgets">
                  <div className="widget w-exam">
                    <span className="w-label">Exam in 3 days</span>
                    <span className="w-val">3 Study Sessions</span>
                  </div>
                  <div className="widget w-budget">
                    <span className="w-label">Budget Remaining</span>
                    <span className="w-val">₹2,150</span>
                  </div>
                  <div className="widget w-readiness">
                    <span className="w-label">Exam Readiness</span>
                    <span className="w-val readiness-val">84%</span>
                  </div>
                </div>

                {/* Scene 2: AI Morning Brief */}
                <div className="ai-brief-widget">
                  <Sparkles size={14} className="ai-icon" />
                  <div className="ai-streaming-text">
                    <p className="line-1">Good morning.</p>
                    <p className="line-2">Yesterday: ✓ 2.4 study hours</p>
                    <p className="line-3">Today's priorities:</p>
                    <p className="line-4">• Operating Systems (2 hrs)</p>
                    <p className="line-5">• DBMS (1 hr)</p>
                    <p className="line-6">You're on track for your target CGPA.</p>
                  </div>
                </div>
              </div>

              {/* Scene 3 & 4: Notebook */}
              <div className="laptop-content layer-notebook">
                <div className="notebook-sidebar">
                  <div className="nav-item active"><FileText size={12}/> OS</div>
                  <div className="nav-item"><FileText size={12}/> DBMS</div>
                </div>
                <div className="notebook-main">
                  <div className="pdf-drop-zone">
                    <FileText size={24} />
                    <span>OperatingSystems.pdf</span>
                    <div className="progress-bar"><div className="fill"></div></div>
                    <div className="progress-text">Extracting Text...</div>
                  </div>
                  
                  <div className="document-preview">
                    <div className="doc-page">
                      <div className="doc-title">Operating Systems - Deadlocks</div>
                      <div className="doc-lines">
                        <div className="d-line"></div>
                        <div className="d-line w-80"></div>
                        <div className="d-line w-90"></div>
                      </div>
                    </div>
                  </div>

                  <div className="ai-insight-panel">
                    <div className="insight-item i-1">✓ Summary Generated</div>
                    <div className="insight-item i-2">✓ Flashcards Created</div>
                    <div className="insight-item i-3">✓ Quiz Generated</div>
                    <div className="insight-item i-4">✓ Weak Topics Identified</div>
                    <div className="blue-pulse-ring"></div>
                  </div>
                </div>
              </div>

              {/* Scene 5: Ask AI */}
              <div className="laptop-content layer-ai-chat">
                <div className="chat-window">
                  <div className="chat-message user">Explain Deadlocks</div>
                  <div className="chat-message ai stream-chat">
                    Deadlock occurs when...<span className="cursor-blink">▋</span>
                  </div>
                  <div className="chat-message user delay-1">Generate Quiz</div>
                  <div className="chat-message ai delay-2 quiz-card">
                    <div>Quiz: Deadlocks</div>
                    <div className="q-score">8 / 10</div>
                  </div>
                </div>
              </div>

              {/* Scene 6: Smart Planner */}
              <div className="laptop-content layer-planner">
                <div className="planner-banner">
                  <Sparkles size={12} /> Creating Revision Plan...
                </div>
                <div className="planner-grid">
                  <div className="p-day">
                    <span>Friday</span>
                    <div className="p-event new-event">Operating Systems (7 PM)</div>
                  </div>
                  <div className="p-day">
                    <span>Saturday</span>
                    <div className="p-event new-event delay-1">Flashcards (30 mins)</div>
                  </div>
                  <div className="p-day">
                    <span>Sunday</span>
                    <div className="p-event new-event delay-2">Mock Quiz</div>
                  </div>
                </div>
              </div>

              {/* Scene 7: Habits */}
              <div className="laptop-content layer-habits">
                <div className="habit-card">
                  <span className="h-label">Today's Goal</span>
                  <span className="h-title">Study 2 Hours</span>
                  <div className="h-checkbox">✓</div>
                </div>
                <div className="habit-streak">
                  16 Days 🔥
                </div>
              </div>

              {/* Scene 8: Finance */}
              <div className="laptop-content layer-finance">
                <div className="quick-capture">
                  <span>Books</span>
                  <span>₹650</span>
                </div>
                <div className="budget-widget">
                  <svg viewBox="0 0 36 36" className="circular-chart">
                    <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <path className="circle-progress f-prog" strokeDasharray="78, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  </svg>
                  <div className="budget-val">78%</div>
                </div>
                <div className="finance-ai-note">Still within your monthly budget.</div>
              </div>

              {/* Scene 10: Collaboration */}
              <div className="laptop-content layer-collab">
                <div className="notification-toast">
                  <span className="n-avatar">R</span>
                  <div className="n-content">
                    <span className="n-title">Rohan Shared</span>
                    <span className="n-desc">OS Summary</span>
                  </div>
                  <div className="n-btn">Save to Notebook</div>
                </div>
                <div className="collab-ai-note">Merged into your notes.</div>
              </div>

              {/* Scene 11: Weekly Report */}
              <div className="laptop-content layer-report">
                <div className="report-header">Weekly Report</div>
                <div className="report-grid">
                  <div className="r-card">Study <br/> 18.2 hrs</div>
                  <div className="r-card">Habits <br/> 92%</div>
                  <div className="r-card">Budget <br/> Excellent</div>
                  <div className="r-card trend">CGPA Trend <br/> ↑</div>
                </div>
                <div className="report-charts">
                  <div className="bar b1"></div>
                  <div className="bar b2"></div>
                  <div className="bar b3"></div>
                  <div className="bar b4"></div>
                  <div className="bar b5"></div>
                </div>
                <div className="confetti"></div>
              </div>

              {/* Scene 12: Ending Network Sync */}
              <div className="laptop-content layer-ending">
                <div className="sync-network">
                  <div className="n-node n-notes"><FileText size={12}/></div>
                  <div className="n-node n-ai"><BrainCircuit size={16}/></div>
                  <div className="n-node n-planner"><Calendar size={12}/></div>
                  <div className="n-node n-analytics"><BarChart2 size={12}/></div>
                  <div className="n-node n-habits"><Target size={12}/></div>
                  <div className="n-node n-finance"><DollarSign size={12}/></div>
                  
                  <svg className="sync-lines" preserveAspectRatio="none" viewBox="0 0 200 150">
                    <path d="M 50 30 L 100 75" className="s-line l1"/>
                    <path d="M 100 75 L 50 120" className="s-line l2"/>
                    <path d="M 100 75 L 150 120" className="s-line l3"/>
                    <path d="M 150 30 L 100 75" className="s-line l4"/>
                  </svg>
                </div>
                <div className="ending-text">
                  One Workspace.<br/>Every Student Tool.<br/>Powered by AI.
                </div>
              </div>

              {/* Cursor Simulation */}
              <div className="simulated-cursor"></div>

            </div>
          </div>
          <div className="laptop-base">
            <div className="laptop-trackpad"></div>
          </div>
        </div>

        {/* Smartphone Device */}
        <div className="device-phone">
          <div className="phone-screen">
            <div className="phone-inner-screen">
              <div className="phone-notch"></div>
              
              <div className="phone-notification">
                <span className="pn-title">Synapse</span>
                <span className="pn-desc">Study Session in 15m</span>
              </div>

              <div className="phone-app-ui">
                <div className="p-header">Planner</div>
                <div className="p-card">
                  <span className="p-card-title">Operating Systems</span>
                  <div className="p-card-btn">Complete</div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
