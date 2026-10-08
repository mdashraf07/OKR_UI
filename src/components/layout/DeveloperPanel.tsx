import React, { useState, useEffect } from 'react';
import { Sliders, RefreshCw, AlertTriangle, Database, Calendar, ShieldCheck, X } from 'lucide-react';
import { getDevSettings, updateDevSettings, resetDemoData } from '../../api';
import { DevSettings } from '../../api/mockDb';
import { useToastStore } from '../ui/Toast';
import { Button } from '../ui/Button';

export const DeveloperPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<DevSettings | null>(null);
  const { showToast } = useToastStore();

  useEffect(() => {
    getDevSettings().then(setSettings);
  }, [isOpen]);

  if (!settings) return null;

  const handleToggle = async (key: keyof DevSettings, value: unknown) => {
    const updated = await updateDevSettings({ [key]: value });
    setSettings(updated);
    showToast({ type: 'info', message: `Dev Setting: ${String(key)} updated` });
  };

  const handleReset = async () => {
    await resetDemoData();
    showToast({ type: 'success', message: 'Demo data reset successfully' });
    window.location.reload();
  };

  return (
    <>
      {/* Floating Toggle Button Bottom Right */}
      <div className="fixed bottom-4 right-4 z-[90]">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-2 rounded-full bg-slate-900 text-white shadow-xl hover:bg-slate-800 border border-slate-700 text-xs font-semibold transition-transform hover:scale-105 select-none"
          title="Developer Prototype Controls"
        >
          <Sliders className="w-3.5 h-3.5 text-amber-400" />
          <span>Dev Tools</span>
        </button>
      </div>

      {/* Dev Panel Modal */}
      {isOpen && (
        <div className="fixed bottom-16 right-4 z-[91] w-80 bg-white rounded-2xl shadow-2xl border border-slate-300 p-4 animate-in fade-in zoom-in-95 duration-150 text-[#1e293b]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-500" />
              <span className="font-bold text-sm">Developer Panel</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="py-3 space-y-3.5 text-xs">
            {/* Demo Date */}
            <div>
              <label className="font-semibold text-slate-700 flex items-center gap-1.5 mb-1">
                <Calendar className="w-3.5 h-3.5 text-blue-500" />
                Demo Date (As-of Date)
              </label>
              <input
                type="date"
                value={settings.demoDate ? settings.demoDate.slice(0, 10) : '2026-11-10'}
                onChange={(e) =>
                  handleToggle('demoDate', new Date(e.target.value).toISOString())
                }
                className="w-full h-8 px-2 rounded-lg border border-slate-300 bg-slate-50 text-xs"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                Calculates expected pace and KR statuses.
              </span>
            </div>

            {/* Simulated Latency */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="font-semibold text-slate-700">Simulated Latency</span>
                <span className="text-[11px] font-mono text-slate-500">
                  {settings.simulatedLatency} ms
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="2000"
                step="100"
                value={settings.simulatedLatency}
                onChange={(e) => handleToggle('simulatedLatency', Number(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Server Error Simulation */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                <span className="font-semibold text-slate-700">Simulate Server Error</span>
              </div>
              <input
                type="checkbox"
                checked={settings.simulateError}
                onChange={(e) => handleToggle('simulateError', e.target.checked)}
                className="rounded cursor-pointer w-4 h-4"
              />
            </div>

            {/* Empty Data Simulation */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-purple-500" />
                <span className="font-semibold text-slate-700">Simulate Empty Data</span>
              </div>
              <input
                type="checkbox"
                checked={settings.simulateEmpty}
                onChange={(e) => handleToggle('simulateEmpty', e.target.checked)}
                className="rounded cursor-pointer w-4 h-4"
              />
            </div>

            {/* Bypass Role Restrictions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span className="font-semibold text-slate-700">Bypass Role Restrictions</span>
              </div>
              <input
                type="checkbox"
                checked={settings.bypassRoleRestrictions}
                onChange={(e) => handleToggle('bypassRoleRestrictions', e.target.checked)}
                className="rounded cursor-pointer w-4 h-4"
              />
            </div>

            {/* Reset Demo Data Button */}
            <div className="pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleReset}
                leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                className="w-full text-xs text-red-600 border-red-200 hover:bg-red-50"
              >
                Reset Demo Data (Initial State)
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
