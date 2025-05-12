import PageHeader from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  return (
    <>
      <PageHeader 
        title="Settings"
        description="Configure your application settings and integrations."
      />
      <div className="grid gap-6 max-w-2xl">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Update your personal or company details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="companyName">Company Name</Label>
              <Input id="companyName" defaultValue="My DevOps Co." />
            </div>
            <div className="space-y-1">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" defaultValue="admin@mydevops.co" />
            </div>
            <Button>Save Profile</Button>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Payment Gateway</CardTitle>
            <CardDescription>Connect your Razorpay account.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="razorpayKeyId">Razorpay Key ID</Label>
              <Input id="razorpayKeyId" placeholder="rzp_live_********" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="razorpayKeySecret">Razorpay Key Secret</Label>
              <Input id="razorpayKeySecret" type="password" placeholder="****************" />
            </div>
            <Button>Save Razorpay Settings</Button>
            <p className="text-xs text-muted-foreground">
              These settings are for demonstration purposes and are not functional.
            </p>
          </CardContent>
        </Card>
         <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Theme</CardTitle>
            <CardDescription>Customize the look and feel of the application.</CardDescription>
          </CardHeader>
          <CardContent>
             <p className="text-muted-foreground">Theme customization options coming soon.</p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
