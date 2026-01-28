import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, LayoutDashboard, Clock, Eye, Loader2, FolderOpen } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface Dashboard {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  sheets_data: unknown;
}

export default function DashboardList() {
  const navigate = useNavigate();

  const { data: dashboards = [], isLoading, error } = useQuery({
    queryKey: ["dashboards"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dashboards")
        .select("*")
        .order("updated_at", { ascending: false });
      
      if (error) throw error;
      return data as Dashboard[];
    },
  });

  const getSheetCount = (sheetsData: unknown): number => {
    if (Array.isArray(sheetsData)) {
      return sheetsData.length;
    }
    return 0;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="h-14 border-b bg-card px-4 flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex items-center gap-2">
          <LayoutDashboard className="h-5 w-5 text-primary" />
          <h1 className="text-sm font-semibold">Saved Dashboards</h1>
        </div>
      </header>

      {/* Content */}
      <main className="p-6 max-w-6xl mx-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading dashboards...</p>
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-destructive">Error loading dashboards</p>
            <Button variant="outline" onClick={() => navigate("/")} className="mt-4">
              Go Back
            </Button>
          </div>
        ) : dashboards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <FolderOpen className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="text-center">
              <h2 className="text-lg font-medium">No dashboards yet</h2>
              <p className="text-muted-foreground text-sm mt-1">
                Create your first dashboard to see it here
              </p>
            </div>
            <Button onClick={() => navigate("/create")} className="mt-2">
              Create Dashboard
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dashboards.map((dashboard) => (
              <Card
                key={dashboard.id}
                className="cursor-pointer transition-all hover:shadow-lg hover:border-primary/50 group"
                onClick={() => navigate(`/view/${dashboard.id}`)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <LayoutDashboard className="h-5 w-5 text-primary" />
                    </div>
                    <Eye className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <CardTitle className="text-base mt-3">{dashboard.name}</CardTitle>
                  {dashboard.description && (
                    <CardDescription className="line-clamp-2">
                      {dashboard.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(new Date(dashboard.updated_at), "MMM d, yyyy")}
                    </span>
                    <span>{getSheetCount(dashboard.sheets_data)} sheet(s)</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
