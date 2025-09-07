import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Users, 
  Building2,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { api } from '@/lib/api';

// Update the interface to match backend response
interface DashboardStats {
  totalAssets: number;
  availableAssets: number;
  assignedAssets: number;
  maintenanceAssets: number;
  overdueMaintenances: number;
  expiringWarranties: number;
}

export const DashboardPage = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.getDashboardStats(),
  });
  
  // Remove the response.data extraction - api already returns the data directly

  const statCards = [
    {
      title: 'Total Assets',
      value: stats?.totalAssets || 0,
      icon: Package,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Available Assets',
      value: stats?.availableAssets || 0,
      icon: CheckCircle,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      title: 'Assigned Assets',
      value: stats?.assignedAssets || 0,
      icon: Users,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
    {
      title: 'In Maintenance',
      value: stats?.maintenanceAssets || 0,
      icon: AlertTriangle,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
    {
      title: 'Overdue Maintenance',
      value: stats?.overdueMaintenances || 0,
      icon: TrendingDown,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
    },
    {
      title: 'Expiring Warranties',
      value: stats?.expiringWarranties || 0,
      icon: Clock,
      color: 'text-muted-foreground',
      bgColor: 'bg-muted',
    },
  ];

  const alertCards = [
    {
      title: 'Overdue Maintenance',
      value: stats?.overdueMaintenances || 0,
      description: 'Requires immediate attention',
      variant: 'destructive' as const,
    },
    {
      title: 'Expiring Warranties',
      value: stats?.expiringWarranties || 0,
      description: 'Expiring in next 30 days',
      variant: 'warning' as const,
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="h-20 bg-muted rounded-t-lg" />
              <CardContent className="h-16 bg-muted/50" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Fire Safety Dashboard
        </h1>
        <p className="text-muted-foreground mt-2">
          Monitor your fire safety assets and compliance status
        </p>
      </div>

      {/* Main Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat) => (
          <Card key={stat.title} className="hover:shadow-medium transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-full ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alert Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {alertCards.map((alert) => (
          <Card key={alert.title} className={`border-l-4 ${
            alert.variant === 'destructive' 
              ? 'border-l-destructive' 
              : 'border-l-warning'
          }`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{alert.title}</CardTitle>
                <Badge variant={alert.variant} className="text-lg font-bold px-3 py-1">
                  {alert.value}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{alert.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4 hover:bg-muted/50 transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <Package className="h-8 w-8 text-primary" />
                <div>
                  <h3 className="font-medium">Add New Asset</h3>
                  <p className="text-sm text-muted-foreground">Register equipment</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 hover:bg-muted/50 transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <Clock className="h-8 w-8 text-warning" />
                <div>
                  <h3 className="font-medium">Schedule Maintenance</h3>
                  <p className="text-sm text-muted-foreground">Plan inspections</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 hover:bg-muted/50 transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-accent" />
                <div>
                  <h3 className="font-medium">Assign Assets</h3>
                  <p className="text-sm text-muted-foreground">Delegate responsibility</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 hover:bg-muted/50 transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <Building2 className="h-8 w-8 text-success" />
                <div>
                  <h3 className="font-medium">Manage Vendors</h3>
                  <p className="text-sm text-muted-foreground">Service providers</p>
                </div>
              </div>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};