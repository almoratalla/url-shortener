// API service for URL shortener
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export interface ShortenUrlRequest {
    url: string;
    customSlug?: string;
    expiresAt?: Date;
    utmParams?: string;
}

export interface ShortenUrlResponse {
    shortUrl: string;
    originalUrl: string;
    shortCode: string;
    expiresAt?: string;
}

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}

export async function shortenUrl(
    request: ShortenUrlRequest
): Promise<ApiResponse<ShortenUrlResponse>> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/shorten`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                originalUrl: request.url,
                customSlug: request.customSlug,
                expirationDate: request.expiresAt?.toISOString(),
                utmParams: request.utmParams,
            }),
        });

        if (!response.ok) {
            const errorData = await response
                .json()
                .catch(() => ({ message: "Unknown error" }));
            return {
                success: false,
                error:
                    errorData.error ||
                    errorData.message ||
                    `HTTP ${response.status}: ${response.statusText}`,
            };
        }

        const responseData = await response.json();

        // Handle the nested response structure from the backend
        const data = responseData.data || responseData;

        return {
            success: true,
            data: {
                shortUrl: data.shortUrl || `${API_BASE_URL}/${data.shortCode}`,
                originalUrl: data.originalUrl,
                shortCode: data.shortCode,
                expiresAt: data.expirationDate,
            },
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Network error",
        };
    }
}

export function validateUtmParams(params: {
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_term?: string;
    utm_content?: string;
}): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check for invalid characters in UTM parameters
    const invalidChars = /[<>'"]/;

    Object.entries(params).forEach(([key, value]) => {
        if (value && invalidChars.test(value)) {
            errors.push(`${key} contains invalid characters`);
        }
        if (value && value.length > 255) {
            errors.push(`${key} is too long (max 255 characters)`);
        }
    });

    return {
        isValid: errors.length === 0,
        errors,
    };
}

export interface RedirectResponse {
    redirectUrl: string;
    shortCode: string;
}

export async function getRedirectInfo(
    shortCode: string
): Promise<ApiResponse<RedirectResponse>> {
    try {
        // Validate shortCode before making the request
        if (
            !shortCode ||
            typeof shortCode !== "string" ||
            shortCode.trim() === ""
        ) {
            return {
                success: false,
                error: "Invalid short code provided",
            };
        }

        // Clean the shortCode of any unwanted characters
        const cleanShortCode = shortCode.trim();

        if (cleanShortCode === "[object Object]") {
            return {
                success: false,
                error: "Invalid short code format",
            };
        }

        const response = await fetch(
            `${API_BASE_URL}/api/redirect/${cleanShortCode}`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );

        if (!response.ok) {
            const errorData = await response
                .json()
                .catch(() => ({ message: "Unknown error" }));
            return {
                success: false,
                error:
                    errorData.error ||
                    errorData.message ||
                    `HTTP ${response.status}: ${response.statusText}`,
            };
        }

        const responseData = await response.json();

        // The backend returns { success: true, data: { redirectUrl: "...", shortCode: "..." } }
        // So we want to return responseData.data directly
        return {
            success: true,
            data: responseData.data,
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Network error",
        };
    }
}
