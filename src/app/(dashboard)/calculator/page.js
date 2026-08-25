'use client';

import { useState } from 'react';
import { Calculator as CalcIcon, ArrowRight } from 'lucide-react';
import { convertArea, calculateTotalValue, calculateProfit, calculateROI, calculateAppreciation } from '@/lib/utils/calculations';

export default function CalculatorPage() {
  const [activeTab, setActiveTab] = useState('area');
  // Area calc
  const [areaLength, setAreaLength] = useState('');
  const [areaWidth, setAreaWidth] = useState('');
  const [convertFrom, setConvertFrom] = useState('sq.ft');
  const [convertTo, setConvertTo] = useState('sq.yards');
  const [convertValue, setConvertValue] = useState('');
  // Price calc
  const [priceArea, setPriceArea] = useState('');
  const [priceRate, setPriceRate] = useState('');
  // Investment calc
  const [investPurchase, setInvestPurchase] = useState('');
  const [investSelling, setInvestSelling] = useState('');

  const tabs = [
    { id: 'area', label: 'Area' },
    { id: 'price', label: 'Price' },
    { id: 'investment', label: 'Investment' },
  ];

  const areaResult = areaLength && areaWidth ? Number(areaLength) * Number(areaWidth) : null;
  const convertResult = convertValue ? convertArea(Number(convertValue), convertFrom, convertTo) : null;
  const priceResult = priceArea && priceRate ? calculateTotalValue(Number(priceArea), Number(priceRate)) : null;
  const profit = investPurchase && investSelling ? calculateProfit(Number(investPurchase), Number(investSelling)) : null;
  const roi = investPurchase && investSelling ? calculateROI(Number(investPurchase), Number(investSelling)) : null;

  return (
    <div style={{ maxWidth: 600 }}>
      <div className="page-header"><div><h1 className="page-title">Calculator</h1><p className="page-subtitle">Area, price & investment calculations</p></div></div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 'var(--space-xs)', marginBottom: 'var(--space-xl)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-xs)' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            style={{ padding: 'var(--space-sm) var(--space-base)', border: 'none', background: activeTab === t.id ? 'var(--color-accent-light)' : 'transparent', color: activeTab === t.id ? 'var(--color-accent)' : 'var(--color-text-secondary)', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 500, fontSize: 'var(--font-size-md)' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Area Calculator */}
      {activeTab === 'area' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          <div className="card">
            <h3 className="section-title" style={{ marginBottom: 'var(--space-base)' }}>Length × Width</h3>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Length (ft)</label><input className="form-input" type="number" step="any" value={areaLength} onChange={e => setAreaLength(e.target.value)} placeholder="30" /></div>
              <div className="form-group"><label className="form-label">Width (ft)</label><input className="form-input" type="number" step="any" value={areaWidth} onChange={e => setAreaWidth(e.target.value)} placeholder="40" /></div>
            </div>
            {areaResult !== null && (
              <div style={{ marginTop: 'var(--space-base)', padding: 'var(--space-md)', background: 'var(--color-accent-light)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>Total Area</span>
                <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--color-accent)' }}>{areaResult.toLocaleString('en-IN')} sq.ft</div>
              </div>
            )}
          </div>

          <div className="card">
            <h3 className="section-title" style={{ marginBottom: 'var(--space-base)' }}>Unit Conversion</h3>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Value</label><input className="form-input" type="number" step="any" value={convertValue} onChange={e => setConvertValue(e.target.value)} placeholder="1200" /></div>
              <div className="form-group"><label className="form-label">From</label><select className="form-select" value={convertFrom} onChange={e => setConvertFrom(e.target.value)}><option value="sq.ft">Sq.Ft</option><option value="sq.yards">Sq.Yards</option><option value="acre">Acre</option><option value="guntha">Guntha</option></select></div>
              <div className="form-group"><label className="form-label">To</label><select className="form-select" value={convertTo} onChange={e => setConvertTo(e.target.value)}><option value="sq.ft">Sq.Ft</option><option value="sq.yards">Sq.Yards</option><option value="acre">Acre</option><option value="guntha">Guntha</option></select></div>
            </div>
            {convertResult !== null && (
              <div style={{ marginTop: 'var(--space-base)', padding: 'var(--space-md)', background: 'var(--color-success-light)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--color-success)' }}>{convertResult.toLocaleString('en-IN', { maximumFractionDigits: 4 })} {convertTo}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Price Calculator */}
      {activeTab === 'price' && (
        <div className="card">
          <h3 className="section-title" style={{ marginBottom: 'var(--space-base)' }}>Property Value</h3>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Area (sq.ft)</label><input className="form-input" type="number" step="any" value={priceArea} onChange={e => setPriceArea(e.target.value)} placeholder="1200" /></div>
            <div className="form-group"><label className="form-label">Rate (₹/sq.ft)</label><input className="form-input" type="number" step="any" value={priceRate} onChange={e => setPriceRate(e.target.value)} placeholder="2000" /></div>
          </div>
          {priceResult !== null && (
            <div style={{ marginTop: 'var(--space-base)', padding: 'var(--space-lg)', background: 'var(--color-accent-light)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
              <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>Total Value</span>
              <div style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 700, color: 'var(--color-accent)' }}>₹{priceResult.toLocaleString('en-IN')}</div>
              {priceResult >= 100000 && <div style={{ fontSize: 'var(--font-size-md)', color: 'var(--color-text-secondary)' }}>{priceResult >= 10000000 ? `₹${(priceResult / 10000000).toFixed(2)} Crore` : `₹${(priceResult / 100000).toFixed(2)} Lakh`}</div>}
              <div style={{ marginTop: 'var(--space-sm)', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-tertiary)' }}>
                Rate/sq.yard: ₹{(Number(priceRate) * 9).toLocaleString('en-IN')}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Investment Calculator */}
      {activeTab === 'investment' && (
        <div className="card">
          <h3 className="section-title" style={{ marginBottom: 'var(--space-base)' }}>Investment Returns</h3>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Purchase Price (₹)</label><input className="form-input" type="number" step="any" value={investPurchase} onChange={e => setInvestPurchase(e.target.value)} placeholder="2400000" /></div>
            <div className="form-group"><label className="form-label">Selling Price (₹)</label><input className="form-input" type="number" step="any" value={investSelling} onChange={e => setInvestSelling(e.target.value)} placeholder="3600000" /></div>
          </div>
          {profit !== null && (
            <div style={{ marginTop: 'var(--space-base)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-base)' }}>
              <div style={{ padding: 'var(--space-md)', background: profit >= 0 ? 'var(--color-success-light)' : 'var(--color-danger-light)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>Profit / Loss</span>
                <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: profit >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>₹{Math.abs(profit).toLocaleString('en-IN')}</div>
              </div>
              <div style={{ padding: 'var(--space-md)', background: roi >= 0 ? 'var(--color-success-light)' : 'var(--color-danger-light)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>ROI</span>
                <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: roi >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>{roi.toFixed(1)}%</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
