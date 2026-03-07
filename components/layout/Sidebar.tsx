"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Menu, X, ChevronLeft, LayoutDashboard, Users, GraduationCap, Calendar, Award, Receipt, DollarSign, BookImage, Settings, MessageSquare, FolderOpen, User } from "lucide-react";

interface SidebarItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
}

interface SidebarProps {
  items: SidebarItem[];
  role: string;
}

const iconMap: Record<string, React.ReactNode> = {
  Dashboard: <LayoutDashboard className="h-5 w-5" />,
  Students: <Users className="h-5 w-5" />,
  Teachers: <GraduationCap className="h-5 w-5" />,
  Batches: <FolderOpen className="h-5 w-5" />,
  Exams: <Calendar className="h-5 w-5" />,
  Marks: <Award className="h-5 w-5" />,
  Results: <Award className="h-5 w-5" />,
  Fees: <DollarSign className="h-5 w-5" />,
  Receipts: <Receipt className="h-5 w-5" />,
  Expenses: <DollarSign className="h-5 w-5" />,
  Syllabus: <BookImage className="h-5 w-5" />,
  Gallery: <BookImage className="h-5 w-5" />,
  SMS: <MessageSquare className="h-5 w-5" />,
  Settings: <Settings className="h-5 w-5" />,
  Profile: <User className="h-5 w-5" />,
};

export function Sidebar({ items, role }: SidebarProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-gray-800 text-white rounded-lg shadow-lg"
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 z-50 h-screen bg-gray-800 text-white transition-transform duration-300 ease-in-out",
        "w-64",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold">Coaching Center</h1>
                <p className="text-sm text-gray-400 capitalize">{role} Panel</p>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="lg:hidden p-1 hover:bg-gray-700 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4">
            {items.map((item) => {
              const isActive = pathname === item.href;
              const icon = iconMap[item.label] || <FolderOpen className="h-5 w-5" />;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-colors",
                    isActive 
                      ? "bg-blue-600 text-white" 
                      : "text-gray-300 hover:bg-gray-700 hover:text-white"
                  )}
                >
                  {icon}
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-700">
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-colors font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Spacer for Desktop */}
      <div className="hidden lg:block lg:w-64 flex-shrink-0" />
    </>
  );
}
