import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { ForgotPasswordForm } from "./forgot-password-form";

// Mock Supabase client
const mockResetPasswordForEmail = vi.fn();
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      resetPasswordForEmail: mockResetPasswordForEmail,
    },
  }),
}));

describe("ForgotPasswordForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResetPasswordForEmail.mockResolvedValue({ data: {}, error: null });
  });

  // Form rendering tests
  describe("form rendering", () => {
    it("renders email input and submit button", () => {
      render(<ForgotPasswordForm />);

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /send reset email/i })
      ).toBeInTheDocument();
    });

    it("accepts className prop", () => {
      const { container } = render(
        <ForgotPasswordForm className="custom-class" />
      );

      // The Card component should have the custom class
      const card = container.querySelector(".custom-class");
      expect(card).toBeInTheDocument();
    });

    it("renders link back to login page", () => {
      render(<ForgotPasswordForm />);

      const loginLink = screen.getByRole("link", { name: /login/i });
      expect(loginLink).toBeInTheDocument();
      expect(loginLink).toHaveAttribute("href", "/auth/login");
    });
  });

  // Email validation tests (AC: #1, #2, #4)
  describe("email validation", () => {
    it("validates email format before submission", async () => {
      render(<ForgotPasswordForm />);

      const emailInput = screen.getByLabelText(/email/i);

      await userEvent.type(emailInput, "invalidemail");

      // Submit the form directly to bypass HTML5 validation
      const form = screen
        .getByRole("button", { name: /send reset email/i })
        .closest("form")!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(
          screen.getByText(/please enter a valid email address/i)
        ).toBeInTheDocument();
      });
      expect(mockResetPasswordForEmail).not.toHaveBeenCalled();
    });

    it("accepts valid email format", async () => {
      render(<ForgotPasswordForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole("button", {
        name: /send reset email/i,
      });

      await userEvent.type(emailInput, "valid@example.com");
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockResetPasswordForEmail).toHaveBeenCalled();
      });
    });
  });

  // Success message tests (AC: #2, #4 - security: same message regardless of email existence)
  describe("success message", () => {
    it("shows success message after submission regardless of email", async () => {
      render(<ForgotPasswordForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole("button", {
        name: /send reset email/i,
      });

      await userEvent.type(emailInput, "test@example.com");
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/check your email/i)
        ).toBeInTheDocument();
      });
    });

    it("shows success message even when email is not registered (security)", async () => {
      // Supabase returns success even for unregistered emails
      mockResetPasswordForEmail.mockResolvedValue({ data: {}, error: null });

      render(<ForgotPasswordForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole("button", {
        name: /send reset email/i,
      });

      await userEvent.type(emailInput, "unregistered@example.com");
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/check your email/i)
        ).toBeInTheDocument();
      });
    });
  });

  // Loading state tests
  describe("loading state", () => {
    it("shows loading state during submission", async () => {
      mockResetPasswordForEmail.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      );

      render(<ForgotPasswordForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole("button", {
        name: /send reset email/i,
      });

      await userEvent.type(emailInput, "test@example.com");
      await userEvent.click(submitButton);

      expect(
        screen.getByRole("button", { name: /sending/i })
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /sending/i })).toBeDisabled();
    });

    it("disables submit button while loading", async () => {
      mockResetPasswordForEmail.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      );

      render(<ForgotPasswordForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole("button", {
        name: /send reset email/i,
      });

      await userEvent.type(emailInput, "test@example.com");
      await userEvent.click(submitButton);

      expect(screen.getByRole("button", { name: /sending/i })).toBeDisabled();
    });
  });

  // Error handling tests
  describe("error handling", () => {
    it("shows generic error for unexpected errors", async () => {
      mockResetPasswordForEmail.mockResolvedValue({
        data: null,
        error: { message: "Some unexpected error" },
      });

      render(<ForgotPasswordForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole("button", {
        name: /send reset email/i,
      });

      await userEvent.type(emailInput, "test@example.com");
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/unable to send reset email/i)
        ).toBeInTheDocument();
      });
    });
  });

  // API call verification
  describe("API calls", () => {
    it("calls resetPasswordForEmail with correct parameters", async () => {
      render(<ForgotPasswordForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole("button", {
        name: /send reset email/i,
      });

      await userEvent.type(emailInput, "test@example.com");
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockResetPasswordForEmail).toHaveBeenCalledWith(
          "test@example.com",
          expect.objectContaining({
            redirectTo: expect.stringContaining("/auth/reset-password"),
          })
        );
      });
    });
  });
});
