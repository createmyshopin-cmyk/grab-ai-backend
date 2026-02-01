'use client';

import React, { useState } from 'react';

interface ViewportOption {
  id: 'mobile' | 'tablet' | 'desktop';
  label: string;
  dimensions: string;
  icon: string;
}

const VIEWPORTS: ViewportOption[] = [
  { id: 'mobile', label: 'Mobile', dimensions: '402 × 874', icon: '📱' },
  { id: 'tablet', label: 'Tablet', dimensions: '1133 × 744', icon: '📱' },
  { id: 'desktop', label: 'Browser', dimensions: '1440 × 1024', icon: '🖥️' },
];

interface ViewportSelectorProps {
  onConfirm: (selectedViewports: Array<'mobile' | 'tablet' | 'desktop'>) => void;
  onCancel: () => void;
}

export default function ViewportSelector({ onConfirm, onCancel }: ViewportSelectorProps) {
  const [selected, setSelected] = useState<Set<'mobile' | 'tablet' | 'desktop'>>(
    new Set(['mobile', 'tablet', 'desktop']) // All selected by default
  );

  const toggleViewport = (id: 'mobile' | 'tablet' | 'desktop') => {
    const newSelected = new Set(selected);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelected(newSelected);
  };

  const handleConfirm = () => {
    if (selected.size === 0) {
      alert('Please select at least one viewport');
      return;
    }
    onConfirm(Array.from(selected));
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
        padding: '24px',
        zIndex: 10000,
        minWidth: '320px',
      }}
    >
      <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 600 }}>
        ⚡ Select Responsive Variants
      </h3>

      <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#6b7280' }}>
        Choose which viewport variants to generate (instant, no AI)
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
        {VIEWPORTS.map((viewport) => (
          <label
            key={viewport.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px',
              border: selected.has(viewport.id) ? '2px solid #3b82f6' : '2px solid #e5e7eb',
              borderRadius: '8px',
              cursor: 'pointer',
              background: selected.has(viewport.id) ? '#eff6ff' : 'white',
              transition: 'all 0.15s',
            }}
          >
            <input
              type="checkbox"
              checked={selected.has(viewport.id)}
              onChange={() => toggleViewport(viewport.id)}
              style={{
                width: '18px',
                height: '18px',
                marginRight: '12px',
                cursor: 'pointer',
              }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                <span style={{ fontSize: '16px' }}>{viewport.icon}</span>
                <span style={{ fontSize: '14px', fontWeight: 500 }}>{viewport.label}</span>
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>{viewport.dimensions}</div>
            </div>
          </label>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={onCancel}
          style={{
            flex: 1,
            padding: '10px 16px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            background: 'white',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          disabled={selected.size === 0}
          style={{
            flex: 1,
            padding: '10px 16px',
            border: 'none',
            borderRadius: '6px',
            background: selected.size === 0 ? '#d1d5db' : '#3b82f6',
            color: 'white',
            cursor: selected.size === 0 ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: 500,
          }}
        >
          Generate {selected.size} Variant{selected.size !== 1 ? 's' : ''}
        </button>
      </div>
    </div>
  );
}
