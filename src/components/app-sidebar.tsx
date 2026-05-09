import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Video, Wifi, AlertTriangle, Activity, ShieldCheck, BarChart3 } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";

const items = [
  { title: "Visão Geral", url: "/", icon: LayoutDashboard },
  { title: "Indicadores", url: "/indicadores", icon: BarChart3 },
  { title: "Câmeras", url: "/cameras", icon: Video },
  { title: "Conexão", url: "/conexao", icon: Wifi },
  { title: "Eventos", url: "/eventos", icon: AlertTriangle },
];

export function AppSidebar() {
  const path = useRouterState({ select: (s) => s.location.pathname });

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/15 ring-1 ring-primary/30">
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>
          <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold tracking-tight">SMOV</span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Operações Veiculares
            </span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Monitoramento</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={path === item.url} tooltip={item.title}>
                    <Link to={item.url} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="flex items-center gap-2 px-2 py-2 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
          <Activity className="h-3.5 w-3.5 text-success pulse-dot" />
          <span>Sistema operacional</span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
