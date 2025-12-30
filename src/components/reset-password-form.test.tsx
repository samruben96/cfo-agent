import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { ResetPasswordForm } from "./reset-password-form";

// Mock next/navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock Supabase client
const mockUpdateUser = vi.fn();
const mockGetSession = vi.fn();
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      updateUser: mockUpdateUser,
      getSession: mockGetSession,
    },
  }),
}));

describe("ResetPasswordForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock valid session by default
    mockGetSession.mockResolvedValue({ data: { session: { user: {} } }, error: null });
    mockUpdateUser.mockResolvedValue({ data: { user: {} }, error: null });
  });

  // Form rendering tests
  describe("form rendering", () => {
    it("renders password and confirm password inputs", async () => {
      render(<ResetPasswordForm />);

      // Wait for session check to complete
      await waitFor(() => {
        expect(screen.getByLabelText(/^new password$/i)).toBeInTheDocument();
      });
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /reset password/i })
      ).toBeInTheDocument();
    });

    it("accepts className prop", async () => {
      const { container } = render(
        <ResetPasswordForm className="custom-class" />
      );

      // Wait for session check to complete
      await waitFor(() => {
        expect(container.querySelector(".custom-class")).toBeInTheDocument();
      });
    });
  });

  // Password validation tests (AC: #5)
  describe("password validation", () => {
    it("validates password minimum length (6 characters)", async () => {
      render(<ResetPasswordForm />);

      const passwordInput = screen.getByLabelText(/^new password$/i);
      const confirmInput = screen.getByLabelText(/confirm password/i);

      await userEvent.type(passwordInput, "12345"); // Only 5 chars
      await userEvent.type(confirmInput, "12345");

      const form = screen
        .getByRole("button", { name: /reset password/i })
        .closest("form")!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(
          screen.getByText(/password must be at least 6 characters/i)
        ).toBeInTheDocument();
      });
      expect(mockUpdateUser).not.toHaveBeenCalled();
    });

    it("validates passwords match", async () => {
      render(<ResetPasswordForm />);

      const passwordInput = screen.getByLabelText(/^new password$/i);
      const confirmInput = screen.getByLabelText(/confirm password/i);

      await userEvent.type(passwordInput, "password123");
      await userEvent.type(confirmInput, "differentpass");

      const form = screen
        .getByRole("button", { name: /reset password/i })
        .closest("form")!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
      });
      expect(mockUpdateUser).not.toHaveBeenCalled();
    });

    it("accepts valid password (6+ characters)", async () => {
      render(<ResetPasswordForm />);

      const passwordInput = screen.getByLabelText(/^new password$/i);
      const confirmInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole("button", {
        name: /reset password/i,
      });

      await userEvent.type(passwordInput, "newpassword123");
      await userEvent.type(confirmInput, "newpassword123");
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockUpdateUser).toHaveBeenCalledWith({
          password: "newpassword123",
        });
      });
    });
  });

  // Successful password update tests (AC: #3)
  describe("successful password update", () => {
    it("redirects to login with success message on successful update", async () => {
      render(<ResetPasswordForm />);

      const passwordInput = screen.getByLabelText(/^new password$/i);
      const confirmInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole("button", {
        name: /reset password/i,
      });

      await userEvent.type(passwordInput, "newpassword123");
      await userEvent.type(confirmInput, "newpassword123");
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(
          "/auth/login?message=password-updated"
        );
      });
    });
  });

  // Expired token handling (AC: #6)
  describe("expired token handling", () => {
    it("shows friendly error for expired token", async () => {
      mockUpdateUser.mockResolvedValue({
        data: null,
        error: { message: "Token has expired or is invalid" },
      });

      render(<ResetPasswordForm />);

      const passwordInput = screen.getByLabelText(/^new password$/i);
      const confirmInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole("button", {
        name: /reset password/i,
      });

      await userEvent.type(passwordInput, "newpassword123");
      await userEvent.type(confirmInput, "newpassword123");
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/reset link has expired/i)
        ).toBeInTheDocument();
      });
    });

    it("shows link to request new reset for expired token", async () => {
      mockUpdateUser.mockResolvedValue({
        data: null,
        error: { message: "expired" },
      });

      render(<ResetPasswordForm />);

      const passwordInput = screen.getByLabelText(/^new password$/i);
      const confirmInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole("button", {
        name: /reset password/i,
      });

      await userEvent.type(passwordInput, "newpassword123");
      await userEvent.type(confirmInput, "newpassword123");
      await userEvent.click(submitButton);

      await waitFor(() => {
        const requestNewLink = screen.getByRole("link", {
          name: /request a new link/i,
        });
        expect(requestNewLink).toBeInTheDocument();
        expect(requestNewLink).toHaveAttribute("href", "/auth/forgot-password");
      });
    });
  });

  // Loading state tests
  describe("loading state", () => {
    it("shows loading state during submission", async () => {
      mockUpdateUser.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      );

      render(<ResetPasswordForm />);

      const passwordInput = screen.getByLabelText(/^new password$/i);
      const confirmInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole("button", {
        name: /reset password/i,
      });

      await userEvent.type(passwordInput, "newpassword123");
      await userEvent.type(confirmInput, "newpassword123");
      await userEvent.click(submitButton);

      expect(
        screen.getByRole("button", { name: /resetting/i })
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /resetting/i })).toBeDisabled();
    });
  });

  // Generic error handling
  describe("error handling", () => {
    it("shows generic error for unexpected errors", async () => {
      mockUpdateUser.mockResolvedValue({
        data: null,
        error: { message: "Some unexpected error" },
      });

      render(<ResetPasswordForm />);

      const passwordInput = screen.getByLabelText(/^new password$/i);
      const confirmInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole("button", {
        name: /reset password/i,
      });

      await userEvent.type(passwordInput, "newpassword123");
      await userEvent.type(confirmInput, "newpassword123");
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/unable to reset password/i)
        ).toBeInTheDocument();
      });
    });
  });

  // Invalid/missing session detection (CRITICAL-2 fix)
  describe("invalid session detection", () => {
    it("shows error when no valid session on mount", async () => {
      mockGetSession.mockResolvedValue({ data: { session: null }, error: null });

      render(<ResetPasswordForm />);

      await waitFor(() => {
        expect(
          screen.getByText(/reset link is invalid or has expired/i)
        ).toBeInTheDocument();
      });
    });

    it("shows request new link option when session is invalid", async () => {
      mockGetSession.mockResolvedValue({ data: { session: null }, error: null });

      render(<ResetPasswordForm />);

      await waitFor(() => {
        const requestNewLink = screen.getByRole("link", {
          name: /request a new link/i,
        });
        expect(requestNewLink).toBeInTheDocument();
        expect(requestNewLink).toHaveAttribute("href", "/auth/forgot-password");
      });
    });

    it("disables submit button when session is invalid", async () => {
      mockGetSession.mockResolvedValue({ data: { session: null }, error: null });

      render(<ResetPasswordForm />);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /reset password/i })
        ).toBeDisabled();
      });
    });
  });
});
