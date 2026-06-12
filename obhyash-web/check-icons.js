const lucide = require('lucide-react');
const icons = [
  'Upload', 'Download', 'Filter', 'Plus', 'Flag', 'Users', 'FileQuestion', 
  'AlertCircle', 'TrendingUp', 'Activity', 'Clock', 'CheckCircle', 'XCircle', 
  'BarChart3', 'Settings', 'Database', 'ArrowRight', 'ArrowUpRight', 'ArrowDownRight', 
  'MoreVertical', 'Loader2', 'Check', 'LayoutDashboard', 'CreditCard', 'LogOut', 
  'Layers', 'BookOpen', 'Bell', 'AlertTriangle', 'MessageSquare', 'Radio', 'Search', 
  'Menu', 'Moon', 'Sun', 'User', 'ChevronDown', 'RefreshCw', 'ChevronRight', 
  'ChevronsLeft', 'Command', 'X'
];

for (const icon of icons) {
  if (!lucide[icon]) {
    console.error(`Missing icon: ${icon}`);
  }
}
console.log('Done checking icons.');
