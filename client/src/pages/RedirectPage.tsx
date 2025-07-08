import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle } from "lucide-react";
import { getRedirectInfo } from "@/services/api";

export default function RedirectPage() {
    const params = useParams();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const handleRedirect = async () => {
            // Extract shortCode from params and validate
            let shortCode = params.shortCode;

            // If we get [object Object], try to extract the actual short code from the URL
            if (
                shortCode === "[object Object]" ||
                shortCode === "[object%20Object]"
            ) {
                const pathSegments = window.location.pathname
                    .split("/")
                    .filter(Boolean);

                // Look for a valid short code pattern in the URL segments
                for (const segment of pathSegments) {
                    if (
                        segment !== "[object%20Object]" &&
                        segment !== "[object Object]" &&
                        segment.length > 0 &&
                        !segment.includes("object")
                    ) {
                        shortCode = decodeURIComponent(segment);
                        break;
                    }
                }
            }

            // Defensive check - ensure we have a string shortCode
            if (
                !shortCode ||
                typeof shortCode !== "string" ||
                shortCode === "[object Object]" ||
                shortCode === "[object%20Object]"
            ) {
                setError(
                    "Invalid short code in URL. This appears to be a bug in the application."
                );
                setLoading(false);
                return;
            }

            try {
                const result = await getRedirectInfo(shortCode);

                if (result.success && result.data) {
                    const redirectUrl = result.data.redirectUrl;

                    // Validate that redirectUrl is a string
                    if (!redirectUrl || typeof redirectUrl !== "string") {
                        setError("Received invalid redirect URL from server");
                        setLoading(false);
                        return;
                    }

                    // Redirect to the destination URL
                    window.location.href = redirectUrl;
                    return;
                }

                // Handle error cases
                setError(result.error || "Link not found or has expired");
            } catch (err) {
                console.error("Error handling redirect:", err);
                setError("Failed to redirect. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        handleRedirect();
    }, [params]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <CardTitle className="flex items-center justify-center gap-2">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Redirecting...
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                        <p className="text-gray-600">
                            Please wait while we redirect you to your
                            destination.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <CardTitle className="flex items-center justify-center gap-2 text-red-600">
                            <AlertCircle className="w-5 h-5" />
                            Link Not Found
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-center">
                        <p className="text-gray-600">{error}</p>
                        <Button asChild className="w-full">
                            <Link to="/">← Create a new short URL</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return null;
}
