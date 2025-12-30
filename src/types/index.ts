/**
 * Shared TypeScript types for the application.
 */

// Re-export database types
export * from "./database";

/**
 * Standard response shape for all Server Actions.
 * Ensures consistent error handling across the application.
 */
export type ActionResponse<T> = {
  data: T | null;
  error: string | null;
};
