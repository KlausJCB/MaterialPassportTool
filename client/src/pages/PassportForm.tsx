import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useEffect, useState } from "react";
import AppHeader from "@/components/AppHeader";
import LCACalculations from "@/components/LCACalculations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Save, ArrowLeft, AlertTriangle } from "lucide-react";
import { useLocation, useParams } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const passportSchema = z.object({
  name: z.string().min(1, "Material name is required"),
  category: z.string().min(1, "Category is required"),
  density: z.string().min(1, "Density is required"),
  volume: z.string().min(1, "Volume is required"),
  strengthClass: z.string().min(1, "Strength class is required"),
  serviceLife: z.number().min(1, "Service life is required"),
  contentReference: z.string().min(1, "Content reference is required"),
  
  // Chemical/Health
  constituents: z.array(z.object({
    material: z.string(),
    percentage: z.number()
  })).min(1, "At least one constituent is required"),
  svhcFlag: z.boolean(),
  vocClass: z.string().min(1, "VOC class is required"),
  
  // Process/IDs
  gtin: z.string().min(1, "GTIN is required"),
  manufacturer: z.string().min(1, "Manufacturer is required"),
  bomObjectGuid: z.string().optional(),
  
  // Circularity
  disassemblyRating: z.string().min(1, "Disassembly rating is required"),
  recyclabilityPercentage: z.string().min(1, "Recyclability percentage is required"),
  
  // LCA
  gwpA1: z.string().min(1, "GWP A1 is required"),
  gwpA2: z.string().min(1, "GWP A2 is required"),
  gwpA3: z.string().min(1, "GWP A3 is required"),
  stageDReduction: z.string().min(1, "Stage D reduction is required"),
});

type PassportFormData = z.infer<typeof passportSchema>;

