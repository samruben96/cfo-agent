import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { SignUpForm } from "./sign-up-form";

// Mock next/navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock Supabase client
const mockSignUp = vi.fn();
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      signUp: mockSignUp,
    },
  }),
}));

describe("SignUpForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSignUp.mockResolvedValue({ data: {}, error: null });
  });

  // Task 1: Password validation tests
  describe("password validation", () => {
    it("shows error when password is less than 8 characters", async () => {
      render(<SignUpForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const repeatPasswordInput = screen.getByLabelText(/repeat password/i);
      const submitButton = screen.getByRole("button", {
        name: /create account/i,
      });

      await userEvent.type(emailInput, "test@example.com");
      await userEvent.type(passwordInput, "short"); // Only 5 chars
      await userEvent.type(repeatPasswordInput, "short");
      await userEvent.click(submitButton);

      expect(
        screen.getByText(/password must be at least 8 characters/i)
      ).toBeInTheDocument();
      expect(mockSignUp).not.toHaveBeenCalled();
    });

    it("allows passwords with exactly 8 characters", async () => {
      render(<SignUpForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const repeatPasswordInput = screen.getByLabelText(/repeat password/i);
      const submitButton = screen.getByRole("button", {
        name: /create account/i,
      });

      await userEvent.type(emailInput, "test@example.com");
      await userEvent.type(passwordInput, "exactly8"); // Exactly 8 chars
      await userEvent.type(repeatPasswordInput, "exactly8");
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalled();
      });
    });

    it("allows passwords longer than 8 characters", async () => {
      render(<SignUpForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const repeatPasswordInput = screen.getByLabelText(/repeat password/i);
      const submitButton = screen.getByRole("button", {
        name: /create account/i,
      });

      await userEvent.type(emailInput, "test@example.com");
      await userEvent.type(passwordInput, "verylongpassword123");
      await userEvent.type(repeatPasswordInput, "verylongpassword123");
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalled();
      });
    });

    it("shows error when passwords do not match", async () => {
      render(<SignUpForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const repeatPasswordInput = screen.getByLabelText(/repeat password/i);
      const submitButton = screen.getByRole("button", {
        name: /create account/i,
      });

      await userEvent.type(emailInput, "test@example.com");
      await userEvent.type(passwordInput, "password123");
      await userEvent.type(repeatPasswordInput, "different123");
      await userEvent.click(submitButton);

      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
      expect(mockSignUp).not.toHaveBeenCalled();
    });

    it("validates password length before checking mismatch", async () => {
      render(<SignUpForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const repeatPasswordInput = screen.getByLabelText(/repeat password/i);
      const submitButton = screen.getByRole("button", {
        name: /create account/i,
      });

      await userEvent.type(emailInput, "test@example.com");
      await userEvent.type(passwordInput, "short"); // Too short AND doesn't match
      await userEvent.type(repeatPasswordInput, "different");
      await userEvent.click(submitButton);

      // Should show password length error first, not mismatch
      expect(
        screen.getByText(/password must be at least 8 characters/i)
      ).toBeInTheDocument();
    });
  });

  // Task 1: Button text test
  describe("button text", () => {
    it("displays 'Create Account' as button text", () => {
      render(<SignUpForm />);
      expect(
        screen.getByRole("button", { name: /create account/i })
      ).toBeInTheDocument();
    });

    it("displays 'Creating account...' when submitting", async () => {
      // Make signUp hang to test loading state
      mockSignUp.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      );

      render(<SignUpForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const repeatPasswordInput = screen.getByLabelText(/repeat password/i);
      const submitButton = screen.getByRole("button", {
        name: /create account/i,
      });

      await userEvent.type(emailInput, "test@example.com");
      await userEvent.type(passwordInput, "password123");
      await userEvent.type(repeatPasswordInput, "password123");
      await userEvent.click(submitButton);

      expect(
        screen.getByRole("button", { name: /creating account/i })
      ).toBeInTheDocument();
    });
  });

  // Task 2: Email already registered error handling
  describe("email already registered error", () => {
    it("shows friendly error when email is already registered", async () => {
      mockSignUp.mockResolvedValue({
        data: null,
        error: { message: "User already registered" },
      });

      render(<SignUpForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const repeatPasswordInput = screen.getByLabelText(/repeat password/i);
      const submitButton = screen.getByRole("button", {
        name: /create account/i,
      });

      await userEvent.type(emailInput, "existing@example.com");
      await userEvent.type(passwordInput, "password123");
      await userEvent.type(repeatPasswordInput, "password123");
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/this email is already registered/i)
        ).toBeInTheDocument();
      });
    });

    it("shows login link when email is already registered", async () => {
      mockSignUp.mockResolvedValue({
        data: null,
        error: { message: "User already registered" },
      });

      render(<SignUpForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const repeatPasswordInput = screen.getByLabelText(/repeat password/i);
      const submitButton = screen.getByRole("button", {
        name: /create account/i,
      });

      await userEvent.type(emailInput, "existing@example.com");
      await userEvent.type(passwordInput, "password123");
      await userEvent.type(repeatPasswordInput, "password123");
      await userEvent.click(submitButton);

      await waitFor(() => {
        const loginLink = screen.getByRole("link", { name: /login instead/i });
        expect(loginLink).toBeInTheDocument();
        expect(loginLink).toHaveAttribute("href", "/auth/login");
      });
    });
  });

  // Task 2: Email format validation
  describe("email validation", () => {
    it("shows error for invalid email format on submit", async () => {
      render(<SignUpForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const repeatPasswordInput = screen.getByLabelText(/repeat password/i);

      // Type invalid email - need to set values directly and trigger submit
      // because HTML5 email validation blocks click events in jsdom
      await userEvent.type(emailInput, "invalidemail");
      await userEvent.type(passwordInput, "password123");
      await userEvent.type(repeatPasswordInput, "password123");

      // Submit the form directly to bypass HTML5 validation
      const form = screen.getByRole("button", { name: /create account/i })
        .closest("form")!;
      fireEvent.submit(form);

      // Should show validation error
      await waitFor(() => {
        expect(
          screen.getByText(/please enter a valid email address/i)
        ).toBeInTheDocument();
      });
      expect(mockSignUp).not.toHaveBeenCalled();
    });
  });

  // Task 5: Form submission with valid data
  describe("successful form submission", () => {
    it("submits form with valid data and redirects to success page", async () => {
      mockSignUp.mockResolvedValue({ data: { user: {} }, error: null });

      render(<SignUpForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const repeatPasswordInput = screen.getByLabelText(/repeat password/i);
      const submitButton = screen.getByRole("button", {
        name: /create account/i,
      });

      await userEvent.type(emailInput, "test@example.com");
      await userEvent.type(passwordInput, "password123");
      await userEvent.type(repeatPasswordInput, "password123");
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledWith({
          email: "test@example.com",
          password: "password123",
          options: expect.objectContaining({
            emailRedirectTo: expect.any(String),
          }),
        });
        expect(mockPush).toHaveBeenCalledWith("/auth/sign-up-success");
      });
    });
  });
});
