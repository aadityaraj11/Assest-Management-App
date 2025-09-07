import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Settings, User, Shield, Bell, Database } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export const SettingsPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  const { data: userProfile } = useQuery({
    queryKey: ['user-profile'],
    queryFn: () => api.getUserProfile(),
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: any) => api.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      setIsUpdatingProfile(false);
      toast({ title: 'Profile updated successfully' });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Failed to update profile', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });

  const handleUpdateProfile = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const updateData: any = {
      name: formData.get('name'),
      phone: formData.get('phone') || undefined,
      department: formData.get('department') || undefined,
    };
    
    updateProfileMutation.mutate(updateData);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Settings
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage your account and application preferences
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {!isUpdatingProfile ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Name</Label>
                      <p className="text-lg">{userProfile?.name || user?.name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                      <p className="text-lg">{userProfile?.email || user?.email}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Role</Label>
                      <p className="text-lg capitalize">{userProfile?.role || user?.role}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Phone</Label>
                      <p className="text-lg">{userProfile?.phone || user?.phone || 'Not provided'}</p>
                    </div>
                    <div className="col-span-2">
                      <Label className="text-sm font-medium text-muted-foreground">Department</Label>
                      <p className="text-lg">{userProfile?.department || user?.department || 'Not specified'}</p>
                    </div>
                  </div>
                  <Button onClick={() => setIsUpdatingProfile(true)}>
                    Edit Profile
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Name</Label>
                      <Input 
                        name="name" 
                        defaultValue={userProfile?.name || user?.name} 
                        required 
                      />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input 
                        value={userProfile?.email || user?.email} 
                        disabled 
                        className="bg-muted"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Email cannot be changed
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input 
                        name="phone" 
                        type="tel"
                        defaultValue={userProfile?.phone || user?.phone || ''} 
                      />
                    </div>
                    <div>
                      <Label htmlFor="department">Department</Label>
                      <Input 
                        name="department" 
                        defaultValue={userProfile?.department || user?.department || ''} 
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={updateProfileMutation.isPending}>
                      {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsUpdatingProfile(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Change Password</h3>
                <form className="space-y-4">
                  <div>
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input name="currentPassword" type="password" />
                  </div>
                  <div>
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input name="newPassword" type="password" />
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input name="confirmPassword" type="password" />
                  </div>
                  <Button type="submit">Change Password</Button>
                </form>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-4">Session Management</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Current Session</p>
                      <p className="text-sm text-muted-foreground">
                        This device • Active now
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      End Session
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Maintenance Reminders</p>
                    <p className="text-sm text-muted-foreground">
                      Get notified about upcoming maintenance schedules
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Configure
                  </Button>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Asset Assignments</p>
                    <p className="text-sm text-muted-foreground">
                      Notifications when assets are assigned to you
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Configure
                  </Button>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Warranty Expiry</p>
                    <p className="text-sm text-muted-foreground">
                      Alerts for assets with expiring warranties
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Configure
                  </Button>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">System Updates</p>
                    <p className="text-sm text-muted-foreground">
                      Important system announcements and updates
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Configure
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                System Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Application Version</Label>
                  <p className="text-lg">v1.0.0</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Database Status</Label>
                  <p className="text-lg text-success">Connected</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Last Backup</Label>
                  <p className="text-lg">Today, 3:00 AM</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Server Status</Label>
                  <p className="text-lg text-success">Online</p>
                </div>
              </div>

              {user?.role === 'admin' && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Administrative Actions</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Export System Data</p>
                          <p className="text-sm text-muted-foreground">
                            Download a complete backup of all system data
                          </p>
                        </div>
                        <Button variant="outline">
                          Export Data
                        </Button>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">System Logs</p>
                          <p className="text-sm text-muted-foreground">
                            View detailed system activity logs
                          </p>
                        </div>
                        <Button variant="outline">
                          View Logs
                        </Button>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Cache Management</p>
                          <p className="text-sm text-muted-foreground">
                            Clear system cache to improve performance
                          </p>
                        </div>
                        <Button variant="outline">
                          Clear Cache
                        </Button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};