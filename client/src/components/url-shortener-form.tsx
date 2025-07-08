import React, { useState } from "react";
import { Zap, Settings, Calendar, Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { shortenUrl, validateUtmParams } from "@/services/api";
import { UtmPresets } from "@/components/utm-presets";

interface ShortenedResult {
    shortUrl: string;
    originalUrl: string;
    shortCode: string;
    expiresAt?: string;
}

function buildUtmString(params: {
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_term?: string;
    utm_content?: string;
}) {
    const searchParams = new URLSearchParams();
    for (const key in params) {
        if (params[key as keyof typeof params]) {
            searchParams.append(key, params[key as keyof typeof params]!);
        }
    }
    return searchParams.toString();
}

export function UrlShortenerForm() {
    const [url, setUrl] = useState("");
    const [customSlug, setCustomSlug] = useState("");
    const [expirationDate, setExpirationDate] = useState("");
    const [expirationTime, setExpirationTime] = useState("");
    const [utmSource, setUtmSource] = useState("");
    const [utmMedium, setUtmMedium] = useState("");
    const [utmCampaign, setUtmCampaign] = useState("");
    const [utmTerm, setUtmTerm] = useState("");
    const [utmContent, setUtmContent] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<ShortenedResult | null>(null);
    const [showAdvanced, setShowAdvanced] = useState(false);

    const isValidUrl = (url: string) => {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    };

    const handleUtmPresetSelect = (values: {
        utm_source: string;
        utm_medium: string;
        utm_campaign: string;
        utm_term?: string;
        utm_content?: string;
    }) => {
        setUtmSource(values.utm_source || "");
        setUtmMedium(values.utm_medium || "");
        setUtmCampaign(values.utm_campaign || "");
        setUtmTerm(values.utm_term || "");
        setUtmContent(values.utm_content || "");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!url.trim()) {
            toast.error("Please enter a URL to shorten");
            return;
        }

        if (!isValidUrl(url)) {
            toast.error("Please enter a valid URL");
            return;
        }

        setIsLoading(true);

        try {
            const utmParams = {
                utm_source: utmSource,
                utm_medium: utmMedium,
                utm_campaign: utmCampaign,
                utm_term: utmTerm,
                utm_content: utmContent,
            };

            // Validate UTM parameters
            const utmValidation = validateUtmParams(utmParams);
            if (!utmValidation.isValid) {
                toast.error(
                    `UTM Parameters Error: ${utmValidation.errors.join(", ")}`
                );
                setIsLoading(false);
                return;
            }

            // Build the final URL with UTM parameters
            let finalUrl = url;
            const utmString = buildUtmString(utmParams);
            if (utmString) {
                finalUrl += (url.includes("?") ? "&" : "?") + utmString;
            }

            // Prepare expiration date
            let expiresAt: Date | undefined;
            if (expirationDate) {
                const dateTime = expirationTime
                    ? `${expirationDate}T${expirationTime}:00.000Z`
                    : `${expirationDate}T23:59:59.999Z`;
                expiresAt = new Date(dateTime);
            }

            const data = await shortenUrl({
                url: finalUrl,
                customSlug,
                expiresAt,
            });

            // Handle API errors
            if (!data.success) {
                const errorMessage = data.error || "Failed to shorten URL";

                // Provide more specific error messages for common cases
                if (
                    errorMessage
                        .toLowerCase()
                        .includes("custom slug already exists")
                ) {
                    toast.error(
                        `The custom slug "${customSlug}" is already in use. Please choose a different one.`
                    );
                } else if (errorMessage.toLowerCase().includes("invalid url")) {
                    toast.error(
                        "Please enter a valid URL starting with http:// or https://"
                    );
                } else if (errorMessage.toLowerCase().includes("expired")) {
                    toast.error("The expiration date must be in the future.");
                } else {
                    toast.error(errorMessage);
                }
                return;
            }

            if (!data.data) {
                toast.error("Invalid response from server");
                return;
            }

            // Validate the shortCode before setting it
            const shortCode = data.data.shortCode;

            if (
                !shortCode ||
                typeof shortCode !== "string" ||
                shortCode === "[object Object]"
            ) {
                toast.error("Received invalid short code from server");
                return;
            }

            setResult({
                shortUrl: data.data.shortUrl,
                originalUrl: finalUrl,
                shortCode: shortCode,
                expiresAt: data.data.expiresAt,
            });

            toast.success("Your URL has been shortened successfully!");
        } catch (error) {
            toast.error(
                error instanceof Error ? error.message : "Failed to shorten URL"
            );
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            toast.success("URL copied to clipboard");
        } catch {
            toast.error("Failed to copy URL");
        }
    };

    const resetForm = () => {
        setUrl("");
        setCustomSlug("");
        setExpirationDate("");
        setExpirationTime("");
        setUtmSource("");
        setUtmMedium("");
        setUtmCampaign("");
        setUtmTerm("");
        setUtmContent("");
        setResult(null);
        setShowAdvanced(false);
    };

    return (
        <div className="w-full max-w-2xl mx-auto space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Zap className="w-5 h-5" />
                        URL Shortener
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="url">URL to shorten</Label>
                            <Input
                                id="url"
                                type="url"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="https://example.com"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="customSlug">
                                Custom Short Code (optional)
                            </Label>
                            <Input
                                id="customSlug"
                                value={customSlug}
                                onChange={(e) => setCustomSlug(e.target.value)}
                                placeholder="my-custom-link"
                            />
                        </div>

                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className="w-full"
                        >
                            <Settings className="w-4 h-4 mr-2" />
                            {showAdvanced ? "Hide" : "Show"} Advanced Options
                        </Button>

                        {showAdvanced && (
                            <div className="pt-4 space-y-4 border-t">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="expirationDate">
                                            Expiration Date
                                        </Label>
                                        <Input
                                            id="expirationDate"
                                            type="date"
                                            value={expirationDate}
                                            onChange={(e) =>
                                                setExpirationDate(
                                                    e.target.value
                                                )
                                            }
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="expirationTime">
                                            Expiration Time
                                        </Label>
                                        <Input
                                            id="expirationTime"
                                            type="time"
                                            value={expirationTime}
                                            onChange={(e) =>
                                                setExpirationTime(
                                                    e.target.value
                                                )
                                            }
                                        />
                                    </div>
                                </div>

                                <Separator />

                                <div className="space-y-4">
                                    <Label>UTM Parameters</Label>
                                    <UtmPresets
                                        onSelectPreset={handleUtmPresetSelect}
                                    />

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="utmSource">
                                                UTM Source
                                            </Label>
                                            <Input
                                                id="utmSource"
                                                value={utmSource}
                                                onChange={(e) =>
                                                    setUtmSource(e.target.value)
                                                }
                                                placeholder="google"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="utmMedium">
                                                UTM Medium
                                            </Label>
                                            <Input
                                                id="utmMedium"
                                                value={utmMedium}
                                                onChange={(e) =>
                                                    setUtmMedium(e.target.value)
                                                }
                                                placeholder="email"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="utmCampaign">
                                            UTM Campaign
                                        </Label>
                                        <Input
                                            id="utmCampaign"
                                            value={utmCampaign}
                                            onChange={(e) =>
                                                setUtmCampaign(e.target.value)
                                            }
                                            placeholder="summer_sale"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="utmTerm">
                                                UTM Term
                                            </Label>
                                            <Input
                                                id="utmTerm"
                                                value={utmTerm}
                                                onChange={(e) =>
                                                    setUtmTerm(e.target.value)
                                                }
                                                placeholder="running+shoes"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="utmContent">
                                                UTM Content
                                            </Label>
                                            <Input
                                                id="utmContent"
                                                value={utmContent}
                                                onChange={(e) =>
                                                    setUtmContent(
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="logolink"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full"
                        >
                            {isLoading ? "Shortening..." : "Shorten URL"}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {result && (
                <Card>
                    <CardHeader>
                        <CardTitle>Your Shortened URL</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Input
                                value={result.shortUrl}
                                readOnly
                                className="flex-1"
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => copyToClipboard(result.shortUrl)}
                            >
                                <Copy className="w-4 h-4" />
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    window.open(result.shortUrl, "_blank")
                                }
                            >
                                <ExternalLink className="w-4 h-4" />
                            </Button>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Badge variant="secondary">
                                {result.shortCode}
                            </Badge>
                            {result.expiresAt && (
                                <Badge
                                    variant="outline"
                                    className="flex items-center gap-1"
                                >
                                    <Calendar className="w-3 h-3" />
                                    Expires:{" "}
                                    {new Date(
                                        result.expiresAt
                                    ).toLocaleDateString()}
                                </Badge>
                            )}
                        </div>

                        <div className="text-sm text-gray-500">
                            <strong>Original URL:</strong> {result.originalUrl}
                        </div>

                        <Button
                            type="button"
                            variant="outline"
                            onClick={resetForm}
                            className="w-full"
                        >
                            Create Another
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
