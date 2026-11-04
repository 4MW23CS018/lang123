import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { 
  Zap, Sprout, Rocket, Sparkles, Flame, Gem, Star, LogOut, 
  Camera, Palette, Check, Lock, ChevronRight, Award, Trophy,
  Sliders, Globe, RefreshCw, X, ShoppingBag
} from "lucide-react";
import { FRAMES, BANNERS } from "../lib/cosmetics";
import { SOUTH_INDIAN_LANGUAGES, useLanguage } from "../components/hooks/useLanguage";

function getLevel(xp) { return Math.floor(Math.sqrt(xp / 100)) + 1; }
function xpForLevel(lvl) { return Math.pow(lvl - 1, 2) * 100; }
function xpProgress(xp) {
  const lvl = getLevel(xp); const curr = xpForLevel(lvl); const next = xpForLevel(lvl + 1);
  return { lvl, curr, next, pct: Math.round(((xp - curr) / (next - curr)) * 100) };
}

function getAchievements(user) {
  const xp = user?.totalXp || user?.xp || 0;
  const streak = Math.max(user?.maxStreak || 0, user?.streak || 0);
  return [
    { id: 'first_xp',  icon: Zap,      label: 'First Spark',   desc: 'Earned your first XP', unlocked: xp >= 1, color: 'var(--accent)' },
    { id: 'xp_100',    icon: Sprout,   label: 'Seedling',      desc: 'Reached 100 XP',       unlocked: xp >= 100, color: '#22c55e' },
    { id: 'xp_500',    icon: Rocket,   label: 'Accelerating',  desc: 'Reached 500 XP',       unlocked: xp >= 500, color: '#0ea5e9' },
    { id: 'xp_1000',   icon: Sparkles, label: 'Scholar',       desc: 'Reached 1,000 XP',     unlocked: xp >= 1000, color: '#8b5cf6' },
    { id: 'streak_3',  icon: Flame,    label: 'On Fire',       desc: '3-day streak',          unlocked: streak >= 3, color: '#f59e0b' },
    { id: 'streak_7',  icon: Gem,      label: 'Diamond Habit', desc: '7-day streak',          unlocked: streak >= 7, color: '#3b82f6' },
    { id: 'streak_30', icon: Star,     label: 'Legendary',     desc: '30-day streak',         unlocked: streak >= 30, color: '#ec4899' },
  ];
}

function mockActivity(user) {
  const streak = user?.streak || 0;
  return Array.from({ length: 14 }, (_, i) => { 
    const d = 13 - i; 
    return d < streak ? Math.floor(Math.random() * 3) + 1 : Math.random() > 0.65 ? 1 : 0; 
  });
}

function heatColor(v) {
  if (v === 0) return 'var(--bg-elevated)';
  if (v === 1) return 'var(--accent)' + '40';
  if (v === 2) return 'var(--accent)' + '80';
  return 'var(--accent)';
}

