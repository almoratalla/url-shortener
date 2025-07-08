import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, Database, Zap, TrendingUp } from "lucide-react";

interface CacheStats {
    cachePerformance: {
        url: {
            hitRate: string;
            hits: number;
            misses: number;
            totalRequests: number;
            redisConnected: boolean;
            fallbackActive: boolean;
        };
        redirect: {
            hitRate: string;
            hits: number;
            misses: number;
            totalRequests: number;
            redisConnected: boolean;
            fallbackActive: boolean;
        };
        analytics: {
            hitRate: string;
            hits: number;
            misses: number;
            totalRequests: number;
            redisConnected: boolean;
            fallbackActive: boolean;
        };
    };
    requestPatterns: {
        totalPatterns: number;
        hotUrls: number;
        slowUrls: number;
        patterns: Array<{
            shortCode: string;
            requestCount: number;
            lastAccessed: number;
            avgResponseTime: number;
        }>;
    };
    timestamp: string;
}

export default function CacheStatsPage() {
    const [stats, setStats] = useState<CacheStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [autoRefresh, setAutoRefresh] = useState(false);
    const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds default

    const fetchStats = async () => {
        try {
            setLoading(true);
            const response = await fetch(
                "http://localhost:8000/api/cache-stats"
            );

            if (!response.ok) {
                throw new Error("Failed to fetch cache stats");
            }

            const data = await response.json();
            setStats(data.data);
            setError(null);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Failed to fetch stats"
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();

        let interval: NodeJS.Timeout | null = null;

        if (autoRefresh) {
            interval = setInterval(fetchStats, refreshInterval);
        }

        return () => {
            if (interval) {
                clearInterval(interval);
            }
        };
    }, [autoRefresh, refreshInterval]);

    if (loading && !stats) {
        return (
            <div className="min-h-screen p-8 bg-gray-50">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center">
                        Loading cache statistics...
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen p-8 bg-gray-50">
                <div className="max-w-6xl mx-auto">
                    <Card>
                        <CardContent className="p-8 text-center">
                            <p className="text-red-600">Error: {error}</p>
                            <Button onClick={fetchStats} className="mt-4">
                                Retry
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    if (!stats) return null;

    const getCacheStatusBadge = (connected: boolean, fallback: boolean) => {
        if (connected && !fallback) {
            return <Badge className="bg-green-500">Redis Active</Badge>;
        } else if (fallback) {
            return <Badge variant="secondary">In-Memory Fallback</Badge>;
        } else {
            return <Badge variant="destructive">Disconnected</Badge>;
        }
    };

    const getHitRateColor = (hitRate: string) => {
        const rate = parseFloat(hitRate);
        if (rate >= 80) return "text-green-600";
        if (rate >= 60) return "text-yellow-600";
        return "text-red-600";
    };

    return (
        <div className="min-h-screen p-8 bg-gray-50">
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold">
                        Cache Performance Dashboard
                    </h1>
                    <div className="flex items-center gap-4">
                        <Badge variant="outline">
                            Last Updated:{" "}
                            {new Date(stats.timestamp).toLocaleTimeString()}
                        </Badge>

                        {/* Auto-refresh controls */}
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium">
                                Auto-refresh:
                            </label>
                            <Button
                                variant={autoRefresh ? "default" : "outline"}
                                size="sm"
                                onClick={() => setAutoRefresh(!autoRefresh)}
                            >
                                {autoRefresh ? "ON" : "OFF"}
                            </Button>
                            {autoRefresh && (
                                <select
                                    className="px-2 py-1 text-sm border rounded"
                                    value={refreshInterval}
                                    onChange={(e) =>
                                        setRefreshInterval(
                                            Number(e.target.value)
                                        )
                                    }
                                >
                                    <option value={10000}>10s</option>
                                    <option value={30000}>30s</option>
                                    <option value={60000}>1m</option>
                                    <option value={300000}>5m</option>
                                </select>
                            )}
                        </div>

                        <Button onClick={fetchStats} size="sm">
                            <Activity className="w-4 h-4 mr-2" />
                            Refresh
                        </Button>
                    </div>
                </div>

                {/* Cache Performance Overview */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    {/* URL Cache */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <Database className="w-5 h-5" />
                                URL Cache
                            </CardTitle>
                            {getCacheStatusBadge(
                                stats.cachePerformance.url.redisConnected,
                                stats.cachePerformance.url.fallbackActive
                            )}
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <div
                                    className={`text-3xl font-bold ${getHitRateColor(
                                        stats.cachePerformance.url.hitRate
                                    )}`}
                                >
                                    {stats.cachePerformance.url.hitRate}
                                </div>
                                <div className="text-sm text-gray-600">
                                    {stats.cachePerformance.url.hits} hits /{" "}
                                    {stats.cachePerformance.url.totalRequests}{" "}
                                    requests
                                </div>
                                <div className="text-xs text-gray-500">
                                    {stats.cachePerformance.url.misses} misses
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Redirect Cache */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <Zap className="w-5 h-5" />
                                Redirect Cache
                            </CardTitle>
                            {getCacheStatusBadge(
                                stats.cachePerformance.redirect.redisConnected,
                                stats.cachePerformance.redirect.fallbackActive
                            )}
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <div
                                    className={`text-3xl font-bold ${getHitRateColor(
                                        stats.cachePerformance.redirect.hitRate
                                    )}`}
                                >
                                    {stats.cachePerformance.redirect.hitRate}
                                </div>
                                <div className="text-sm text-gray-600">
                                    {stats.cachePerformance.redirect.hits} hits
                                    /{" "}
                                    {
                                        stats.cachePerformance.redirect
                                            .totalRequests
                                    }{" "}
                                    requests
                                </div>
                                <div className="text-xs text-gray-500">
                                    {stats.cachePerformance.redirect.misses}{" "}
                                    misses
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Analytics Cache */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="w-5 h-5" />
                                Analytics Cache
                            </CardTitle>
                            {getCacheStatusBadge(
                                stats.cachePerformance.analytics.redisConnected,
                                stats.cachePerformance.analytics.fallbackActive
                            )}
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <div
                                    className={`text-3xl font-bold ${getHitRateColor(
                                        stats.cachePerformance.analytics.hitRate
                                    )}`}
                                >
                                    {stats.cachePerformance.analytics.hitRate}
                                </div>
                                <div className="text-sm text-gray-600">
                                    {stats.cachePerformance.analytics.hits} hits
                                    /{" "}
                                    {
                                        stats.cachePerformance.analytics
                                            .totalRequests
                                    }{" "}
                                    requests
                                </div>
                                <div className="text-xs text-gray-500">
                                    {stats.cachePerformance.analytics.misses}{" "}
                                    misses
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Request Patterns */}
                <Card>
                    <CardHeader>
                        <CardTitle>Request Patterns & Intelligence</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-4 mb-6 md:grid-cols-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600">
                                    {stats.requestPatterns.totalPatterns}
                                </div>
                                <div className="text-sm text-gray-600">
                                    Total Patterns
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-600">
                                    {stats.requestPatterns.hotUrls}
                                </div>
                                <div className="text-sm text-gray-600">
                                    Hot URLs
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-red-600">
                                    {stats.requestPatterns.slowUrls}
                                </div>
                                <div className="text-sm text-gray-600">
                                    Slow URLs
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-purple-600">
                                    {stats.requestPatterns.patterns.length}
                                </div>
                                <div className="text-sm text-gray-600">
                                    Top Patterns
                                </div>
                            </div>
                        </div>

                        {/* Top Request Patterns */}
                        {stats.requestPatterns.patterns.length > 0 && (
                            <div>
                                <h4 className="mb-3 font-semibold">
                                    Most Accessed URLs
                                </h4>
                                <div className="space-y-2">
                                    {stats.requestPatterns.patterns.map(
                                        (pattern) => (
                                            <div
                                                key={pattern.shortCode}
                                                className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <code className="px-2 py-1 text-sm bg-gray-200 rounded">
                                                        {pattern.shortCode}
                                                    </code>
                                                    <Badge variant="outline">
                                                        {pattern.requestCount}{" "}
                                                        requests
                                                    </Badge>
                                                </div>
                                                <div className="text-sm text-right text-gray-600">
                                                    <div>
                                                        Avg:{" "}
                                                        {pattern.avgResponseTime.toFixed(
                                                            0
                                                        )}
                                                        ms
                                                    </div>
                                                    <div>
                                                        {new Date(
                                                            pattern.lastAccessed
                                                        ).toLocaleTimeString()}
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
