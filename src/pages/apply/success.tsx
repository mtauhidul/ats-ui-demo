import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Briefcase, CheckCircle2, Home, Mail } from "lucide-react";
import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";

export default function ApplySuccessPage() {
  const [searchParams] = useSearchParams();
  const jobTitle = searchParams.get("job") || "position";

  useEffect(() => {
    // Simple animation effect on mount
    const timer = setTimeout(() => {
      // Animation completed
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-linear-to-br from-primary/10 via-background to-primary/5 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <Card className="border-2 border-primary/20 shadow-2xl">
          <CardContent className="p-8 md:p-12 text-center">
            {/* Success Icon */}
            <div className="mb-8 relative">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse" />
                <div className="relative bg-linear-to-br from-primary to-primary/80 rounded-full p-6 shadow-xl">
                  <CheckCircle2 className="h-16 w-16 md:h-20 md:w-20 text-white" />
                </div>
              </div>
            </div>

            {/* Success Message */}
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Application Submitted!
            </h1>
            <p className="text-lg text-muted-foreground mb-2">
              Thank you for applying for
            </p>
            <p className="text-xl md:text-2xl font-semibold text-primary mb-8">
              {jobTitle}
            </p>

            {/* Info Card */}
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 mb-8 text-left">
              <div className="flex items-start gap-3 mb-4">
                <Mail className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <h3 className="font-semibold text-foreground mb-1">
                    Check Your Email
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    We've sent a confirmation email with your application
                    details. Our team will review your application and get back
                    to you soon.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Briefcase className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <h3 className="font-semibold text-foreground mb-1">
                    What's Next?
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Our recruitment team typically reviews applications within
                    3-5 business days. If your skills match our requirements,
                    we'll reach out to schedule an interview.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild size="lg">
                <Link to="/">
                  <Home className="h-4 w-4 mr-2" />
                  Back to Home
                </Link>
              </Button>
            </div>

            {/* Additional Info */}
            <p className="text-xs text-muted-foreground mt-8">
              Application ID:{" "}
              {Math.random().toString(36).substring(2, 10).toUpperCase()}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
