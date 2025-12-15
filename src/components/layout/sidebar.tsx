"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  UserCog,
  Calendar,
  ClipboardList,
  FileText,
  Menu,
  X,
  Heart,
  Bot,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Patients", href: "/patients", icon: Users },
  { name: "Practitioners", href: "/practitioners", icon: UserCog },
  { name: "Appointments", href: "/appointments", icon: Calendar },
  { name: "Encounters", href: "/encounters", icon: ClipboardList },
  { name: "Medical Records", href: "/records", icon: FileText },
];

export function Sidebar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Mobile Header */}
      <header className="fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 lg:hidden">
        {/* Logo & Brand */}
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600">
            <Heart className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-gray-900">HealthCare</h1>
            <p className="text-[10px] leading-tight text-gray-500">FHIR HL7 Clinic</p>
          </div>
        </Link>

        {/* Hamburger Button */}
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 transition-colors hover:bg-gray-100 active:bg-gray-200"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
        >
          {mobileMenuOpen ? (
            <X className="h-5 w-5 text-gray-700" />
          ) : (
            <Menu className="h-5 w-5 text-gray-700" />
          )}
        </button>
      </header>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 top-16 z-40 bg-black/50 lg:hidden lg:top-0"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 z-40 w-64 transform border-r border-gray-200 bg-white transition-transform duration-200 ease-in-out",
          "top-16 bottom-0 lg:top-0 lg:bottom-0",
          "lg:translate-x-0",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo - Desktop Only */}
          <div className="hidden h-16 items-center gap-3 border-b border-gray-200 px-6 lg:flex">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
              <Heart className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">HealthCare</h1>
              <p className="text-xs text-gray-500">FHIR HL7 Clinic</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4 lg:py-4">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-5 w-5",
                      isActive ? "text-blue-700" : "text-gray-400"
                    )}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* AI Chat Link */}
          <div className="border-t border-gray-200 p-3">
            <Link
              href="/ai"
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                pathname === "/ai"
                  ? "bg-blue-600 text-white"
                  : "bg-blue-50 text-blue-700 hover:bg-blue-100"
              )}
            >
              <Bot className="h-5 w-5" />
              AI Assistant
            </Link>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-4">
            <div className="rounded-lg bg-gray-50 px-4 py-3">
              <p className="text-xs font-medium text-gray-500">FHIR R4 Compliant</p>
              <p className="mt-1 text-xs text-gray-400">
                Healthcare Interoperability
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}