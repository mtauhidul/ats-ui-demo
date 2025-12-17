import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, Save, Mail } from 'lucide-react';
import { authenticatedFetch } from '@/lib/authenticated-fetch';
import { API_BASE_URL } from '@/config/api';

interface EmailSettings {
  fromEmail: string;
  fromName: string;
}

export function EmailConfigurationSettings() {
  const [settings, setSettings] = useState<EmailSettings>({
    fromEmail: '',
    fromName: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await authenticatedFetch(`${API_BASE_URL}/email-settings`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch email settings');
      }

      const data = await response.json();
      setSettings({
        fromEmail: data.fromEmail || '',
        fromName: data.fromName || '',
      });
    } catch (error) {
      toast.error('Failed to load email settings');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings.fromEmail || !settings.fromName) {
      toast.error('Please fill in all fields');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(settings.fromEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    try {
      setSaving(true);
      const response = await authenticatedFetch(`${API_BASE_URL}/email-settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error('Failed to update email settings');
      }

      toast.success('Email settings updated successfully');
    } catch (error) {
      toast.error('Failed to save email settings');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-primary/10 p-2">
            <Mail className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>Email Configuration</CardTitle>
            <CardDescription>
              Configure the default sender email and name for outbound communications
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fromEmail">From Email Address</Label>
            <Input
              id="fromEmail"
              type="email"
              placeholder="hello@yourcompany.com"
              value={settings.fromEmail}
              onChange={(e) => setSettings({ ...settings, fromEmail: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              This email will be used as the sender for all outbound emails. Make sure this domain is verified in your Resend account.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fromName">From Name</Label>
            <Input
              id="fromName"
              type="text"
              placeholder="Your Company Name"
              value={settings.fromName}
              onChange={(e) => setSettings({ ...settings, fromName: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              This name will appear as the sender name in recipient inboxes.
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/20 p-4">
          <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
            Important Notes:
          </h4>
          <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
            <li>Only emails sent from or received by this email address will be stored in the system</li>
            <li>The email hub will only display communications associated with this address</li>
            <li>Make sure the domain is verified in your Resend account before saving</li>
            <li>Changes will apply to all new emails sent after saving</li>
          </ul>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={fetchSettings} disabled={saving}>
            Reset
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
