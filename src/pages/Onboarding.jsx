import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';

const STEPS = [
  'motivation-killers',
  'proudest-goal',
  'dedicated-time',
  'learning-for',
  'master-situation',
  'challenge',
  'did-you-know',
  'boost-success',
  'all-done',
];

export default function Onboarding() {
  const navigate = useNavigate();
  const savePrefs = useMutation(api.preferences.saveOnboarding);
  const userId = localStorage.getItem('userId');

  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState({
    motivationKillers: [],
    proudestGoal: '',
    dedicatedTime: '',
    learningFor: [],
    masterSituation: [],
    acceptChallenge: false,
    reminders: {
      dailyReminders: false,
      streakNotifications: false,
      weekendAlerts: false,
      progressCelebration: false,
    },
  });

  const currentStep = STEPS[stepIndex];

  const goNext = () => {
    if (stepIndex < STEPS.length - 1) {
      setStepIndex(stepIndex + 1);
    } else {
      // Save everything and redirect
      const preferences = JSON.stringify(answers);
      savePrefs({
        userId,
        preferences,
        reminderTime: answers.dedicatedTime || undefined,
      }).then(() => {
        navigate('/dashboard');
      });
    }
  };

  const toggleMulti = (field, value) => {
    setAnswers((prev) => {
      const arr = prev[field];
      if (arr.includes(value)) return { ...prev, [field]: arr.filter((v) => v !== value) };
      else return { ...prev, [field]: [...arr, value] };
    });
  };

  const toggleReminder = (key) => {
    setAnswers((prev) => ({
      ...prev,
      reminders: { ...prev.reminders, [key]: !prev.reminders[key] },
    }));
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'motivation-killers':
        return (
          <>
            <h2>What killed your motivation previously?</h2>
            <div className="options-grid">
              {['Boredom', 'No clear progression', 'Too busy', 'Lack of resources', 'Forgetfulness', 'No feedback', 'Other'].map((opt) => (
                <div
                  key={opt}
                  className={`option-card ${answers.motivationKillers.includes(opt) ? 'selected' : ''}`}
                  onClick={() => toggleMulti('motivationKillers', opt)}
                >
                  {opt}
                </div>
              ))}
            </div>
          </>
        );

      case 'proudest-goal':
        return (
          <>
            <h2>What would make you proudest?</h2>
            <div className="options-grid">
              {['Ordering food', 'Communicating with auto driver', 'Understanding TV shows', 'Chatting with locals', 'Traveling alone', 'Other'].map((opt) => (
                <div
                  key={opt}
                  className={`option-card ${answers.proudestGoal === opt ? 'selected' : ''}`}
                  onClick={() => setAnswers((prev) => ({ ...prev, proudestGoal: opt }))}
                >
                  {opt}
                </div>
              ))}
            </div>
          </>
        );

      case 'dedicated-time':
        return (
          <>
            <h2>When can you dedicate your time?</h2>
            <div className="options-grid">
              {['Morning (6am-12pm)', 'Afternoon (12pm-6pm)', 'Evening (6pm-10pm)', 'Night (10pm-6am)'].map((opt) => (
                <div
                  key={opt}
                  className={`option-card ${answers.dedicatedTime === opt ? 'selected' : ''}`}
                  onClick={() => setAnswers((prev) => ({ ...prev, dedicatedTime: opt }))}
                >
                  {opt}
                </div>
              ))}
            </div>
            {answers.dedicatedTime && (
              <p className="mt-3 text-indigo-600">
                ✅ We'll remind you during the <strong>{answers.dedicatedTime.split('(')[0].trim()}</strong>
              </p>
            )}
          </>
        );

      case 'learning-for':
        return (
          <>
            <h2>Who are you learning for?</h2>
            <div className="options-grid">
              {['Myself', 'Family', 'Friends', 'Work', 'Travel', 'Others'].map((opt) => (
                <div
                  key={opt}
                  className={`option-card ${answers.learningFor.includes(opt) ? 'selected' : ''}`}
                  onClick={() => toggleMulti('learningFor', opt)}
                >
                  {opt}
                </div>
              ))}
            </div>
          </>
        );

      case 'master-situation':
        return (
          <>
            <h2>Which situation would you like to master?</h2>
            <div className="options-grid">
              {['Ordering at restaurant', 'Shopping', 'Asking for direction', 'Making friends', 'Work conversation', 'Travel situations', 'Others'].map((opt) => (
                <div
                  key={opt}
                  className={`option-card ${answers.masterSituation.includes(opt) ? 'selected' : ''}`}
                  onClick={() => toggleMulti('masterSituation', opt)}
                >
                  {opt}
                </div>
              ))}
            </div>
          </>
        );

      case 'challenge':
        return (
          <>
            <h2>Can you practice for 30 days straight?</h2>
            <p className="text-gray-500 mb-4">Only 15% of users achieve this in their first month</p>
            <button
              className="big-button"
              onClick={() => {
                setAnswers((prev) => ({ ...prev, acceptChallenge: true }));
                goNext();
              }}
            >
              Accept challenge
            </button>
            <button className="big-button secondary" onClick={() => goNext()}>
              Maybe later
            </button>
          </>
        );

      case 'did-you-know':
        return (
          <>
            <h2>Did you know?</h2>
            <p className="text-gray-500 mb-4">
              Your brain forms new pathways for language skills after just 7 days of practice.
              Miss 2 days = pathways weaken. That's why streaks matter!
            </p>
            <button className="big-button" onClick={goNext}>Continue</button>
          </>
        );

      case 'boost-success':
        return (
          <>
            <h2>Boost your success rate by 40%</h2>
            <div className="mb-4">
              <div className="toggle-row">
                <span>Enable daily reminders</span>
                <div
                  className={`toggle-switch ${answers.reminders.dailyReminders ? 'active' : ''}`}
                  onClick={() => toggleReminder('dailyReminders')}
                />
              </div>
              <div className="toggle-row">
                <span>Allow streak notifications</span>
                <div
                  className={`toggle-switch ${answers.reminders.streakNotifications ? 'active' : ''}`}
                  onClick={() => toggleReminder('streakNotifications')}
                />
              </div>
              <div className="toggle-row">
                <span>Weekend practice alerts</span>
                <div
                  className={`toggle-switch ${answers.reminders.weekendAlerts ? 'active' : ''}`}
                  onClick={() => toggleReminder('weekendAlerts')}
                />
              </div>
              <div className="toggle-row">
                <span>Progress celebration</span>
                <div
                  className={`toggle-switch ${answers.reminders.progressCelebration ? 'active' : ''}`}
                  onClick={() => toggleReminder('progressCelebration')}
                />
              </div>
            </div>
            <button className="big-button" onClick={goNext}>Continue</button>
          </>
        );

      case 'all-done':
        return (
          <>
            <h2>All done!</h2>
            <p className="text-gray-500 mb-4">Time to generate your custom plan!</p>
            <button className="big-button" onClick={goNext}>
              Let's go → Dashboard
            </button>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="onboarding-container">
      <div className="onboarding-step">{renderStep()}</div>
      {/* Show Next button for all steps except the ones with their own navigation (challenge, all-done) */}
      {currentStep !== 'challenge' && currentStep !== 'all-done' && currentStep !== 'did-you-know' && currentStep !== 'boost-success' && (
        <button className="big-button mt-4" onClick={goNext} disabled={
          currentStep === 'motivation-killers' && answers.motivationKillers.length === 0 ||
          currentStep === 'proudest-goal' && !answers.proudestGoal ||
          currentStep === 'dedicated-time' && !answers.dedicatedTime
        }>
          Continue
        </button>
      )}
    </div>
  );
}