/**
 * Generates a custom customer ID based on outlet category and location.
 * Format: [CategoryCode]-[PlaceCode]-[Number]
 * Example: HP-TVL-001 (HyperPharmacy-Thiruvalla-001)
 */
export function generateCustomerId(outletName: string, count: number): string {
    // Default values if name is simple
    let categoryCode = 'OT'; // Other
    let placeCode = 'LOC';   // Location

    const words = outletName.split(' ');

    // 1. Determine Category Code
    // Looking for keywords like "HyperPharmacy", "SmartClinic", "Pharmacy", "Clinic"
    const lowerName = outletName.toLowerCase();
    if (lowerName.includes('hyper')) {
        categoryCode = 'HP';
    } else if (lowerName.includes('clinic')) {
        categoryCode = 'SC';
    } else if (lowerName.includes('pharmacy')) {
        categoryCode = 'PH';
    } else if (lowerName.includes('store')) {
        categoryCode = 'ST';
    }

    // 2. Determine Place Code
    // Usually the last word is the location
    if (words.length > 0) {
        const place = words[words.length - 1];
        // Take first 3 letters, uppercase
        placeCode = place.substring(0, 3).toUpperCase();
    }

    // 3. Format Number (3 digits)
    const sequenceNumber = String(count + 1).padStart(3, '0');

    return `${categoryCode}-${placeCode}-${sequenceNumber}`;
}
