import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { UserMenu } from "./UserMenu";

// Mock the logout action - returns ActionResponse shape
const mockLogout = vi.fn();
vi.mock("@/actions/auth", () => ({
  logout: () => mockLogout(),
}));

describe("UserMenu", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: successful logout (redirect happens, no return)
    mockLogout.mockResolvedValue({ data: null, error: null });
  });

  describe("rendering", () => {
    it("renders user icon button", () => {
      render(<UserMenu />);
      expect(screen.getByLabelText("User menu")).toBeInTheDocument();
    });

    it("accepts className prop", () => {
      render(<UserMenu className="custom-class" />);
      const button = screen.getByLabelText("User menu");
      expect(button).toHaveClass("custom-class");
    });
  });

  describe("dropdown behavior", () => {
    it("shows dropdown with logout option on click", async () => {
      render(<UserMenu />);

      const userMenuButton = screen.getByLabelText("User menu");
      await userEvent.click(userMenuButton);

      await waitFor(() => {
        expect(screen.getByText("Log out")).toBeInTheDocument();
      });
    });

    it("calls logout when logout option is clicked", async () => {
      render(<UserMenu />);

      const userMenuButton = screen.getByLabelText("User menu");
      await userEvent.click(userMenuButton);

      await waitFor(() => {
        expect(screen.getByText("Log out")).toBeInTheDocument();
      });

      const logoutOption = screen.getByText("Log out");
      await userEvent.click(logoutOption);

      await waitFor(() => {
        expect(mockLogout).toHaveBeenCalled();
      });
    });

    it("displays logout icon alongside text", async () => {
      render(<UserMenu />);

      const userMenuButton = screen.getByLabelText("User menu");
      await userEvent.click(userMenuButton);

      await waitFor(() => {
        const menuItem = screen.getByText("Log out").closest("[role='menuitem']");
        expect(menuItem).toBeInTheDocument();
        // The LogOut icon should be rendered as an SVG
        const svg = menuItem?.querySelector("svg");
        expect(svg).toBeInTheDocument();
      });
    });
  });

  describe("loading state", () => {
    it("disables button during logout", async () => {
      // Make logout hang to observe loading state
      mockLogout.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ data: null, error: null }), 1000))
      );

      render(<UserMenu />);

      const userMenuButton = screen.getByLabelText("User menu");
      await userEvent.click(userMenuButton);

      const logoutOption = screen.getByText("Log out");
      await userEvent.click(logoutOption);

      // Button should become disabled during pending state
      await waitFor(() => {
        expect(screen.getByLabelText("User menu")).toBeDisabled();
      });
    });
  });
});
