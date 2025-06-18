import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertMaterialPassportSchema, insertComponentSchema, insertImportJobSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import * as XLSX from "xlsx";

const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Dashboard stats
  app.get('/api/dashboard/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      // Authors see all data, members/viewers see only their own
      const authorId = user?.role === 'author' ? undefined : userId;
      const stats = await storage.getDashboardStats(authorId);
      
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Material Passport routes
  app.get('/api/passports', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      // Authors see all passports, members/viewers see only their own
      const authorId = user?.role === 'author' ? undefined : userId;
      const passports = await storage.getMaterialPassports(authorId);
      
      res.json(passports);
    } catch (error) {
      console.error("Error fetching passports:", error);
      res.status(500).json({ message: "Failed to fetch passports" });
    }
  });

  app.get('/api/passports/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const passport = await storage.getMaterialPassport(id);
      
      if (!passport) {
        return res.status(404).json({ message: "Passport not found" });
      }
      
      res.json(passport);
    } catch (error) {
      console.error("Error fetching passport:", error);
      res.status(500).json({ message: "Failed to fetch passport" });
    }
  });

  app.post('/api/passports', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role === 'viewer') {
        return res.status(403).json({ message: "Viewers cannot create passports" });
      }
      
      const validatedData = insertMaterialPassportSchema.parse(req.body);
      
      // Auto-calculate weight from density and volume
      if (validatedData.density && validatedData.volume) {
        validatedData.weight = (parseFloat(validatedData.density) * parseFloat(validatedData.volume)).toString();
      }
      
      // Auto-calculate total GWP
      if (validatedData.gwpA1 && validatedData.gwpA2 && validatedData.gwpA3) {
        const total = parseFloat(validatedData.gwpA1) + parseFloat(validatedData.gwpA2) + parseFloat(validatedData.gwpA3);
        validatedData.gwpTotal = total.toString();
        
        // Calculate net GWP with Stage D benefits
        if (validatedData.stageDReduction) {
          validatedData.netGwp = (total - parseFloat(validatedData.stageDReduction)).toString();
        }
      }
      
      const passport = await storage.createMaterialPassport(validatedData, userId);
      res.status(201).json(passport);
    } catch (error) {
      console.error("Error creating passport:", error);
      res.status(400).json({ message: "Failed to create passport" });
    }
  });

  app.put('/api/passports/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const id = parseInt(req.params.id);
      
      if (user?.role === 'viewer') {
        return res.status(403).json({ message: "Viewers cannot edit passports" });
      }
      
      const validatedData = insertMaterialPassportSchema.partial().parse(req.body);
      
      // Auto-calculate weight from density and volume
      if (validatedData.density && validatedData.volume) {
        validatedData.weight = (parseFloat(validatedData.density) * parseFloat(validatedData.volume)).toString();
      }
      
      // Auto-calculate total GWP
      if (validatedData.gwpA1 && validatedData.gwpA2 && validatedData.gwpA3) {
        const total = parseFloat(validatedData.gwpA1) + parseFloat(validatedData.gwpA2) + parseFloat(validatedData.gwpA3);
        validatedData.gwpTotal = total.toString();
        
        // Calculate net GWP with Stage D benefits
        if (validatedData.stageDReduction) {
          validatedData.netGwp = (total - parseFloat(validatedData.stageDReduction)).toString();
        }
      }
      
      const passport = await storage.updateMaterialPassport(id, validatedData, userId);
      res.json(passport);
    } catch (error) {
      console.error("Error updating passport:", error);
      res.status(400).json({ message: "Failed to update passport" });
    }
  });

  app.delete('/api/passports/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const id = parseInt(req.params.id);
      
      if (user?.role !== 'author') {
        return res.status(403).json({ message: "Only authors can delete passports" });
      }
      
      const success = await storage.deleteMaterialPassport(id, userId);
      if (success) {
        res.status(204).end();
      } else {
        res.status(404).json({ message: "Passport not found" });
      }
    } catch (error) {
      console.error("Error deleting passport:", error);
      res.status(500).json({ message: "Failed to delete passport" });
    }
  });

  // Component routes
  app.get('/api/components', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      // Authors see all components, members/viewers see only their own
      const authorId = user?.role === 'author' ? undefined : userId;
      const components = await storage.getComponents(authorId);
      
      res.json(components);
    } catch (error) {
      console.error("Error fetching components:", error);
      res.status(500).json({ message: "Failed to fetch components" });
    }
  });

  app.post('/api/components', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role === 'viewer') {
        return res.status(403).json({ message: "Viewers cannot create components" });
      }
      
      const validatedData = insertComponentSchema.parse(req.body);
      const component = await storage.createComponent(validatedData, userId);
      res.status(201).json(component);
    } catch (error) {
      console.error("Error creating component:", error);
      res.status(400).json({ message: "Failed to create component" });
    }
  });

  // File import routes
  app.post('/api/import/excel', isAuthenticated, upload.single('file'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role === 'viewer') {
        return res.status(403).json({ message: "Viewers cannot import data" });
      }
      
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      // Create import job
      const importJob = await storage.createImportJob({
        type: 'excel',
        filename: req.file.originalname,
        status: 'processing'
      }, userId);
      
      // Process Excel file
      try {
        const workbook = XLSX.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);
        
        // Update job with results
        await storage.updateImportJob(importJob.id, {
          status: 'completed',
          resultData: data
        });
        
        res.json({ 
          jobId: importJob.id, 
          message: `Successfully imported ${data.length} rows`,
          data 
        });
      } catch (processError) {
        await storage.updateImportJob(importJob.id, {
          status: 'failed',
          errorMessage: 'Failed to process Excel file'
        });
        throw processError;
      }
    } catch (error) {
      console.error("Error importing Excel:", error);
      res.status(500).json({ message: "Failed to import Excel file" });
    }
  });

  app.post('/api/import/ifc', isAuthenticated, upload.single('file'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role === 'viewer') {
        return res.status(403).json({ message: "Viewers cannot import data" });
      }
      
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      // Create import job
      const importJob = await storage.createImportJob({
        type: 'ifc',
        filename: req.file.originalname,
        status: 'processing'
      }, userId);
      
      // Mock IFC processing for MVP - in production would use ifcOpenShell
      setTimeout(async () => {
        const mockComponents = [
          { name: 'Steel Beam HEB 200 - B001', guid: '2N1gHkRXL8ChVYzM3QEKMz', material: 'Structural Steel' },
          { name: 'Concrete Column C1', guid: '3M2hGlSYM9DiWZaN4RFLNa', material: 'Concrete C25/30' },
          { name: 'CLT Panel P001', guid: '1L0gFlRWK7BhUXyL2PDKLz', material: 'Cross Laminated Timber' },
        ];
        
        await storage.updateImportJob(importJob.id, {
          status: 'completed',
          resultData: mockComponents
        });
      }, 2000);
      
      res.json({ 
        jobId: importJob.id, 
        message: 'IFC file processing started'
      });
    } catch (error) {
      console.error("Error importing IFC:", error);
      res.status(500).json({ message: "Failed to import IFC file" });
    }
  });

  app.get('/api/import/:jobId', isAuthenticated, async (req: any, res) => {
    try {
      const jobId = parseInt(req.params.jobId);
      const job = await storage.getImportJob(jobId);
      
      if (!job) {
        return res.status(404).json({ message: "Import job not found" });
      }
      
      res.json(job);
    } catch (error) {
      console.error("Error fetching import job:", error);
      res.status(500).json({ message: "Failed to fetch import job" });
    }
  });

  // Export routes
  app.get('/api/passports/:id/export/json', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const passport = await storage.getMaterialPassport(id);
      
      if (!passport) {
        return res.status(404).json({ message: "Passport not found" });
      }
      
      // Format as BAMB-MPP schema
      const bambSchema = {
        passportId: passport.id,
        materialName: passport.name,
        category: passport.category,
        physicalProperties: {
          density: passport.density,
          volume: passport.volume,
          weight: passport.weight,
          strengthClass: passport.strengthClass,
          serviceLife: passport.serviceLife,
          contentReference: passport.contentReference
        },
        chemical: {
          constituents: passport.constituents,
          svhcFlag: passport.svhcFlag,
          vocClass: passport.vocClass
        },
        processIds: {
          gtin: passport.gtin,
          manufacturer: passport.manufacturer,
          bomObjectGuid: passport.bomObjectGuid
        },
        circularity: {
          disassemblyRating: passport.disassemblyRating,
          recyclabilityPercentage: passport.recyclabilityPercentage
        },
        lca: {
          gwpA1A3: passport.gwpTotal,
          stageDReduction: passport.stageDReduction,
          netGwp: passport.netGwp
        },
        standard: "ISO 14040/44, ISO 20887, ISO 12006-3, ISO 23387",
        exportedAt: new Date().toISOString()
      };
      
      res.setHeader('Content-Disposition', `attachment; filename="passport-${id}.json"`);
      res.setHeader('Content-Type', 'application/json');
      res.json(bambSchema);
    } catch (error) {
      console.error("Error exporting JSON:", error);
      res.status(500).json({ message: "Failed to export JSON" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
