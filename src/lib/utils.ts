import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// cn — combine class names with clsx (conditional logic) plus tailwind-merge
// (deduplicates conflicting Tailwind utilities so the last-wins rule applies
// across props). The shadcn convention; customers can compose className
// props without inline string concatenation.
//
//   <div className={cn("p-2 bg-white", isActive && "bg-black", className)} />

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
