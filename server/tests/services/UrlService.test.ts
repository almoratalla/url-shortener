import { UrlService } from "../../src/services/UrlService";

// Mock the database
jest.mock("../../src/db/knex", () => ({
    db: jest.fn(),
}));

// Mock the utilities
jest.mock("../../src/utils/urlGenerator", () => ({
    generateUniqueShortCode: jest.fn(),
    validateCustomSlug: jest.fn(),
    buildUtmUrl: jest.fn(),
}));

jest.mock("../../src/utils/validators", () => ({
    validateAndNormalizeUrl: jest.fn(),
    validateExpirationDate: jest.fn(),
    validateUtmParams: jest.fn(),
    isUrlExpired: jest.fn(),
}));

describe("UrlService", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("createShortUrl", () => {
        it("should be defined", () => {
            expect(UrlService.createShortUrl).toBeDefined();
        });
    });

    describe("getAllUrls", () => {
        it("should be defined", () => {
            expect(UrlService.getAllUrls).toBeDefined();
        });
    });

    describe("deleteUrl", () => {
        it("should be defined", () => {
            expect(UrlService.deleteUrl).toBeDefined();
        });
    });

    describe("handleRedirect", () => {
        it("should be defined", () => {
            expect(UrlService.handleRedirect).toBeDefined();
        });
    });

    describe("getUrlAnalytics", () => {
        it("should be defined", () => {
            expect(UrlService.getUrlAnalytics).toBeDefined();
        });
    });
});
