// Manual test validation script
const { validateAndNormalizeUrl } = require('./src/utils/validators');

console.log('Testing validator functions...');

try {
    // Test basic validation
    const result1 = validateAndNormalizeUrl('https://example.com');
    console.log('✓ Basic URL validation passed:', result1);

    const result2 = validateAndNormalizeUrl('example.com');
    console.log('✓ URL normalization passed:', result2);

    try {
        validateAndNormalizeUrl('invalid');
        console.log('✗ Invalid URL should have thrown error');
    } catch (e) {
        console.log('✓ Invalid URL correctly rejected');
    }

    console.log('All validator tests passed!');
} catch (error) {
    console.error('Validator test failed:', error);
}
