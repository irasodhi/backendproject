// Intelligent Matching Algorithm Script (matching.js)
// Compares Lost & Found reports based on 6 factors:
// 1. Item Name & Brand NLP (25%)
// 2. Category & Subcategory Relationships (20%)
// 3. Campus Zone Topological Proximity (20%)
// 4. Color Ontology & Harmony (15%)
// 5. Date Temporal Decay (10%)
// 6. Description Semantic NLP & Distinct Keyword Overlap (10%)

// Recognized Brands for weighted NLP extraction
const RECOGNIZED_BRANDS = [
    "apple", "iphone", "ipad", "macbook", "airpods", "nike", "adidas", "puma",
    "dell", "xps", "hp", "lenovo", "thinkpad", "asus", "acer", "sony", "samsung",
    "galaxy", "casio", "g-shock", "fossil", "titan", "boat", "noise", "fastrack",
    "wildcraft", "skybags", "american tourister", "jbl", "oneplus", "google", "pixel",
    "kindle", "logitech", "bose", "anker", "stanley", "hydro flask", "tupperware"
];

// Common stop words to exclude during text tokenization
const STOP_WORDS = new Set([
    "a", "an", "the", "and", "or", "in", "on", "at", "to", "for", "of", "with",
    "my", "lost", "found", "near", "left", "please", "is", "was", "it", "this",
    "that", "there", "i", "me", "by", "from", "inside", "outside", "around", "has",
    "have", "had", "item", "something", "someone", "color", "brand", "model"
]);

// Campus zone topological adjacency graph
const ZONE_ADJACENCY = {
    "Library": ["Main Block", "Laboratory", "Admin Block"],
    "Main Block": ["Library", "Cafeteria", "Admin Block", "Auditorium", "Laboratory"],
    "Cafeteria": ["Main Block", "Hostel", "Sports Complex"],
    "Hostel": ["Cafeteria", "Sports Complex", "Parking"],
    "Sports Complex": ["Hostel", "Cafeteria", "Parking"],
    "Parking": ["Sports Complex", "Auditorium", "Main Block", "Hostel"],
    "Auditorium": ["Main Block", "Parking", "Admin Block"],
    "Laboratory": ["Library", "Main Block"],
    "Admin Block": ["Main Block", "Library", "Auditorium"]
};

// Related / overlapping categories mapping
const CATEGORY_CORRELATION = {
    "Wallets": ["ID Cards", "Accessories"],
    "ID Cards": ["Wallets", "Accessories", "Books"],
    "Accessories": ["Wallets", "Clothing", "Electronics"],
    "Clothing": ["Accessories", "Bags"],
    "Bags": ["Accessories", "Clothing"],
    "Electronics": ["Accessories"],
    "Books": ["ID Cards"]
};

// Extended Color Distance & Family Mapping
function getColorSimilarity(color1, color2) {
    if (!color1 || !color2) return 0.2;
    let c1 = color1.toLowerCase().trim();
    let c2 = color2.toLowerCase().trim();

    if (c1 === c2) return 1.0;

    // Direct color family pairings
    const COLOR_FAMILIES = {
        black: ["grey", "dark grey", "charcoal", "black"],
        grey: ["black", "charcoal", "silver", "white"],
        white: ["silver", "cream", "beige", "grey", "white"],
        blue: ["navy", "sky blue", "cyan", "teal", "blue"],
        red: ["maroon", "burgundy", "crimson", "pink", "rose", "red"],
        green: ["olive", "mint", "dark green", "teal", "emerald", "green"],
        brown: ["tan", "beige", "khaki", "chocolate", "brown"],
        yellow: ["gold", "orange", "mustard", "amber", "yellow"]
    };

    for (let key in COLOR_FAMILIES) {
        let fam = COLOR_FAMILIES[key];
        if (fam.includes(c1) && fam.includes(c2)) {
            return 0.75;
        }
    }

    // Cross-tone close matches
    if ((c1 === "black" && c2 === "navy") || (c1 === "navy" && c2 === "black")) return 0.65;
    if ((c1 === "brown" && c2 === "black") || (c1 === "black" && c2 === "brown")) return 0.40;
    if ((c1 === "white" && c2 === "transparent") || (c2 === "white" && c1 === "transparent")) return 0.60;

    return 0.0;
}

