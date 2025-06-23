import {
  Activity,
  Home,
  Settings,
  Upload,
  Users,
  BarChart2,
  Layers,
} from "lucide-react";

export const dashboardConfig = {
  sidebarNav: [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: <Home className="h-5 w-5" />,
    },
    {
      title: "Upload X-Ray",
      href: "/dashboard",
      icon: <Upload className="h-5 w-5" />,
    },
    {
      title: "Batch Processing",
      href: "/dashboard/batch",
      icon: <Layers className="h-5 w-5" />,
    },
    {
      title: "Results",
      href: "/dashboard/results",
      icon: <Activity className="h-5 w-5" />,
    },
    {
      title: "Comparison View",
      href: "/dashboard/comparison",
      icon: <BarChart2 className="h-5 w-5" />,
    },
    {
      title: "Patient Records",
      href: "/dashboard/patients",
      icon: <Users className="h-5 w-5" />,
    },
    {
      title: "Settings",
      href: "/dashboard/settings",
      icon: <Settings className="h-5 w-5" />,
    },
  ],
};
