export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
};

export const formatDate = (dateString: string): string => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
};

export const formatRelativeTime = (dateString: string): string => {
  if (!dateString) return 'Just now';
  const past = new Date(dateString).getTime();
  const now = new Date().getTime();
  const diffSec = Math.max(0, Math.floor((now - past) / 1000));

  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay}d ago`;
};

export const getCategoryBadgeColor = (category: string): string => {
  switch (category.toLowerCase()) {
    case 'education':
      return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    case 'healthcare':
    case 'medical':
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    case 'disaster relief':
    case 'emergency':
      return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    case 'environment':
      return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    default:
      return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
  }
};