// Category and specific electronics device similarity calculation
function getCategorySimilarity(cat1, cat2, item1 = null, item2 = null) {
    if (!cat1 || !cat2) return 0;
    let c1 = cat1.trim();
    let c2 = cat2.trim();
    if (c1 === c2) {
        // Device class alignment for Electronics
        if (c1 === "Electronics" && item1 && item2) {
            let t1 = (item1.electronicType || item1.subcategory || "").toLowerCase().trim();
            let t2 = (item2.electronicType || item2.subcategory || "").toLowerCase().trim();
            let name1 = (item1.itemName || "").toLowerCase();
            let name2 = (item2.itemName || "").toLowerCase();

            function getDeviceClass(typeStr, nameStr) {
                let s = `${typeStr} ${nameStr}`;
                if (s.includes("laptop") || s.includes("macbook") || s.includes("thinkpad") || s.includes("notebook") || s.includes("xps")) return "laptop";
                if (s.includes("phone") || s.includes("smartphone") || s.includes("iphone") || s.includes("galaxy") || s.includes("mobile") || s.includes("oneplus") || s.includes("pixel")) return "phone";
                if (s.includes("headphone") || s.includes("earbud") || s.includes("airpod") || s.includes("tws") || s.includes("earphone") || s.includes("airdopes")) return "audio";
                if (s.includes("tablet") || s.includes("ipad") || s.includes("tab")) return "tablet";
                if (s.includes("watch") || s.includes("smartwatch") || s.includes("fitness")) return "watch";
                if (s.includes("charger") || s.includes("cable") || s.includes("adapter") || s.includes("power bank")) return "power";
                if (s.includes("calculator") || s.includes("casio")) return "calculator";
                if (s.includes("usb") || s.includes("drive") || s.includes("hard disk") || s.includes("ssd")) return "storage";
                return null;
            }

            let d1 = getDeviceClass(t1, name1);
            let d2 = getDeviceClass(t2, name2);

            if (d1 && d2) {
                if (d1 === d2) return 1.0;
                if ((d1 === "laptop" && d2 === "power") || (d2 === "laptop" && d1 === "power")) return 0.70;
                if ((d1 === "phone" && d2 === "audio") || (d2 === "phone" && d1 === "audio")) return 0.70;
                return 0.45;
            }
        }
        return 1.0;
    }

    if (CATEGORY_CORRELATION[c1] && CATEGORY_CORRELATION[c1].includes(c2)) return 0.55;
    if (CATEGORY_CORRELATION[c2] && CATEGORY_CORRELATION[c2].includes(c1)) return 0.55;

    return 0.0;
}

// Zone topological graph distance calculation
function getZoneSimilarity(zone1, zone2) {
    if (!zone1 || !zone2) return 0.15;
    let z1 = zone1.trim();
    let z2 = zone2.trim();

    if (z1.toLowerCase() === z2.toLowerCase()) return 1.0;

    // Check direct 1-hop adjacency
    if (ZONE_ADJACENCY[z1] && ZONE_ADJACENCY[z1].includes(z2)) return 0.75;
    if (ZONE_ADJACENCY[z2] && ZONE_ADJACENCY[z2].includes(z1)) return 0.75;

    // Check 2-hop adjacency
    let hops1 = ZONE_ADJACENCY[z1] || [];
    for (let neighbor of hops1) {
        if (ZONE_ADJACENCY[neighbor] && ZONE_ADJACENCY[neighbor].includes(z2)) {
            return 0.45;
        }
    }

    // Partial substring match for custom other locations
    if (z1.toLowerCase().includes(z2.toLowerCase()) || z2.toLowerCase().includes(z1.toLowerCase())) {
        return 0.85;
    }

    return 0.20;
}

