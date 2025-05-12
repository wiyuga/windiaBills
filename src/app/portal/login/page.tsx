import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default function ClientLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <Card className="w-full max-w-sm shadow-2xl">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold text-primary">TimeBill Pro</CardTitle>
          <CardDescription>Client Portal Login</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="client@example.com" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center">
              <Label htmlFor="password">Password</Label>
              <Link href="#" className="ml-auto inline-block text-sm text-primary/80 hover:text-primary underline">
                Forgot password?
              </Link>
            </div>
            <Input id="password" type="password" />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">Sign In</Button>
          <p className="text-xs text-center text-muted-foreground">
            This is a demonstration login page. Authentication is not implemented.
          </p>
           <Link href="/" className="text-sm text-primary/80 hover:text-primary underline">
            &larr; Back to Admin App
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}

// This page should ideally have its own layout, separate from the admin AppLayout.
// For simplicity, we're not creating a separate layout for /portal routes in this iteration.
// To do that, you'd create a (portal) route group with its own layout.tsx.
