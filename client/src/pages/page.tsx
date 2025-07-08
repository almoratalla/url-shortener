import { UrlShortenerForm } from "@/components/url-shortener-form";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

export default function HomePage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
            <div className="container px-4 py-8 mx-auto">
                <div className="max-w-2xl mx-auto">
                    <div className="mb-8 text-center">
                        <h1 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white">
                            URL Shortener
                        </h1>
                        <p className="text-lg text-gray-600 dark:text-gray-300">
                            Transform long URLs into short, shareable links with
                            advanced tracking
                        </p>
                    </div>

                    <Card className="shadow-xl">
                        <CardHeader>
                            <CardTitle>Create Short Link</CardTitle>
                            <CardDescription>
                                Enter a long URL to generate a shortened version
                                with optional tracking parameters
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <UrlShortenerForm />
                        </CardContent>
                    </Card>

                    <div className="mt-8 text-sm text-center text-gray-500 dark:text-gray-400">
                        <p>
                            All shortened URLs are stored securely and can be
                            set to expire automatically
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
