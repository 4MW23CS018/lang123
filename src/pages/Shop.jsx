import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { Snowflake, Shield, Sparkles, Check, Lock, Palette, Gem } from "lucide-react";
import { FRAMES, BANNERS } from "../lib/cosmetics";
import shopGemIcon from "../assets/shop-gem.png";

export default function Shop() {
  const userId = localStorage.getItem("userId");
  const user = useQuery(api.users.get, userId ? { userId } : "skip");
  const buyItem = useMutation(api.shop.buyItem);
  const equipBorder = useMutation(api.shop.equipBorder);
  const equipBanner = useMutation(api.shop.equipBanner);

  const [activeTab, setActiveTab] = useState("frames"); // "frames" | "banners" | "utilities"
  const [buying, setBuying] = useState(null);

  if (!user) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'var(--text-muted)' }}>Loading Shop...</p>
    </div>
  );

  const gems = user.gems || 0;
  const streakFreezes = user.streakFreezes || 0;
  const unlockedBorders = user.unlockedBorders || ["border_default"];
  const equippedBorder = user.equippedBorder || "border_default";
  const unlockedBanners = user.unlockedBanners || ["banner_default"];
  const equippedBanner = user.equippedBanner || "banner_default";

  const handleBuy = async (itemId, price) => {
    if (gems < price) return alert("Not enough gems! Complete lessons and streaks to earn more.");
    setBuying(itemId);
    try {
      await buyItem({ userId, itemId });
    } catch (err) {
      alert(err.message);
    } finally {
      setBuying(null);
    }
  };

  const handleEquipBorder = async (borderId) => {
    try {
      await equipBorder({ userId, borderId });
    } catch (err) {
      alert(err.message);
    }
  };

  const handleEquipBanner = async (bannerId) => {
    try {
      await equipBanner({ userId, bannerId });
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={{ padding: '32px 24px', maxWidth: 900, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, animation: 'fadeDown 0.4s var(--ease-out)' }}>
        <div>
          <h1 style={{ fontSize: 36, fontWeight: 800, margin: '0 0 8px', letterSpacing: '-0.5px' }}>Cosmetics & Shop</h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Equip animated avatar frames and profile banners!</p>
        </div>
        <div style={{ background: 'var(--bg-elevated)', padding: '10px 22px', borderRadius: 99, border: '2px solid rgba(168, 85, 247, 0.4)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <img src={shopGemIcon} alt="Gems" style={{ width: 22, height: 22, objectFit: 'contain' }} />
          <span style={{ color: '#c084fc', fontWeight: 800, fontSize: 20 }}>{gems}</span>
        </div>
      </div>

      {/* Tab Switcher */}
      <div style={{
        display: 'flex', gap: 8, marginBottom: 32,
        background: 'var(--bg-elevated)', padding: 6, borderRadius: 16,
        width: 'fit-content'
      }}>
        {[
          { id: "frames", label: "Avatar Frames", icon: Shield },
          { id: "banners", label: "Profile Banners", icon: Palette },
          { id: "utilities", label: "Utilities", icon: Snowflake },
        ].map(tab => {
          const TabIcon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 20px', borderRadius: 12,
                background: isActive ? 'var(--accent)' : 'transparent',
                color: isActive ? '#fff' : 'var(--text-muted)',
                border: 'none', fontWeight: 700, fontSize: 14,
                cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              <TabIcon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: AVATAR FRAMES */}
      {activeTab === "frames" && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
            {FRAMES.map(f => {
              const isOwned = unlockedBorders.includes(f.id) || f.isDefault;
              const isEquipped = equippedBorder === f.id;

              return (
                <div key={f.id} className="glass-panel" style={{
                  padding: 24, display: 'flex', flexDirection: 'column',
                  border: isEquipped ? '2px solid var(--accent)' : '1px solid var(--border-subtle)',
                  borderRadius: 20, transition: 'transform 0.2s', position: 'relative'
                }}>
                  {/* Rarity Tag */}
                  <div style={{
                    position: 'absolute', top: 16, right: 16,
                    fontSize: 10, fontWeight: 800, textTransform: 'uppercase',
                    padding: '3px 8px', borderRadius: 99,
                    background: 'var(--bg-elevated)', color: f.glowColor || 'var(--text-muted)'
                  }}>
                    {f.rarity}
                  </div>

                  {/* Live Avatar Preview in Frame */}
                  <div style={{ margin: '12px auto 20px', position: 'relative', width: 76, height: 76 }}>
                    <div 
                      className={f.class}
                      style={{
                        width: 76, height: 76, borderRadius: '50%',
                        background: 'var(--bg-base)', overflow: 'hidden',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent)' }}>
                          {user.name?.[0]?.toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 style={{ margin: '0 0 4px', fontSize: 17, fontWeight: 800, textAlign: 'center' }}>{f.name}</h3>
                  <p style={{ margin: '0 0 20px', color: 'var(--text-secondary)', fontSize: 13, textAlign: 'center', minHeight: 36 }}>{f.desc}</p>

                  <div style={{ marginTop: 'auto' }}>
                    {!isOwned ? (
                      <button 
                        onClick={() => handleBuy(f.id, f.price)}
                        disabled={buying === f.id || gems < f.price}
                        style={{
                          width: '100%', background: gems >= f.price ? '#0ea5e9' : 'var(--bg-elevated)', 
                          color: gems >= f.price ? '#fff' : 'var(--text-muted)',
                          border: 'none', padding: '12px', borderRadius: 12, fontWeight: 700, 
                          cursor: gems >= f.price ? 'pointer' : 'not-allowed',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                        }}
                      >
                        {buying === f.id ? 'Purchasing...' : (
                          <><span>{f.price}</span> <img src={shopGemIcon} alt="gems" style={{ width: 16, height: 16, objectFit: 'contain' }} /></>
                        )}
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleEquipBorder(f.id)}
                        disabled={isEquipped}
                        style={{
                          width: '100%', 
                          background: isEquipped ? 'rgba(34,197,94,0.15)' : 'var(--accent)', 
                          color: isEquipped ? '#22c55e' : '#fff',
                          border: isEquipped ? '1px solid rgba(34,197,94,0.3)' : 'none', 
                          padding: '12px', borderRadius: 12, fontWeight: 700, 
                          cursor: isEquipped ? 'default' : 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                        }}
                      >
                        {isEquipped ? <><Check size={16} /> Equipped</> : 'Equip Frame'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: PROFILE BANNERS */}
      {activeTab === "banners" && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 24 }}>
            {BANNERS.map(b => {
              const isOwned = unlockedBanners.includes(b.id) || b.isDefault;
              const isEquipped = equippedBanner === b.id;

              return (
                <div key={b.id} className="glass-panel" style={{
                  borderRadius: 20, overflow: 'hidden',
                  border: isEquipped ? '2px solid var(--accent)' : '1px solid var(--border-subtle)',
                  display: 'flex', flexDirection: 'column'
                }}>
                  {/* Live Animated Banner Preview */}
                  <div className={`profile-banner-base ${b.class}`} style={{ height: 110, position: 'relative' }}>
                    <div style={{
                      position: 'absolute', top: 12, right: 12, zIndex: 10,
                      fontSize: 10, fontWeight: 800, textTransform: 'uppercase',
                      padding: '3px 8px', borderRadius: 99,
                      background: 'rgba(0,0,0,0.6)', color: b.accentColor || '#fff',
                      backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)'
                    }}>
                      {b.rarity}
                    </div>
                  </div>

                  <div style={{ padding: 20, display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                      <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>{b.name}</h3>
                      {b.isDefault && <span style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 700 }}>Default</span>}
                    </div>
                    <p style={{ margin: '0 0 20px', color: 'var(--text-secondary)', fontSize: 13, flex: 1 }}>{b.desc}</p>

                    <div>
                      {!isOwned ? (
                        <button 
                          onClick={() => handleBuy(b.id, b.price)}
                          disabled={buying === b.id || gems < b.price}
                          style={{
                            width: '100%', background: gems >= b.price ? '#0ea5e9' : 'var(--bg-elevated)', 
                            color: gems >= b.price ? '#fff' : 'var(--text-muted)',
                            border: 'none', padding: '12px', borderRadius: 12, fontWeight: 700, 
                            cursor: gems >= b.price ? 'pointer' : 'not-allowed',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                          }}
                        >
                          {buying === b.id ? 'Purchasing...' : (
                            <><span>{b.price}</span> <img src={shopGemIcon} alt="gems" style={{ width: 16, height: 16, objectFit: 'contain' }} /></>
                          )}
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleEquipBanner(b.id)}
                          disabled={isEquipped}
                          style={{
                            width: '100%', 
                            background: isEquipped ? 'rgba(34,197,94,0.15)' : 'var(--accent)', 
                            color: isEquipped ? '#22c55e' : '#fff',
                            border: isEquipped ? '1px solid rgba(34,197,94,0.3)' : 'none', 
                            padding: '12px', borderRadius: 12, fontWeight: 700, 
                            cursor: isEquipped ? 'default' : 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                          }}
                        >
                          {isEquipped ? <><Check size={16} /> Equipped</> : 'Equip Banner'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: UTILITIES */}
      {activeTab === "utilities" && (
        <div className="glass-panel" style={{ padding: '24px', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(14, 165, 233, 0.15)', color: '#0ea5e9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Snowflake size={28} />
            </div>
            <div>
              <h3 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 800 }}>Streak Freeze</h3>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 14 }}>
                Miss a day of practice without losing your streak record. You currently have <strong>{streakFreezes}</strong>.
              </p>
            </div>
          </div>
          <button 
            onClick={() => handleBuy('streak_freeze', 50)}
            disabled={buying === 'streak_freeze' || gems < 50}
            style={{
              background: gems >= 50 ? '#0ea5e9' : 'var(--bg-elevated)', 
              color: gems >= 50 ? '#fff' : 'var(--text-muted)',
              border: 'none', padding: '12px 24px', borderRadius: 12, fontWeight: 700, 
              cursor: gems >= 50 ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', gap: 8
            }}
          >
            {buying === 'streak_freeze' ? '...' : (
              <><span>50</span> <img src={shopGemIcon} alt="gems" style={{ width: 16, height: 16, objectFit: 'contain' }} /></>
            )}
          </button>
        </div>
      )}

    </div>
  );
}
