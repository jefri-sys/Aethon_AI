import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import './Landing.css';
import { Brain, ArrowRight, BrainCircuit, Calendar, BookOpen, Target, Briefcase, FileText, LayoutDashboard, MessageSquare, LineChart, Globe } from 'lucide-react';
import brainNetworkImg from '../../assets/brain_network.png';
import aethonLogo from '../../assets/logo.png';
import WatchDemoSection from './components/WatchDemoSection.jsx';
import { WorkspaceAnimation } from './components/WorkspaceAnimation.jsx';
import './components/WatchDemoModal.css';
import { X } from 'lucide-react';

const AethonNetworkAnimation = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let particles = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    const colors = {
      node: 'rgba(148, 163, 184, 0.3)',
      line: 'rgba(56, 189, 248, 0.1)', 
    };

    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 0.4;
        this.vy = (Math.random() - 0.5) * 0.4;
        this.radius = Math.random() * 1.5 + 0.5;
      }
      update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
        if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
      }
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = colors.node;
        ctx.fill();
      }
    }

    const numParticles = Math.floor((canvas.width * canvas.height) / 10000);
    const connectionDistance = 160;

    for (let i = 0; i < numParticles; i++) {
      particles.push(new Particle());
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => { p.update(); p.draw(); });
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < connectionDistance) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            const opacity = (1 - dist / connectionDistance) * 0.8;
            ctx.strokeStyle = `rgba(56, 189, 248, ${opacity})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }
      animationFrameId = window.requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      window.cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      style={{ 
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
        display: 'block', zIndex: 0, pointerEvents: 'none'
      }} 
    />
  );
};

const Landing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const isIosDevice = /iPhone|iPad|iPod/.test(navigator.userAgent);
    const isStandalone = window.navigator.standalone;

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    if (isIosDevice && !isStandalone) {
      setIsIOS(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else if (isIOS) {
      alert("To install on iOS: tap the Share icon, then 'Add to Home Screen'.");
    }
  };
  
  const featuresRef = useRef([]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.1 });

    featuresRef.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const addToRefs = (el) => {
    if (el && !featuresRef.current.includes(el)) {
      featuresRef.current.push(el);
    }
  };

  const handleMouseMove = (e, ref) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ref.current.style.setProperty('--mouse-x', `${x}px`);
    ref.current.style.setProperty('--mouse-y', `${y}px`);
  };

  const Card = ({ icon, title, desc }) => {
    const cardRef = useRef(null);
    return (
      <div 
        className="feature-card" 
        ref={(el) => {
          cardRef.current = el;
          addToRefs(el);
        }}
        onMouseMove={(e) => handleMouseMove(e, cardRef)}
      >
        <div className="card-animated-bg"></div>
        <div className="feature-icon-wrapper">
          {icon}
        </div>
        <h3 className="feature-title">{title}</h3>
        <p className="feature-desc">{desc}</p>
      </div>
    );
  };

  return (
    <div className="landing-container">
      <AethonNetworkAnimation />
      <nav className="landing-nav">
        <div className="landing-logo">
          <img src={aethonLogo} alt="Aethon" className="logo-icon" style={{ width: '38px', height: '38px' }} />
          <span>Aethon</span>
        </div>
        <div className="landing-nav-links">
          <button onClick={() => setIsDemoModalOpen(true)} className="nav-link" style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>Watch Demo</button>
          {(deferredPrompt || isIOS) && (
            <button onClick={handleInstallClick} className="nav-link" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#8B5CF6', fontWeight: 'bold' }}>
              Install App
            </button>
          )}
          <a href="#features" className="nav-link">Features</a>
          <button onClick={() => navigate('/explore')} className="nav-link">
            Explore Platform
          </button>
          {user ? (
            <button onClick={() => navigate('/dashboard')} className="btn-primary">
              Workspace <ArrowRight size={18} style={{ marginLeft: '6px' }} />
            </button>
          ) : (
            <>
              <button onClick={() => navigate('/login')} className="btn-secondary">
                Log in
              </button>
              <button onClick={() => navigate('/register')} className="btn-primary">
                Get started
              </button>
            </>
          )}
        </div>
      </nav>

      <section className="hero-section">
        <div className="hero-badge">
          ✨ AI-Powered Student Workspace
        </div>
        <h1 className="hero-title">
          The Student Operating System.<br />
          <span className="text-gradient">Powered by AI.</span> <span className="text-gradient-accent">Built around you.</span>
        </h1>
        <p className="hero-subtitle">
          Everything you need to succeed in college—from academics and AI-powered studying to notes, planning, habits, finances, and career preparation—all connected in one intelligent workspace.
        </p>
        
        <div className="hero-actions" style={{ marginBottom: '6rem' }}>
          {user ? (
            <button onClick={() => navigate('/dashboard')} className="btn-primary">
              Launch Workspace
            </button>
          ) : (
            <>
              <button onClick={() => navigate('/register')} className="btn-primary">
                Get Started Free
              </button>
              <button onClick={() => navigate('/explore')} className="btn-secondary">
                Explore platform
              </button>
            </>
          )}
        </div>
      </section>

      <WatchDemoSection onWatchDemoClick={() => setIsDemoModalOpen(true)} />

      {isDemoModalOpen && (
        <div className="demo-modal-overlay" onClick={() => setIsDemoModalOpen(false)}>
          <div className="demo-modal-content" onClick={e => e.stopPropagation()}>
            <button className="demo-modal-close" onClick={() => setIsDemoModalOpen(false)}>
              <X size={24} color="#fff" />
            </button>
            <WorkspaceAnimation />
          </div>
        </div>
      )}

      <section id="features" className="features-container">
        <div className="features-header">
          <h2 className="text-gradient">Intelligent architecture</h2>
          <p className="hero-subtitle" style={{ marginInline: 'auto' }}>
            A unified system that connects your academic performance to your daily habits.
          </p>
        </div>
        
        <div className="features-grid">
          <Card 
            icon={<BrainCircuit size={24} color="#38BDF8" />} 
            title="AI Notebook" 
            desc="Upload your documents and watch as Aethon instantly extracts key concepts, generates smart flashcards, and builds custom quizzes."
          />
          <Card 
            icon={<Calendar size={24} color="#38BDF8" />} 
            title="Dynamic Study Planner" 
            desc="Stop stressing over schedules. Our AI automatically optimizes your study sessions based on target exam dates and real-time progress."
          />
          <Card 
            icon={<BookOpen size={24} color="#38BDF8" />} 
            title="Academics Hub" 
            desc="A powerful Windows-style file explorer built natively into your browser. Organize subjects, track grades, and access materials instantly."
          />
        </div>
        
        <div className="features-grid" style={{ marginTop: '1.5rem' }}>
          <Card 
            icon={<Target size={24} color="#38BDF8" />} 
            title="Habit & Finance Tracker" 
            desc="Build lasting routines with GitHub-style contribution graphs. Take control of your budget with automated finance analytics."
          />
          <Card 
            icon={<Briefcase size={24} color="#38BDF8" />} 
            title="Secure Career Vault" 
            desc="Store your certifications, internships, and projects in a session-locked vault. AI automatically extracts metadata to build your professional timeline."
          />
          <Card 
            icon={<FileText size={24} color="#38BDF8" />} 
            title="AI Resume Builder" 
            desc="Instantly generate tailored ATS-friendly resumes from your vault. Get AI-driven feedback to identify skill gaps and optimize for your target role."
          />
        </div>
        
        <div style={{ textAlign: 'center', marginTop: '4rem', position: 'relative', zIndex: 10 }}>
          <button onClick={() => navigate('/register')} className="btn-secondary" style={{ padding: '0.8rem 2.5rem', fontSize: '1.05rem' }}>
            Register for free
          </button>
        </div>
      </section>

      <section className="cta-section">
        <div className="cta-content" ref={(el) => addToRefs(el)} style={{ opacity: 0, transform: 'translateY(30px)', transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)' }}>
          <h2 className="cta-title">Ready to <span className="text-gradient-accent">upgrade</span> your workflow?</h2>
          <p className="hero-subtitle" style={{ marginInline: 'auto' }}>
            Join thousands of students who have transformed their academic journey with Aethon.
          </p>
          <div style={{ marginTop: '2.5rem' }}>
            {user ? (
              <button onClick={() => navigate('/dashboard')} className="btn-primary" style={{ padding: '0.9rem 2.5rem', fontSize: '1.1rem' }}>
                Enter Workspace
              </button>
            ) : (
              <button onClick={() => navigate('/register')} className="btn-primary" style={{ padding: '0.9rem 2.5rem', fontSize: '1.1rem' }}>
                Create Free Account
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
