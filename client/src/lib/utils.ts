import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  const dateObj = date instanceof Date ? date : new Date(date);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(dateObj);
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function generateRandomPin(length: number = 4): string {
  return Math.floor(Math.random() * (10 ** length)).toString().padStart(length, '0');
}

export function getImageUrl(path: string): string {
  // If it's already a full URL or starts with a slash, return as is
  if (path.startsWith('http') || path.startsWith('/')) {
    return path;
  }
  
  // Otherwise, prepend the API base URL
  return `${window.location.origin}/${path}`;
}

export function isValidImage(file: File): boolean {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  return validTypes.includes(file.type);
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}

export async function getBase64ImageDimensions(base64: string): Promise<{ width: number, height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        width: img.width,
        height: img.height
      });
    };
    img.src = base64;
  });
}

export const DEFAULT_ERROR_MESSAGE = 'Something went wrong. Please try again later.';
