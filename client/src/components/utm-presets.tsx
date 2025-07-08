"use client";

import type React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Share2, MousePointer, Search, Megaphone } from "lucide-react";

interface UtmPreset {
    name: string;
    description: string;
    icon: React.ReactNode;
    values: {
        utm_source: string;
        utm_medium: string;
        utm_campaign: string;
        utm_term?: string;
        utm_content?: string;
    };
}

interface UtmPresetsProps {
    onSelectPreset: (values: UtmPreset["values"]) => void;
}

const presets: UtmPreset[] = [
    {
        name: "Email Newsletter",
        description: "Track clicks from email campaigns",
        icon: <Mail className="w-4 h-4" />,
        values: {
            utm_source: "newsletter",
            utm_medium: "email",
            utm_campaign: "weekly_digest",
        },
    },
    {
        name: "Social Media",
        description: "Track social media posts",
        icon: <Share2 className="w-4 h-4" />,
        values: {
            utm_source: "facebook",
            utm_medium: "social",
            utm_campaign: "product_announcement",
        },
    },
    {
        name: "Google Ads",
        description: "Track paid search campaigns",
        icon: <Search className="w-4 h-4" />,
        values: {
            utm_source: "google",
            utm_medium: "cpc",
            utm_campaign: "brand_keywords",
            utm_term: "your_brand_name",
        },
    },
    {
        name: "Display Banner",
        description: "Track banner advertisements",
        icon: <MousePointer className="w-4 h-4" />,
        values: {
            utm_source: "partner_site",
            utm_medium: "banner",
            utm_campaign: "summer_promo",
            utm_content: "header_banner",
        },
    },
    {
        name: "PR Campaign",
        description: "Track press releases and PR",
        icon: <Megaphone className="w-4 h-4" />,
        values: {
            utm_source: "press_release",
            utm_medium: "pr",
            utm_campaign: "product_launch",
        },
    },
];

export function UtmPresets({ onSelectPreset }: UtmPresetsProps) {
    return (
        <Card className="border-blue-200 border-dashed dark:border-blue-800">
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    Quick UTM Presets
                </CardTitle>
                <p className="text-xs text-blue-600 dark:text-blue-400">
                    Click any preset to auto-fill UTM parameters for common use
                    cases
                </p>
            </CardHeader>
            <CardContent className="space-y-2">
                {presets.map((preset, index) => (
                    <Button
                        key={index}
                        variant="ghost"
                        size="sm"
                        onClick={() => onSelectPreset(preset.values)}
                        className="justify-start w-full h-auto p-3 text-left hover:bg-blue-50 dark:hover:bg-blue-950"
                    >
                        <div className="flex items-start w-full gap-3">
                            <div className="text-blue-600 dark:text-blue-400 mt-0.5">
                                {preset.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm font-medium">
                                        {preset.name}
                                    </span>
                                    <Badge
                                        variant="secondary"
                                        className="text-xs"
                                    >
                                        {Object.keys(preset.values).length}{" "}
                                        params
                                    </Badge>
                                </div>
                                <p className="mb-2 text-xs text-gray-600 dark:text-gray-400">
                                    {preset.description}
                                </p>
                                <div className="flex flex-wrap gap-1">
                                    {Object.entries(preset.values).map(
                                        ([key, value]) => (
                                            <Badge
                                                key={key}
                                                variant="outline"
                                                className="font-mono text-xs"
                                            >
                                                {key}={value}
                                            </Badge>
                                        )
                                    )}
                                </div>
                            </div>
                        </div>
                    </Button>
                ))}
            </CardContent>
        </Card>
    );
}
