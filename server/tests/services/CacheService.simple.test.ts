import { CacheService } from "../../src/services/CacheService";

describe("Simple Cache Test", () => {
    it("should work", () => {
        const cache = new CacheService<string>(3, 1);
        cache.set("key1", "value1");
        expect(cache.get("key1")).toBe("value1");
        console.log("✅ Cache basic test passed");
    });
});
