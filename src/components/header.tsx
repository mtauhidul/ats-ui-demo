"use client";
import { LogoIcon } from "@/components/logo";
import { MenuToggleIcon } from "@/components/menu-toggle-icon";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useScroll } from "@/hooks/use-scroll";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { LogOut, Settings } from "lucide-react";
import React from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";

export function Header() {
  const [open, setOpen] = React.useState(false);
  const scrolled = useScroll(10);
  const { user, logout } = useAuth();

  const links = [
    {
      label: "Home",
      href: "/",
    },
    {
      label: "Jobs",
      href: "/jobs",
    },
  ];

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const handleLogout = async () => {
    await logout();
  };

  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={cn("sticky top-0 z-50 w-full border-transparent border-b", {
        "border-border bg-background/95 backdrop-blur-lg supports-backdrop-filter:bg-background/50":
          scrolled,
      })}
    >
      <nav className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 rounded-md p-2">
          <LogoIcon className="h-7 w-7" />
          <span className="text-xl font-bold text-foreground tracking-tight">
            Arista ATS
          </span>
        </Link>
        <div className="hidden items-center gap-2 md:flex">
          {links.map((link, i) => (
            <Link
              className={buttonVariants({ variant: "ghost" })}
              to={link.href}
              key={i}
            >
              {link.label}
            </Link>
          ))}
          {!user ? (
            <>
              <Button variant="outline" asChild>
                <Link to="/login">Sign In</Link>
              </Button>
              <Button asChild>
                <Link to="/dashboard">Get Started</Link>
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" asChild>
                <Link to="/dashboard">Dashboard</Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="h-10 rounded-md px-3 gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                    <Avatar className="h-7 w-7">
                      {user.avatar && (
                        <AvatarImage
                          src={user.avatar}
                          alt={`${user.firstName} ${user.lastName}`}
                        />
                      )}
                      <AvatarFallback className="bg-primary-foreground/20 text-primary-foreground font-semibold text-xs">
                        {getInitials(`${user.firstName} ${user.lastName}`)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-mono text-white">
                      {user.firstName}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 p-2">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex items-center gap-3 p-2">
                      <Avatar className="h-10 w-10">
                        {user.avatar && (
                          <AvatarImage
                            src={user.avatar}
                            alt={`${user.firstName} ${user.lastName}`}
                          />
                        )}
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {getInitials(`${user.firstName} ${user.lastName}`)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-semibold leading-none">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    asChild
                    className="cursor-pointer py-2.5 px-3 rounded-md "
                  >
                    <Link
                      to="/dashboard/account"
                      className="flex items-center gap-3"
                    >
                      <Settings className="h-4 w-4 text-muted-foreground" />
                      <span>Account Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer py-2.5 px-3 rounded-md text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400 focus:bg-red-50 dark:focus:bg-red-950/20"
                  >
                    <LogOut className="h-4 w-4 mr-3" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
        <Button
          aria-controls="mobile-menu"
          aria-expanded={open}
          aria-label="Toggle menu"
          className="md:hidden"
          onClick={() => setOpen(!open)}
          size="icon"
          variant="outline"
        >
          <MenuToggleIcon className="size-5" duration={300} open={open} />
        </Button>
      </nav>
      <MobileMenu className="flex flex-col justify-between gap-2" open={open}>
        <div className="grid gap-y-2">
          {links.map((link) => (
            <Link
              className={buttonVariants({
                variant: "ghost",
                className: "justify-start",
              })}
              to={link.href}
              key={link.label}
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </div>
        <div className="flex flex-col gap-2">
          {!user ? (
            <>
              <Button
                className="w-full bg-transparent"
                variant="outline"
                asChild
                onClick={() => setOpen(false)}
              >
                <Link to="/login">Sign In</Link>
              </Button>
              <Button className="w-full" asChild onClick={() => setOpen(false)}>
                <Link to="/dashboard">Get Started</Link>
              </Button>
            </>
          ) : (
            <>
              <Button
                className="w-full"
                variant="ghost"
                asChild
                onClick={() => setOpen(false)}
              >
                <Link to="/dashboard">Dashboard</Link>
              </Button>
              <Button
                className="w-full justify-start"
                variant="ghost"
                asChild
                onClick={() => setOpen(false)}
              >
                <Link
                  to="/dashboard/account"
                  className="flex items-center gap-3"
                >
                  <Settings className="h-4 w-4" />
                  <span>Account Settings</span>
                </Link>
              </Button>
              <Button
                className="w-full justify-start text-red-600 dark:text-red-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20"
                variant="ghost"
                onClick={() => {
                  setOpen(false);
                  handleLogout();
                }}
              >
                <LogOut className="h-4 w-4 mr-3" />
                <span>Log out</span>
              </Button>
            </>
          )}
        </div>
      </MobileMenu>
    </header>
  );
}

type MobileMenuProps = React.ComponentProps<"div"> & {
  open: boolean;
};

function MobileMenu({ open, children, className, ...props }: MobileMenuProps) {
  if (!open || typeof window === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className={cn(
        "bg-background/95 backdrop-blur-lg supports-backdrop-filter:bg-background/50",
        "fixed top-14 right-0 bottom-0 left-0 z-40 flex flex-col overflow-hidden border-y md:hidden"
      )}
      id="mobile-menu"
    >
      <div
        className={cn(
          "data-[slot=open]:zoom-in-97 ease-out data-[slot=open]:animate-in",
          "size-full p-4",
          className
        )}
        data-slot={open ? "open" : "closed"}
        {...props}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}
