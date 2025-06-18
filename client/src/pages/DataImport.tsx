import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useEffect } from "react";
import AppHeader from "@/components/AppHeader";
import FileUpload from "@/components/FileUpload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { CloudUpload, FileSpreadsheet, Building, Download, Info, CheckCircle, AlertTriangle } from "lucide-react";

export default function DataImport() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importType, setImportType] = useState<'excel' | 'ifc'>('excel');
  const [processingProgress, setProcessingProgress] = useState(0);
  const [importResults, setImportResults] = useState<any>(null);
  const [selectedComponents, setSelectedComponents] = useState<string[]>([]);

  // Excel import mutation
  const excelImportMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/import/excel', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`${response.status}: ${text || response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: `Successfully imported ${data.data?.length || 0} rows from Excel file`,
      });
      setImportResults(data);
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
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
      toast({
        title: "Import Failed",
        description: "Failed to import Excel file. Please check the format and try again.",
        variant: "destructive",
      });
    },
  });

  // IFC import mutation
  const ifcImportMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/import/ifc', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`${response.status}: ${text || response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // Poll for job completion
      const jobId = data.jobId;
      const pollInterval = setInterval(async () => {
        try {
          const response = await fetch(`/api/import/${jobId}`, {
            credentials: 'include',
          });
          const job = await response.json();
          
          if (job.status === 'completed') {
            clearInterval(pollInterval);
            setProcessingProgress(100);
            setImportResults(job);
            toast({
              title: "IFC Processing Complete",
              description: `Found ${job.resultData?.length || 0} components in the model`,
            });
          } else if (job.status === 'failed') {
            clearInterval(pollInterval);
            toast({
              title: "IFC Processing Failed",
              description: job.errorMessage || "Failed to process IFC file",
              variant: "destructive",
            });
          } else {
            setProcessingProgress(prev => Math.min(prev + 10, 90));
          }
        } catch (error) {
          clearInterval(pollInterval);
          toast({
            title: "Error",
            description: "Failed to check import status",
            variant: "destructive",
          });
        }
      }, 1000);
      
      setProcessingProgress(10);
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
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
      toast({
        title: "Import Failed",
        description: "Failed to import IFC file. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle unauthorized access
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

  if (isLoading || !isAuthenticated) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">Loading...</div>
    </div>;
  }

  if (user?.role === 'viewer') {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <AppHeader />
        <main className="flex-1 flex items-center justify-center">
          <Alert className="max-w-md">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Viewers cannot import data. Contact an Author or Member for assistance.
            </AlertDescription>
          </Alert>
        </main>
      </div>
    );
  }

  const handleFileUpload = (file: File) => {
    setSelectedFile(file);
    setImportResults(null);
    setProcessingProgress(0);
    
    if (importType === 'excel') {
      excelImportMutation.mutate(file);
    } else {
      ifcImportMutation.mutate(file);
    }
  };

  const handleComponentToggle = (componentId: string) => {
    setSelectedComponents(prev => 
      prev.includes(componentId) 
        ? prev.filter(id => id !== componentId)
        : [...prev, componentId]
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader />
      
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Data Import</h1>
            <p className="text-gray-500 mt-1">Import material data from various sources</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* IFC Import */}
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Building className="w-5 h-5 text-primary" />
                  <CardTitle>IFC Model Import</CardTitle>
                </div>
                <p className="text-sm text-gray-500">Import building components from IFC files</p>
              </CardHeader>
              <CardContent>
                <FileUpload
                  onFileSelect={(file) => {
                    setImportType('ifc');
                    handleFileUpload(file);
                  }}
                  acceptedTypes=".ifc"
                  maxSize={100}
                  title="Upload IFC File"
                  description="Drag and drop your IFC file here, or click to browse"
                  icon={<Building className="w-8 h-8 text-gray-400" />}
                  disabled={ifcImportMutation.isPending}
                />

                {/* IFC Processing Status */}
                {ifcImportMutation.isPending && (
                  <div className="mt-6">
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
                          <span className="font-medium">Processing IFC file...</span>
                        </div>
                        <Progress value={processingProgress} className="h-2" />
                        <p className="text-xs text-blue-700 mt-2">Extracting components from model</p>
                      </AlertDescription>
                    </Alert>
                  </div>
                )}

                {/* Component Selection */}
                {importResults && importResults.resultData && importType === 'ifc' && (
                  <div className="mt-6">
                    <h4 className="text-base font-medium text-gray-900 mb-4">Select Components to Import</h4>
                    <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
                      <div className="divide-y divide-gray-200">
                        {importResults.resultData.map((component: any, index: number) => (
                          <label key={index} className="flex items-center p-3 hover:bg-gray-50 cursor-pointer">
                            <Checkbox
                              checked={selectedComponents.includes(component.guid)}
                              onCheckedChange={() => handleComponentToggle(component.guid)}
                              className="mr-3"
                            />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">{component.name}</p>
                              <p className="text-xs text-gray-500">GUID: {component.guid} • Material: {component.material}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="mt-4 flex justify-between items-center">
                      <span className="text-sm text-gray-500">
                        {selectedComponents.length} of {importResults.resultData.length} components selected
                      </span>
                      <Button 
                        disabled={selectedComponents.length === 0}
                        onClick={() => {
                          toast({
                            title: "Components Import",
                            description: `${selectedComponents.length} components would be imported (feature in development)`,
                          });
                        }}
                      >
                        Import Selected
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Excel Import */}
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <FileSpreadsheet className="w-5 h-5 text-primary" />
                  <CardTitle>Excel/CSV Import</CardTitle>
                </div>
                <p className="text-sm text-gray-500">Import material data from spreadsheets</p>
              </CardHeader>
              <CardContent>
                
                {/* Template Download */}
                <Alert className="mb-6">
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-blue-800">Import Template</h4>
                        <p className="text-sm text-blue-700 mt-1">Use our template to ensure proper data formatting</p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          toast({
                            title: "Template Download",
                            description: "Template download feature coming soon!",
                          });
                        }}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>

                <FileUpload
                  onFileSelect={(file) => {
                    setImportType('excel');
                    handleFileUpload(file);
                  }}
                  acceptedTypes=".xlsx,.xls,.csv"
                  maxSize={50}
                  title="Upload Excel/CSV File"
                  description="Select your formatted data file"
                  icon={<FileSpreadsheet className="w-8 h-8 text-gray-400" />}
                  disabled={excelImportMutation.isPending}
                />

                {/* Import Results */}
                {importResults && importResults.data && importType === 'excel' && (
                  <div className="mt-6">
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-green-800">Import Successful</span>
                          <span className="text-sm text-green-700">
                            {importResults.data.length} rows imported
                          </span>
                        </div>
                      </AlertDescription>
                    </Alert>
                    
                    {/* Preview imported data */}
                    <div className="mt-4 max-h-48 overflow-auto border border-gray-200 rounded-lg">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            {Object.keys(importResults.data[0] || {}).slice(0, 4).map((key) => (
                              <th key={key} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                {key}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {importResults.data.slice(0, 5).map((row: any, index: number) => (
                            <tr key={index}>
                              {Object.values(row).slice(0, 4).map((value: any, cellIndex: number) => (
                                <td key={cellIndex} className="px-3 py-2 text-sm text-gray-900">
                                  {String(value).substring(0, 50)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* EPD XML Integration */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>EPD Data Integration</CardTitle>
              <p className="text-sm text-gray-500">Import environmental product declarations</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* EPD Search */}
                <div>
                  <h4 className="text-base font-medium text-gray-900 mb-4">Search EPD Database</h4>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="productName">Product Name</Label>
                      <Input
                        id="productName"
                        placeholder="Search for materials..."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="category">Category</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="All Categories" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            <SelectItem value="steel">Steel Products</SelectItem>
                            <SelectItem value="concrete">Concrete</SelectItem>
                            <SelectItem value="timber">Timber</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="standard">Standard</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="EN 15804" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="en15804">EN 15804</SelectItem>
                            <SelectItem value="iso14025">ISO 14025</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button 
                      className="w-full"
                      onClick={() => {
                        toast({
                          title: "EPD Search",
                          description: "EPD database search feature coming soon!",
                        });
                      }}
                    >
                      Search EPDs
                    </Button>
                  </div>
                </div>

                {/* EPD Upload */}
                <div>
                  <h4 className="text-base font-medium text-gray-900 mb-4">Upload EPD XML</h4>
                  <FileUpload
                    onFileSelect={(file) => {
                      toast({
                        title: "EPD Upload",
                        description: "EPD XML processing feature coming soon!",
                      });
                    }}
                    acceptedTypes=".xml"
                    maxSize={10}
                    title="Drop EPD XML files here"
                    description="Select EPD XML documents"
                    icon={<CloudUpload className="w-6 h-6 text-gray-400" />}
                    compact
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
