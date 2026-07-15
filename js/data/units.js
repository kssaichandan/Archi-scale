// Unit definitions with conversion factors relative to base unit
// For length, base = meters; area = m²; volume = m³; mass = kg; etc.

export const units = {
    // LENGTH - base: meters
    length: {
        mm:  { factor: 0.001,     name: 'Millimeters (mm)',   abbr: 'mm' },
        cm:  { factor: 0.01,      name: 'Centimeters (cm)',   abbr: 'cm' },
        m:   { factor: 1,         name: 'Meters (m)',         abbr: 'm' },
        km:  { factor: 1000,      name: 'Kilometers (km)',    abbr: 'km' },
        in:  { factor: 0.0254,    name: 'Inches (in)',        abbr: 'in' },
        ft:  { factor: 0.3048,    name: 'Feet (ft)',          abbr: 'ft' },
        yd:  { factor: 0.9144,    name: 'Yards (yd)',         abbr: 'yd' },
        mi:  { factor: 1609.344,  name: 'Miles (mi)',         abbr: 'mi' },
    },
    // AREA - base: square meters
    area: {
        mm2:  { factor: 0.000001,   name: 'mm²',   abbr: 'mm²' },
        cm2:  { factor: 0.0001,     name: 'cm²',   abbr: 'cm²' },
        m2:   { factor: 1,          name: 'm²',    abbr: 'm²' },
        km2:  { factor: 1000000,    name: 'km²',   abbr: 'km²' },
        ha:   { factor: 10000,      name: 'Hectares', abbr: 'ha' },
        acre: { factor: 4046.8564224, name: 'Acres', abbr: 'ac' },
        in2:  { factor: 0.00064516, name: 'in²',   abbr: 'in²' },
        ft2:  { factor: 0.09290304, name: 'ft²',   abbr: 'ft²' },
        yd2:  { factor: 0.83612736, name: 'yd²',   abbr: 'yd²' },
    },
    // VOLUME - base: cubic meters
    volume: {
        mm3:  { factor: 0.000000001, name: 'mm³',  abbr: 'mm³' },
        cm3:  { factor: 0.000001,    name: 'cm³',  abbr: 'cm³' },
        m3:   { factor: 1,           name: 'm³',   abbr: 'm³' },
        L:    { factor: 0.001,       name: 'Liters', abbr: 'L' },
        mL:   { factor: 0.000001,    name: 'Milliliters', abbr: 'mL' },
        gal:  { factor: 0.003785411784,  name: 'Gallons (US)', abbr: 'gal' },
        in3:  { factor: 0.000016387064, name: 'in³', abbr: 'in³' },
        ft3:  { factor: 0.028316846592, name: 'ft³', abbr: 'ft³' },
        yd3:  { factor: 0.764554857984, name: 'yd³', abbr: 'yd³' },
    },
    // MASS - base: kilograms
    mass: {
        mg: { factor: 0.000001,     name: 'Milligrams (mg)',  abbr: 'mg' },
        g:  { factor: 0.001,        name: 'Grams (g)',        abbr: 'g' },
        kg: { factor: 1,            name: 'Kilograms (kg)',   abbr: 'kg' },
        t:  { factor: 1000,         name: 'Tonnes (t)',       abbr: 't' },
        oz: { factor: 0.028349523125, name: 'Ounces (oz)',    abbr: 'oz' },
        lb: { factor: 0.45359237,   name: 'Pounds (lb)',      abbr: 'lb' },
        st: { factor: 6.35029318,   name: 'Stone (st)',       abbr: 'st' },
    },
    // PRESSURE - base: Pascals
    pressure: {
        Pa:  { factor: 1,          name: 'Pascals (Pa)',      abbr: 'Pa' },
        kPa: { factor: 1000,       name: 'Kilopascals (kPa)', abbr: 'kPa' },
        MPa: { factor: 1000000,    name: 'Megapascals (MPa)', abbr: 'MPa' },
        psi: { factor: 6894.757293168, name: 'PSI',           abbr: 'psi' },
        bar: { factor: 100000,     name: 'Bar',               abbr: 'bar' },
        atm: { factor: 101325,     name: 'Atmospheres',       abbr: 'atm' },
        kgf: { factor: 98066.5,    name: 'kgf/cm²',          abbr: 'kgf/cm²' },
    },
    // DENSITY - base: kg/m³
    density: {
        kgm3:  { factor: 1,         name: 'kg/m³',  abbr: 'kg/m³' },
        gcm3:  { factor: 1000,      name: 'g/cm³',  abbr: 'g/cm³' },
        lbft3: { factor: 16.0184634, name: 'lb/ft³', abbr: 'lb/ft³' },
        lbin3: { factor: 27679.9047102, name: 'lb/in³', abbr: 'lb/in³' },
    },
    // ANGLE - base: degrees
    angle: {
        deg:    { factor: 1,            name: 'Degrees (°)',       abbr: '°' },
        rad:    { factor: 57.29577951,   name: 'Radians (rad)',    abbr: 'rad' },
        grad:   { factor: 0.9,           name: 'Gradians (gon)',   abbr: 'gon' },
        arcmin: { factor: 1/60,          name: 'Arcminutes (′)',   abbr: '′' },
        arcsec: { factor: 1/3600,        name: 'Arcseconds (″)',   abbr: '″' },
    },
    // CONSTRUCTION - Board Feet (base: cubic meters)
    boardfeet: {
        bf:  { factor: 0.0023597372,  name: 'Board Feet', abbr: 'bf' },
        in3: { factor: 0.000016387064, name: 'Cubic Inches', abbr: 'in³' },
        cm3: { factor: 0.000001,      name: 'Cubic cm',  abbr: 'cm³' },
        m3:  { factor: 1,             name: 'Cubic meters', abbr: 'm³' },
        ft3: { factor: 0.028316846592, name: 'Cubic Feet', abbr: 'ft³' },
    },
    // ROOFING - Squares (base: square meters)
    roofing: {
        sq:  { factor: 9.290304,     name: 'Squares (100 ft²)', abbr: 'sq' },
        ft2: { factor: 0.09290304,   name: 'Square Feet',       abbr: 'ft²' },
        m2:  { factor: 1,            name: 'Square Meters',     abbr: 'm²' },
        yd2: { factor: 0.83612736,   name: 'Square Yards',      abbr: 'yd²' },
    },
    // CONCRETE - Volume (base: cubic meters)
    concrete: {
        yd3: { factor: 0.764554857984, name: 'Cubic Yards',  abbr: 'yd³' },
        m3:  { factor: 1,              name: 'Cubic Meters', abbr: 'm³' },
        ft3: { factor: 0.028316846592, name: 'Cubic Feet',   abbr: 'ft³' },
    },
};

export function convert(category, value, fromUnit, toUnit) {
    if (!Number.isFinite(value)) return NaN;
    if (category === 'temperature') {
        return convertTemperature(value, fromUnit, toUnit);
    }
    const cat = units[category];
    if (!cat || !cat[fromUnit] || !cat[toUnit]) return NaN;
    return (value * cat[fromUnit].factor) / cat[toUnit].factor;
}

function convertTemperature(value, from, to) {
    if (!Number.isFinite(value)) return NaN;
    if (from === 'K' && value < 0) return NaN;
    if (from === 'C' && value < -273.15) return NaN;
    if (from === 'F' && value < -459.67) return NaN;
    if (from === to) return value;
    // Convert to Celsius first
    let celsius;
    switch (from) {
        case 'C': celsius = value; break;
        case 'F': celsius = (value - 32) * 5/9; break;
        case 'K': celsius = value - 273.15; break;
    }
    if (!Number.isFinite(celsius) || celsius < -273.15) return NaN;
    // Convert from Celsius to target
    switch (to) {
        case 'C': return celsius;
        case 'F': return celsius * 9/5 + 32;
        case 'K': return celsius + 273.15;
    }
}
