import React, { useState, useEffect } from 'react';
import { Shield, Bell, FileCheck, AlertTriangle, BarChart3, CheckCircle, ArrowRight } from 'lucide-react';
import './WelcomeExperience.css';

const WelcomeExperience = ({ onComplete }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);
  const [showEnterButton, setShowEnterButton] = useState(false);
  const [logoAnimation, setLogoAnimation] = useState(true);

  const modules = [
    {
      id: 'regulatory-horizon',
      icon: Bell,
      title: 'Regulatory Horizon',
      subtitle: 'Regulatory Change Monitoring',
      description: 'Stay ahead of regulatory changes with real-time monitoring of FCA, PRA, CBI, and ESMA updates. Rule-based impact scoring helps you prioritize what matters most.',
      features: ['Live regulatory feed monitoring', 'Quantified impact scoring', 'Change detection', 'Deadline tracking'],
      color: '#F97316'
    },
    {
      id: 'control-architecture',
      icon: Shield,
      title: 'Control Architecture',
      subtitle: 'Control Framework Core',
      description: 'Build and maintain a robust control library with lifecycle tracking. Monitor control status and review coverage.',
      features: ['Comprehensive control library', 'Policy-control linking', 'Control effectiveness tracking', 'Coverage indicators'],
      color: '#F97316'
    },
    {
      id: 'operational-assurance',
      icon: FileCheck,
      title: 'Operational Assurance',
      subtitle: 'Control Execution & Monitoring',
      description: 'Execute and monitor your control framework with attestations, evidence collection, and structured compliance workflows.',
      features: ['Control attestations', 'Evidence management', 'Policy library', 'Compliance workflows'],
      color: '#F97316'
    },
    {
      id: 'issue-management',
      icon: AlertTriangle,
      title: 'Issue & Breach Management',
      subtitle: 'Exceptions & Remediation',
      description: 'Identify, track, and remediate control exceptions and breaches with structured risk prioritization and workflow management.',
      features: ['Exception tracking', 'Risk signal tracking', 'Remediation workflows', 'Breach management'],
      color: '#FB923C'
    },
    {
      id: 'automation-intelligence',
      icon: FileCheck,
      title: 'Operations & Automation',
      subtitle: 'Workflow & Export Tools',
      description: 'Streamline compliance operations with structured guidance, workflow automation, and real data exports to support decision-making.',
      features: ['Regulatory guidance', 'Workflow automation', 'Notifications', 'Data exports'],
      color: '#F97316'
    },
    {
      id: 'governance-board',
      icon: BarChart3,
      title: 'Governance & Board Assurance',
      subtitle: 'Board View',
      description: 'Provide your board and senior management with clear compliance visibility through structured dashboards and management information.',
      features: ['Strategic scoring', 'Management information', 'Risk posture views', 'Regulatory readiness'],
      color: '#F97316'
    }
  ];

  useEffect(() => {
    // Auto-advance slides
    const slideInterval = setInterval(() => {
      setCurrentSlide(prev => {
        if (prev >= modules.length - 1) {
          setShowEnterButton(true);
          clearInterval(slideInterval);
          return prev;
        }
        return prev + 1;
      });
    }, 5000);

    // Stop logo animation after initial bounce
    const logoTimer = setTimeout(() => {
      setLogoAnimation(false);
    }, 3000);

    return () => {
      clearInterval(slideInterval);
      clearTimeout(logoTimer);
    };
  }, []);

  const handleSlideClick = (index) => {
    setCurrentSlide(index);
    if (index === modules.length - 1) {
      setShowEnterButton(true);
    }
  };

  const currentModule = modules[currentSlide];

  return (
    <div className="welcome-experience">
      {/* Animated Background */}
      <div className="welcome-bg">
        <div className="bg-gradient"></div>
        <div className="bg-grid"></div>
        <div className="bg-glow"></div>
      </div>

      {/* Bouncing Logo */}
      <div className="welcome-logo">
        <img src="/logo.png" alt="REGINTELS" />
      </div>

      {/* Brand Header */}
      <div className="welcome-header">
        <h1 className="welcome-brand">
          REG<span>INTELS</span>
          <sup>TM</sup>
        </h1>
        <p className="welcome-tagline">Compliance Operations for FCA-Regulated Firms</p>
      </div>

      {/* Module Showcase */}
      <div className="module-showcase">
        <div className="module-content" key={currentModule.id}>
          <div className="module-icon" style={{ '--module-color': currentModule.color }}>
            <currentModule.icon size={48} />
          </div>
          <h2 className="module-title">{currentModule.title}</h2>
          <p className="module-subtitle">{currentModule.subtitle}</p>
          <p className="module-description">{currentModule.description}</p>

          <div className="module-features">
            {currentModule.features.map((feature, idx) => (
              <div key={idx} className="feature-item">
                <CheckCircle size={16} />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Progress Dots */}
      <div className="slide-progress">
        {modules.map((module, idx) => (
          <button
            key={idx}
            className={`progress-dot ${idx === currentSlide ? 'active' : ''} ${idx < currentSlide ? 'completed' : ''}`}
            onClick={() => handleSlideClick(idx)}
            style={{ '--dot-color': module.color }}
          >
            <span className="dot-tooltip">{module.title}</span>
          </button>
        ))}
      </div>

      {/* Enter Button */}
      <div className={`enter-section ${showEnterButton ? 'visible' : ''}`}>
        <button className="enter-button" onClick={onComplete}>
          <span>Now Let Me In</span>
          <ArrowRight size={20} />
        </button>
      </div>

      {/* Skip Button */}
      <button className="skip-button" onClick={onComplete}>
        Skip Intro
      </button>
    </div>
  );
};

export default WelcomeExperience;
