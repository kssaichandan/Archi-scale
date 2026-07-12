// Paper size definitions in millimeters
export const paperSizes = {
    iso: [
        { name: 'A0', width: 841,  height: 1189 },
        { name: 'A1', width: 594,  height: 841 },
        { name: 'A2', width: 420,  height: 594 },
        { name: 'A3', width: 297,  height: 420 },
        { name: 'A4', width: 210,  height: 297 },
        { name: 'A5', width: 148,  height: 210 },
        { name: 'A6', width: 105,  height: 148 },
    ],
    ansi: [
        { name: 'ANSI A', width: 216,  height: 279 },
        { name: 'ANSI B', width: 279,  height: 432 },
        { name: 'ANSI C', width: 432,  height: 559 },
        { name: 'ANSI D', width: 559,  height: 864 },
        { name: 'ANSI E', width: 864,  height: 1118 },
    ],
    arch: [
        { name: 'ARCH D', width: 610,  height: 914 },
        { name: 'ARCH E', width: 914,  height: 1219 },
    ],
};

export const marginMm = 10; // Standard margin in mm
