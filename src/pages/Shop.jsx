import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";

const BORDERS = [
  { id: "border_neon", name: "Cyber Neon", price: 100, desc: "A pulsing cyan and magenta outline", class: "border-neon", icon: "⚡" },
  { id: "border_gold", name: "Royal Gold", price: 250, desc: "Shimmering gold gradient", class: "border-gold", icon: "👑" },
  { id: "border_fire", name: "Inferno", price: 500, desc: "Blazing animated fire ring", class: "border-fire", icon: "🔥" },
];

export default function Shop() {
  const userId = localStorage.getItem("userId");
  const user = useQuery(api.users.get, userId ? { userId } : "skip");
  const buyItem = useMutation(api.shop.buyItem);
  const equipBorder = useMutation(api.shop.equipBorder);

  const [buying, setBuying] = useState(null);

  if (!user) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'var(--text-muted)' }}>Loading Shop...</p>
    </div>
  );

  const gems = user.gems || 0;
  const streakFreezes = user.streakFreezes || 0;
  const unlockedBorders = user.unlockedBorders || [];
  const equippedBorder = user.equippedBorder || "";

  const handleBuy = async (itemId, price) => {
    if (gems < price) return alert("Not enough gems!");
    setBuying(itemId);
    try {
      await buyItem({ userId, itemId });
    } catch (err) {
      alert(err.message);
    }
    setBuying(null);
  };

  const handleEquip = async (borderId) => {
    await equipBorder({ userId, borderId });
  };

  return (
    <div style={{ padding: '32px 24px', maxWidth: 800, margin: '0 auto' }}>
      


      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40, animation: 'fadeDown 0.4s var(--ease-out)' }}>
        <div>
          <h1 style={{ fontSize: 36, fontWeight: 800, margin: '0 0 8px', letterSpacing: '-0.5px' }}>Shop</h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Spend your hard-earned gems!</p>
        </div>
        <div style={{ background: 'var(--bg-elevated)', padding: '12px 24px', borderRadius: 99, border: '2px solid #0ea5e9', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 24 }}>💎</span>
          <span style={{ color: '#0ea5e9', fontWeight: 800, fontSize: 20 }}>{gems}</span>
        </div>
      </div>

      {/* Utilities */}
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, color: 'var(--text-muted)' }}>Utilities</h2>
      <div className="glass-panel" style={{ padding: '24px', marginBottom: 40, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ fontSize: 40 }}>🧊</div>
          <div>
            <h3 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 700 }}>Streak Freeze</h3>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 14 }}>Miss a day without losing your streak. You have {streakFreezes}.</p>
          </div>
        </div>
        <button 
          onClick={() => handleBuy('streak_freeze', 50)}
          disabled={buying === 'streak_freeze' || gems < 50}
          style={{
            background: gems >= 50 ? '#0ea5e9' : 'var(--bg-elevated)', 
            color: gems >= 50 ? '#fff' : 'var(--text-muted)',
            border: 'none', padding: '12px 24px', borderRadius: 12, fontWeight: 700, cursor: gems >= 50 ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', gap: 8
          }}
        >
          {buying === 'streak_freeze' ? '...' : (
            <><span>50</span> 💎</>
          )}
        </button>
      </div>

      {/* Premium Borders */}
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, color: 'var(--text-muted)' }}>Premium Borders</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
        {BORDERS.map(b => {
          const isOwned = unlockedBorders.includes(b.id);
          const isEquipped = equippedBorder === b.id;

          return (
            <div key={b.id} className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                <div className={`border-demo ${b.class}`}>{b.icon}</div>
                <div>
                  <h3 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 700 }}>{b.name}</h3>
                  <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 13 }}>{b.desc}</p>
                </div>
              </div>
              
              <div style={{ marginTop: 'auto', paddingTop: 16 }}>
                {!isOwned ? (
                  <button 
                    onClick={() => handleBuy(b.id, b.price)}
                    disabled={buying === b.id || gems < b.price}
                    style={{
                      width: '100%', background: gems >= b.price ? '#0ea5e9' : 'var(--bg-elevated)', 
                      color: gems >= b.price ? '#fff' : 'var(--text-muted)',
                      border: 'none', padding: '12px', borderRadius: 12, fontWeight: 700, cursor: gems >= b.price ? 'pointer' : 'not-allowed',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                    }}
                  >
                    {buying === b.id ? '...' : (
                      <><span>{b.price}</span> 💎</>
                    )}
                  </button>
                ) : (
                  <button 
                    onClick={() => handleEquip(isEquipped ? "" : b.id)}
                    style={{
                      width: '100%', background: isEquipped ? 'transparent' : 'var(--accent)', 
                      color: isEquipped ? 'var(--text-secondary)' : '#fff',
                      border: isEquipped ? '2px solid var(--border-subtle)' : 'none', 
                      padding: isEquipped ? '10px' : '12px', 
                      borderRadius: 12, fontWeight: 700, cursor: 'pointer',
                    }}
                  >
                    {isEquipped ? 'Unequip' : 'Equip Border'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
