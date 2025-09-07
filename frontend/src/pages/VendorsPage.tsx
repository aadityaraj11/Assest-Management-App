import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Plus, Building2, Phone, Mail, MapPin, Edit, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface Vendor {
  _id: string;
  name: string;
  contact: string;
  email: string;
  phone: string;
  address: string;
  specialization: string[];
  isActive: boolean;
  createdAt: string;
}

const SPECIALIZATIONS = [
  'extinguisher',
  'detector',
  'alarm',
  'sprinkler',
  'emergency_light',
  'hose',
  'panel',
  'fire_door'
];

export const VendorsPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [specializationFilter, setSpecializationFilter] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);

  const { data: vendors, isLoading } = useQuery({
    queryKey: ['vendors', specializationFilter],
    queryFn: () => api.getVendors({ specialization: specializationFilter || undefined }),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.createVendor(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      setIsCreateDialogOpen(false);
      toast({ title: 'Vendor created successfully' });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Failed to create vendor', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      api.updateVendor(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      setIsEditDialogOpen(false);
      setSelectedVendor(null);
      toast({ title: 'Vendor updated successfully' });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Failed to update vendor', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteVendor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      toast({ title: 'Vendor deleted successfully' });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Failed to delete vendor', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });

  const filteredVendors = vendors?.filter((vendor: Vendor) =>
    vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.email.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const canManageVendors = user?.role === 'admin' || user?.role === 'ops';
  const canDeleteVendors = user?.role === 'admin';

  const handleCreateVendor = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const specialization = SPECIALIZATIONS.filter(spec => 
      formData.get(`spec_${spec}`) === 'on'
    );
    
    createMutation.mutate({
      name: formData.get('name'),
      contact: formData.get('contact'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      address: formData.get('address'),
      specialization,
    });
  };

  const handleUpdateVendor = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const specialization = SPECIALIZATIONS.filter(spec => 
      formData.get(`spec_${spec}`) === 'on'
    );
    
    if (selectedVendor) {
      updateMutation.mutate({
        id: selectedVendor._id,
        data: {
          name: formData.get('name'),
          contact: formData.get('contact'),
          email: formData.get('email'),
          phone: formData.get('phone'),
          address: formData.get('address'),
          specialization,
        },
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="h-32 bg-muted/50" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Vendor Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage service providers and suppliers
          </p>
        </div>
        {canManageVendors && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Vendor
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Vendor</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateVendor} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Company Name</Label>
                    <Input name="name" required />
                  </div>
                  <div>
                    <Label htmlFor="contact">Contact Person</Label>
                    <Input name="contact" required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input name="email" type="email" required />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input name="phone" required />
                  </div>
                </div>
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Textarea name="address" required />
                </div>
                <div>
                  <Label>Specializations</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {SPECIALIZATIONS.map((spec) => (
                      <div key={spec} className="flex items-center space-x-2">
                        <Checkbox name={`spec_${spec}`} />
                        <Label className="text-sm capitalize">
                          {spec.replace('_', ' ')}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Creating...' : 'Create Vendor'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search vendors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={specializationFilter} onValueChange={setSpecializationFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Specializations" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Specializations</SelectItem> {/* FIXED: Changed from empty string */}
            {SPECIALIZATIONS.map((spec) => (
              <SelectItem key={spec} value={spec}>
                {spec.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Vendors List */}
      <div className="grid gap-4">
        {filteredVendors.map((vendor: Vendor) => (
          <Card key={vendor._id} className="hover:shadow-medium transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-full bg-accent/10">
                    <Building2 className="h-5 w-5 text-accent" />
                  </div>
                  <div className="space-y-2">
                    <div>
                      <h3 className="font-semibold text-lg">{vendor.name}</h3>
                      <p className="text-muted-foreground">Contact: {vendor.contact}</p>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        {vendor.email}
                      </div>
                      <div className="flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        {vendor.phone}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {vendor.address}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {vendor.specialization.map((spec) => (
                        <Badge key={spec} variant="outline" className="text-xs">
                          {spec.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={vendor.isActive !== false ? 'success' : 'secondary'}>
                    {vendor.isActive !== false ? 'Active' : 'Inactive'}
                  </Badge>
                  {canManageVendors && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedVendor(vendor);
                        setIsEditDialogOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                  {canDeleteVendors && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this vendor?')) {
                          deleteMutation.mutate(vendor._id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredVendors.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No vendors found</h3>
            <p className="text-muted-foreground">
              {canManageVendors ? 'Add your first vendor to get started.' : 'No vendors match your search.'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Edit Vendor Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Vendor</DialogTitle>
          </DialogHeader>
          {selectedVendor && (
            <form onSubmit={handleUpdateVendor} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Company Name</Label>
                  <Input name="name" defaultValue={selectedVendor.name} required />
                </div>
                <div>
                  <Label htmlFor="contact">Contact Person</Label>
                  <Input name="contact" defaultValue={selectedVendor.contact} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input name="email" type="email" defaultValue={selectedVendor.email} required />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input name="phone" defaultValue={selectedVendor.phone} required />
                </div>
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea name="address" defaultValue={selectedVendor.address} required />
              </div>
              <div>
                <Label>Specializations</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {SPECIALIZATIONS.map((spec) => (
                    <div key={spec} className="flex items-center space-x-2">
                      <Checkbox 
                        name={`spec_${spec}`} 
                        defaultChecked={selectedVendor.specialization.includes(spec)}
                      />
                      <Label className="text-sm capitalize">
                        {spec.replace('_', ' ')}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Updating...' : 'Update Vendor'}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};