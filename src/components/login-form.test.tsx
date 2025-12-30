import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { LoginForm } from "./login-form";

// Mock next/navigation
const mockPush = vi.fn();
const mockSearchParams = new URLSearchParams();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => mockSearchParams,
}));

// Mock Supabase client
const mockSignInWithPassword = vi.fn();
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      signInWithPassword: mockSignInWithPassword,
    },
  }),
}));

describe("LoginForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams.delete("redirectTo");
    mockSignInWithPassword.mockResolvedValue({ data: { user: {} }, error: null });
  });

  // AC #1: Successful login redirects to /chat
  describe("successful login", () => {
    it("redirects to /chat on successful login", async () => {
      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole("button", { name: /log in/i });

      await userEvent.type(emailInput, "test@example.com");
      await userEvent.type(passwordInput, "password123");
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockSignInWithPassword).toHaveBeenCalledWith({
          email: "test@example.com",
          password: "password123",
        });
        expect(mockPush).toHaveBeenCalledWith("/chat");
      });
    });

    it("respects redirectTo query param after successful login", async () => {
      mockSearchParams.set("redirectTo", "/settings");

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole("button", { name: /log in/i });

      await userEvent.type(emailInput, "test@example.com");
      await userEvent.type(passwordInput, "password123");
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/settings");
      });
    });
  });

  // AC #2: Invalid credentials show friendly error
  describe("invalid credentials error", () => {
    it("shows 'Invalid email or password' for invalid credentials", async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: null,
        error: { message: "Invalid login credentials" },
      });

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole("button", { name: /log in/i });

      await userEvent.type(emailInput, "wrong@example.com");
      await userEvent.type(passwordInput, "wrongpassword");
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
      });
    });

    it("shows generic error for other auth errors", async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: null,
        error: { message: "Some unexpected error" },
      });

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole("button", { name: /log in/i });

      await userEvent.type(emailInput, "test@example.com");
      await userEvent.type(passwordInput, "password123");
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/unable to sign in/i)).toBeInTheDocument();
      });
    });
  });

  // Email format validation
  describe("email validation", () => {
    it("shows error for invalid email format", async () => {
      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);

      await userEvent.type(emailInput, "invalidemail");
      await userEvent.type(passwordInput, "password123");

      // Submit the form directly to bypass HTML5 validation
      const form = screen.getByRole("button", { name: /log in/i }).closest("form")!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
      });
      expect(mockSignInWithPassword).not.toHaveBeenCalled();
    });

    it("accepts valid email format", async () => {
      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole("button", { name: /log in/i });

      await userEvent.type(emailInput, "valid@example.com");
      await userEvent.type(passwordInput, "password123");
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockSignInWithPassword).toHaveBeenCalled();
      });
    });
  });

  // Password length validation
  describe("password validation", () => {
    it("shows error for password shorter than 6 characters", async () => {
      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);

      await userEvent.type(emailInput, "valid@example.com");
      await userEvent.type(passwordInput, "12345"); // Only 5 chars

      const form = screen.getByRole("button", { name: /log in/i }).closest("form")!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument();
      });
      expect(mockSignInWithPassword).not.toHaveBeenCalled();
    });

    it("accepts password with 6 or more characters", async () => {
      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole("button", { name: /log in/i });

      await userEvent.type(emailInput, "valid@example.com");
      await userEvent.type(passwordInput, "123456"); // Exactly 6 chars
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockSignInWithPassword).toHaveBeenCalled();
      });
    });
  });

  // Redirect URL validation (open redirect prevention)
  describe("redirect URL validation", () => {
    it("ignores external redirect URLs", async () => {
      mockSearchParams.set("redirectTo", "https://evil.com/steal");

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole("button", { name: /log in/i });

      await userEvent.type(emailInput, "test@example.com");
      await userEvent.type(passwordInput, "password123");
      await userEvent.click(submitButton);

      await waitFor(() => {
        // Should redirect to /chat (safe default) instead of external URL
        expect(mockPush).toHaveBeenCalledWith("/chat");
      });
    });

    it("ignores protocol-relative redirect URLs", async () => {
      mockSearchParams.set("redirectTo", "//evil.com/path");

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole("button", { name: /log in/i });

      await userEvent.type(emailInput, "test@example.com");
      await userEvent.type(passwordInput, "password123");
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/chat");
      });
    });

    it("accepts valid internal redirect URLs", async () => {
      mockSearchParams.set("redirectTo", "/documents/123");

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole("button", { name: /log in/i });

      await userEvent.type(emailInput, "test@example.com");
      await userEvent.type(passwordInput, "password123");
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/documents/123");
      });
    });
  });

  // Loading state
  describe("loading state", () => {
    it("shows 'Logging in...' during submission", async () => {
      mockSignInWithPassword.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      );

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole("button", { name: /log in/i });

      await userEvent.type(emailInput, "test@example.com");
      await userEvent.type(passwordInput, "password123");
      await userEvent.click(submitButton);

      expect(screen.getByRole("button", { name: /logging in/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /logging in/i })).toBeDisabled();
    });

    it("disables submit button while loading", async () => {
      mockSignInWithPassword.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      );

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole("button", { name: /log in/i });

      await userEvent.type(emailInput, "test@example.com");
      await userEvent.type(passwordInput, "password123");
      await userEvent.click(submitButton);

      expect(screen.getByRole("button", { name: /logging in/i })).toBeDisabled();
    });
  });

  // Button text verification
  describe("button text", () => {
    it("displays 'Log In' as button text", () => {
      render(<LoginForm />);
      expect(screen.getByRole("button", { name: /log in/i })).toBeInTheDocument();
    });
  });

  // Form elements render correctly
  describe("form rendering", () => {
    it("renders email and password inputs", () => {
      render(<LoginForm />);

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    });

    it("renders forgot password link", () => {
      render(<LoginForm />);

      const forgotLink = screen.getByRole("link", { name: /forgot your password/i });
      expect(forgotLink).toBeInTheDocument();
      expect(forgotLink).toHaveAttribute("href", "/auth/forgot-password");
    });

    it("renders sign up link", () => {
      render(<LoginForm />);

      const signUpLink = screen.getByRole("link", { name: /sign up/i });
      expect(signUpLink).toBeInTheDocument();
      expect(signUpLink).toHaveAttribute("href", "/auth/sign-up");
    });
  });
});