// Date temporal distance scoring (Gaussian decay)
function getDateSimilarity(date1, date2) {
    if (!date1 || !date2) return 0.5;
    let d1 = new Date(date1);
    let d2 = new Date(date2);
    let diffDays = Math.abs(Math.floor((d1 - d2) / (1000 * 60 * 60 * 24)));

    if (diffDays === 0) return 1.0;
    if (diffDays === 1) return 0.90;
    if (diffDays <= 3) return 0.75;
    if (diffDays <= 7) return 0.50;
    if (diffDays <= 14) return 0.30;
    if (diffDays <= 30) return 0.15;

    return 0.05;
}

// Tokenize text into clean keywords
function tokenizeText(text) {
    if (!text) return [];
    let clean = text.toLowerCase().replace(/[^a-z0-9\s]/g, " ");
    return clean.split(/\s+/).filter(w => w.length > 1 && !STOP_WORDS.has(w));
}

// Item Name & Brand NLP similarity helper
function getItemNameSimilarity(name1, name2) {
    if (!name1 || !name2) return { score: 0, sharedTokens: [], brandMatch: null };
    let n1 = name1.toLowerCase().trim();
    let n2 = name2.toLowerCase().trim();

    if (n1 === n2) {
        return { score: 1.0, sharedTokens: tokenizeText(n1), brandMatch: null };
    }

    let tokens1 = tokenizeText(n1);
    let tokens2 = tokenizeText(n2);

    if (tokens1.length === 0 || tokens2.length === 0) {
        return { score: 0.1, sharedTokens: [], brandMatch: null };
    }

    let shared = tokens1.filter(t => tokens2.includes(t));
    let brandMatch = null;

    // Check for recognized brand matches
    for (let brand of RECOGNIZED_BRANDS) {
        if (n1.includes(brand) && n2.includes(brand)) {
            brandMatch = brand.toUpperCase();
            break;
        }
    }

    // Levenshtein / substring check
    let substringMatch = n1.includes(n2) || n2.includes(n1);

    let jaccard = shared.length / (new Set([...tokens1, ...tokens2])).size;
    let baseScore = jaccard;

    if (brandMatch) {
        baseScore = Math.min(1.0, baseScore + 0.40);
    }
    if (substringMatch) {
        baseScore = Math.min(1.0, baseScore + 0.35);
    }

    return {
        score: Math.min(1.0, Math.max(0, baseScore)),
        sharedTokens: [...new Set(shared)],
        brandMatch: brandMatch
    };
}

// Description Semantic NLP similarity
function getDescriptionSimilarity(desc1, desc2) {
    if (!desc1 || !desc2) return { score: 0, keywords: [] };
    let tokens1 = tokenizeText(desc1);
    let tokens2 = tokenizeText(desc2);

    if (tokens1.length === 0 || tokens2.length === 0) {
        return { score: 0, keywords: [] };
    }

    let shared = tokens1.filter(w => tokens2.includes(w));
    let uniqueShared = [...new Set(shared)];
    let unionSize = (new Set([...tokens1, ...tokens2])).size;

    let jaccard = unionSize > 0 ? shared.length / unionSize : 0;

    // Bonus for matching key descriptive keywords
    let keyFeatures = ["charger", "zipper", "case", "screen", "strap", "logo", "sticker", "leather", "bottle", "key", "card", "macbook", "pro", "pocket"];
    let matchedFeatures = uniqueShared.filter(w => keyFeatures.includes(w));
    let featureBonus = Math.min(0.35, matchedFeatures.length * 0.12);

    let finalScore = Math.min(1.0, jaccard + featureBonus);

    return {
        score: finalScore,
        keywords: uniqueShared
    };
}

