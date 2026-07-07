import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';

const STEPS = ['motivation-killers','proudest-goal','dedicated-time','learning-for','master-situation','challenge','did-you-know','boost-success','all-done'];

function OptionCard({ label, selected, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: '12px 16px', borderRadius: 12,
      border: selected ? '1.5px solid var(--accent)' : '1.5px solid var(--border-default)',
      background: selected ? 'var(--accent-bg)' : 'var(--bg-elevated)',
      color: selected ? 'var(--accent)' : 'var(--text-secondary)',
      fontSize: 14, fontWeight: 500, cursor: 'pointer', textAlign: 'left',
      transition: 'all 0.2s var(--ease-out)',
    }}
      onMouseEnter={e => { if (!selected) { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.color = 'var(--text-primary)'; } }}
      onMouseLeave={e => { if (!selected) { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.color = 'var(--text-secondary)'; } }}>
      {label}
    </button>
  );
}

function Toggle({ label, enabled, onToggle }) {
  return (
    <div onClick={onToggle} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer' }}>
      <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{label}</span>
      <div style={{ width: 44, height: 24, borderRadius: 12, background: enabled ? 'var(--accent)' : 'var(--bg-elevated)', border: '1px solid var(--border-default)', position: 'relative', transition: 'background 0.3s var(--ease-spring)', flexShrink: 0 }}>
        <div style={{ position: 'absolute', top: 3, left: enabled ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left 0.3s var(--ease-spring)' }} />
      </div>
    </div>
  );
}

export default function Onboarding() {
  const navigate = useNavigate();
  const savePrefs = useMutation(api.preferences.saveOnboarding);
  const userId = localStorage.getItem('userId');
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState({
    motivationKillers: [], proudestGoal: '', dedicatedTime: '',
    learningFor: [], masterSituation: [], acceptChallenge: false,
    reminders: { dailyReminders: false, streakNotifications: false, weekendAlerts: false, progressCelebration: false },
  });

  const currentStep = STEPS[stepIndex];
  const progress = ((stepIndex + 1) / STEPS.length) * 100;

  const goNext = () => {
    if (stepIndex < STEPS.length - 1) setStepIndex(s => s + 1);
    else savePrefs({ userId, preferences: JSON.stringify(answers), reminderTime: answers.dedicatedTime || undefined }).then(() => navigate('/dashboard'));
  };

  const toggleMulti = (field, value) => setAnswers(prev => ({ ...prev, [field]: prev[field].includes(value) ? prev[field].filter(v => v !== value) : [...prev[field], value] }));
  const toggleReminder = key => setAnswers(prev => ({ ...prev, reminders: { ...prev.reminders, [key]: !prev.reminders[key] } }));

  const isDisabled =
    (currentStep === 'motivation-killers' && answers.motivationKillers.length === 0) ||
    (currentStep === 'proudest-goal' && !answers.proudestGoal) ||
    (currentStep === 'dedicated-time' && !answers.dedicatedTime);

  const showContinue = !['challenge', 'all-done', 'did-you-know', 'boost-success'].includes(currentStep);

  const btnStyle = {
    width: '100%', padding: 14,
    background: 'var(--accent)', border: 'none', borderRadius: 12,
    color: '#fff', fontWeight: 700, fontSize: 16,
    cursor: 'pointer', marginTop: 8, transition: 'all 0.2s var(--ease-out)',
  };
  const ghostStyle = {
    ...btnStyle, background: 'var(--bg-elevated)', color: 'var(--text-primary)',
    border: '1px solid var(--border-default)',
  };

  const hoverIn = e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.background = 'var(--accent-hover)'; };
  const hoverOut = e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.background = 'var(--accent)'; };

  const renderStep = () => {
    switch (currentStep) {
      case 'motivation-killers': return <>
        <h2 style={{ color: 'var(--text-primary)', fontSize: 22, fontWeight: 800, margin: '0 0 6px' }}>What killed your motivation?</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: '0 0 20px' }}>Select all that apply</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {['Boredom','No clear progression','Too busy','Lack of resources','Forgetfulness','No feedback','Other'].map(opt => <OptionCard key={opt} label={opt} selected={answers.motivationKillers.includes(opt)} onClick={() => toggleMulti('motivationKillers', opt)} />)}
        </div>
      </>;
      case 'proudest-goal': return <>
        <h2 style={{ color: 'var(--text-primary)', fontSize: 22, fontWeight: 800, margin: '0 0 6px' }}>What would make you proudest?</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: '0 0 20px' }}>Pick one goal</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {['Ordering food','Communicating with auto driver','Understanding TV shows','Chatting with locals','Traveling alone','Other'].map(opt => <OptionCard key={opt} label={opt} selected={answers.proudestGoal === opt} onClick={() => setAnswers(p => ({ ...p, proudestGoal: opt }))} />)}
        </div>
      </>;
      case 'dedicated-time': return <>
        <h2 style={{ color: 'var(--text-primary)', fontSize: 22, fontWeight: 800, margin: '0 0 6px' }}>When can you practice?</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: '0 0 20px' }}>We'll schedule reminders</p>
        <div style={{ display: 'grid', gap: 8 }}>
          {['Morning (6am–12pm)','Afternoon (12pm–6pm)','Evening (6pm–10pm)','Night (10pm–6am)'].map(opt => <OptionCard key={opt} label={opt} selected={answers.dedicatedTime === opt} onClick={() => setAnswers(p => ({ ...p, dedicatedTime: opt }))} />)}
        </div>
      </>;
      case 'learning-for': return <>
        <h2 style={{ color: 'var(--text-primary)', fontSize: 22, fontWeight: 800, margin: '0 0 6px' }}>Who are you learning for?</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: '0 0 20px' }}>Select all that apply</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {['Myself','Family','Friends','Work','Travel','Others'].map(opt => <OptionCard key={opt} label={opt} selected={answers.learningFor.includes(opt)} onClick={() => toggleMulti('learningFor', opt)} />)}
        </div>
      </>;
      case 'master-situation': return <>
        <h2 style={{ color: 'var(--text-primary)', fontSize: 22, fontWeight: 800, margin: '0 0 6px' }}>Which situation to master?</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: '0 0 20px' }}>Select all that apply</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {['Ordering at restaurant','Shopping','Asking for directions','Making friends','Work conversation','Travel situations','Others'].map(opt => <OptionCard key={opt} label={opt} selected={answers.masterSituation.includes(opt)} onClick={() => toggleMulti('masterSituation', opt)} />)}
        </div>
      </>;
      case 'challenge': return <>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 48, marginBottom: 12, animation: 'float 3s ease-in-out infinite' }}>🏆</div>
          <h2 style={{ color: 'var(--text-primary)', fontSize: 22, fontWeight: 800, margin: '0 0 8px' }}>30-Day Challenge</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: 0 }}>Only 15% achieve this in their first month.</p>
        </div>
        <button style={btnStyle} onClick={() => { setAnswers(p => ({ ...p, acceptChallenge: true })); goNext(); }} onMouseEnter={hoverIn} onMouseLeave={hoverOut}>Accept Challenge 💪</button>
        <button style={ghostStyle} onClick={goNext}>Maybe Later</button>
      </>;
      case 'did-you-know': return <>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 48, marginBottom: 12, animation: 'float 3s ease-in-out infinite' }}>🧠</div>
          <h2 style={{ color: 'var(--text-primary)', fontSize: 22, fontWeight: 800, margin: '0 0 12px' }}>Did you know?</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.7, margin: 0 }}>Your brain forms new pathways after just <strong style={{ color: 'var(--accent)' }}>7 days</strong> of practice. Miss 2 days and they weaken!</p>
        </div>
        <button style={btnStyle} onClick={goNext} onMouseEnter={hoverIn} onMouseLeave={hoverOut}>Got it, let's go!</button>
      </>;
      case 'boost-success': return <>
        <h2 style={{ color: 'var(--text-primary)', fontSize: 22, fontWeight: 800, margin: '0 0 6px' }}>Boost success by 40%</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: '0 0 18px' }}>Enable smart reminders</p>
        <div style={{ marginBottom: 18 }}>
          <Toggle label="Daily reminders" enabled={answers.reminders.dailyReminders} onToggle={() => toggleReminder('dailyReminders')} />
          <Toggle label="Streak notifications" enabled={answers.reminders.streakNotifications} onToggle={() => toggleReminder('streakNotifications')} />
          <Toggle label="Weekend alerts" enabled={answers.reminders.weekendAlerts} onToggle={() => toggleReminder('weekendAlerts')} />
          <Toggle label="Progress celebrations" enabled={answers.reminders.progressCelebration} onToggle={() => toggleReminder('progressCelebration')} />
        </div>
        <button style={btnStyle} onClick={goNext} onMouseEnter={hoverIn} onMouseLeave={hoverOut}>Continue</button>
      </>;
      case 'all-done': return <>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 56, marginBottom: 14, animation: 'float 3s ease-in-out infinite' }}>🎉</div>
          <h2 style={{ color: 'var(--text-primary)', fontSize: 24, fontWeight: 800, margin: '0 0 8px' }}>You're all set!</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15, margin: '0 0 24px' }}>Your personalized plan is ready.</p>
          <button style={btnStyle} onClick={goNext} onMouseEnter={hoverIn} onMouseLeave={hoverOut}>Go to Dashboard →</button>
        </div>
      </>;
      default: return null;
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'var(--bg-base)' }}>
      <div style={{
        width: '100%', maxWidth: 500,
        background: 'var(--bg-card)', border: '1px solid var(--border-default)',
        borderRadius: 22, padding: '36px 32px',
        boxShadow: 'var(--card-shadow)',
        animation: 'fadeUp 0.5s var(--ease-out) both',
      }}>
        {/* Progress */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 600 }}>Step {stepIndex + 1} of {STEPS.length}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 600 }}>{Math.round(progress)}%</span>
          </div>
          <div style={{ height: 4, background: 'var(--bg-elevated)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ height: '100%', background: 'var(--accent)', borderRadius: 99, width: `${progress}%`, transition: 'width 0.4s var(--ease-out)' }} />
          </div>
          <div style={{ display: 'flex', gap: 3, justifyContent: 'center', marginTop: 10 }}>
            {STEPS.map((_, i) => (
              <div key={i} style={{ width: i === stepIndex ? 16 : 6, height: 6, borderRadius: 99, background: i <= stepIndex ? 'var(--accent)' : 'var(--bg-elevated)', transition: 'all 0.3s var(--ease-out)' }} />
            ))}
          </div>
        </div>

        {renderStep()}

        {showContinue && (
          <button onClick={goNext} disabled={isDisabled}
            style={{ ...btnStyle, opacity: isDisabled ? 0.3 : 1, cursor: isDisabled ? 'not-allowed' : 'pointer', marginTop: 18 }}
            onMouseEnter={e => { if (!isDisabled) hoverIn(e); }}
            onMouseLeave={e => { if (!isDisabled) hoverOut(e); }}>
            Continue
          </button>
        )}
      </div>
    </div>
  );
}