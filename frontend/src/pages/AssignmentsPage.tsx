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
import { Search, Plus, Calendar, User, Package, ArrowLeft, AlertTriangle } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface Assignment {
  _id: string;
  assetId: { 
    _id: string;
    name: string;
    assetTag: string;
    category: string;
  } | null; // Allow assetId to be null
  userId: {
    _id: string;
    name: string;
    email: string;
  } | null; // Allow userId to be null
  assignedAt: string;
  dueDate: string;
  returnedAt?: string;
  status: 'active' | 'returned';
  notes: string;
}

export const AssignmentsPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);

  const { data: assignments, isLoading } = useQuery({
    queryKey: ['assignments', statusFilter],
    queryFn: () => api.getAssignments({ 
      ...(statusFilter && statusFilter !== 'all' && { status: statusFilter })
    }),
  });

  const { data: assets } = useQuery({
    queryKey: ['assets-available'],
    queryFn: () => api.getAssets({ status: 'available' }),
    enabled: isCreateDialogOpen,
  });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.getUsers(),
    enabled: isCreateDialogOpen && (user?.role === 'admin' || user?.role === 'ops'),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.createAssignment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      setIsCreateDialogOpen(false);
      toast({ title: 'Assignment created successfully' });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Failed to create assignment', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });

  const returnMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => 
      api.returnAssignment(id, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      setIsReturnDialogOpen(false);
      setSelectedAssignment(null);
      toast({ title: 'Assignment returned successfully' });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Failed to return assignment', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });

  // FIXED: Filter out assignments where assetId or userId is null
  const filteredAssignments = (assignments as Assignment[])
    ?.filter((assignment: Assignment) => assignment.assetId !== null && assignment.userId !== null)
    ?.filter((assignment: Assignment) => {
      const assetName = assignment.assetId?.name?.toLowerCase() || '';
      const assetTag = assignment.assetId?.assetTag?.toLowerCase() || '';
      const userName = assignment.userId?.name?.toLowerCase() || '';
      
      return (
        assetName.includes(searchTerm.toLowerCase()) ||
        assetTag.includes(searchTerm.toLowerCase()) ||
        userName.includes(searchTerm.toLowerCase())
      );
    }) || [];

  const canCreateAssignment = user?.role === 'admin' || user?.role === 'ops';

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'returned': return 'secondary';
      default: return 'outline';
    }
  };

  const handleCreateAssignment = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createMutation.mutate({
      assetId: formData.get('assetId'),
      userId: formData.get('userId'),
      dueDate: formData.get('dueDate'),
      notes: formData.get('notes'),
    });
  };

  const handleReturnAssignment = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (selectedAssignment) {
      returnMutation.mutate({
        id: selectedAssignment._id,
        reason: formData.get('reason') as string,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="h-24 bg-muted/50" />
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
            Asset Assignments
          </h1>
          <p className="text-muted-foreground mt-2">
            Track asset assignments and responsibilities
          </p>
        </div>
        {canCreateAssignment && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Assignment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Assignment</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateAssignment} className="space-y-4">
                <div>
                  <Label htmlFor="assetId">Asset</Label>
                  <Select name="assetId" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an asset" />
                    </SelectTrigger>
                    <SelectContent>
                      {(assets as any[])?.map((asset: any) => (
                        <SelectItem key={asset._id} value={asset._id}>
                          {asset.name} ({asset.assetTag})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="userId">Assign To</Label>
                  <Select name="userId" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a user" />
                    </SelectTrigger>
                    <SelectContent>
                      {(users as any[])?.map((user: any) => (
                        <SelectItem key={user._id} value={user._id}>
                          {user.name} ({user.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input type="date" name="dueDate" required />
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea name="notes" placeholder="Assignment notes..." />
                </div>
                <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Creating...' : 'Create Assignment'}
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
            placeholder="Search assignments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="returned">Returned</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Assignments List */}
      <div className="grid gap-4">
        {filteredAssignments.map((assignment: Assignment) => (
          <Card key={assignment._id} className="hover:shadow-medium transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-full bg-primary/10">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{assignment.assetId?.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Tag: {assignment.assetId?.assetTag} • {assignment.assetId?.category}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4" />
                      {assignment.userId?.name || 'Unknown User'}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      Due: {new Date(assignment.dueDate).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getStatusVariant(assignment.status)}>
                      {assignment.status}
                    </Badge>
                    {assignment.status === 'active' && assignment.assetId && assignment.userId && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedAssignment(assignment);
                          setIsReturnDialogOpen(true);
                        }}
                      >
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Return
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              {assignment.notes && (
                <p className="mt-3 text-sm text-muted-foreground">{assignment.notes}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredAssignments.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No assignments found</h3>
            <p className="text-muted-foreground">
              {canCreateAssignment ? 'Create your first assignment to get started.' : 'No assignments match your search.'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Return Assignment Dialog */}
      <Dialog open={isReturnDialogOpen} onOpenChange={setIsReturnDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Return Assignment</DialogTitle>
          </DialogHeader>
          {selectedAssignment && (
            <form onSubmit={handleReturnAssignment} className="space-y-4">
              <div className="bg-muted p-3 rounded-lg">
                <p className="font-medium">{selectedAssignment.assetId?.name}</p>
                <p className="text-sm text-muted-foreground">
                  Assigned to: {selectedAssignment.userId?.name || 'Unknown User'}
                </p>
              </div>
              <div>
                <Label htmlFor="reason">Return Reason</Label>
                <Textarea 
                  name="reason" 
                  placeholder="Reason for returning the asset..." 
                  required 
                />
              </div>
              <Button type="submit" className="w-full" disabled={returnMutation.isPending}>
                {returnMutation.isPending ? 'Returning...' : 'Return Assignment'}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};