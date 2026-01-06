import { LogoIcon } from "@/components/icons/logo-icon";
import { useAuth } from "@/hooks/useAuth";
import { hasPermission, isAdmin } from "@/lib/rbac";
import {
  IconBookmark,
  IconBriefcase,
  IconBuilding,
  IconDashboard,
  IconFileText,
  IconHelp,
  IconMail,
  IconSearch,
  IconSettings,
  IconTag,
  IconUserCheck,
  IconUsers,
} from "@tabler/icons-react";
import * as React from "react";
import { Link } from "react-router-dom";

import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import { NavUtilities } from "@/components/nav-utilities";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

// Define navigation items with their required permissions
const allNavItems = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
      permission: null, // Everyone can see dashboard
      adminOnly: false,
    },
    {
      title: "Clients",
      url: "/dashboard/clients",
      icon: IconBuilding,
      permission: "canManageClients" as const,
      adminOnly: false,
    },
    {
      title: "Candidates",
      url: "/dashboard/candidates",
      icon: IconUserCheck,
      permission: "canManageCandidates" as const,
      adminOnly: false,
    },
    {
      title: "Emails",
      url: "/dashboard/emails",
      icon: IconMail,
      permission: "canSendEmails" as const,
      adminOnly: false,
    },
    {
      title: "Team",
      url: "/dashboard/team",
      icon: IconUsers,
      permission: "canManageTeam" as const,
      adminOnly: false,
    },
  ],
  navSecondary: [
    {
      title: "Search",
      url: "/dashboard/search",
      icon: IconSearch,
      permission: null, // Everyone can search
      adminOnly: false,
    },
    {
      title: "Settings",
      url: "/dashboard/settings",
      icon: IconSettings,
      permission: null,
      adminOnly: true, // 🔒 Only admins can access settings
    },
    {
      title: "Get Help",
      url: "/dashboard/help",
      icon: IconHelp,
      permission: null, // Everyone can get help
      adminOnly: false,
    },
  ],
  utilities: [
    {
      name: "Tags",
      url: "/dashboard/tags",
      icon: IconTag,
      permission: "canManageCandidates" as const, // Tags are for organizing candidates
      adminOnly: false,
    },
    {
      name: "Categories",
      url: "/dashboard/categories",
      icon: IconBookmark,
      permission: "canManageJobs" as const, // Categories are for jobs
      adminOnly: false,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, isLoading } = useAuth();

  // Get user data
  const userData = {
    name: user ? `${user.firstName} ${user.lastName}`.trim() : "User",
    email: user?.email || "",
    avatar: user?.avatar || "",
  };

  // Filter navigation items based on user permissions
  const filterNavItems = React.useMemo(() => {
    if (!user)
      return {
        navMain: [],
        utilities: [],
        navSecondary: allNavItems.navSecondary,
      };

    // Admins can see everything
    if (isAdmin(user)) {
      return {
        navMain: allNavItems.navMain.map((item) => ({
          title: item.title,
          url: item.url,
          icon: item.icon,
        })),
        utilities: allNavItems.utilities.map((item) => ({
          name: item.name,
          url: item.url,
          icon: item.icon,
        })),
        navSecondary: allNavItems.navSecondary.map((item) => ({
          title: item.title,
          url: item.url,
          icon: item.icon,
        })),
      };
    }

    // Filter based on permissions and adminOnly flag
    const filteredNavMain = allNavItems.navMain
      .filter((item) => {
        // Hide admin-only items from non-admins
        if (item.adminOnly) return false;
        // Show items with no permission requirement or items user has permission for
        return !item.permission || hasPermission(user, item.permission);
      })
      .map((item) => ({ title: item.title, url: item.url, icon: item.icon }));

    const filteredUtilities = allNavItems.utilities
      .filter((item) => {
        // Hide admin-only items from non-admins
        if (item.adminOnly) return false;
        // Show items with no permission requirement or items user has permission for
        return !item.permission || hasPermission(user, item.permission);
      })
      .map((item) => ({ name: item.name, url: item.url, icon: item.icon }));

    const filteredNavSecondary = allNavItems.navSecondary
      .filter((item) => {
        // Hide admin-only items from non-admins
        if (item.adminOnly) return false;
        // Show items with no permission requirement or items user has permission for
        return !item.permission || hasPermission(user, item.permission);
      })
      .map((item) => ({ title: item.title, url: item.url, icon: item.icon }));

    return {
      navMain: filteredNavMain,
      utilities: filteredUtilities,
      navSecondary: filteredNavSecondary,
    };
  }, [user]);

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <Link
              to="/dashboard"
              className="flex items-center gap-2 p-2 cursor-pointer hover:bg-transparent"
            >
              <div style={{ width: "24px", height: "24px", flexShrink: 0 }}>
                <LogoIcon size={24} color="#71abbf" />
              </div>
              <span className="text-base font-semibold">Arista ATS</span>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={filterNavItems.navMain} />
        {filterNavItems.utilities.length > 0 && (
          <NavUtilities items={filterNavItems.utilities} />
        )}
        <NavSecondary items={filterNavItems.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        {!isLoading && user && <NavUser user={userData} />}
      </SidebarFooter>
    </Sidebar>
  );
}
