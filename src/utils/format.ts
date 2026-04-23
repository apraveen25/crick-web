export function formatOvers(overs: number, balls: number): string {
  return `${overs}.${balls}`;
}

export function formatRunRate(runs: number, overs: number, balls: number): string {
  const totalOvers = overs + balls / 6;
  if (totalOvers === 0) return '0.00';
  return (runs / totalOvers).toFixed(2);
}

export function formatStrikeRate(runs: number, balls: number): string {
  if (balls === 0) return '0.00';
  return ((runs / balls) * 100).toFixed(1);
}

export function formatEconomy(runs: number, overs: number, balls: number): string {
  const totalOvers = overs + balls / 6;
  if (totalOvers === 0) return '0.00';
  return (runs / totalOvers).toFixed(2);
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getBallDisplay(runs: number, ballType: string, isWicket: boolean): string {
  if (isWicket) return 'W';
  if (ballType === 'wide') return `${runs}wd`;
  if (ballType === 'no_ball') return `${runs}nb`;
  if (ballType === 'bye') return `${runs}b`;
  if (ballType === 'leg_bye') return `${runs}lb`;
  return String(runs);
}

export function getBallColor(runs: number, ballType: string, isWicket: boolean): string {
  if (isWicket) return 'bg-red-500 text-white';
  if (ballType === 'wide' || ballType === 'no_ball') return 'bg-yellow-500 text-black';
  if (runs === 4) return 'bg-blue-500 text-white';
  if (runs === 6) return 'bg-green-500 text-white';
  if (runs === 0) return 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200';
  return 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-white';
}
