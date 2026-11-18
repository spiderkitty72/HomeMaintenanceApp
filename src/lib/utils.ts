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

export function formatUtcDate(
  dateInput: Date | string | number | null | undefined,
  formatStr: "MMM d, yyyy" | "MMMM d, yyyy" | "yyyy-MM-dd" | "MMM d" = "MMM d, yyyy"
): string {
  if (!dateInput) return "";
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "";

  const monthsShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthsFull = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const year = date.getUTCFullYear();
  const monthIndex = date.getUTCMonth();
  const day = date.getUTCDate();

  switch (formatStr) {
    case "MMMM d, yyyy":
      return `${monthsFull[monthIndex]} ${day}, ${year}`;
    case "yyyy-MM-dd":
      const mm = String(monthIndex + 1).padStart(2, '0');
      const dd = String(day).padStart(2, '0');
      return `${year}-${mm}-${dd}`;
    case "MMM d":
      return `${monthsShort[monthIndex]} ${day}`;
    case "MMM d, yyyy":
    default:
      return `${monthsShort[monthIndex]} ${day}, ${year}`;
  }
}
