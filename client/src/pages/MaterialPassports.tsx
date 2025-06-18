import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useEffect } from "react";
import AppHeader from "@/components/AppHeader";
import PassportCard from "@/components/PassportCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Plus, Search } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";

export default function MaterialPassports() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");

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

  // Filter passports
  const filteredPassports = passports?.filter((passport: any) => {
    const matchesSearch = passport.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         passport.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || passport.category === categoryFilter;
    const matchesStatus = !statusFilter || passport.status === statusFilter;
    
    return matchesSearch && matchesCategory && matchesStatus;
  }) || [];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader />
      
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Material Passports</h1>
              <p className="text-gray-500 mt-1">Manage your BAMB-compliant material passports</p>
            </div>
            {user?.role !== 'viewer' && (
              <Button onClick={() => setLocation('/passports/new')}>
                <Plus className="w-4 h-4 mr-2" />
                New Passport
              </Button>
            )}
          </div>

          {/* Filters */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search passports..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Categories</SelectItem>
                    <SelectItem value="steel">Steel</SelectItem>
                    <SelectItem value="concrete">Concrete</SelectItem>
                    <SelectItem value="timber">Timber</SelectItem>
                    <SelectItem value="aluminum">Aluminum</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="complete">Complete</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
                
                <div className="text-sm text-gray-500 flex items-center">
                  {filteredPassports.length} of {passports?.length || 0} passports
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Passports Grid */}
          {passportsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="pt-6">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                    <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredPassports.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPassports.map((passport: any) => (
                <div key={passport.id} className="cursor-pointer" onClick={() => setLocation(`/passports/${passport.id}/edit`)}>
                  <PassportCard passport={passport} showActions />
                </div>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-12 pb-12">
                <div className="text-center">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {searchTerm || categoryFilter || statusFilter ? 'No matching passports' : 'No passports yet'}
                  </h3>
                  <p className="text-gray-500 mb-4">
                    {searchTerm || categoryFilter || statusFilter 
                      ? 'Try adjusting your search or filter criteria'
                      : 'Create your first material passport to get started'
                    }
                  </p>
                  {user?.role !== 'viewer' && !searchTerm && !categoryFilter && !statusFilter && (
                    <Button onClick={() => setLocation('/passports/new')}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Passport
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
