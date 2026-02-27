import { useNavigate } from "react-router-dom";
import { Plus, Eye, LayoutDashboard } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-4xl w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <LayoutDashboard className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-bold tracking-tight">Custom Dashboard</h1>
          <p className="text-muted-foreground text-lg max-w-md mx-auto">
            Connect to BigQuery and create interactive dashboards with drag-and-drop visuals
          </p>
        </div>

        {/* Options */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Create Dashboard */}
          <Card 
            className="cursor-pointer transition-all hover:shadow-lg hover:border-primary/50 group"
            onClick={() => navigate("/create")}
          >
            <CardHeader className="text-center pb-2">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                <Plus className="h-7 w-7 text-primary" />
              </div>
              <CardTitle className="text-xl">Create Dashboard</CardTitle>
              <CardDescription>
                Build a new dashboard from scratch with charts, slicers, and layouts
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button className="w-full" size="lg">
                <Plus className="h-4 w-4 mr-2" />
                Start Building
              </Button>
            </CardContent>
          </Card>

          {/* View Dashboards */}
          <Card 
            className="cursor-pointer transition-all hover:shadow-lg hover:border-primary/50 group"
            onClick={() => navigate("/dashboards")}
          >
            <CardHeader className="text-center pb-2">
              <div className="w-14 h-14 rounded-xl bg-secondary flex items-center justify-center mx-auto mb-4 group-hover:bg-secondary/80 transition-colors">
                <Eye className="h-7 w-7 text-secondary-foreground" />
              </div>
              <CardTitle className="text-xl">View Dashboards</CardTitle>
              <CardDescription>
                Browse and interact with your saved dashboards in view-only mode
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button variant="secondary" className="w-full" size="lg">
                <Eye className="h-4 w-4 mr-2" />
                Browse Dashboards
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