export default function PassportForm() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const params = useParams();
  const isEditing = Boolean(params.id);
  const [activeTab, setActiveTab] = useState("physical");
  const [constituents, setConstituents] = useState([{ material: "", percentage: 0 }]);

  const form = useForm<PassportFormData>({
    resolver: zodResolver(passportSchema),
    defaultValues: {
      name: "",
      category: "",
      density: "",
      volume: "",
      strengthClass: "",
      serviceLife: 50,
      contentReference: "",
      constituents: [{ material: "", percentage: 0 }],
      svhcFlag: false,
      vocClass: "",
      gtin: "",
      manufacturer: "",
      bomObjectGuid: "",
      disassemblyRating: "",
      recyclabilityPercentage: "",
      gwpA1: "",
      gwpA2: "",
      gwpA3: "",
      stageDReduction: "",
    },
  });

  // Load existing passport if editing
  const { data: passport } = useQuery({
    queryKey: [`/api/passports/${params.id}`],
    enabled: isEditing,
    retry: false,
  });

  // Calculate completion progress
  const calculateProgress = () => {
    const formData = form.watch();
    const requiredFields = [
      'name', 'category', 'density', 'volume', 'strengthClass', 'serviceLife', 'contentReference',
      'vocClass', 'gtin', 'manufacturer', 'disassemblyRating', 'recyclabilityPercentage',
      'gwpA1', 'gwpA2', 'gwpA3', 'stageDReduction'
    ];
    
    const completedFields = requiredFields.filter(field => {
      const value = formData[field as keyof PassportFormData];
      return value !== "" && value !== null && value !== undefined;
    });
    
    const constituentsComplete = formData.constituents.some(c => c.material && c.percentage > 0);
    if (constituentsComplete) completedFields.push('constituents');
    
    return Math.round((completedFields.length / (requiredFields.length + 1)) * 100);
  };

  // Auto-calculate weight
  const density = form.watch("density");
  const volume = form.watch("volume");
  
  useEffect(() => {
    if (density && volume) {
      const weight = parseFloat(density) * parseFloat(volume);
      if (!isNaN(weight)) {
        // Weight is calculated automatically, no need to set in form
      }
    }
  }, [density, volume]);

  // Load passport data when editing
  useEffect(() => {
    if (passport) {
      form.reset({
        name: passport.name || "",
        category: passport.category || "",
        density: passport.density || "",
        volume: passport.volume || "",
        strengthClass: passport.strengthClass || "",
        serviceLife: passport.serviceLife || 50,
        contentReference: passport.contentReference || "",
        constituents: passport.constituents || [{ material: "", percentage: 0 }],
        svhcFlag: passport.svhcFlag || false,
        vocClass: passport.vocClass || "",
        gtin: passport.gtin || "",
        manufacturer: passport.manufacturer || "",
        bomObjectGuid: passport.bomObjectGuid || "",
        disassemblyRating: passport.disassemblyRating || "",
        recyclabilityPercentage: passport.recyclabilityPercentage || "",
        gwpA1: passport.gwpA1 || "",
        gwpA2: passport.gwpA2 || "",
        gwpA3: passport.gwpA3 || "",
        stageDReduction: passport.stageDReduction || "",
      });
      setConstituents(passport.constituents || [{ material: "", percentage: 0 }]);
    }
  }, [passport, form]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data: PassportFormData) => {
      const url = isEditing ? `/api/passports/${params.id}` : '/api/passports';
      const method = isEditing ? 'PUT' : 'POST';
      return await apiRequest(method, url, { ...data, constituents });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: `Material passport ${isEditing ? 'updated' : 'created'} successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/passports'] });
      setLocation('/passports');
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
        title: "Error",
        description: `Failed to ${isEditing ? 'update' : 'create'} passport`,
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
              Viewers cannot create or edit material passports.
            </AlertDescription>
          </Alert>
        </main>
      </div>
    );
  }

  const onSubmit = (data: PassportFormData) => {
    saveMutation.mutate(data);
  };

  const progress = calculateProgress();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader />
      
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Header */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setLocation('/passports')}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <div>
                    <CardTitle>
                      {isEditing ? 'Edit Material Passport' : 'Create Material Passport'}
                    </CardTitle>
                    <p className="text-sm text-gray-500 mt-1">
                      BAMB-compliant material passport with full lifecycle scope
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={progress === 100 ? "default" : "secondary"}>
                    {progress === 100 ? 'Complete' : 'Draft'}
                  </Badge>
                  <Button 
                    onClick={form.handleSubmit(onSubmit)}
                    disabled={saveMutation.isPending}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saveMutation.isPending ? 'Saving...' : 'Save Passport'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-600">Completion Progress</span>
                <span className="font-medium">{progress}% complete</span>
              </div>
              <Progress value={progress} className="h-2" />
            </CardContent>
          </Card>

          <form onSubmit={form.handleSubmit(onSubmit)}>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-5 mb-8">
                <TabsTrigger value="physical">Physical</TabsTrigger>
                <TabsTrigger value="chemical">Chemical/Health</TabsTrigger>
                <TabsTrigger value="process">Process/IDs</TabsTrigger>
                <TabsTrigger value="circularity">Circularity</TabsTrigger>
                <TabsTrigger value="lca">LCA Data</TabsTrigger>
              </TabsList>

              {/* Physical Properties */}
              <TabsContent value="physical">
                <Card>
                  <CardHeader>
                    <CardTitle>Physical Properties</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="name">Material Name *</Label>
                          <Input
                            id="name"
                            placeholder="e.g., Structural Steel Grade S355"
                            {...form.register("name")}
                          />
                          {form.formState.errors.name && (
                            <p className="text-sm text-red-600 mt-1">{form.formState.errors.name.message}</p>
                          )}
                        </div>
                        
                        <div>
                          <Label htmlFor="category">Material Category *</Label>
                          <Select value={form.watch("category")} onValueChange={(value) => form.setValue("category", value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="steel">Steel</SelectItem>
                              <SelectItem value="concrete">Concrete</SelectItem>
                              <SelectItem value="timber">Timber</SelectItem>
                              <SelectItem value="aluminum">Aluminum</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="density">Density (kg/m³) *</Label>
                          <Input
                            id="density"
                            type="number"
                            step="0.01"
                            placeholder="7850"
                            {...form.register("density")}
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="volume">Volume (m³) *</Label>
                            <Input
                              id="volume"
                              type="number"
                              step="0.001"
                              placeholder="0.125"
                              {...form.register("volume")}
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="weight">Weight (kg)</Label>
                            <Input
                              id="weight"
                              type="number"
                              step="0.01"
                              placeholder="Auto-calculated"
                              value={density && volume ? (parseFloat(density) * parseFloat(volume)).toFixed(2) : ''}
                              readOnly
                              className="bg-gray-50"
                            />
                            <p className="text-xs text-gray-500 mt-1">Auto-calculated from density × volume</p>
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="strengthClass">Strength Class/Grade *</Label>
                          <Input
                            id="strengthClass"
                            placeholder="e.g., S355, C25/30, GL28h"
                            {...form.register("strengthClass")}
                          />
                        </div>

                        <div>
                          <Label htmlFor="serviceLife">Service Life (years) *</Label>
                          <Input
                            id="serviceLife"
                            type="number"
                            placeholder="50"
                            {...form.register("serviceLife", { valueAsNumber: true })}
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="contentReference">Content Reference *</Label>
                      <Textarea
                        id="contentReference"
                        rows={3}
                        placeholder="Reference to technical specifications, standards, or documentation"
                        {...form.register("contentReference")}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Chemical/Health Properties */}
              <TabsContent value="chemical">
                <Card>
                  <CardHeader>
                    <CardTitle>Chemical/Health Properties</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <Label>Material Constituents *</Label>
                      <div className="space-y-2 mt-2">
                        {constituents.map((constituent, index) => (
                          <div key={index} className="flex gap-4">
                            <Input
                              placeholder="Material name"
                              value={constituent.material}
                              onChange={(e) => {
                                const updated = [...constituents];
                                updated[index].material = e.target.value;
                                setConstituents(updated);
                              }}
                              className="flex-1"
                            />
                            <Input
                              type="number"
                              step="0.1"
                              placeholder="% by weight"
                              value={constituent.percentage || ''}
                              onChange={(e) => {
                                const updated = [...constituents];
                                updated[index].percentage = parseFloat(e.target.value) || 0;
                                setConstituents(updated);
                              }}
                              className="w-32"
                            />
                            {constituents.length > 1 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const updated = constituents.filter((_, i) => i !== index);
                                  setConstituents(updated);
                                }}
                              >
                                Remove
                              </Button>
                            )}
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setConstituents([...constituents, { material: "", percentage: 0 }])}
                        >
                          Add Constituent
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="svhcFlag"
                        checked={form.watch("svhcFlag")}
                        onCheckedChange={(checked) => form.setValue("svhcFlag", checked as boolean)}
                      />
                      <Label htmlFor="svhcFlag">Contains SVHC (Substance of Very High Concern)</Label>
                    </div>

                    <div>
                      <Label htmlFor="vocClass">VOC Classification *</Label>
                      <Select value={form.watch("vocClass")} onValueChange={(value) => form.setValue("vocClass", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select VOC class..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="A+">A+ (Very Low)</SelectItem>
                          <SelectItem value="A">A (Low)</SelectItem>
                          <SelectItem value="B">B (Medium)</SelectItem>
                          <SelectItem value="C">C (High)</SelectItem>
                          <SelectItem value="none">No VOC emissions</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Process/IDs */}
              <TabsContent value="process">
                <Card>
                  <CardHeader>
                    <CardTitle>Process/Identification Data</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="gtin">GTIN/EAN Code *</Label>
                        <Input
                          id="gtin"
                          placeholder="e.g., 1234567890123"
                          {...form.register("gtin")}
                        />
                      </div>

                      <div>
                        <Label htmlFor="manufacturer">Manufacturer *</Label>
                        <Input
                          id="manufacturer"
                          placeholder="Manufacturer name"
                          {...form.register("manufacturer")}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="bomObjectGuid">BIM Object GUID</Label>
                      <Input
                        id="bomObjectGuid"
                        placeholder="e.g., 2N1gHkRXL8ChVYzM3QEKMz"
                        {...form.register("bomObjectGuid")}
                      />
                      <p className="text-xs text-gray-500 mt-1">Unique identifier from BIM/IFC model</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Circularity */}
              <TabsContent value="circularity">
                <Card>
                  <CardHeader>
                    <CardTitle>Circularity Properties</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <Label htmlFor="disassemblyRating">Disassembly Rating *</Label>
                      <Select value={form.watch("disassemblyRating")} onValueChange={(value) => form.setValue("disassemblyRating", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select disassembly rating..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="excellent">Excellent - Reversible connections</SelectItem>
                          <SelectItem value="good">Good - Some disassembly possible</SelectItem>
                          <SelectItem value="fair">Fair - Limited disassembly</SelectItem>
                          <SelectItem value="poor">Poor - Destructive disassembly required</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="recyclabilityPercentage">Recyclability Percentage *</Label>
                      <Input
                        id="recyclabilityPercentage"
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        placeholder="95.0"
                        {...form.register("recyclabilityPercentage")}
                      />
                      <p className="text-xs text-gray-500 mt-1">Percentage of material that can be recycled at end of life</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* LCA Data */}
              <TabsContent value="lca">
                <div className="space-y-8">
                  <Card>
                    <CardHeader>
                      <CardTitle>LCA Environmental Impact Data</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div>
                          <Label htmlFor="gwpA1">GWP A1 - Raw Materials (kg CO₂-eq/kg) *</Label>
                          <Input
                            id="gwpA1"
                            type="number"
                            step="0.0001"
                            placeholder="0.89"
                            {...form.register("gwpA1")}
                          />
                        </div>

                        <div>
                          <Label htmlFor="gwpA2">GWP A2 - Transport (kg CO₂-eq/kg) *</Label>
                          <Input
                            id="gwpA2"
                            type="number"
                            step="0.0001"
                            placeholder="0.12"
                            {...form.register("gwpA2")}
                          />
                        </div>

                        <div>
                          <Label htmlFor="gwpA3">GWP A3 - Manufacturing (kg CO₂-eq/kg) *</Label>
                          <Input
                            id="gwpA3"
                            type="number"
                            step="0.0001"
                            placeholder="1.44"
                            {...form.register("gwpA3")}
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="stageDReduction">Stage D - End of Life Benefits (kg CO₂-eq/kg) *</Label>
                        <Input
                          id="stageDReduction"
                          type="number"
                          step="0.0001"
                          placeholder="1.89"
                          {...form.register("stageDReduction")}
                        />
                        <p className="text-xs text-gray-500 mt-1">Positive value represents benefits from recycling/recovery</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* LCA Calculations Display */}
                  <LCACalculations
                    gwpA1={form.watch("gwpA1")}
                    gwpA2={form.watch("gwpA2")}
                    gwpA3={form.watch("gwpA3")}
                    stageDReduction={form.watch("stageDReduction")}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </form>

          {/* Validation Summary */}
          {progress < 100 && (
            <Alert className="mt-8">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Required Fields Missing:</strong> Complete all mandatory fields in all sections to save this passport.
                Currently {progress}% complete.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </main>
    </div>
  );
}
