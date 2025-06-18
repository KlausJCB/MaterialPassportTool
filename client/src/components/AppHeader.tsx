import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Construction, LogOut, User } from "lucide-react";
import { useLocation } from "wouter";

export default function AppHeader() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();

  const navigationItems = [
    { path: "/", label: "Dashboard", id: "dashboard" },
    { path: "/passports", label: "Material Passports", id: "passports" },
    { path: "/import", label: "Data Import", id: "imports" },
  ];

  const getActiveTab = () => {
    if (location === "/") return "dashboard";
    if (location.startsWith("/passports")) return "passports";
    if (location === "/import") return "imports";
    return "";
  };

  const activeTab = getActiveTab();

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo and Title */}
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Construction className="text-white text-xl" />
            </div>
            <div>
              <h1 className="text-xl font-medium text-gray-900">Material Passport Tool</h1>
              <p className="text-sm text-gray-500">BAMB Compliant System</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex space-x-8">
            {navigationItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setLocation(item.path)}
                className={`border-b-2 py-4 px-1 text-sm font-medium transition-colors ${
                  activeTab === item.id
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <div className="hidden md:block text-right">
              <p className="text-sm font-medium text-gray-900">
                {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user?.email || 'User'}
              </p>
              <div className="flex items-center justify-end space-x-2">
                <Badge variant={user?.role === 'author' ? 'default' : user?.role === 'member' ? 'secondary' : 'outline'}>
                  {user?.role || 'viewer'}
                </Badge>
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.profileImageUrl || ''} alt={user?.firstName || 'User'} />
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuItem onClick={() => window.location.href = '/api/logout'}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
