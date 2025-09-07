import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

const ASSET_CATEGORIES = [
  'extinguisher',
  'detector',
  'alarm',
  'sprinkler',
  'emergency_light',
  'hose',
  'panel',
  'fire_door'
];

const ASSET_STATUS = ['available', 'assigned', 'maintenance', 'retired'];

export const AssetFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    name: '',
    assetTag: '',
    category: '',
    serial: '',
    status: 'available',
    location: '',
    purchaseDate: '',
    warrantyUntil: '',
    cost: '',
    vendorId: '',
    metadata: {
      manufacturer: '',
      model: '',
      capacity: ''
    }
  });

  // Fetch vendors for dropdown
  const { data: vendors } = useQuery({
    queryKey: ['vendors'],
    queryFn: () => api.getVendors(),
  });

  // Fetch asset data if editing
  const { data: asset } = useQuery({
    queryKey: ['asset', id],
    queryFn: () => api.getAsset(id!),
    enabled: isEdit,
  });

  // Set form data when asset is loaded (for edit)
  useEffect(() => {
    if (asset && isEdit) {
      setFormData({
        name: asset.name || '',
        assetTag: asset.assetTag || '',
        category: asset.category || '',
        serial: asset.serial || '',
        status: asset.status || 'available',
        location: asset.location || '',
        purchaseDate: asset.purchaseDate ? asset.purchaseDate.split('T')[0] : '',
        warrantyUntil: asset.warrantyUntil ? asset.warrantyUntil.split('T')[0] : '',
        cost: asset.cost?.toString() || '',
        vendorId: asset.vendor?._id || '',
        metadata: {
          manufacturer: asset.metadata?.manufacturer || '',
          model: asset.metadata?.model || '',
          capacity: asset.metadata?.capacity || ''
        }
      });
    }
  }, [asset, isEdit]);

  const createMutation = useMutation({
    mutationFn: (data: any) => api.createAsset(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast({ title: 'Asset created successfully' });
      navigate('/assets');
    },
    onError: (error: any) => {
      toast({ 
        title: 'Failed to create asset', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.updateAsset(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast({ title: 'Asset updated successfully' });
      navigate('/assets');
    },
    onError: (error: any) => {
      toast({ 
        title: 'Failed to update asset', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = {
      ...formData,
      cost: parseFloat(formData.cost) || 0,
      purchaseDate: new Date(formData.purchaseDate).toISOString(),
      warrantyUntil: new Date(formData.warrantyUntil).toISOString(),
      metadata: {
        manufacturer: formData.metadata.manufacturer,
        model: formData.metadata.model,
        ...(formData.metadata.capacity && { capacity: formData.metadata.capacity })
      }
    };

    if (isEdit) {
      updateMutation.mutate(submitData);
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleMetadataChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      metadata: { ...prev.metadata, [field]: value }
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate('/assets')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Assets
        </Button>
        <h1 className="text-3xl font-bold text-foreground">
          {isEdit ? 'Edit Asset' : 'Add New Asset'}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Asset Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Basic Information</h3>
                
                <div>
                  <Label htmlFor="name">Asset Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="assetTag">Asset Tag *</Label>
                  <Input
                    id="assetTag"
                    value={formData.assetTag}
                    onChange={(e) => handleChange('assetTag', e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => handleChange('category', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {ASSET_CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="serial">Serial Number</Label>
                  <Input
                    id="serial"
                    value={formData.serial}
                    onChange={(e) => handleChange('serial', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="status">Status *</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => handleChange('status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {ASSET_STATUS.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Vendor & Location */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Vendor & Location</h3>

                <div>
                  <Label htmlFor="vendorId">Vendor *</Label>
                  <Select
                    value={formData.vendorId}
                    onValueChange={(value) => handleChange('vendorId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select vendor" />
                    </SelectTrigger>
                    <SelectContent>
                      {vendors?.map((vendor: any) => (
                        <SelectItem key={vendor._id} value={vendor._id}>
                          {vendor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleChange('location', e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="purchaseDate">Purchase Date</Label>
                  <Input
                    id="purchaseDate"
                    type="date"
                    value={formData.purchaseDate}
                    onChange={(e) => handleChange('purchaseDate', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="warrantyUntil">Warranty Until</Label>
                  <Input
                    id="warrantyUntil"
                    type="date"
                    value={formData.warrantyUntil}
                    onChange={(e) => handleChange('warrantyUntil', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="cost">Cost ($)</Label>
                  <Input
                    id="cost"
                    type="number"
                    step="0.01"
                    value={formData.cost}
                    onChange={(e) => handleChange('cost', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Metadata */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Technical Specifications</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="manufacturer">Manufacturer</Label>
                  <Input
                    id="manufacturer"
                    value={formData.metadata.manufacturer}
                    onChange={(e) => handleMetadataChange('manufacturer', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="model">Model</Label>
                  <Input
                    id="model"
                    value={formData.metadata.model}
                    onChange={(e) => handleMetadataChange('model', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="capacity">Capacity</Label>
                  <Input
                    id="capacity"
                    value={formData.metadata.capacity}
                    onChange={(e) => handleMetadataChange('capacity', e.target.value)}
                    placeholder="e.g., 5kg, 10lbs"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/assets')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                {createMutation.isPending || updateMutation.isPending
                  ? 'Saving...'
                  : isEdit
                  ? 'Update Asset'
                  : 'Create Asset'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};