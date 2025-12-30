/**
 * Shared TypeScript types for the application.
 */

// Re-export database types
export * from "./database";

// Re-export overhead costs types
export * from "./overhead-costs";

// Re-export employees types
export * from "./employees";

// Re-export navigation types
export * from "./navigation";

/**
 * Standard response shape for all Server Actions.
 * Ensures consistent error handling across the application.
 */
export type ActionResponse<T> = {
  data: T | null;
  error: string | null;
};
