import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Construction, FileText, BarChart3, Users } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Construction className="text-white text-xl" />
              </div>
              <div>
                <h1 className="text-xl font-medium text-gray-900">Material Passport Tool</h1>
                <p className="text-sm text-gray-500">BAMB Compliant System</p>
              </div>
            </div>
            <Button onClick={() => window.location.href = '/api/login'}>
              Sign In
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            BAMB-Compliant Material Passport Tool
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Create, manage, and export material passports for structural engineering projects 
            with full lifecycle assessment and regulatory compliance.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <Card>
            <CardHeader className="text-center">
              <FileText className="w-12 h-12 text-primary mx-auto mb-4" />
              <CardTitle>Material Passports</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-center">
                Create comprehensive material passports with all mandatory BAMB fields
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <BarChart3 className="w-12 h-12 text-primary mx-auto mb-4" />
              <CardTitle>LCA Calculations</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-center">
                Auto-calculate GWP factors for EN 15804 A1-A3 stages with Stage D benefits
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <Construction className="w-12 h-12 text-primary mx-auto mb-4" />
              <CardTitle>Data Import</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-center">
                Import from IFC files, Excel spreadsheets, and EPD XML documents
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <Users className="w-12 h-12 text-primary mx-auto mb-4" />
              <CardTitle>Team Collaboration</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-center">
                Role-based access with Author, Member, and Viewer permissions
              </p>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-gray-50 rounded-lg p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Ready to get started?
          </h3>
          <p className="text-gray-600 mb-6">
            Sign in to create your first material passport and join your engineering team.
          </p>
          <Button 
            size="lg" 
            onClick={() => window.location.href = '/api/login'}
            className="px-8"
          >
            Sign In to Continue
          </Button>
        </div>
      </main>
    </div>
  );
}
