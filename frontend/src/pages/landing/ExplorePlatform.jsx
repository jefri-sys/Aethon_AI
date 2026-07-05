import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Brain, ArrowLeft, LayoutDashboard, BrainCircuit, Calendar, 
  BookOpen, Target, Briefcase, Shield, LineChart, Users, Bell, Globe
} from 'lucide-react';
import './ExplorePlatform.css';

const SynapseNetworkAnimation = () => {
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

    const numParticles = Math.floor((canvas.width * canvas.height) / 15000);
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
            const opacity = (1 - dist / connectionDistance) * 0.25;
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

const ExplorePlatform = () => {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(0);
  const itemRefs = useRef([]);

  const features = [
    {
      category: "AI Engine",
      name: "Central AI Assistant",
      description: "An always-available AI that has context on all your data. Every Sunday, receive an automated, personalized weekly report summarizing your study hours, spending, habits, and actionable advice.",
      icon: <BrainCircuit size={28} />
    },
    {
      category: "Academic",
      name: "AI Notebooks",
      description: "Upload notes (PDF/Word) to create an AI Notebook where you can chat with your notes, generate summaries, and take AI quizzes.",
      icon: <BookOpen size={24} />
    },
    {
      category: "Dashboard",
      name: "Resource Explorer",
      description: "Search any topic and the AI will scrape trusted educational sources to generate a structured learning roadmap instead of a chaotic list of links.",
      icon: <Globe size={24} />
    },
    {
      category: "Planning",
      name: "Dynamic Study Planner",
      description: "AI analyzes your marks and automatically generates a day-by-day study schedule based on exam dates and credit weights.",
      icon: <Calendar size={24} />
    },
    {
      category: "Academic",
      name: "Academics Hub",
      description: "A powerful file explorer built natively into your browser. Organize subjects, track grades, and access your study materials instantly.",
      icon: <BookOpen size={24} />
    },
    {
      category: "Career",
      name: "Resume Intelligence",
      description: "Simulates an ATS evaluation to identify missing keywords. Automatically generates polished PDF resumes.",
      icon: <Briefcase size={24} />
    },
    {
      category: "Security",
      name: "Encrypted Career Vault",
      description: "A secondary-password protected vault for sensitive documents. Logs major milestones visually.",
      icon: <Shield size={24} />
    },
    {
      category: "Finance",
      name: "AI Finance Tracker",
      description: "Manage a monthly budget across 6 categories. Get warnings when nearing limits and receive AI analysis of spending patterns.",
      icon: <Target size={24} />
    },
    {
      category: "Social",
      name: "Peer Networking",
      description: "Connect with peers from your college. Collaborate via real-time WebSocket chat and easily share AI-generated summaries.",
      icon: <Users size={24} />
    },
    {
      category: "UX",
      name: "Universal Quick Capture",
      description: "A floating button to log expenses, tasks, or notes in under 5 seconds. Stay updated with proactive system notifications.",
      icon: <Bell size={24} />
    }
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute('data-index'));
            if (index > activeIndex) {
              setActiveIndex(index);
            }
            entry.target.classList.add('active');
          }
        });
      },
      { threshold: 0.5, rootMargin: '-10% 0px -40% 0px' }
    );

    itemRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [activeIndex]);

  // Calculate progress line height based on active index
  const progressHeight = features.length > 0 ? `${(activeIndex / (features.length - 1)) * 100}%` : '0%';

  return (
    <div className="explore-container">
      <SynapseNetworkAnimation />
      <nav className="explore-nav">
        <div className="landing-logo" style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>
          <Brain className="logo-icon" size={28} />
          <span>Synapse</span>
        </div>
        <button onClick={() => navigate('/')} className="btn-secondary" style={{ border: 'none', background: 'transparent' }}>
          <ArrowLeft size={16} style={{ marginRight: '6px' }} />
          Back to Home
        </button>
      </nav>

      <div className="explore-header">
        <h1 className="explore-title">Platform Architecture</h1>
        <p className="explore-subtitle">
          Follow the roadmap of interconnected features designed to replace your fragmented ecosystem with one unified, AI-powered workspace.
        </p>
      </div>

      <div className="roadmap-container">
        <div className="roadmap-line">
          <div className="roadmap-line-progress" style={{ height: progressHeight }}></div>
        </div>

        {features.map((feature, idx) => (
          <div 
            key={idx} 
            className="roadmap-item" 
            data-index={idx}
            ref={(el) => (itemRefs.current[idx] = el)}
          >
            <div className="roadmap-node"></div>
            <div className="roadmap-content">
              <div className="roadmap-animated-bg"></div>
              <div className="roadmap-icon-wrapper">
                {feature.icon}
              </div>
              <span className="roadmap-category">{feature.category}</span>
              <h2 className="roadmap-title">{feature.name}</h2>
              <p className="roadmap-desc">{feature.description}</p>
            </div>
          </div>
        ))}
      </div>
      
      <div style={{ textAlign: 'center', marginTop: '6rem', position: 'relative', zIndex: 10 }}>
        <button onClick={() => navigate('/register')} className="btn-primary" style={{ padding: '0.9rem 2.5rem', fontSize: '1.1rem' }}>
          Start your journey for free
        </button>
      </div>
    </div>
  );
};

export default ExplorePlatform;
