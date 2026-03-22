import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatHouseUsage(totalDays: number): string {
  const years = Math.floor(totalDays / 365);
  const days = Math.floor(totalDays % 365);
  
  if (years === 0) {
    return `${days} ${days === 1 ? 'day' : 'days'}`;
  }
  
  if (days === 0) {
    return `${years} ${years === 1 ? 'yr' : 'yrs'}`;
  }
  
  return `${years} ${years === 1 ? 'yr' : 'yrs'}, ${days} ${days === 1 ? 'day' : 'days'}`;
}
