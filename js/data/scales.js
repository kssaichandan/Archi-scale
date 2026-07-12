// Architectural scale definitions
export const metricScales = [
    { value: 1, label: '1:1', use: 'Full-size details, joinery' },
    { value: 2, label: '1:2', use: 'Construction details' },
    { value: 5, label: '1:5', use: 'Construction details, sections' },
    { value: 10, label: '1:10', use: 'Construction details, sections' },
    { value: 20, label: '1:20', use: 'Room layouts, wall sections' },
    { value: 25, label: '1:25', use: 'Room layouts, wall sections' },
    { value: 50, label: '1:50', use: 'Detailed floor plans' },
    { value: 75, label: '1:75', use: 'Floor plans' },
    { value: 100, label: '1:100', use: 'Standard floor plans, elevations' },
    { value: 125, label: '1:125', use: 'Floor plans, sections' },
    { value: 200, label: '1:200', use: 'Site plans, building elevations' },
    { value: 250, label: '1:250', use: 'Site plans' },
    { value: 500, label: '1:500', use: 'Site context, masterplans' },
    { value: 1000, label: '1:1000', use: 'Urban masterplans, mapping' },
    { value: 1250, label: '1:1250', use: 'Urban mapping' },
    { value: 2500, label: '1:2500', use: 'Urban planning' },
    { value: 5000, label: '1:5000', use: 'Large-scale planning' },
];

export const imperialScales = [
    { value: 192, label: '1/16" = 1\'-0"', metric: 192, use: 'Large commercial buildings' },
    { value: 96,  label: '1/8" = 1\'-0"',  metric: 96,  use: 'Building sections' },
    { value: 64,  label: '3/16" = 1\'-0"', metric: 64,  use: 'Floor plans, sections' },
    { value: 48,  label: '1/4" = 1\'-0"',  metric: 48,  use: 'Floor plans, elevations' },
    { value: 32,  label: '3/8" = 1\'-0"',  metric: 32,  use: 'Floor plans' },
    { value: 24,  label: '1/2" = 1\'-0"',  metric: 24,  use: 'Residential floor plans' },
    { value: 16,  label: '3/4" = 1\'-0"',  metric: 16,  use: 'Furniture plans' },
    { value: 12,  label: '1" = 1\'-0"',    metric: 12,  use: 'Interior details' },
    { value: 8,   label: '1-1/2" = 1\'-0"', metric: 8, use: 'Details, cabinetry' },
    { value: 4,   label: '3" = 1\'-0"',    metric: 4,   use: 'Details, millwork' },
];
