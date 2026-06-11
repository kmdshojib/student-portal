"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Menu,
  X,
  ChevronDown,
  LogOut,
  User,
  LayoutDashboard,
  CreditCard,
  Users,
  ClipboardList,
  FileText,
  BarChart3,
  Bell,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const router = useRouter();
  const pathname = usePathname();

  // Check login status function
  const checkAuth = () => {
    const logged = localStorage.getItem("adminLoggedIn");
    const email = localStorage.getItem("adminEmail");
    setIsLoggedIn(logged === "true");
    setAdminEmail(email || "");
  };

  // Check on mount and route changes
  useEffect(() => {
    checkAuth();
  }, [pathname]);

  useEffect(() => {
    // Listen for storage changes (login/logout in other tabs)
    window.addEventListener("storage", checkAuth);
    // Listen for custom auth change event (same tab)
    window.addEventListener("authChange", checkAuth);
    return () => {
      window.removeEventListener("storage", checkAuth);
      window.removeEventListener("authChange", checkAuth);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("adminLoggedIn");
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminEmail");
    setIsLoggedIn(false);
    setAdminEmail("");
    window.dispatchEvent(new Event("authChange"));
    router.push("/admin/login");
  };

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link
            href={isLoggedIn ? "/dashboard" : "/"}
            className="flex-shrink-0 font-bold text-xl hover:text-blue-100 transition"
          >
            Student Portal
          </Link>

          {/* Right side - Dropdown Menu (shown when logged in) */}
          {isLoggedIn && (
            <div className="flex items-center gap-4">
              {/* Desktop Dropdown */}
              <div className="hidden md:flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="text-white hover:bg-blue-700 hover:text-white flex items-center gap-2"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      Menu
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Navigation</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link
                        href="/dashboard"
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        href="/student-registration"
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Users className="w-4 h-4" />
                        Student Registration
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        href="/attendance"
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <ClipboardList className="w-4 h-4" />
                        Attendance
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Payments</DropdownMenuLabel>
                    <DropdownMenuItem asChild>
                      <Link
                        href="/payments"
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <CreditCard className="w-4 h-4" />
                        Payment Management
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        href="/payment-summary"
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <BarChart3 className="w-4 h-4" />
                        Payment Summary
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Reports</DropdownMenuLabel>
                    <DropdownMenuItem asChild>
                      <Link
                        href="/exam-marks"
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <FileText className="w-4 h-4" />
                        Exam Marks
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        href="/guardian-report"
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <FileText className="w-4 h-4" />
                        Guardian Report
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link
                        href="/notify"
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Bell className="w-4 h-4" />
                        Notify
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="text-white hover:bg-blue-700 hover:text-white flex items-center gap-2"
                    >
                      <User className="w-4 h-4" />
                      {adminEmail || "Admin"}
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="text-red-600 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Mobile Menu Button */}
              <div className="md:hidden">
                <button
                  onClick={toggleMenu}
                  className="inline-flex items-center justify-center p-2 rounded-md hover:bg-blue-700 transition-colors"
                  aria-label="Toggle menu"
                >
                  {isOpen ? (
                    <X className="h-6 w-6" />
                  ) : (
                    <Menu className="h-6 w-6" />
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Login button when not logged in */}
          {!isLoggedIn && (
            <Link href="/admin/login">
              <Button
                variant="ghost"
                className="text-white hover:bg-blue-700 hover:text-white"
              >
                Login
              </Button>
            </Link>
          )}
        </div>

        {/* Mobile Menu */}
        {isOpen && isLoggedIn && (
          <div className="md:hidden pb-4 space-y-2">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </Link>
            <Link
              href="/student-registration"
              className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              <Users className="w-4 h-4" />
              Student Registration
            </Link>
            <Link
              href="/attendance"
              className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              <ClipboardList className="w-4 h-4" />
              Attendance
            </Link>
            <div className="border-t border-blue-500 my-2"></div>
            <Link
              href="/payments"
              className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              <CreditCard className="w-4 h-4" />
              Payment Management
            </Link>
            <Link
              href="/payment-summary"
              className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              <BarChart3 className="w-4 h-4" />
              Payment Summary
            </Link>
            <div className="border-t border-blue-500 my-2"></div>
            <Link
              href="/exam-marks"
              className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              <FileText className="w-4 h-4" />
              Exam Marks
            </Link>
            <Link
              href="/guardian-report"
              className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              <FileText className="w-4 h-4" />
              Guardian Report
            </Link>
            <div className="border-t border-blue-500 my-2"></div>
            <Link
              href="/notify"
              className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              <Bell className="w-4 h-4" />
              Notify
            </Link>
            <div className="border-t border-blue-500 my-2"></div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-md hover:bg-red-600 transition-colors text-left"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
