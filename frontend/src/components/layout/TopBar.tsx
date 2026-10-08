import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getCaptureStatus } from '../../services/monitoring';
import { CaptureStatus } from '../../types';

const pageTitles: Record<string, string> = {
  '/': 'Security Overview',
  '/traffic': 'Traffic Monitoring',
  '/alerts': 'Security Alerts',
  '/threats': 'Threat Classification',
  '/history': 'Attack History',
  '/models': 'Detection Models',
  '/evaluation': 'Model Evaluation',
  '/system': 'System Status',
};

export function TopBar() {
  const location = useLocation();
  const title = pageTitles[location.pathname] || 'NetGuard AI';
  const { user, logout } = useAuth();
  const [capture, setCapture] = useState<CaptureStatus | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const status = await getCaptureStatus();
        if (active) setCapture(status);
      } catch {
        if (active) setCapture(null);
      }
    };
    load();
    const interval = setInterval(load, 5000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const badge = !capture
    ? { dot: 'bg-gray-400', text: 'Status Unavailable', cls: 'bg-gray-50 border-gray-200 text-gray-600' }
    : !capture.available
      ? { dot: 'bg-critical-500', text: 'Packet Capture Unavailable', cls: 'bg-critical-50 border-critical-200 text-critical-700' }
      : capture.running
        ? { dot: 'bg-normal-500', text: 'Monitoring Live', cls: 'bg-normal-50 border-normal-200 text-normal-700' }
        : { dot: 'bg-gray-400', text: 'Monitoring Idle', cls: 'bg-gray-50 border-gray-200 text-gray-600' };

  return (
    <header className="sticky top-0 z-10 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between px-6 py-4">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 px-3 py-1.5 border rounded ${badge.cls}`}>
            <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
            <span className="text-xs font-medium">{badge.text}</span>
          </div>
          {user && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500">{user.email}</span>
              <button
                onClick={logout}
                className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
