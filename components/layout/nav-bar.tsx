'use client';

import { useSession, signOut } from "next-auth/react";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Avatar,
} from "@nextui-org/react";
import { LogOut, Home, Mail, BarChart3, TrendingUp } from "lucide-react";

export default function AdminNavbar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  const handleLogout = async () => {
    await signOut({ redirect: true, callbackUrl: '/login' });
  };

  const navItems = [
    { href: '/', label: 'Dashboard', icon: Home },
    { href: '/businesses', label: 'Businesses', icon: BarChart3 },
    { href: '/email', label: 'Email', icon: Mail },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <Navbar 
      maxWidth="full" 
      className="bg-white/80 backdrop-blur-md border-b border-gray-100"
      classNames={{
        wrapper: "px-4 sm:px-6",
      }}
    >
      <NavbarBrand className="gap-2">
        <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-violet-700 rounded-lg flex items-center justify-center">
          <TrendingUp size={18} className="text-white" />
        </div>
        <Link href="/" className="no-style font-semibold text-gray-900 hover:text-violet-600 transition-colors">
          SalesPath Admin
        </Link>
      </NavbarBrand>

      <NavbarContent className="hidden sm:flex gap-1" justify="center">
        {navItems.map((item) => (
          <NavbarItem key={item.href}>
            <Link 
              href={item.href}
              className={`no-style flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive(item.href)
                  ? 'bg-violet-100 text-violet-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <item.icon size={16} />
              {item.label}
            </Link>
          </NavbarItem>
        ))}
      </NavbarContent>

      <NavbarContent justify="end">
        <Dropdown placement="bottom-end">
          <DropdownTrigger>
            <Avatar
              as="button"
              className="transition-transform ring-2 ring-violet-100 hover:ring-violet-200"
              size="sm"
              name={session?.user?.name ?? 'Admin'}
              showFallback
              classNames={{
                base: "bg-violet-100",
                fallback: "text-violet-600 font-medium",
              }}
            />
          </DropdownTrigger>
          <DropdownMenu 
            aria-label="Profile Actions"
            classNames={{
              base: "min-w-[200px]",
            }}
          >
            <DropdownItem key="profile" className="h-14 gap-2" textValue="Profile">
              <p className="text-xs text-gray-500">Signed in as</p>
              <p className="font-medium text-gray-900 truncate">{session?.user?.email}</p>
            </DropdownItem>
            <DropdownItem
              key="dashboard"
              startContent={<Home size={16} className="text-gray-500" />}
              as={Link}
              href="/"
              className="sm:hidden"
            >
              Dashboard
            </DropdownItem>
            <DropdownItem
              key="businesses"
              startContent={<BarChart3 size={16} className="text-gray-500" />}
              as={Link}
              href="/businesses"
              className="sm:hidden"
            >
              Businesses
            </DropdownItem>
            <DropdownItem
              key="email"
              startContent={<Mail size={16} className="text-gray-500" />}
              as={Link}
              href="/email"
              className="sm:hidden"
            >
              Send Emails
            </DropdownItem>
            <DropdownItem
              key="logout"
              color="danger"
              startContent={<LogOut size={16} />}
              onPress={handleLogout}
              className="text-red-600"
            >
              Log Out
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </NavbarContent>
    </Navbar>
  );
}