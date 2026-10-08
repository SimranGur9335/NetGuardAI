import { useLocation } from 'react-router-dom';

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

  return (
    <header className="sticky top-0 z-10 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between px-6 py-4">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-warning-50 border border-warning-200 rounded">
            <span className="w-2 h-2 rounded-full bg-warning-500" />
            <span className="text-xs font-medium text-warning-700">Simulation Mode</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-normal-500" />
            <span className="text-xs text-gray-500">System Online</span>
          </div>
        </div>
      </div>
    </header>
  );
}