// ── Main Comprehensive 6-Factor Matching Calculation ──────────────────────
function calculateMatchScore(targetItem, candidateItem) {
    // 1. Item Name & Brand NLP (25% max)
    let nameResult = getItemNameSimilarity(targetItem.itemName, candidateItem.itemName);
    let namePts = nameResult.score * 25.0;

    // 2. Category & Semantic Correlation (20% max)
    let catScore = getCategorySimilarity(targetItem.category, candidateItem.category, targetItem, candidateItem);
    let catPts = catScore * 20.0;

    // 3. Campus Zone Topological Proximity (20% max)
    let locScore = getZoneSimilarity(targetItem.zone, candidateItem.zone);
    let locPts = locScore * 20.0;

    // 4. Color Ontology & Harmony (15% max)
    let colorScore = getColorSimilarity(targetItem.color, candidateItem.color);
    let colorPts = colorScore * 15.0;

    // 5. Date Temporal Interval (10% max)
    let dateScore = getDateSimilarity(targetItem.date, candidateItem.date);
    let datePts = dateScore * 10.0;

    // 6. Description Semantic NLP & Keyword Overlap (10% max)
    let descResult = getDescriptionSimilarity(targetItem.description, candidateItem.description);
    let descPts = descResult.score * 10.0;

    // Total Score Calculation (Sum of 6 weights = 100%)
    let totalPts = namePts + catPts + locPts + colorPts + datePts + descPts;
    let matchPercentage = Math.min(100, Math.max(0, Math.round(totalPts)));

    // Generate specific human-readable reason badges
    let reasons = [];
    if (nameResult.brandMatch) {
        reasons.push(`Brand match: ${nameResult.brandMatch}`);
    } else if (nameResult.score >= 0.8) {
        reasons.push(`Exact item title match`);
    } else if (nameResult.sharedTokens.length > 0) {
        reasons.push(`Name keyword match: "${nameResult.sharedTokens.slice(0, 2).join(', ')}"`);
    }

    if (catScore === 1.0) {
        reasons.push(`Same category (${candidateItem.category})`);
    } else if (catScore > 0.5) {
        reasons.push(`Related category (${candidateItem.category} ↔ ${targetItem.category})`);
    }

    if (locScore === 1.0) {
        reasons.push(`Exact campus zone (${candidateItem.zone})`);
    } else if (locScore >= 0.7) {
        reasons.push(`Adjacent campus zone (${candidateItem.zone})`);
    }

    if (colorScore === 1.0) {
        reasons.push(`Color match (${candidateItem.color})`);
    } else if (colorScore >= 0.7) {
        reasons.push(`Color tone similarity (${candidateItem.color} ~ ${targetItem.color})`);
    }

    if (dateScore === 1.0) {
        reasons.push(`Reported on exact same date`);
    } else if (dateScore >= 0.85) {
        reasons.push(`Reported within 24 hours`);
    } else if (dateScore >= 0.7) {
        reasons.push(`Reported within 3 days`);
    }

    if (descResult.keywords.length > 0) {
        reasons.push(`Matching traits: ${descResult.keywords.slice(0, 3).map(k => `"${k}"`).join(', ')}`);
    }

    // All combined matched tokens for chip highlights
    let allMatchedTokens = [...new Set([...nameResult.sharedTokens, ...descResult.keywords])];

    return {
        candidate: candidateItem,
        score: matchPercentage,
        totalPts: parseFloat(totalPts.toFixed(1)),
        breakdown: {
            name:        { matchPct: Math.round(nameResult.score * 100), pts: parseFloat(namePts.toFixed(1)), maxPts: 25 },
            category:    { matchPct: Math.round(catScore * 100),         pts: parseFloat(catPts.toFixed(1)),  maxPts: 20 },
            location:    { matchPct: Math.round(locScore * 100),         pts: parseFloat(locPts.toFixed(1)),  maxPts: 20 },
            color:       { matchPct: Math.round(colorScore * 100),        pts: parseFloat(colorPts.toFixed(1)), maxPts: 15 },
            date:        { matchPct: Math.round(dateScore * 100),         pts: parseFloat(datePts.toFixed(1)),  maxPts: 10 },
            description: { matchPct: Math.round(descResult.score * 100), pts: parseFloat(descPts.toFixed(1)),  maxPts: 10 }
        },
        reasons: reasons,
        matchedTokens: allMatchedTokens,
        brandMatch: nameResult.brandMatch
    };
}

// Find opposite type matches (Lost -> Found, Found -> Lost)
function findMatches(targetItem, allReports) {
    if (!targetItem) return [];

    let oppositeType = targetItem.type === "lost" ? "found" : "lost";

    let candidates = allReports.filter(r =>
        r.type === oppositeType &&
        r.id !== targetItem.id
    );

    let results = candidates.map(c => calculateMatchScore(targetItem, c));
    results.sort((a, b) => b.score - a.score);

    return results;
}