export default function Profile() {
  const userId = localStorage.getItem("userId");
  const user = useQuery(api.users.get, userId ? { userId } : "skip");
  const stats = useQuery(api.users.getProfileStats, userId ? { userId } : "skip");
  const { language, setLanguage } = useLanguage();

  const generateAvatarUploadUrl = useMutation(api.users.generateAvatarUploadUrl);
  const saveAvatar = useMutation(api.users.saveAvatar);
  const removeAvatar = useMutation(api.users.removeAvatar);
  const updateBestLanguage = useMutation(api.users.updateBestLanguage);
  const equipBorder = useMutation(api.shop.equipBorder);
  const equipBanner = useMutation(api.shop.equipBanner);

  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [xpVis, setXpVis] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState("avatar"); // "avatar" | "frames" | "banners" | "language"
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => { 
    const t = setTimeout(() => setXpVis(true), 500); 
    return () => clearTimeout(t); 
  }, []);

  const handleLogout = () => { 
    localStorage.removeItem("userId"); 
    navigate("/"); 
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    if (!file.type.startsWith("image/")) {
      return alert("Please select a valid image file (PNG, JPG, WebP).");
    }

    if (file.size > 5 * 1024 * 1024) {
      return alert("Image size exceeds 5MB. Please choose a smaller photo.");
    }

    setUploadingAvatar(true);
    try {
      const uploadUrl = await generateAvatarUploadUrl();
      const res = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!res.ok) throw new Error("Upload failed");
      const { storageId } = await res.json();
      await saveAvatar({ userId, storageId });
    } catch (err) {
      console.error(err);
      alert("Failed to upload profile photo. Please try again.");
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveAvatar = async () => {
    if (!userId) return;
    setUploadingAvatar(true);
    try {
      await removeAvatar({ userId });
    } catch (err) {
      console.error(err);
      alert("Failed to remove avatar photo.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleEquipBorder = async (borderId) => {
    if (!userId) return;
    await equipBorder({ userId, borderId });
  };

  const handleEquipBanner = async (bannerId) => {
    if (!userId) return;
    await equipBanner({ userId, bannerId });
  };

  const handleSelectLanguage = async (langName) => {
    if (!userId) return;
    setLanguage(langName);
    await updateBestLanguage({ userId, language: langName });
  };

  if (!user) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', border: '2.5px solid var(--border-subtle)', borderTopColor: 'var(--accent)', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading your profile…</p>
      </div>
    </div>
  );

  const xp = user.totalXp || user.xp || 0;
  const { lvl, curr, next, pct } = xpProgress(xp);
  const achievements = getAchievements(user);
  const activity = mockActivity(user);

  const equippedBannerId = user.equippedBanner || "banner_default";
  const equippedBorderId = user.equippedBorder || "border_default";
  const unlockedBorders = user.unlockedBorders || ["border_default"];
  const unlockedBanners = user.unlockedBanners || ["banner_default"];

  const currentBannerObj = BANNERS.find(b => b.id === equippedBannerId) || BANNERS[0];
  const currentFrameObj = FRAMES.find(f => f.id === equippedBorderId) || FRAMES[0];

  const currentLang = user.bestLanguage || language || "Kannada";
  const langMeta = SOUTH_INDIAN_LANGUAGES.find(l => l.label === currentLang) || SOUTH_INDIAN_LANGUAGES[0];

  return (
    <div style={{ padding: '24px 16px', maxWidth: 650, margin: '0 auto' }}>
      {/* Hidden file input for Avatar upload */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleAvatarUpload} 
        accept="image/*" 
        style={{ display: "none" }} 
      />

      {/* Main Gaming Profile Card */}
      <div className="glass-panel" style={{
        borderRadius: 24,
        overflow: 'hidden',
        border: '1px solid var(--border-subtle)',
        boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
        animation: 'fadeUp 0.5s var(--ease-out)',
        marginBottom: 24,
      }}>
        {/* Animated Banner Header */}
        <div className={`profile-banner-base ${currentBannerObj.class}`}>
          {/* Top Floating Controls */}
          <div style={{
            position: 'absolute', top: 12, right: 12, zIndex: 10,
            display: 'flex', alignItems: 'center', gap: 8
          }}>
            <button 
              onClick={() => { setModalTab("avatar"); setModalOpen(true); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 14px', borderRadius: 99,
                background: 'rgba(0, 0, 0, 0.55)', backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                color: '#fff', fontSize: 13, fontWeight: 700,
                cursor: 'pointer', transition: 'all 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.8)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.55)'}
            >
              <Palette size={14} color="#facc15" />
              <span>Customize</span>
            </button>

            <button 
              onClick={handleLogout}
              title="Log out"
              style={{
                padding: '8px 10px', borderRadius: 99,
                background: 'rgba(239, 68, 68, 0.2)', backdropFilter: 'blur(10px)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                color: '#f87171', fontSize: 13, fontWeight: 700,
                cursor: 'pointer', transition: 'all 0.2s',
                display: 'flex', alignItems: 'center'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.4)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>

        {/* Profile Card Body with Overlapping Avatar */}
        <div style={{ padding: '0 24px 24px', position: 'relative' }}>
          
          {/* Overlapping Avatar Section */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
            marginTop: -44, marginBottom: 16,
          }}>
            {/* Avatar Container with Frame */}
            <div style={{ position: 'relative', width: 88, height: 88 }}>
              <div 
                className={currentFrameObj.class}
                style={{
                  width: 88, height: 88, borderRadius: '50%',
                  position: 'relative', overflow: 'hidden',
                  background: 'var(--bg-base)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {user.avatarUrl ? (
                  <img 
                    src={user.avatarUrl} 
                    alt={user.name} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                ) : (
                  <div style={{
                    width: '100%', height: '100%',
                    background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 34, fontWeight: 800, color: '#fff',
                  }}>
                    {user.name?.[0]?.toUpperCase() || "L"}
                  </div>
                )}
              </div>

              {/* Quick Camera Upload Button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                title="Change Avatar Photo"
                style={{
                  position: 'absolute', bottom: -2, right: -2,
                  width: 30, height: 30, borderRadius: '50%',
                  background: 'var(--accent)', border: '2px solid var(--bg-card)',
                  color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: uploadingAvatar ? 'wait' : 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                  transition: 'transform 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.15)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'none'}
              >
                {uploadingAvatar ? <RefreshCw size={13} className="spin" /> : <Camera size={13} />}
              </button>
            </div>

            {/* Gems Pill */}
            <div 
              onClick={() => navigate('/shop')}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 14px', borderRadius: 99,
                background: 'rgba(14, 165, 233, 0.12)', border: '1px solid rgba(14, 165, 233, 0.35)',
                color: '#38bdf8', fontSize: 13, fontWeight: 800, cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(14, 165, 233, 0.25)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(14, 165, 233, 0.12)'}
            >
              <Gem size={15} />
              <span>{user.gems || 0} Gems</span>
              <ChevronRight size={13} opacity={0.7} />
            </div>
          </div>

          {/* User Name & Badges */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                {user.name}
              </h1>
              
              {/* Level Pill */}
              <span style={{
                padding: '3px 10px', borderRadius: 99,
                background: 'var(--accent-bg)', border: '1px solid var(--accent-border)',
                color: 'var(--accent)', fontSize: 11, fontWeight: 800, textTransform: 'uppercase',
              }}>
                Lvl {lvl} Learner
              </span>

              {/* Best Language Badge */}
              <span 
                onClick={() => { setModalTab("language"); setModalOpen(true); }}
                title="Tap to change best language"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '3px 10px', borderRadius: 99,
                  background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
                  color: 'var(--text-secondary)', fontSize: 11, fontWeight: 700,
                  cursor: 'pointer', transition: 'all 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
              >
                <span>{langMeta.emoji}</span>
                <span>{langMeta.label} ({langMeta.script})</span>
              </span>
            </div>
          </div>

          {/* Clash of Clans Style Hero Stats Grid */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10,
            marginBottom: 20
          }}>
            {/* Streak & Best Streak */}
            <div style={{
              background: 'var(--bg-elevated)', border: '1px solid rgba(245, 158, 11, 0.25)',
              borderRadius: 16, padding: '14px 16px', position: 'relative', overflow: 'hidden'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#f59e0b', marginBottom: 6 }}>
                <Flame size={16} />
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Current Streak</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontSize: 28, fontWeight: 800, color: '#f59e0b', lineHeight: 1 }}>{user.streak || 0}</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>days</span>
              </div>
              <div style={{ marginTop: 6, fontSize: 11, color: 'var(--text-faint)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Trophy size={12} color="#fbbf24" />
                <span>All-time Best: <strong>{user.maxStreak || user.streak || 0} days</strong></span>
              </div>
            </div>

            {/* Total XP & Rank */}
            <div style={{
              background: 'var(--bg-elevated)', border: '1px solid var(--accent-border)',
              borderRadius: 16, padding: '14px 16px', position: 'relative', overflow: 'hidden'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--accent)', marginBottom: 6 }}>
                <Zap size={16} />
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Total XP</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent)', lineHeight: 1 }}>{xp.toLocaleString()}</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>XP</span>
              </div>
              <div style={{ marginTop: 6, fontSize: 11, color: 'var(--text-faint)' }}>
                Next Level in <strong>{(next - xp).toLocaleString()} XP</strong>
              </div>
            </div>

            {/* Pronunciation Accuracy */}
            <div style={{
              background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
              borderRadius: 16, padding: '14px 16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#0ea5e9', marginBottom: 6 }}>
                <Award size={16} />
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Accuracy</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontSize: 28, fontWeight: 800, color: '#0ea5e9', lineHeight: 1 }}>
                  {stats ? `${stats.avgAccuracy}%` : '—'}
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>average</span>
              </div>
            </div>

            {/* Completed Lessons */}
            <div style={{
              background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
              borderRadius: 16, padding: '14px 16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#8b5cf6', marginBottom: 6 }}>
                <Star size={16} />
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Practiced</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontSize: 28, fontWeight: 800, color: '#8b5cf6', lineHeight: 1 }}>
                  {stats ? stats.totalAssessments : '—'}
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>sessions</span>
              </div>
            </div>
          </div>

          {/* Level Progress Bar */}
          <div style={{ marginBottom: 24, padding: '14px 16px', background: 'var(--bg-elevated)', borderRadius: 16, border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                Level Progress
              </span>
              <span style={{ color: 'var(--accent)', fontSize: 12, fontWeight: 800 }}>
                Lvl {lvl} → {lvl + 1} ({pct}%)
              </span>
            </div>
            <div style={{ height: 8, borderRadius: 99, background: 'var(--bg-base)', overflow: 'hidden' }}>
              <div style={{ 
                height: '100%', width: `${xpVis ? pct : 0}%`, 
                background: 'linear-gradient(90deg, var(--accent), #10b981)', 
                borderRadius: 99, transition: 'width 1s var(--ease-out)' 
              }} />
            </div>
          </div>

          {/* Achievements Showcase */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                Achievements Showcase
              </span>
              <span style={{ color: 'var(--text-faint)', fontSize: 11 }}>
                {achievements.filter(a => a.unlocked).length} / {achievements.length} Unlocked
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {achievements.map((a) => {
                const AchIcon = a.icon;
                return (
                  <div 
                    key={a.id} 
                    title={a.unlocked ? `${a.label}: ${a.desc}` : `Locked: ${a.desc}`}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                      padding: '12px 6px', borderRadius: 14,
                      background: a.unlocked ? 'var(--accent-bg)' : 'var(--bg-elevated)',
                      border: a.unlocked ? '1px solid var(--accent-border)' : '1px solid var(--border-subtle)',
                      filter: a.unlocked ? 'none' : 'grayscale(1) opacity(0.35)',
                      transition: 'transform 0.2s', cursor: 'default'
                    }}
                    onMouseEnter={e => { if (a.unlocked) e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                  >
                    <div style={{ color: a.color }}>
                      <AchIcon size={20} />
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: a.unlocked ? 'var(--accent)' : 'var(--text-faint)', textAlign: 'center', lineHeight: 1.15 }}>
                      {a.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 14-Day Activity Heatmap */}
          <div>
            <span style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block', marginBottom: 10 }}>
              Activity — Last 14 Days
            </span>
            <div style={{ display: 'flex', gap: 5 }}>
              {activity.map((v, i) => (
                <div 
                  key={i} 
                  title={v === 0 ? 'No practice' : `${v} lesson session${v > 1 ? 's' : ''}`}
                  style={{ 
                    flex: 1, height: 26, borderRadius: 6, 
                    background: heatColor(v), transition: 'transform 0.15s', cursor: 'default' 
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.15)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'none'} 
                />
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          Customize Profile Modal / Wardrobe
          ═══════════════════════════════════════════════════════════════ */}
      {modalOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
        }}>
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border-default)',
            borderRadius: 24, width: '100%', maxWidth: 540, maxHeight: '90vh',
            overflow: 'hidden', display: 'flex', flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            animation: 'fadeUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
          }}>
            {/* Modal Header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '18px 24px', borderBottom: '1px solid var(--border-subtle)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Palette size={20} color="var(--accent)" />
                <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Customize Profile</h2>
              </div>
              <button 
                onClick={() => setModalOpen(false)}
                style={{
                  background: 'none', border: 'none', color: 'var(--text-muted)',
                  cursor: 'pointer', padding: 6, borderRadius: 8, display: 'flex'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Tabs */}
            <div style={{
              display: 'flex', borderBottom: '1px solid var(--border-subtle)',
              padding: '0 16px', background: 'var(--bg-elevated)'
            }}>
              {[
                { id: "avatar", label: "Avatar Photo" },
                { id: "frames", label: "Avatar Frames" },
                { id: "banners", label: "Profile Banners" },
                { id: "language", label: "Best Language" },
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setModalTab(t.id)}
                  style={{
                    padding: '12px 14px', border: 'none', background: 'none',
                    color: modalTab === t.id ? 'var(--accent)' : 'var(--text-muted)',
                    fontWeight: modalTab === t.id ? 800 : 600, fontSize: 13,
                    borderBottom: modalTab === t.id ? '2px solid var(--accent)' : '2px solid transparent',
                    cursor: 'pointer', transition: 'all 0.2s'
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
              
              {/* TAB 1: AVATAR PHOTO */}
              {modalTab === "avatar" && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    width: 100, height: 100, borderRadius: '50%', margin: '0 auto 16px',
                    position: 'relative', overflow: 'hidden',
                  }} className={currentFrameObj.class}>
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{
                        width: '100%', height: '100%', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 38, fontWeight: 800, color: '#fff'
                      }}>
                        {user.name?.[0]?.toUpperCase()}
                      </div>
                    )}
                  </div>

                  <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 20 }}>
                    Upload a custom profile image (JPG, PNG, WebP up to 5MB).
                  </p>

                  <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingAvatar}
                      style={{
                        padding: '10px 18px', borderRadius: 12,
                        background: 'var(--accent)', color: '#fff', border: 'none',
                        fontWeight: 700, fontSize: 14, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 8
                      }}
                    >
                      {uploadingAvatar ? <RefreshCw size={16} className="spin" /> : <Camera size={16} />}
                      <span>{uploadingAvatar ? "Uploading..." : "Upload Photo"}</span>
                    </button>

                    {user.avatarUrl && (
                      <button
                        onClick={handleRemoveAvatar}
                        disabled={uploadingAvatar}
                        style={{
                          padding: '10px 16px', borderRadius: 12,
                          background: 'var(--coral-bg)', color: 'var(--coral)',
                          border: '1px solid rgba(244,63,94,0.3)',
                          fontWeight: 700, fontSize: 14, cursor: 'pointer'
                        }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: AVATAR FRAMES */}
              {modalTab === "frames" && (
                <div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: '0 0 16px' }}>
                    Select an avatar frame to equip. Unlock more styles in the Shop!
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                    {FRAMES.map(f => {
                      const isOwned = unlockedBorders.includes(f.id);
                      const isEquipped = equippedBorderId === f.id;

                      return (
                        <div
                          key={f.id}
                          style={{
                            background: 'var(--bg-elevated)',
                            border: `2px solid ${isEquipped ? 'var(--accent)' : 'var(--border-subtle)'}`,
                            borderRadius: 16, padding: 14, textAlign: 'center',
                            position: 'relative'
                          }}
                        >
                          {/* Mini Avatar Preview */}
                          <div style={{
                            width: 54, height: 54, borderRadius: '50%', margin: '0 auto 10px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: 'var(--bg-card)', position: 'relative'
                          }} className={f.class}>
                            <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent)' }}>
                              {user.name?.[0]?.toUpperCase()}
                            </span>
                          </div>

                          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 2 }}>
                            {f.name}
                          </div>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 12 }}>
                            {f.desc}
                          </div>

                          {isOwned ? (
                            <button
                              onClick={() => handleEquipBorder(f.id)}
                              style={{
                                width: '100%', padding: '6px 10px', borderRadius: 10,
                                background: isEquipped ? 'var(--accent)' : 'transparent',
                                color: isEquipped ? '#fff' : 'var(--text-secondary)',
                                border: isEquipped ? 'none' : '1px solid var(--border-default)',
                                fontSize: 12, fontWeight: 700, cursor: 'pointer'
                              }}
                            >
                              {isEquipped ? "Equipped" : "Equip"}
                            </button>
                          ) : (
                            <button
                              onClick={() => { setModalOpen(false); navigate('/shop'); }}
                              style={{
                                width: '100%', padding: '6px 10px', borderRadius: 10,
                                background: 'rgba(14, 165, 233, 0.1)', color: '#0ea5e9',
                                border: '1px solid rgba(14, 165, 233, 0.3)',
                                fontSize: 11, fontWeight: 700, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4
                              }}
                            >
                              <Lock size={12} />
                              <span>{f.price} Gems in Shop</span>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 3: PROFILE BANNERS */}
              {modalTab === "banners" && (
                <div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: '0 0 16px' }}>
                    Select your animated banner background. Unlock animated banners in the Shop!
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {BANNERS.map(b => {
                      const isOwned = unlockedBanners.includes(b.id);
                      const isEquipped = equippedBannerId === b.id;

                      return (
                        <div
                          key={b.id}
                          style={{
                            background: 'var(--bg-elevated)',
                            border: `2px solid ${isEquipped ? 'var(--accent)' : 'var(--border-subtle)'}`,
                            borderRadius: 16, overflow: 'hidden',
                          }}
                        >
                          {/* Banner preview strip */}
                          <div className={`profile-banner-base ${b.class}`} style={{ height: 60, borderRadius: '14px 14px 0 0' }} />

                          <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>
                                {b.name}
                              </div>
                              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                {b.desc}
                              </div>
                            </div>

                            {isOwned ? (
                              <button
                                onClick={() => handleEquipBanner(b.id)}
                                style={{
                                  padding: '7px 16px', borderRadius: 10,
                                  background: isEquipped ? 'var(--accent)' : 'transparent',
                                  color: isEquipped ? '#fff' : 'var(--text-secondary)',
                                  border: isEquipped ? 'none' : '1px solid var(--border-default)',
                                  fontSize: 12, fontWeight: 700, cursor: 'pointer'
                                }}
                              >
                                {isEquipped ? "Equipped" : "Equip"}
                              </button>
                            ) : (
                              <button
                                onClick={() => { setModalOpen(false); navigate('/shop'); }}
                                style={{
                                  padding: '7px 14px', borderRadius: 10,
                                  background: 'rgba(14, 165, 233, 0.1)', color: '#0ea5e9',
                                  border: '1px solid rgba(14, 165, 233, 0.3)',
                                  fontSize: 12, fontWeight: 700, cursor: 'pointer',
                                  display: 'flex', alignItems: 'center', gap: 4
                                }}
                              >
                                <Lock size={12} />
                                <span>{b.price} Gems</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 4: BEST LANGUAGE */}
              {modalTab === "language" && (
                <div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: '0 0 16px' }}>
                    Choose your primary focus language to highlight on your profile:
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                    {SOUTH_INDIAN_LANGUAGES.map(l => {
                      const isSelected = currentLang === l.label;
                      return (
                        <button
                          key={l.code}
                          onClick={() => handleSelectLanguage(l.label)}
                          style={{
                            padding: '12px 14px', borderRadius: 14,
                            background: isSelected ? 'var(--accent-bg)' : 'var(--bg-elevated)',
                            border: `2px solid ${isSelected ? 'var(--accent)' : 'var(--border-subtle)'}`,
                            color: isSelected ? 'var(--accent)' : 'var(--text-primary)',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left'
                          }}
                        >
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 700 }}>
                              {l.emoji} {l.label}
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                              {l.script}
                            </div>
                          </div>
                          {isSelected && <Check size={16} color="var(--accent)" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer with Link to Shop */}
            <div style={{
              padding: '14px 24px', borderTop: '1px solid var(--border-subtle)',
              background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                💎 Balance: <strong>{user.gems || 0} Gems</strong>
              </span>
              <button
                onClick={() => { setModalOpen(false); navigate('/shop'); }}
                style={{
                  background: 'none', border: 'none', color: '#0ea5e9',
                  fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 4
                }}
              >
                <ShoppingBag size={14} />
                <span>Open Shop ➔</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
