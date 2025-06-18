import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useEffect } from "react";
import AppHeader from "@/components/AppHeader";
import StatsCard from "@/components/StatsCard";
import PassportCard from "@/components/PassportCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, CheckCircle, Clock, Building, Plus, Upload, Download, Users } from "lucide-react";
import { useLocation } from "wouter";

export default function Dashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    retry: false,
  });

  // Recent passports
  const { data: passports, isLoading: passportsLoading, error: passportsError } = useQuery({
    queryKey: ["/api/passports"],
    retry: false,
  });

  // Handle unauthorized errors
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  useEffect(() => {
    if (passportsError && isUnauthorizedError(passportsError as Error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [passportsError, toast]);

  if (isLoading || !isAuthenticated) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">Loading...</div>
    </div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader />
      
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard
              title="Total Passports"
              value={stats?.totalPassports || 0}
              icon={FileText}
              color="text-primary"
              isLoading={statsLoading}
            />
            <StatsCard
              title="Completed"
              value={stats?.completed || 0}
              icon={CheckCircle}
              color="text-green-600"
              isLoading={statsLoading}
            />
            <StatsCard
              title="In Progress"
              value={stats?.inProgress || 0}
              icon={Clock}
              color="text-yellow-600"
              isLoading={statsLoading}
            />
            <StatsCard
              title="Components"
              value={stats?.totalComponents || 0}
              icon={Building}
              color="text-primary"
              isLoading={statsLoading}
            />
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Recent Passports */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Material Passports</CardTitle>
                </CardHeader>
                <CardContent>
                  {passportsLoading ? (
                    <div className="space-y-4">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="animate-pulse">
                          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      ))}
                    </div>
                  ) : passports && passports.length > 0 ? (
                    <div className="space-y-4">
                      {passports.slice(0, 5).map((passport: any) => (
                        <PassportCard key={passport.id} passport={passport} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No passports yet</h3>
                      <p className="text-gray-500 mb-4">Create your first material passport to get started</p>
                      <Button onClick={() => setLocation('/passports/new')}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Passport
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    className="w-full justify-start" 
                    onClick={() => setLocation('/passports/new')}
                    disabled={user?.role === 'viewer'}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Material Passport
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => setLocation('/import')}
                    disabled={user?.role === 'viewer'}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Import Data
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => setLocation('/passports')}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    View All Passports
                  </Button>
                  
                  {user?.role === 'author' && (
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => {
                        toast({
                          title: "User Management",
                          description: "User management feature coming soon!",
                        });
                      }}
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Manage Users
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
