import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Edit, Download, MoreHorizontal } from "lucide-react";
import { useLocation } from "wouter";

interface PassportCardProps {
  passport: any;
  showActions?: boolean;
}

export default function PassportCard({ passport, showActions = false }: PassportCardProps) {
  const [, setLocation] = useLocation();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'complete':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Complete</Badge>;
      case 'published':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Published</Badge>;
      default:
        return <Badge variant="secondary">Draft</Badge>;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'steel':
        return 'text-gray-600';
      case 'concrete':
        return 'text-stone-600';
      case 'timber':
        return 'text-amber-600';
      case 'aluminum':
        return 'text-slate-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleExport = (e: React.MouseEvent, format: 'json' | 'pdf') => {
    e.stopPropagation();
    if (format === 'json') {
      window.open(`/api/passports/${passport.id}/export/json`, '_blank');
    } else {
      // PDF export would go here
      alert('PDF export coming soon!');
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h4 className="text-sm font-medium text-gray-900 mb-1">{passport.name}</h4>
            <p className="text-sm text-gray-500 mb-2">
              Modified {formatDate(passport.updatedAt)} • {' '}
              <span className={getCategoryColor(passport.category)}>
                {passport.category?.replace(/^\w/, (c: string) => c.toUpperCase())}
              </span>
            </p>
            <div className="flex items-center space-x-4">
              {getStatusBadge(passport.status)}
              {passport.gwpTotal && (
                <span className="text-xs text-gray-500">
                  GWP: {parseFloat(passport.gwpTotal).toFixed(2)} kg CO₂-eq/kg
                </span>
              )}
            </div>
          </div>
          
          {showActions && (
            <div onClick={(e) => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setLocation(`/passports/${passport.id}/edit`)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => handleExport(e, 'json')}>
                    <Download className="mr-2 h-4 w-4" />
                    Export JSON
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => handleExport(e, 'pdf')}>
                    <Download className="mr-2 h-4 w-4" />
                    Export PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
