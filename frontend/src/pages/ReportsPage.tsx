import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertTriangle, 
  Calendar, 
  FileText, 
  Package, 
  Shield,  
  TrendingUp,
  Download,
  Clock,
  DollarSign,
  RefreshCw
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast'; // ADDED: Import toast


interface MaintenanceDueItem {
  _id: string;
  assetId: {
    name: string;
    assetTag: string;
    category: string;
  } | null; // FIXED: Allow assetId to be null
  scheduledAt: string;
  vendorId?: {
    name: string;
  };
  cost: number;
  daysUntilDue: number;
}

interface WarrantyExpiryItem {
  _id: string;
  name: string;
  assetTag: string;
  category: string;
  warrantyUntil: string;
  daysUntilExpiry: number;
  vendorId?: {
    name: string;
  };
}

interface InventorySummary {
  category: string;
  total: number;
  available: number;
  assigned: number;
  maintenance: number;
  retired: number;
  totalValue: number;
}

export const ReportsPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [maintenanceDays, setMaintenanceDays] = useState('30');
  const [warrantyDays, setWarrantyDays] = useState('30');
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refreshReports();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const { data: maintenanceDue, isLoading: loadingMaintenance, refetch: refetchMaintenance } = useQuery({
    queryKey: ['maintenance-due', maintenanceDays],
    queryFn: () => api.getMaintenanceDueReport(Number(maintenanceDays)),
    staleTime: 30000,
  });

  const { data: warrantyExpiry, isLoading: loadingWarranty, refetch: refetchWarranty } = useQuery({
    queryKey: ['warranty-expiry', warrantyDays],
    queryFn: () => api.getWarrantyExpiryReport(Number(warrantyDays)),
    staleTime: 30000,
  });

  const { data: inventorySummary, isLoading: loadingInventory, refetch: refetchInventory } = useQuery({
    queryKey: ['inventory-summary'],
    queryFn: () => api.getInventorySummaryReport(),
    staleTime: 30000,
  });

  const { data: complianceReport, isLoading: loadingCompliance, refetch: refetchCompliance } = useQuery({
    queryKey: ['compliance'],
    queryFn: () => api.getComplianceReport(),
    enabled: user?.role === 'admin' || user?.role === 'auditor',
    staleTime: 30000,
  });

  // Function to refresh all reports
  const refreshReports = async () => {
    try {
      await Promise.all([
        refetchMaintenance(),
        refetchWarranty(),
        refetchInventory(),
        refetchCompliance()
      ]);
      setLastRefreshed(new Date());
      toast({ title: 'Reports refreshed successfully' });
    } catch (error) {
      toast({ 
        title: 'Failed to refresh reports', 
        variant: 'destructive' 
      });
    }
  };

  const canViewCompliance = user?.role === 'admin' || user?.role === 'auditor';

  const getUrgencyVariant = (days: number) => {
    if (days <= 7) return 'destructive';
    if (days <= 14) return 'warning';
    return 'outline';
  };

  const exportReport = (type: string, data: any) => {
    if (!data || data.length === 0) {
      toast({ title: 'No data to export', variant: 'destructive' });
      return;
    }
    
    const csv = convertToCSV(data, type);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const convertToCSV = (data: any[], type: string) => {
    if (!data || data.length === 0) return '';
    
    let headers: string[] = [];
    let rows: any[] = [];

    switch (type) {
      case 'maintenance-due':
        headers = ['Asset Name', 'Asset Tag', 'Category', 'Scheduled Date', 'Vendor', 'Cost', 'Days Until Due'];
        rows = data.map((item: MaintenanceDueItem) => [
          item.assetId?.name || 'Deleted Asset', // FIXED: Handle null assetId
          item.assetId?.assetTag || 'N/A',
          item.assetId?.category || 'N/A',
          new Date(item.scheduledAt).toLocaleDateString(),
          item.vendorId?.name || 'N/A',
          item.cost,
          item.daysUntilDue
        ]);
        break;
      
      case 'warranty-expiry':
        headers = ['Asset Name', 'Asset Tag', 'Category', 'Warranty Until', 'Vendor', 'Days Until Expiry'];
        rows = data.map((item: WarrantyExpiryItem) => [
          item.name,
          item.assetTag,
          item.category,
          new Date(item.warrantyUntil).toLocaleDateString(),
          item.vendorId?.name || 'N/A',
          item.daysUntilExpiry
        ]);
        break;
      
      case 'inventory-summary':
        headers = ['Category', 'Total', 'Available', 'Assigned', 'Maintenance', 'Retired', 'Total Value'];
        rows = data.map((item: InventorySummary) => [
          item.category,
          item.total,
          item.available,
          item.assigned,
          item.maintenance,
          item.retired,
          item.totalValue
        ]);
        break;
      
      case 'compliance':
        headers = ['Metric', 'Value'];
        rows = Object.entries(data).map(([key, value]) => [
          key.replace(/([A-Z])/g, ' $1').trim(),
          value
        ]);
        break;
      
      default:
        headers = Object.keys(data[0] || {});
        rows = data.map(row => headers.map(header => row[header]));
    }

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map((cell: any) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    return csvContent;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Reports & Analytics
          </h1>
          <p className="text-muted-foreground mt-2">
            Monitor compliance and track asset performance
          </p>
        </div>
        <Button variant="outline" onClick={refreshReports} className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {lastRefreshed && (
        <p className="text-sm text-muted-foreground">
          Last updated: {lastRefreshed.toLocaleTimeString()}
        </p>
      )}

      <Tabs defaultValue="maintenance" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="maintenance">Maintenance Due</TabsTrigger>
          <TabsTrigger value="warranty">Warranty Expiry</TabsTrigger>
          <TabsTrigger value="inventory">Inventory Summary</TabsTrigger>
          {canViewCompliance && (
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="maintenance" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Select value={maintenanceDays} onValueChange={setMaintenanceDays}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="30 days" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="14">14 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="60">60 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">upcoming</span>
            </div>
            <Button 
              variant="outline" 
              onClick={() => exportReport('maintenance-due', maintenanceDue)}
              disabled={!maintenanceDue || maintenanceDue.length === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>

          {loadingMaintenance ? (
            <div className="grid gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="h-20 bg-muted/50" />
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid gap-4">
              {maintenanceDue?.map((item: MaintenanceDueItem) => (
                <Card key={item._id} className="hover:shadow-medium transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-full bg-warning/10">
                          <Clock className="h-5 w-5 text-warning" />
                        </div>
                        <div>
                          {/* FIXED: Handle null assetId */}
                          {item.assetId ? (
                            <>
                              <h3 className="font-semibold">{item.assetId.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                {item.assetId.assetTag} • {item.assetId.category}
                              </p>
                            </>
                          ) : (
                            <>
                              <h3 className="font-semibold text-destructive flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4" />
                                Deleted Asset
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                This asset has been removed from the system
                              </p>
                            </>
                          )}
                          {item.vendorId && (
                            <p className="text-sm text-muted-foreground">
                              Vendor: {item.vendorId.name}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={getUrgencyVariant(item.daysUntilDue)}>
                          {item.daysUntilDue} days
                        </Badge>
                        <p className="text-sm text-muted-foreground mt-1">
                          Due: {new Date(item.scheduledAt).toLocaleDateString()}
                        </p>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <DollarSign className="h-3 w-3" />
                          ${item.cost.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {(!maintenanceDue || maintenanceDue.length === 0) && (
                <Card>
                  <CardContent className="text-center py-12">
                    <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No maintenance due</h3>
                    <p className="text-muted-foreground">
                      All assets are up to date with maintenance schedules.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="warranty" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Select value={warrantyDays} onValueChange={setWarrantyDays}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="30 days" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="14">14 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="60">60 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">to expiry</span>
            </div>
            <Button 
              variant="outline" 
              onClick={() => exportReport('warranty-expiry', warrantyExpiry)}
              disabled={!warrantyExpiry || warrantyExpiry.length === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>

          {loadingWarranty ? (
            <div className="grid gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="h-20 bg-muted/50" />
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid gap-4">
              {warrantyExpiry?.map((item: WarrantyExpiryItem) => (
                <Card key={item._id} className="hover:shadow-medium transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-full bg-destructive/10">
                          <Shield className="h-5 w-5 text-destructive" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{item.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {item.assetTag} • {item.category}
                          </p>
                          {item.vendorId && (
                            <p className="text-sm text-muted-foreground">
                              Vendor: {item.vendorId.name}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={getUrgencyVariant(item.daysUntilExpiry)}>
                          {item.daysUntilExpiry} days
                        </Badge>
                        <p className="text-sm text-muted-foreground mt-1">
                          Expires: {new Date(item.warrantyUntil).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {(!warrantyExpiry || warrantyExpiry.length === 0) && (
                <Card>
                  <CardContent className="text-center py-12">
                    <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No warranties expiring</h3>
                    <p className="text-muted-foreground">
                      All assets have valid warranties for the selected period.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <div className="flex justify-end">
            <Button 
              variant="outline" 
              onClick={() => exportReport('inventory-summary', inventorySummary)}
              disabled={!inventorySummary || inventorySummary.length === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>

          {loadingInventory ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="h-32 bg-muted/50" />
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {inventorySummary?.map((category: InventorySummary) => (
                <Card key={category.category} className="hover:shadow-medium transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Package className="h-5 w-5" />
                      {category.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total Assets:</span>
                      <span className="font-semibold">{category.total}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Available:</span>
                        <Badge variant="success">{category.available}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Assigned:</span>
                        <Badge variant="default">{category.assigned}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Maintenance:</span>
                        <Badge variant="warning">{category.maintenance}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Retired:</span>
                        <Badge variant="secondary">{category.retired}</Badge>
                      </div>
                    </div>
                    <div className="pt-2 border-t">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Total Value:</span>
                        <span className="font-semibold">${category.totalValue?.toLocaleString() || 0}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {canViewCompliance && (
          <TabsContent value="compliance" className="space-y-4">
            <div className="flex justify-end">
              <Button 
                variant="outline" 
                onClick={() => exportReport('compliance', complianceReport)}
                disabled={!complianceReport || Object.keys(complianceReport).length === 0}
              >
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>

            {loadingCompliance ? (
              <Card className="animate-pulse">
                <CardContent className="h-32 bg-muted/50" />
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Compliance Report
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {complianceReport && Object.keys(complianceReport).length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(complianceReport as Record<string, any>).map(([key, value]) => (
                          <div key={key} className="p-4 border rounded-lg">
                            <h4 className="font-semibold capitalize mb-2">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </h4>
                            <p className="text-2xl font-bold text-primary">{value}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No compliance data available</h3>
                        <p className="text-muted-foreground">
                          Compliance metrics will appear here once data is available.
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};