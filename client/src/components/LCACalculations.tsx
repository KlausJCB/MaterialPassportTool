import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Leaf, Recycle, Zap } from "lucide-react";
import { useMemo } from "react";

interface LCACalculationsProps {
  gwpA1?: string;
  gwpA2?: string;
  gwpA3?: string;
  stageDReduction?: string;
}

export default function LCACalculations({ gwpA1, gwpA2, gwpA3, stageDReduction }: LCACalculationsProps) {
  const calculations = useMemo(() => {
    const a1 = parseFloat(gwpA1 || '0');
    const a2 = parseFloat(gwpA2 || '0');
    const a3 = parseFloat(gwpA3 || '0');
    const stageD = parseFloat(stageDReduction || '0');
    
    const totalA1A3 = a1 + a2 + a3;
    const netImpact = totalA1A3 - stageD;
    
    return {
      a1,
      a2,
      a3,
      totalA1A3,
      stageD,
      netImpact,
      hasData: !!(gwpA1 && gwpA2 && gwpA3)
    };
  }, [gwpA1, gwpA2, gwpA3, stageDReduction]);

  if (!calculations.hasData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Leaf className="w-5 h-5 text-green-600" />
            <span>LCA Calculations</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-8">
            Enter GWP values in the LCA Data section to see calculations
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Leaf className="w-5 h-5 text-green-600" />
            <span>LCA Calculations</span>
          </div>
          <Badge variant="secondary">EN 15804</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Impact Categories Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-800">Global Warming Potential</p>
                <p className="text-2xl font-bold text-red-900 mt-1">
                  {calculations.totalA1A3.toFixed(3)}
                </p>
                <p className="text-xs text-red-700">kg CO₂-eq/kg (A1-A3)</p>
              </div>
              <Leaf className="w-6 h-6 text-red-600" />
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">Stage D Benefits</p>
                <p className="text-2xl font-bold text-green-900 mt-1">
                  -{calculations.stageD.toFixed(3)}
                </p>
                <p className="text-xs text-green-700">kg CO₂-eq/kg avoided</p>
              </div>
              <Recycle className="w-6 h-6 text-green-600" />
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-800">Net Impact</p>
                <p className="text-2xl font-bold text-blue-900 mt-1">
                  {calculations.netImpact.toFixed(3)}
                </p>
                <p className="text-xs text-blue-700">kg CO₂-eq/kg net</p>
              </div>
              <Zap className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Lifecycle Stages Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Production Stages */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Production Stage (A1-A3)</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-sm text-gray-600">A1 - Raw Material Supply</span>
                <span className="text-sm font-medium">{calculations.a1.toFixed(4)} kg CO₂-eq/kg</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-sm text-gray-600">A2 - Transport</span>
                <span className="text-sm font-medium">{calculations.a2.toFixed(4)} kg CO₂-eq/kg</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-sm text-gray-600">A3 - Manufacturing</span>
                <span className="text-sm font-medium">{calculations.a3.toFixed(4)} kg CO₂-eq/kg</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center py-2 font-medium bg-gray-50 px-3 rounded">
                <span className="text-sm text-gray-900">Total A1-A3</span>
                <span className="text-sm">{calculations.totalA1A3.toFixed(3)} kg CO₂-eq/kg</span>
              </div>
            </div>
          </div>

          {/* End-of-Life Benefits */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">End-of-Life Benefits (Stage D)</h3>
            <div className="space-y-3">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-green-800">Recycling Benefit</span>
                  <span className="text-sm font-bold text-green-900">
                    -{calculations.stageD.toFixed(3)}
                  </span>
                </div>
                <p className="text-xs text-green-700">kg CO₂-eq/kg avoided through recycling</p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Estimated Recycling Rate</span>
                  <span className="font-medium">95%*</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Energy Recovery Potential</span>
                  <span className="font-medium">High*</span>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800 font-medium">Net Environmental Impact</p>
                <p className="text-lg font-bold text-blue-900">{calculations.netImpact.toFixed(3)} kg CO₂-eq/kg</p>
                <p className="text-xs text-blue-700">Including Stage D benefits</p>
              </div>
            </div>
          </div>
        </div>

        {/* Methodology */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="text-base font-medium text-gray-900 mb-2">Calculation Methodology</h4>
          <div className="text-sm text-gray-700 space-y-1">
            <p><strong>Standard:</strong> EN 15804:2012+A2:2019 - Sustainability of construction works</p>
            <p><strong>System Boundary:</strong> Cradle-to-grave with end-of-life benefits (A1-A3, D)</p>
            <p><strong>Functional Unit:</strong> 1 kg of material</p>
            <p className="text-xs text-gray-500 mt-2">
              * Estimated values - actual values depend on local recycling infrastructure and practices
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
