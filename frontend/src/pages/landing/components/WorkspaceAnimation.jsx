import React, { useEffect, useState } from 'react';
import { 
  ArrowRight, Calendar, FileText, MessageSquare, DollarSign, 
  Target, CheckSquare, BrainCircuit, BarChart2, Briefcase, FileSearch, Download, BookOpen
} from 'lucide-react';
import './WorkspaceAnimation.css';

export const WorkspaceAnimation = () => {
  const [scene, setScene] = useState(1);

  useEffect(() => {
    let timers = [];
    const runSequence = () => {
      setScene(1); // 0-8s Boot
      timers.push(setTimeout(() => setScene(2), 8000)); // 8-15s Dash
      timers.push(setTimeout(() => setScene(3), 15000)); // 15-24s Notebook
      timers.push(setTimeout(() => setScene(4), 24000)); // 24-34s Chat
      timers.push(setTimeout(() => setScene(5), 34000)); // 34-50s Vault
      timers.push(setTimeout(() => setScene(6), 50000)); // 50-62s Resume
      timers.push(setTimeout(() => setScene(7), 62000)); // 62-72s Resume Intel
      
      timers.push(setTimeout(() => setScene(8), 72000)); // 72-75s Study Groups Click
      timers.push(setTimeout(() => setScene(9), 75000)); // 75-79s Live Room
      timers.push(setTimeout(() => setScene(10), 79000)); // 79-85s AI Notebook Share
      timers.push(setTimeout(() => setScene(11), 85000)); // 85-89s AI Summary Gen
      timers.push(setTimeout(() => setScene(12), 89000)); // 89-96s Mobile Sync React
      
      timers.push(setTimeout(() => setScene(13), 96000)); // 96-104s Weekly Report
      timers.push(setTimeout(() => setScene(14), 104000)); // 104-110s Final
      timers.push(setTimeout(runSequence, 110000)); // Loop
    };
    runSequence();
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className={`cinematic-short-film scene-${scene}`}>
      <div className="film-environment">
        
        {/* MacBook */}
        <div className="film-laptop">
          <div className="film-laptop-screen">
            <div className="film-laptop-inner">
              
              {/* Scene 1: Start the Day */}
              <div className="film-layer layer-s1">
                <div className="browser-bar">
                  <div className="traffic-lights"><span></span><span></span><span></span></div>
                  <div className="search-bar">www.aethon.com</div>
                </div>
                <div className="browser-content">
                  <div className="boot-seq">
                    <div className="b-logo">◎</div>
                    <div className="b-title">AETHON</div>
                    <div className="b-sub">Student Operating System</div>
                    <div className="b-neural-glow"></div>
                  </div>
                </div>
              </div>

              {/* Scene 2: Dashboard */}
              <div className="film-layer layer-s2">
                <div className="dash-ui">
                  <div className="d-greeting">Good Morning, Jefri 👋</div>
                  <div className="d-widgets">
                    <div className="dw w1"><span className="l">Exam in 3 Days</span><span className="v">3 Sessions</span></div>
                    <div className="dw w2"><span className="l">Budget Remaining</span><span className="v">₹2,150</span></div>
                    <div className="dw w3"><span className="l">Exam Readiness</span><span className="v d-readiness">84%</span></div>
                  </div>
                  <div className="d-ai-brief">
                    <div className="aib-head">Good morning.</div>
                    <div className="aib-body">
                      Yesterday: ✓ Studied 2.6 hours<br/><br/>
                      Today's priority:<br/>
                      • Operating Systems<br/>
                      • DBMS<br/>
                      • Placement Preparation<br/><br/>
                      <span className="aib-highlight">You're on track for your target CGPA.</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Scene 3: Notebook */}
              <div className="film-layer layer-s3">
                <div className="notebook-ui">
                  <div className="nb-drop">
                    <FileText size={32}/>
                    <span>OperatingSystems.pdf</span>
                    <div className="nb-prog"><div className="nb-prog-fill"></div></div>
                    <span className="nb-prog-txt">Extracting Text...</span>
                  </div>
                  <div className="nb-doc">
                    <div className="doc-page-turn">
                      <div className="dt-title">Deadlocks</div>
                      <div className="dt-lines">
                        <div className="dt-l w90"></div><div className="dt-l w80"></div>
                        <div className="dt-l w95"></div><div className="dt-l w70"></div>
                      </div>
                    </div>
                  </div>
                  <div className="nb-ai-side">
                    <div className="ais-item t1">✓ Summary Generated</div>
                    <div className="ais-item t2">✓ Flashcards Created</div>
                    <div className="ais-item t3">✓ Quiz Ready</div>
                    <div className="ais-item t4">✓ Key Topics Identified</div>
                    <div className="ais-planner">Today: OS (2 Hours)</div>
                  </div>
                </div>
              </div>

              {/* Scene 4: AI Conversation */}
              <div className="film-layer layer-s4">
                <div className="chat-ui">
                  <div className="msg usr">Explain Deadlocks like I'm a beginner.</div>
                  <div className="msg ai stream">Deadlocks occur when...<span className="blink">▋</span></div>
                  <div className="msg usr m-delay1">Generate Quiz</div>
                  <div className="msg ai quiz-card m-delay2">
                    <div className="qc-title">Quiz: Operating Systems</div>
                    <div className="qc-ans">Selected Answer ✓</div>
                    <div className="qc-score">8 / 10</div>
                  </div>
                </div>
                <div className="mini-analytics">
                  <span>Readiness</span>
                  <div className="ma-score">89% <ArrowRight size={12}/> 91%</div>
                  <div className="ma-graph"></div>
                </div>
              </div>

              {/* Scene 5: Career Vault */}
              <div className="film-layer layer-s5">
                <div className="vault-sidebar">
                  <div className="vs-item"><Briefcase size={12}/> Certificates</div>
                  <div className="vs-item"><Briefcase size={12}/> Projects</div>
                  <div className="vs-item"><Briefcase size={12}/> Internships</div>
                  <div className="vs-item"><Briefcase size={12}/> Academic Records</div>
                </div>
                <div className="vault-main">
                  <div className="v-uploading">
                    Semester6Marksheet.pdf<br/>
                    AWS Certificate.pdf<br/>
                    Hackathon Certificate.pdf
                    <div className="nb-prog"><div className="nb-prog-fill p-slow"></div></div>
                  </div>
                  <div className="v-extracted">
                    <div className="ve-skills">
                      <span className="ve-head">Skills Found</span>
                      <div className="sk-tags">
                        <span>Python</span><span>Java</span><span>React</span>
                        <span>Node.js</span><span>MongoDB</span><span>SQL</span>
                      </div>
                    </div>
                    <div className="ve-edu">
                      <span className="ve-head">Education & Experience Auto-Organized</span>
                      <div className="edu-cards">
                        <div className="ec">CGPA: 8.4</div>
                        <div className="ec">AWS Certified</div>
                        <div className="ec">React Developer</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Scene 6: Resume Builder */}
              <div className="film-layer layer-s6">
                <div className="resume-builder">
                  <div className="rb-left">
                    <div className="rbl-title">Modern ATS Template</div>
                    <div className="rbl-build-prog">
                      Building Resume... <div className="nb-prog"><div className="nb-prog-fill"></div></div>
                    </div>
                    <div className="rbl-typing">
                      Jefri Jiji<br/>Software Engineer<br/><br/>Education...<br/>Projects...<br/>Technical Skills...
                    </div>
                  </div>
                  <div className="rb-right">
                    <div className="rb-pdf">
                      <div className="rpdf-head">JEFRI JIJI</div>
                      <div className="rpdf-l w80"></div>
                      <div className="rpdf-l w60"></div>
                      <div className="rpdf-l w90"></div>
                      <div className="rpdf-l w70"></div>
                    </div>
                    <div className="rb-download"><Download size={12}/> Download PDF</div>
                  </div>
                </div>
              </div>

              {/* Scene 7: Resume Intelligence */}
              <div className="film-layer layer-s7">
                <div className="resume-intel">
                  <div className="ri-top">
                    <div className="ri-doc">SoftwareEngineerResume.pdf</div>
                    <div className="ri-jd">JD: Frontend Developer (React, Node, TS)</div>
                  </div>
                  <div className="ri-scan">Analyzing match... <div className="nb-prog"><div className="nb-prog-fill"></div></div></div>
                  <div className="ri-results">
                    <div className="rir-score">91 / 100 <br/><span>Excellent Match</span></div>
                    <div className="rir-missing">Missing: TypeScript, REST APIs, CI/CD</div>
                  </div>
                  <div className="ri-suggest">
                    <div className="ris-head">AI Suggestions:</div>
                    <div className="ris-item">Add Internship</div>
                    <div className="ris-item">Mention REST APIs</div>
                    <div className="ris-apply">Apply Improvements ✨</div>
                  </div>
                </div>
              </div>

              {/* Scenes 8-12: The Study Group Epic */}
              <div className="film-layer layer-s-study-groups">
                <div className="sg-sidebar">
                   <div className="sgs-title">MY GROUPS</div>
                   <div className="sgs-item">✓ MCA Semester 7</div>
                   <div className="sgs-item target-os">✓ Operating Systems</div>
                   <div className="sgs-item">✓ Placement Prep</div>
                </div>
                
                <div className="sg-chat-main">
                   <div className="sgc-header">
                     <span className="sgc-title">Operating Systems</span>
                     <span className="sgc-online">12 Members Online</span>
                   </div>
                   
                   <div className="sgc-body">
                     <div className="sgc-msg m-akhil">
                        <b>Akhil</b>
                        <p>Can someone explain Deadlocks?</p>
                        <small>2 min ago</small>
                     </div>
                     
                     <div className="sgc-msg m-rohan">
                        <b>Rohan</b>
                        <p>Uploading today's lecture notes...</p>
                        <div className="nb-prog"><div className="nb-prog-fill"></div></div>
                     </div>
                     
                     <div className="sgc-typing">Rohan is typing<span>.</span><span>.</span><span>.</span></div>
                     
                     <div className="sgc-file-share">
                        <div className="sgcf-icon"><FileText size={24}/></div>
                        <div className="sgcf-info">
                          <b>OperatingSystems.pdf</b>
                          <span>42 Pages</span>
                        </div>
                        <div className="sgcf-btns">
                          <button className="sgcf-open">Open</button>
                          <button className="sgcf-save">Save to Notebook</button>
                        </div>
                     </div>
                     
                     <div className="sgc-importing">
                        Importing... <div className="nb-prog"><div className="nb-prog-fill"></div></div>
                     </div>
                     <div className="sgc-saved">Notebook Icon Glows. Saved.</div>
                     
                     <div className="sgc-ai-popup">
                        <div className="sgai-head">AI detected new notes.</div>
                        <div className="sgai-ask">Generate Summary? <button className="sgai-gen-btn">Generate</button></div>
                        <div className="sgai-results">
                          <span>✓ Summary Ready</span>
                          <span>✓ Flashcards Ready</span>
                          <span>✓ Quiz Ready</span>
                        </div>
                        <div className="sgai-actions">
                          <button>Share Summary ↓</button>
                          <button>Share Quiz</button>
                        </div>
                     </div>
                     
                     <div className="sgc-reaction">
                        <span className="react-icon">👍</span> Jefri reacted
                     </div>
                   </div>
                </div>
              </div>

              {/* Scene 13: Weekly Intelligence */}
              <div className="film-layer layer-s13">
                <div className="weekly-report">
                  <div className="wr-title">Weekly Report</div>
                  <div className="wr-grid">
                    <div className="wrg">Study<br/>18.6 hrs</div>
                    <div className="wrg">Budget<br/>Excellent</div>
                    <div className="wrg">Habits<br/>94%</div>
                    <div className="wrg trend">CGPA Trend<br/>↑</div>
                  </div>
                  <div className="wr-ai">
                    <span className="wrai-h">AI Recommendations</span>
                    <div className="wrai-body">
                      Excellent consistency.<br/>
                      Continue focusing on Operating Systems.<br/>
                      Increase DBMS practice before Friday.
                    </div>
                  </div>
                </div>
              </div>

              {/* Scene 14: Final Scene / Fade to everything */}
              <div className="film-layer layer-s14">
                <div className="final-dashboard-grid">
                  <div className="fg-mod m1"><FileText/> Notebook</div>
                  <div className="fg-mod m2"><Calendar/> Planner</div>
                  <div className="fg-mod m3"><BrainCircuit/> AI</div>
                  <div className="fg-mod m4"><Briefcase/> Career Vault</div>
                  <div className="fg-mod m5"><FileSearch/> Resume Intel</div>
                  <div className="fg-mod m6"><BarChart2/> Analytics</div>
                  <div className="fg-mod m7"><DollarSign/> Finance</div>
                  <div className="fg-mod m8"><Target/> Habits</div>
                  <svg className="final-connections" viewBox="0 0 400 300">
                    <path d="M 100 50 L 300 50 L 200 150 L 100 50" />
                    <path d="M 200 150 L 100 250 L 300 250 L 200 150" />
                  </svg>
                </div>
                <div className="final-overlay">
                  <div className="fo-txt">
                    One Workspace.<br/>Every Student Tool.<br/>Powered by AI.
                  </div>
                  <div className="fo-btn">Get Started Free →</div>
                  <div className="fo-logo">◎ Aethon</div>
                </div>
              </div>

              {/* Global Cursor for interactions */}
              <div className="film-cursor"></div>

            </div>
          </div>
          <div className="film-laptop-base"><div className="film-trackpad"></div></div>
        </div>

        {/* Smartphone (Wakes up in Scene 12) */}
        <div className="film-phone">
          <div className="film-phone-screen">
            <div className="film-phone-inner">
              <div className="phone-notch"></div>
              
              <div className="phone-lockscreen">
                <div className="pl-time">09:41</div>
                <div className="pl-notif">
                  <span className="pln-title">Aethon</span>
                  <span className="pln-txt">Operating Systems<br/>12 New Messages<br/>Rohan shared AI Summary</span>
                </div>
              </div>

              <div className="phone-app-chat">
                <div className="pac-header">Operating Systems</div>
                <div className="pac-msgs">
                  <div className="pac-msg">Akhil: Can someone explain deadlocks?</div>
                  <div className="pac-msg">Rohan: Uploading notes...</div>
                  <div className="pac-msg ai-sum">AI Summary Ready</div>
                </div>
                <div className="pac-react-btn">👍</div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
