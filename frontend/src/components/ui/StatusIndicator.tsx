interface StatusIndicatorProps {
  status: 'operational' | 'simulation' | 'ready' | 'not_configured' | 'error';
  label?: string;
}

const statusConfig = {
  operational: { color: 'bg-normal-500', text: 'Operational' },
  simulation: { color: 'bg-warning-500', text: 'Simulation' },
  ready: { color: 'bg-informational-500', text: 'Ready' },
  not_configured: { color: 'bg-gray-400', text: 'Not Configured' },
  error: { color: 'bg-critical-500', text: 'Error' },
};

export function StatusIndicator({ status, label }: StatusIndicatorProps) {
  const config = statusConfig[status];
  return (
    <div className="flex items-center gap-2">
      <span className={`w-2 h-2 rounded-full ${config.color}`} />
      <span className="text-sm text-gray-600">{label || config.text}</span>
    </div>
  );
}
