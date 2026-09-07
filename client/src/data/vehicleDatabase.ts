export interface EngineSpec {
  name: string;
  fuelType: 'Gasoline' | 'Diesel' | 'Hybrid' | 'Electric' | 'E85';
  tankCapacity?: number; // in gallons
  hp?: number;
}

export interface ModelSpec {
  name: string;
  startYear: number;
  endYear: number; // 9999 for current/active
  trims: string[];
  engines: EngineSpec[];
  defaultTankCapacity?: number;
}

export interface MakeSpec {
  make: string;
  models: ModelSpec[];
}

export const VEHICLE_DATABASE: MakeSpec[] = [
  {
    make: 'Acura',
    models: [
      {
        name: 'Integra',
        startYear: 1986,
        endYear: 9999,
        trims: ['Base', 'A-Spec', 'A-Spec w/ Technology', 'Type S'],
        engines: [
          { name: '1.5L Turbo I4 (200 hp)', fuelType: 'Gasoline', tankCapacity: 12.4 },
          { name: '2.0L Turbo VTEC I4 (320 hp - Type S)', fuelType: 'Gasoline', tankCapacity: 12.4 },
        ],
        defaultTankCapacity: 12.4,
      },
      {
        name: 'TLX',
        startYear: 2015,
        endYear: 9999,
        trims: ['Base', 'Technology', 'A-Spec', 'Advance', 'Type S', 'Type S PMC Edition'],
        engines: [
          { name: '2.0L Turbo I4 (272 hp)', fuelType: 'Gasoline', tankCapacity: 15.8 },
          { name: '3.0L Turbo V6 (355 hp - Type S)', fuelType: 'Gasoline', tankCapacity: 15.8 },
          { name: '2.4L i-VTEC I4 (206 hp)', fuelType: 'Gasoline', tankCapacity: 17.2 },
          { name: '3.5L V6 (290 hp)', fuelType: 'Gasoline', tankCapacity: 17.2 },
        ],
        defaultTankCapacity: 15.8,
      },
      {
        name: 'MDX',
        startYear: 2001,
        endYear: 9999,
        trims: ['Base', 'Technology', 'A-Spec', 'Advance', 'Type S', 'Type S Advance'],
        engines: [
          { name: '3.5L i-VTEC V6 (290 hp)', fuelType: 'Gasoline', tankCapacity: 18.5 },
          { name: '3.0L Turbo V6 (355 hp - Type S)', fuelType: 'Gasoline', tankCapacity: 18.5 },
          { name: '3.0L Hybrid V6 (321 hp)', fuelType: 'Hybrid', tankCapacity: 19.4 },
        ],
        defaultTankCapacity: 18.5,
      },
      {
        name: 'RDX',
        startYear: 2007,
        endYear: 9999,
        trims: ['Base', 'Technology', 'A-Spec', 'Advance', 'A-Spec Advance'],
        engines: [
          { name: '2.0L Turbo VTEC I4 (272 hp)', fuelType: 'Gasoline', tankCapacity: 17.1 },
          { name: '3.5L V6 (279 hp)', fuelType: 'Gasoline', tankCapacity: 16.0 },
        ],
        defaultTankCapacity: 17.1,
      },
      {
        name: 'NSX',
        startYear: 1990,
        endYear: 2022,
        trims: ['Base', 'Type S'],
        engines: [
          { name: '3.5L Twin-Turbo V6 Hybrid (573 hp)', fuelType: 'Hybrid', tankCapacity: 15.6 },
          { name: '3.5L Twin-Turbo V6 Hybrid (600 hp - Type S)', fuelType: 'Hybrid', tankCapacity: 15.6 },
          { name: '3.0L VTEC V6 (270 hp)', fuelType: 'Gasoline', tankCapacity: 18.5 },
          { name: '3.2L VTEC V6 (290 hp)', fuelType: 'Gasoline', tankCapacity: 18.5 },
        ],
        defaultTankCapacity: 15.6,
      },
      {
        name: 'ZDX',
        startYear: 2024,
        endYear: 9999,
        trims: ['A-Spec RWD', 'A-Spec AWD', 'Type S'],
        engines: [
          { name: 'Single Motor Electric (358 hp)', fuelType: 'Electric' },
          { name: 'Dual Motor Electric AWD (500 hp)', fuelType: 'Electric' },
        ],
      },
    ],
  },
  {
    make: 'Alfa Romeo',
    models: [
      {
        name: 'Giulia',
        startYear: 2017,
        endYear: 9999,
        trims: ['Sprint', 'Ti', 'Veloce', 'Competizione', 'Quadrifoglio'],
        engines: [
          { name: '2.0L Turbo I4 (280 hp)', fuelType: 'Gasoline', tankCapacity: 15.3 },
          { name: '2.9L Twin-Turbo V6 (505 hp - Quadrifoglio)', fuelType: 'Gasoline', tankCapacity: 15.3 },
        ],
        defaultTankCapacity: 15.3,
      },
      {
        name: 'Stelvio',
        startYear: 2018,
        endYear: 9999,
        trims: ['Sprint', 'Ti', 'Veloce', 'Competizione', 'Quadrifoglio'],
        engines: [
          { name: '2.0L Turbo I4 (280 hp)', fuelType: 'Gasoline', tankCapacity: 16.9 },
          { name: '2.9L Twin-Turbo V6 (505 hp - Quadrifoglio)', fuelType: 'Gasoline', tankCapacity: 16.9 },
        ],
        defaultTankCapacity: 16.9,
      },
      {
        name: 'Tonale',
        startYear: 2023,
        endYear: 9999,
        trims: ['Sprint', 'Ti', 'Veloce'],
        engines: [
          { name: '1.3L Turbo I4 Plug-In Hybrid (285 hp)', fuelType: 'Hybrid', tankCapacity: 11.2 },
        ],
        defaultTankCapacity: 11.2,
      },
    ],
  },
  {
    make: 'Audi',
    models: [
      {
        name: 'A3 / S3 / RS3',
        startYear: 1996,
        endYear: 9999,
        trims: ['Premium', 'Premium Plus', 'Prestige', 'S3 Premium Plus', 'S3 Prestige', 'RS 3'],
        engines: [
          { name: '2.0L Turbo I4 40 TFSI (201 hp)', fuelType: 'Gasoline', tankCapacity: 13.2 },
          { name: '2.0L Turbo I4 S3 (306 hp)', fuelType: 'Gasoline', tankCapacity: 14.5 },
          { name: '2.5L Turbo Inline-5 RS3 (401 hp)', fuelType: 'Gasoline', tankCapacity: 14.5 },
        ],
        defaultTankCapacity: 13.2,
      },
      {
        name: 'A4 / S4',
        startYear: 1995,
        endYear: 9999,
        trims: ['Premium 40', 'Premium 45', 'Premium Plus', 'Prestige', 'S4 Premium Plus', 'S4 Prestige'],
        engines: [
          { name: '2.0L Turbo I4 40 TFSI (201 hp)', fuelType: 'Gasoline', tankCapacity: 15.3 },
          { name: '2.0L Turbo I4 45 TFSI (261 hp)', fuelType: 'Gasoline', tankCapacity: 15.3 },
          { name: '3.0L Turbo V6 S4 (349 hp)', fuelType: 'Gasoline', tankCapacity: 15.3 },
        ],
        defaultTankCapacity: 15.3,
      },
      {
        name: 'A5 / S5 / RS5',
        startYear: 2008,
        endYear: 9999,
        trims: ['Coupe', 'Sportback', 'Cabriolet', 'S5', 'RS 5'],
        engines: [
          { name: '2.0L Turbo I4 45 TFSI (261 hp)', fuelType: 'Gasoline', tankCapacity: 15.3 },
          { name: '3.0L Turbo V6 S5 (349 hp)', fuelType: 'Gasoline', tankCapacity: 15.3 },
          { name: '2.9L Twin-Turbo V6 RS 5 (444 hp)', fuelType: 'Gasoline', tankCapacity: 15.3 },
        ],
        defaultTankCapacity: 15.3,
      },
      {
        name: 'A6 / S6 / RS6',
        startYear: 1994,
        endYear: 9999,
        trims: ['Premium', 'Premium Plus', 'Prestige', 'S6', 'RS 6 Avant'],
        engines: [
          { name: '2.0L Turbo I4 45 TFSI (261 hp)', fuelType: 'Gasoline', tankCapacity: 19.3 },
          { name: '3.0L Turbo V6 55 TFSI (335 hp)', fuelType: 'Gasoline', tankCapacity: 19.3 },
          { name: '2.9L Twin-Turbo V6 S6 (444 hp)', fuelType: 'Gasoline', tankCapacity: 19.3 },
          { name: '4.0L Twin-Turbo V8 RS 6 (621 hp)', fuelType: 'Gasoline', tankCapacity: 19.3 },
        ],
        defaultTankCapacity: 19.3,
      },
      {
        name: 'Q3',
        startYear: 2015,
        endYear: 9999,
        trims: ['Premium 40', 'Premium 45', 'Premium Plus 45'],
        engines: [
          { name: '2.0L Turbo I4 40 TFSI (184 hp)', fuelType: 'Gasoline', tankCapacity: 15.9 },
          { name: '2.0L Turbo I4 45 TFSI (228 hp)', fuelType: 'Gasoline', tankCapacity: 15.9 },
        ],
        defaultTankCapacity: 15.9,
      },
      {
        name: 'Q5 / SQ5',
        startYear: 2009,
        endYear: 9999,
        trims: ['Premium 40', 'Premium 45', 'Premium Plus', 'Prestige', '55 TFSI e PHEV', 'SQ5'],
        engines: [
          { name: '2.0L Turbo I4 45 TFSI (261 hp)', fuelType: 'Gasoline', tankCapacity: 18.5 },
          { name: '2.0L Turbo PHEV (362 hp)', fuelType: 'Hybrid', tankCapacity: 14.3 },
          { name: '3.0L Turbo V6 SQ5 (349 hp)', fuelType: 'Gasoline', tankCapacity: 18.5 },
        ],
        defaultTankCapacity: 18.5,
      },
      {
        name: 'Q7 / SQ7',
        startYear: 2007,
        endYear: 9999,
        trims: ['Premium 45', 'Premium 55', 'Premium Plus', 'Prestige', 'SQ7'],
        engines: [
          { name: '2.0L Turbo I4 45 TFSI (261 hp)', fuelType: 'Gasoline', tankCapacity: 22.5 },
          { name: '3.0L Turbo V6 55 TFSI (335 hp)', fuelType: 'Gasoline', tankCapacity: 22.5 },
          { name: '4.0L Twin-Turbo V8 SQ7 (500 hp)', fuelType: 'Gasoline', tankCapacity: 22.5 },
        ],
        defaultTankCapacity: 22.5,
      },
      {
        name: 'Q8 / SQ8 / RS Q8',
        startYear: 2019,
        endYear: 9999,
        trims: ['Premium', 'Premium Plus', 'Prestige', 'SQ8', 'RS Q8'],
        engines: [
          { name: '3.0L Turbo V6 55 TFSI (335 hp)', fuelType: 'Gasoline', tankCapacity: 22.5 },
          { name: '4.0L Twin-Turbo V8 SQ8 (500 hp)', fuelType: 'Gasoline', tankCapacity: 22.5 },
          { name: '4.0L Twin-Turbo V8 RS Q8 (591 hp)', fuelType: 'Gasoline', tankCapacity: 22.5 },
        ],
        defaultTankCapacity: 22.5,
      },
      {
        name: 'e-tron / Q8 e-tron / e-tron GT',
        startYear: 2019,
        endYear: 9999,
        trims: ['Q8 e-tron Premium', 'Prestige', 'SQ8 e-tron', 'e-tron GT', 'RS e-tron GT'],
        engines: [
          { name: 'Dual Motor Electric AWD (402 hp)', fuelType: 'Electric' },
          { name: 'Tri-Motor Electric AWD SQ8 (496 hp)', fuelType: 'Electric' },
          { name: 'Dual Motor Electric GT (522 hp)', fuelType: 'Electric' },
          { name: 'Dual Motor Electric RS GT (637 hp)', fuelType: 'Electric' },
        ],
      },
    ],
  },
  {
    make: 'BMW',
    models: [
      {
        name: '2 Series / M2',
        startYear: 2014,
        endYear: 9999,
        trims: ['230i', '230i xDrive', 'M240i', 'M240i xDrive', 'M2 Coupe'],
        engines: [
          { name: '2.0L Turbo I4 (255 hp - 230i)', fuelType: 'Gasoline', tankCapacity: 13.7 },
          { name: '3.0L Turbo Inline-6 (382 hp - M240i)', fuelType: 'Gasoline', tankCapacity: 13.7 },
          { name: '3.0L Twin-Turbo Inline-6 (453 hp - M2)', fuelType: 'Gasoline', tankCapacity: 13.7 },
        ],
        defaultTankCapacity: 13.7,
      },
      {
        name: '3 Series / M3',
        startYear: 1975,
        endYear: 9999,
        trims: ['330i', '330i xDrive', '330e PHEV', 'M340i', 'M340i xDrive', 'M3', 'M3 Competition', 'M3 CS'],
        engines: [
          { name: '2.0L Turbo B48 I4 (255 hp - 330i)', fuelType: 'Gasoline', tankCapacity: 15.6 },
          { name: '2.0L Turbo PHEV (288 hp - 330e)', fuelType: 'Hybrid', tankCapacity: 10.6 },
          { name: '3.0L Turbo B58 Inline-6 (382 hp - M340i)', fuelType: 'Gasoline', tankCapacity: 15.6 },
          { name: '3.0L Twin-Turbo S58 Inline-6 (473 hp - M3)', fuelType: 'Gasoline', tankCapacity: 15.6 },
          { name: '3.0L Twin-Turbo S58 Inline-6 (503 hp - M3 Comp)', fuelType: 'Gasoline', tankCapacity: 15.6 },
        ],
        defaultTankCapacity: 15.6,
      },
      {
        name: '4 Series / M4',
        startYear: 2014,
        endYear: 9999,
        trims: ['430i', '430i Gran Coupe', 'M440i', 'M440i xDrive', 'M4 Coupe', 'M4 Competition', 'M4 CSL'],
        engines: [
          { name: '2.0L Turbo I4 (255 hp - 430i)', fuelType: 'Gasoline', tankCapacity: 15.6 },
          { name: '3.0L Turbo Inline-6 (382 hp - M440i)', fuelType: 'Gasoline', tankCapacity: 15.6 },
          { name: '3.0L Twin-Turbo Inline-6 (503 hp - M4 Comp)', fuelType: 'Gasoline', tankCapacity: 15.6 },
        ],
        defaultTankCapacity: 15.6,
      },
      {
        name: '5 Series / M5',
        startYear: 1972,
        endYear: 9999,
        trims: ['530i', '530i xDrive', '540i xDrive', '550e xDrive', 'M550i xDrive', 'M5', 'M5 Competition', 'M5 CS'],
        engines: [
          { name: '2.0L Turbo I4 (255 hp - 530i)', fuelType: 'Gasoline', tankCapacity: 15.9 },
          { name: '3.0L Turbo Inline-6 (375 hp - 540i)', fuelType: 'Gasoline', tankCapacity: 15.9 },
          { name: '4.4L Twin-Turbo V8 (523 hp - M550i)', fuelType: 'Gasoline', tankCapacity: 18.0 },
          { name: '4.4L Twin-Turbo V8 (600 hp - M5)', fuelType: 'Gasoline', tankCapacity: 18.0 },
          { name: '4.4L Twin-Turbo V8 Hybrid (717 hp - M5 2025+)', fuelType: 'Hybrid', tankCapacity: 15.9 },
        ],
        defaultTankCapacity: 15.9,
      },
      {
        name: 'X1',
        startYear: 2009,
        endYear: 9999,
        trims: ['sDrive28i', 'xDrive28i', 'M35i xDrive'],
        engines: [
          { name: '2.0L Turbo I4 (241 hp - xDrive28i)', fuelType: 'Gasoline', tankCapacity: 14.3 },
          { name: '2.0L Turbo I4 (312 hp - M35i)', fuelType: 'Gasoline', tankCapacity: 14.3 },
        ],
        defaultTankCapacity: 14.3,
      },
      {
        name: 'X3 / X3 M',
        startYear: 2003,
        endYear: 9999,
        trims: ['sDrive30i', 'xDrive30i', 'M40i', 'M50 xDrive', 'X3 M', 'X3 M Competition'],
        engines: [
          { name: '2.0L Turbo I4 (248 hp - 30i)', fuelType: 'Gasoline', tankCapacity: 17.2 },
          { name: '3.0L Turbo B58 Inline-6 (382 hp - M40i)', fuelType: 'Gasoline', tankCapacity: 17.2 },
          { name: '3.0L Twin-Turbo S58 Inline-6 (503 hp - X3 M)', fuelType: 'Gasoline', tankCapacity: 17.2 },
        ],
        defaultTankCapacity: 17.2,
      },
      {
        name: 'X5 / X5 M',
        startYear: 1999,
        endYear: 9999,
        trims: ['sDrive40i', 'xDrive40i', 'xDrive50e PHEV', 'M60i xDrive', 'X5 M Competition'],
        engines: [
          { name: '3.0L Turbo B58 Inline-6 (375 hp - 40i)', fuelType: 'Gasoline', tankCapacity: 21.9 },
          { name: '3.0L Turbo Inline-6 PHEV (483 hp - 50e)', fuelType: 'Hybrid', tankCapacity: 18.2 },
          { name: '4.4L Twin-Turbo V8 (523 hp - M60i)', fuelType: 'Gasoline', tankCapacity: 21.9 },
          { name: '4.4L Twin-Turbo V8 (617 hp - X5 M)', fuelType: 'Gasoline', tankCapacity: 21.9 },
        ],
        defaultTankCapacity: 21.9,
      },
      {
        name: 'i4 / iX / i7',
        startYear: 2022,
        endYear: 9999,
        trims: ['eDrive35', 'eDrive40', 'xDrive40', 'M50', 'xDrive50', 'M60'],
        engines: [
          { name: 'Single Motor Electric RWD (282-335 hp)', fuelType: 'Electric' },
          { name: 'Dual Motor Electric AWD (516-536 hp)', fuelType: 'Electric' },
          { name: 'Dual Motor Electric M (610 hp)', fuelType: 'Electric' },
        ],
      },
    ],
  },
  {
    make: 'Cadillac',
    models: [
      {
        name: 'CT4 / CT4-V Blackwing',
        startYear: 2020,
        endYear: 9999,
        trims: ['Luxury', 'Premium Luxury', 'Sport', 'CT4-V', 'CT4-V Blackwing'],
        engines: [
          { name: '2.0L Turbo I4 (237 hp)', fuelType: 'Gasoline', tankCapacity: 17.0 },
          { name: '2.7L Turbo Dual Volute I4 (325 hp - CT4-V)', fuelType: 'Gasoline', tankCapacity: 17.0 },
          { name: '3.6L Twin-Turbo V6 (472 hp - Blackwing)', fuelType: 'Gasoline', tankCapacity: 17.0 },
        ],
        defaultTankCapacity: 17.0,
      },
      {
        name: 'CT5 / CT5-V Blackwing',
        startYear: 2020,
        endYear: 9999,
        trims: ['Luxury', 'Premium Luxury', 'Sport', 'CT5-V', 'CT5-V Blackwing'],
        engines: [
          { name: '2.0L Turbo I4 (237 hp)', fuelType: 'Gasoline', tankCapacity: 17.0 },
          { name: '3.0L Twin-Turbo V6 (360 hp - CT5-V)', fuelType: 'Gasoline', tankCapacity: 17.0 },
          { name: '6.2L Supercharged V8 (668 hp - Blackwing)', fuelType: 'Gasoline', tankCapacity: 17.0 },
        ],
        defaultTankCapacity: 17.0,
      },
      {
        name: 'Escalade / Escalade-V',
        startYear: 1999,
        endYear: 9999,
        trims: ['Luxury', 'Premium Luxury', 'Sport', 'Platinum', 'Sport Platinum', 'Escalade-V'],
        engines: [
          { name: '6.2L EcoTec3 V8 (420 hp)', fuelType: 'Gasoline', tankCapacity: 24.0 },
          { name: '3.0L Duramax Turbo-Diesel I6 (277 hp)', fuelType: 'Diesel', tankCapacity: 24.0 },
          { name: '6.2L Supercharged V8 (682 hp - Escalade-V)', fuelType: 'Gasoline', tankCapacity: 24.0 },
        ],
        defaultTankCapacity: 24.0,
      },
      {
        name: 'Lyriq',
        startYear: 2023,
        endYear: 9999,
        trims: ['Tech', 'Luxury 1', 'Luxury 2', 'Sport 1', 'Sport 2', 'Sport 3'],
        engines: [
          { name: 'Single Motor Electric RWD (340 hp)', fuelType: 'Electric' },
          { name: 'Dual Motor Electric AWD (500 hp)', fuelType: 'Electric' },
        ],
      },
    ],
  },
  {
    make: 'Chevrolet',
    models: [
      {
        name: 'Silverado 1500',
        startYear: 1999,
        endYear: 9999,
        trims: ['WT', 'Custom', 'Custom Trail Boss', 'LT', 'RST', 'LT Trail Boss', 'LTZ', 'High Country', 'ZR2'],
        engines: [
          { name: '2.7L TurboMax I4 (310 hp / 430 lb-ft)', fuelType: 'Gasoline', tankCapacity: 24.0 },
          { name: '5.3L EcoTec3 V8 (355 hp)', fuelType: 'Gasoline', tankCapacity: 24.0 },
          { name: '6.2L EcoTec3 V8 (420 hp)', fuelType: 'Gasoline', tankCapacity: 24.0 },
          { name: '3.0L Duramax Turbo-Diesel I6 (305 hp)', fuelType: 'Diesel', tankCapacity: 24.0 },
          { name: '4.3L EcoTec3 V6 (285 hp)', fuelType: 'Gasoline', tankCapacity: 26.0 },
        ],
        defaultTankCapacity: 24.0,
      },
      {
        name: 'Corvette',
        startYear: 1953,
        endYear: 9999,
        trims: ['1LT Stingray', '2LT Stingray', '3LT Stingray', 'Z06 1LZ', 'Z06 2LZ', 'Z06 3LZ', 'E-Ray 1LZ', 'E-Ray 3LZ', 'ZR1'],
        engines: [
          { name: '6.2L LT2 V8 (495 hp - Stingray)', fuelType: 'Gasoline', tankCapacity: 18.5 },
          { name: '5.5L Flat-Plane Crank LT6 V8 (670 hp - Z06)', fuelType: 'Gasoline', tankCapacity: 18.5 },
          { name: '6.2L V8 + e-AWD Hybrid (655 hp - E-Ray)', fuelType: 'Hybrid', tankCapacity: 18.5 },
          { name: '5.5L Twin-Turbo LT7 V8 (1064 hp - ZR1)', fuelType: 'Gasoline', tankCapacity: 18.5 },
          { name: '6.2L LT1 V8 (460 hp - C7)', fuelType: 'Gasoline', tankCapacity: 18.5 },
          { name: '6.2L Supercharged LT4 V8 (650 hp - C7 Z06)', fuelType: 'Gasoline', tankCapacity: 18.5 },
        ],
        defaultTankCapacity: 18.5,
      },
      {
        name: 'Camaro',
        startYear: 1967,
        endYear: 2024,
        trims: ['1LS', '1LT', '2LT', '3LT', 'LT1', '1SS', '2SS', 'ZL1', 'ZL1 1LE'],
        engines: [
          { name: '2.0L Turbo I4 (275 hp)', fuelType: 'Gasoline', tankCapacity: 19.0 },
          { name: '3.6L V6 (335 hp)', fuelType: 'Gasoline', tankCapacity: 19.0 },
          { name: '6.2L LT1 V8 (455 hp - SS/LT1)', fuelType: 'Gasoline', tankCapacity: 19.0 },
          { name: '6.2L Supercharged LT4 V8 (650 hp - ZL1)', fuelType: 'Gasoline', tankCapacity: 19.0 },
        ],
        defaultTankCapacity: 19.0,
      },
      {
        name: 'Tahoe / Suburban',
        startYear: 1995,
        endYear: 9999,
        trims: ['LS', 'LT', 'RST', 'Z71', 'Premier', 'High Country'],
        engines: [
          { name: '5.3L EcoTec3 V8 (355 hp)', fuelType: 'Gasoline', tankCapacity: 24.0 },
          { name: '6.2L EcoTec3 V8 (420 hp)', fuelType: 'Gasoline', tankCapacity: 24.0 },
          { name: '3.0L Duramax Turbo-Diesel I6 (305 hp)', fuelType: 'Diesel', tankCapacity: 24.0 },
        ],
        defaultTankCapacity: 24.0,
      },
      {
        name: 'Equinox',
        startYear: 2005,
        endYear: 9999,
        trims: ['LT', 'RS', 'ACTIV', 'Premier'],
        engines: [
          { name: '1.5L Turbo I4 (175 hp)', fuelType: 'Gasoline', tankCapacity: 15.6 },
          { name: 'Dual Motor Electric AWD (288 hp - Equinox EV)', fuelType: 'Electric' },
        ],
        defaultTankCapacity: 15.6,
      },
      {
        name: 'Malibu',
        startYear: 1997,
        endYear: 2024,
        trims: ['LS', 'RS', '1LT', '2LT', 'Premier'],
        engines: [
          { name: '1.5L Turbo I4 (160 hp)', fuelType: 'Gasoline', tankCapacity: 15.8 },
          { name: '2.0L Turbo I4 (250 hp)', fuelType: 'Gasoline', tankCapacity: 15.8 },
        ],
        defaultTankCapacity: 15.8,
      },
      {
        name: 'Colorado',
        startYear: 2004,
        endYear: 9999,
        trims: ['WT', 'LT', 'Trail Boss', 'Z71', 'ZR2', 'ZR2 Bison'],
        engines: [
          { name: '2.7L TurboMax I4 (310 hp / 430 lb-ft)', fuelType: 'Gasoline', tankCapacity: 21.4 },
          { name: '3.6L V6 (308 hp)', fuelType: 'Gasoline', tankCapacity: 21.0 },
          { name: '2.8L Duramax Turbo-Diesel (181 hp)', fuelType: 'Diesel', tankCapacity: 21.0 },
        ],
        defaultTankCapacity: 21.4,
      },
    ],
  },
  {
    make: 'Dodge',
    models: [
      {
        name: 'Charger',
        startYear: 1966,
        endYear: 9999,
        trims: ['SXT', 'GT', 'R/T', 'Scat Pack', 'Scat Pack Widebody', 'SRT Hellcat', 'Hellcat Redeye', 'Jailbreak', 'Daytona EV'],
        engines: [
          { name: '3.6L Pentastar V6 (300 hp)', fuelType: 'Gasoline', tankCapacity: 18.5 },
          { name: '5.7L HEMI V8 (370 hp - R/T)', fuelType: 'Gasoline', tankCapacity: 18.5 },
          { name: '6.4L 392 HEMI V8 (485 hp - Scat Pack)', fuelType: 'Gasoline', tankCapacity: 18.5 },
          { name: '6.2L Supercharged HEMI V8 (717 hp - Hellcat)', fuelType: 'Gasoline', tankCapacity: 18.5 },
          { name: '6.2L Supercharged HEMI V8 (797 hp - Redeye)', fuelType: 'Gasoline', tankCapacity: 18.5 },
          { name: '3.0L Twin-Turbo Hurricane I6 (420-550 hp)', fuelType: 'Gasoline', tankCapacity: 18.0 },
          { name: 'Dual Motor Banshee Electric (496-670 hp)', fuelType: 'Electric' },
        ],
        defaultTankCapacity: 18.5,
      },
      {
        name: 'Challenger',
        startYear: 1970,
        endYear: 2023,
        trims: ['SXT', 'GT', 'R/T', 'R/T Scat Pack', 'SRT Hellcat', 'Hellcat Redeye', 'Super Stock', 'Demon 170'],
        engines: [
          { name: '3.6L Pentastar V6 (303 hp)', fuelType: 'Gasoline', tankCapacity: 18.5 },
          { name: '5.7L HEMI V8 (375 hp - R/T)', fuelType: 'Gasoline', tankCapacity: 18.5 },
          { name: '6.4L 392 HEMI V8 (485 hp - Scat Pack)', fuelType: 'Gasoline', tankCapacity: 18.5 },
          { name: '6.2L Supercharged HEMI V8 (717 hp - Hellcat)', fuelType: 'Gasoline', tankCapacity: 18.5 },
          { name: '6.2L Supercharged HEMI V8 (1025 hp - Demon 170)', fuelType: 'E85', tankCapacity: 18.5 },
        ],
        defaultTankCapacity: 18.5,
      },
      {
        name: 'Durango',
        startYear: 1998,
        endYear: 9999,
        trims: ['SXT', 'GT', 'R/T', 'Citadel', 'SRT 392', 'SRT Hellcat'],
        engines: [
          { name: '3.6L Pentastar V6 (295 hp)', fuelType: 'Gasoline', tankCapacity: 24.6 },
          { name: '5.7L HEMI V8 (360 hp - R/T)', fuelType: 'Gasoline', tankCapacity: 24.6 },
          { name: '6.4L 392 HEMI V8 (475 hp - SRT 392)', fuelType: 'Gasoline', tankCapacity: 24.6 },
          { name: '6.2L Supercharged HEMI V8 (710 hp - Hellcat)', fuelType: 'Gasoline', tankCapacity: 24.6 },
        ],
        defaultTankCapacity: 24.6,
      },
      {
        name: 'Hornet',
        startYear: 2023,
        endYear: 9999,
        trims: ['GT', 'GT Plus', 'R/T PHEV', 'R/T Plus PHEV'],
        engines: [
          { name: '2.0L Turbo Hurricane4 I4 (268 hp - GT)', fuelType: 'Gasoline', tankCapacity: 13.5 },
          { name: '1.3L Turbo I4 Plug-In Hybrid (288 hp - R/T)', fuelType: 'Hybrid', tankCapacity: 11.2 },
        ],
        defaultTankCapacity: 13.5,
      },
    ],
  },
  {
    make: 'Ford',
    models: [
      {
        name: 'F-150',
        startYear: 1975,
        endYear: 9999,
        trims: ['XL', 'STX', 'XLT', 'Lariat', 'King Ranch', 'Platinum', 'Tremor', 'Raptor', 'Raptor R', 'Lightning Pro', 'Lightning Lariat', 'Lightning Platinum'],
        engines: [
          { name: '2.7L EcoBoost Twin-Turbo V6 (325 hp)', fuelType: 'Gasoline', tankCapacity: 26.0 },
          { name: '3.5L EcoBoost Twin-Turbo V6 (400 hp)', fuelType: 'Gasoline', tankCapacity: 26.0 },
          { name: '3.5L PowerBoost Full-Hybrid V6 (430 hp)', fuelType: 'Hybrid', tankCapacity: 30.6 },
          { name: '5.0L Ti-VCT Coyote V8 (400 hp)', fuelType: 'Gasoline', tankCapacity: 26.0 },
          { name: '3.5L High-Output EcoBoost V6 (450 hp - Raptor)', fuelType: 'Gasoline', tankCapacity: 36.0 },
          { name: '5.2L Supercharged Predator V8 (720 hp - Raptor R)', fuelType: 'Gasoline', tankCapacity: 36.0 },
          { name: 'Dual Motor Standard Range (452 hp - Lightning)', fuelType: 'Electric' },
          { name: 'Dual Motor Extended Range (580 hp - Lightning)', fuelType: 'Electric' },
        ],
        defaultTankCapacity: 26.0,
      },
      {
        name: 'Mustang',
        startYear: 1964,
        endYear: 9999,
        trims: ['EcoBoost', 'EcoBoost Premium', 'GT', 'GT Premium', 'Dark Horse', 'Dark Horse Premium', 'Mach 1', 'Shelby GT350', 'Shelby GT500', 'GTD'],
        engines: [
          { name: '2.3L EcoBoost Turbo I4 (315 hp)', fuelType: 'Gasoline', tankCapacity: 16.0 },
          { name: '5.0L Gen-4 Coyote V8 (486 hp - GT)', fuelType: 'Gasoline', tankCapacity: 16.0 },
          { name: '5.0L Gen-4 Coyote V8 (500 hp - Dark Horse)', fuelType: 'Gasoline', tankCapacity: 16.0 },
          { name: '5.2L Voodoo Flat-Plane Crank V8 (526 hp - GT350)', fuelType: 'Gasoline', tankCapacity: 16.0 },
          { name: '5.2L Supercharged Predator V8 (760 hp - GT500)', fuelType: 'Gasoline', tankCapacity: 16.0 },
          { name: '5.2L Supercharged V8 (800+ hp - GTD)', fuelType: 'Gasoline', tankCapacity: 16.0 },
        ],
        defaultTankCapacity: 16.0,
      },
      {
        name: 'Bronco',
        startYear: 1966,
        endYear: 9999,
        trims: ['Base', 'Big Bend', 'Black Diamond', 'Outer Banks', 'Badlands', 'Wildtrak', 'Everglades', 'Heritage', 'Raptor'],
        engines: [
          { name: '2.3L EcoBoost Turbo I4 (300 hp)', fuelType: 'Gasoline', tankCapacity: 20.8 },
          { name: '2.7L EcoBoost Twin-Turbo V6 (330 hp)', fuelType: 'Gasoline', tankCapacity: 20.8 },
          { name: '3.0L EcoBoost Twin-Turbo V6 (418 hp - Raptor)', fuelType: 'Gasoline', tankCapacity: 20.8 },
        ],
        defaultTankCapacity: 20.8,
      },
      {
        name: 'Explorer',
        startYear: 1991,
        endYear: 9999,
        trims: ['Active', 'ST-Line', 'ST', 'Platinum', 'Timberline', 'King Ranch'],
        engines: [
          { name: '2.3L EcoBoost Turbo I4 (300 hp)', fuelType: 'Gasoline', tankCapacity: 17.9 },
          { name: '3.0L EcoBoost Twin-Turbo V6 (400 hp - ST)', fuelType: 'Gasoline', tankCapacity: 20.2 },
          { name: '3.3L Hybrid V6 (318 hp)', fuelType: 'Hybrid', tankCapacity: 18.0 },
        ],
        defaultTankCapacity: 17.9,
      },
      {
        name: 'Maverick',
        startYear: 2022,
        endYear: 9999,
        trims: ['XL', 'XLT', 'Lariat', 'Tremor', 'Lobo'],
        engines: [
          { name: '2.5L Hybrid FWD/AWD (191 hp)', fuelType: 'Hybrid', tankCapacity: 13.8 },
          { name: '2.0L EcoBoost Turbo I4 (250 hp)', fuelType: 'Gasoline', tankCapacity: 16.5 },
        ],
        defaultTankCapacity: 15.0,
      },
      {
        name: 'Mustang Mach-E',
        startYear: 2021,
        endYear: 9999,
        trims: ['Select', 'Premium', 'California Route 1', 'GT', 'GT Performance', 'Rally'],
        engines: [
          { name: 'Single Motor Standard Range (266 hp)', fuelType: 'Electric' },
          { name: 'Dual Motor Extended Range (346 hp)', fuelType: 'Electric' },
          { name: 'Dual Motor GT (480 hp / 600 lb-ft)', fuelType: 'Electric' },
          { name: 'Dual Motor GT Performance (480 hp / 700 lb-ft)', fuelType: 'Electric' },
        ],
      },
      {
        name: 'Super Duty (F-250 / F-350)',
        startYear: 1999,
        endYear: 9999,
        trims: ['XL', 'XLT', 'Lariat', 'King Ranch', 'Platinum', 'Limited'],
        engines: [
          { name: '6.8L 2V DEVCT NA PFI V8 (405 hp)', fuelType: 'Gasoline', tankCapacity: 34.0 },
          { name: '7.3L Godzilla OHV PFI V8 (430 hp)', fuelType: 'Gasoline', tankCapacity: 34.0 },
          { name: '6.7L Power Stroke V8 Turbo Diesel (475 hp / 1050 lb-ft)', fuelType: 'Diesel', tankCapacity: 34.0 },
          { name: '6.7L High Output Power Stroke Diesel (500 hp / 1200 lb-ft)', fuelType: 'Diesel', tankCapacity: 34.0 },
        ],
        defaultTankCapacity: 34.0,
      },
    ],
  },
  {
    make: 'GMC',
    models: [
      {
        name: 'Sierra 1500',
        startYear: 1999,
        endYear: 9999,
        trims: ['Pro', 'SLE', 'Elevation', 'SLT', 'AT4', 'AT4X', 'Denali', 'Denali Ultimate'],
        engines: [
          { name: '2.7L TurboMax I4 (310 hp / 430 lb-ft)', fuelType: 'Gasoline', tankCapacity: 24.0 },
          { name: '5.3L EcoTec3 V8 (355 hp)', fuelType: 'Gasoline', tankCapacity: 24.0 },
          { name: '6.2L EcoTec3 V8 (420 hp)', fuelType: 'Gasoline', tankCapacity: 24.0 },
          { name: '3.0L Duramax Turbo-Diesel I6 (305 hp)', fuelType: 'Diesel', tankCapacity: 24.0 },
        ],
        defaultTankCapacity: 24.0,
      },
      {
        name: 'Yukon / Yukon XL',
        startYear: 1992,
        endYear: 9999,
        trims: ['SLE', 'SLT', 'AT4', 'AT4 Ultimate', 'Denali', 'Denali Ultimate'],
        engines: [
          { name: '5.3L EcoTec3 V8 (355 hp)', fuelType: 'Gasoline', tankCapacity: 24.0 },
          { name: '6.2L EcoTec3 V8 (420 hp)', fuelType: 'Gasoline', tankCapacity: 24.0 },
          { name: '3.0L Duramax Turbo-Diesel I6 (305 hp)', fuelType: 'Diesel', tankCapacity: 24.0 },
        ],
        defaultTankCapacity: 24.0,
      },
      {
        name: 'Canyon',
        startYear: 2004,
        endYear: 9999,
        trims: ['Elevation', 'AT4', 'Denali', 'AT4X', 'AT4X AEV Edition'],
        engines: [
          { name: '2.7L TurboMax I4 (310 hp / 430 lb-ft)', fuelType: 'Gasoline', tankCapacity: 21.4 },
        ],
        defaultTankCapacity: 21.4,
      },
      {
        name: 'Hummer EV',
        startYear: 2022,
        endYear: 9999,
        trims: ['2X', '3X', 'Edition 1', 'Omega Edition'],
        engines: [
          { name: 'Dual Motor Electric AWD (570 hp)', fuelType: 'Electric' },
          { name: 'Tri-Motor Electric AWD (1000 hp)', fuelType: 'Electric' },
        ],
      },
    ],
  },
  {
    make: 'Honda',
    models: [
      {
        name: 'Civic',
        startYear: 1972,
        endYear: 9999,
        trims: ['LX', 'Sport', 'EX', 'EX-L', 'Touring', 'Sport Touring', 'Si', 'Type R', 'Sport Hybrid', 'Sport Touring Hybrid'],
        engines: [
          { name: '2.0L DOHC i-VTEC I4 (158 hp)', fuelType: 'Gasoline', tankCapacity: 12.4 },
          { name: '1.5L Turbo I4 (180 hp)', fuelType: 'Gasoline', tankCapacity: 12.4 },
          { name: '1.5L Turbo I4 (200 hp - Si)', fuelType: 'Gasoline', tankCapacity: 12.4 },
          { name: '2.0L Turbo VTEC I4 (315 hp - Type R)', fuelType: 'Gasoline', tankCapacity: 12.4 },
          { name: '2.0L Two-Motor Hybrid (200 hp)', fuelType: 'Hybrid', tankCapacity: 10.6 },
        ],
        defaultTankCapacity: 12.4,
      },
      {
        name: 'Accord',
        startYear: 1976,
        endYear: 9999,
        trims: ['LX', 'EX', 'Sport', 'Sport-L Hybrid', 'EX-L Hybrid', 'Touring Hybrid', '2.0T Touring'],
        engines: [
          { name: '1.5L Turbo I4 (192 hp)', fuelType: 'Gasoline', tankCapacity: 14.8 },
          { name: '2.0L Two-Motor Hybrid (204 hp)', fuelType: 'Hybrid', tankCapacity: 12.8 },
          { name: '2.0L Turbo VTEC I4 (252 hp - Past Gen)', fuelType: 'Gasoline', tankCapacity: 14.8 },
          { name: '3.5L V6 (278 hp - Past Gen)', fuelType: 'Gasoline', tankCapacity: 17.2 },
        ],
        defaultTankCapacity: 14.8,
      },
      {
        name: 'CR-V',
        startYear: 1997,
        endYear: 9999,
        trims: ['LX', 'EX', 'EX-L', 'Sport Hybrid', 'Sport-L Hybrid', 'Sport Touring Hybrid'],
        engines: [
          { name: '1.5L Turbo I4 (190 hp)', fuelType: 'Gasoline', tankCapacity: 14.0 },
          { name: '2.0L Two-Motor Hybrid AWD (204 hp)', fuelType: 'Hybrid', tankCapacity: 14.0 },
        ],
        defaultTankCapacity: 14.0,
      },
      {
        name: 'Pilot',
        startYear: 2003,
        endYear: 9999,
        trims: ['LX', 'Sport', 'EX-L', 'Touring', 'TrailSport', 'Elite', 'Black Edition'],
        engines: [
          { name: '3.5L 24-Valve DOHC V6 (285 hp)', fuelType: 'Gasoline', tankCapacity: 18.5 },
        ],
        defaultTankCapacity: 18.5,
      },
      {
        name: 'S2000',
        startYear: 1999,
        endYear: 2009,
        trims: ['Base (AP1)', 'Base (AP2)', 'Club Racer (CR)'],
        engines: [
          { name: '2.0L F20C VTEC I4 9000RPM (240 hp)', fuelType: 'Gasoline', tankCapacity: 13.2 },
          { name: '2.2L F22C1 VTEC I4 8200RPM (237 hp)', fuelType: 'Gasoline', tankCapacity: 13.2 },
        ],
        defaultTankCapacity: 13.2,
      },
      {
        name: 'Ridgeline',
        startYear: 2006,
        endYear: 9999,
        trims: ['Sport', 'RTL', 'TrailSport', 'Black Edition'],
        engines: [
          { name: '3.5L i-VTEC V6 (280 hp)', fuelType: 'Gasoline', tankCapacity: 19.5 },
        ],
        defaultTankCapacity: 19.5,
      },
    ],
  },
  {
    make: 'Hyundai',
    models: [
      {
        name: 'Elantra / Elantra N',
        startYear: 1990,
        endYear: 9999,
        trims: ['SE', 'SEL', 'Limited', 'N Line', 'Elantra Hybrid Blue', 'Elantra Hybrid Limited', 'Elantra N'],
        engines: [
          { name: '2.0L MPI I4 (147 hp)', fuelType: 'Gasoline', tankCapacity: 12.4 },
          { name: '1.6L Turbo GDI I4 (201 hp - N Line)', fuelType: 'Gasoline', tankCapacity: 12.4 },
          { name: '1.6L Hybrid (139 hp)', fuelType: 'Hybrid', tankCapacity: 11.1 },
          { name: '2.0L Flat-Power Turbo I4 (276 hp - Elantra N)', fuelType: 'Gasoline', tankCapacity: 12.4 },
        ],
        defaultTankCapacity: 12.4,
      },
      {
        name: 'Sonata',
        startYear: 1989,
        endYear: 9999,
        trims: ['SEL', 'N Line', 'SEL Hybrid', 'Limited Hybrid'],
        engines: [
          { name: '2.5L GDI I4 (191 hp)', fuelType: 'Gasoline', tankCapacity: 15.9 },
          { name: '2.5L Turbo GDI I4 (290 hp - N Line)', fuelType: 'Gasoline', tankCapacity: 15.9 },
          { name: '2.0L Hybrid (192 hp)', fuelType: 'Hybrid', tankCapacity: 13.2 },
        ],
        defaultTankCapacity: 15.9,
      },
      {
        name: 'Tucson',
        startYear: 2004,
        endYear: 9999,
        trims: ['SE', 'SEL', 'XRT', 'N Line', 'Limited', 'Blue Hybrid', 'SEL Convenience Hybrid', 'Limited Hybrid', 'PHEV'],
        engines: [
          { name: '2.5L GDI I4 (187 hp)', fuelType: 'Gasoline', tankCapacity: 14.3 },
          { name: '1.6L Turbo Hybrid AWD (231 hp)', fuelType: 'Hybrid', tankCapacity: 13.7 },
          { name: '1.6L Turbo Plug-In Hybrid AWD (268 hp)', fuelType: 'Hybrid', tankCapacity: 11.1 },
        ],
        defaultTankCapacity: 14.3,
      },
      {
        name: 'Palisade',
        startYear: 2020,
        endYear: 9999,
        trims: ['SE', 'SEL', 'XRT', 'Limited', 'Calligraphy', 'Calligraphy Night'],
        engines: [
          { name: '3.8L GDI V6 (291 hp)', fuelType: 'Gasoline', tankCapacity: 18.8 },
        ],
        defaultTankCapacity: 18.8,
      },
      {
        name: 'IONIQ 5 / IONIQ 5 N',
        startYear: 2022,
        endYear: 9999,
        trims: ['Standard Range RWD', 'Long Range RWD', 'Long Range AWD', 'D100 Platinum', 'IONIQ 5 N'],
        engines: [
          { name: 'Single Motor Standard Range (168 hp)', fuelType: 'Electric' },
          { name: 'Single Motor Long Range (225 hp)', fuelType: 'Electric' },
          { name: 'Dual Motor AWD (320 hp)', fuelType: 'Electric' },
          { name: 'Dual Motor AWD N Performance (641 hp - IONIQ 5 N)', fuelType: 'Electric' },
        ],
      },
      {
        name: 'Santa Cruz',
        startYear: 2022,
        endYear: 9999,
        trims: ['SE', 'SEL', 'Night', 'XRT', 'Limited'],
        engines: [
          { name: '2.5L GDI I4 (191 hp)', fuelType: 'Gasoline', tankCapacity: 17.7 },
          { name: '2.5L Turbo GDI I4 (281 hp)', fuelType: 'Gasoline', tankCapacity: 17.7 },
        ],
        defaultTankCapacity: 17.7,
      },
    ],
  },
  {
    make: 'Jeep',
    models: [
      {
        name: 'Wrangler',
        startYear: 1987,
        endYear: 9999,
        trims: ['Sport', 'Sport S', 'Willys', 'Sahara', 'Rubicon', 'Rubicon X', 'Rubicon 392', '4xe Sahara', '4xe Willys', '4xe Rubicon'],
        engines: [
          { name: '3.6L Pentastar V6 (285 hp)', fuelType: 'Gasoline', tankCapacity: 21.5 },
          { name: '2.0L Turbo I4 (270 hp)', fuelType: 'Gasoline', tankCapacity: 21.5 },
          { name: '2.0L Turbo PHEV 4xe (375 hp)', fuelType: 'Hybrid', tankCapacity: 17.2 },
          { name: '6.4L 392 HEMI V8 (470 hp - Rubicon 392)', fuelType: 'Gasoline', tankCapacity: 21.5 },
        ],
        defaultTankCapacity: 21.5,
      },
      {
        name: 'Grand Cherokee',
        startYear: 1993,
        endYear: 9999,
        trims: ['Laredo', 'Altitude', 'Limited', 'Overland', 'Summit', 'Summit Reserve', 'Trailhawk 4xe', 'Overland 4xe', 'Trackhawk'],
        engines: [
          { name: '3.6L Pentastar V6 (293 hp)', fuelType: 'Gasoline', tankCapacity: 23.0 },
          { name: '2.0L Turbo PHEV 4xe (375 hp)', fuelType: 'Hybrid', tankCapacity: 19.0 },
          { name: '5.7L HEMI V8 (357 hp)', fuelType: 'Gasoline', tankCapacity: 24.6 },
          { name: '6.2L Supercharged HEMI V8 (707 hp - Trackhawk)', fuelType: 'Gasoline', tankCapacity: 24.6 },
        ],
        defaultTankCapacity: 23.0,
      },
      {
        name: 'Gladiator',
        startYear: 2020,
        endYear: 9999,
        trims: ['Sport', 'Sport S', 'Willys', 'Mojave', 'Mojave X', 'Rubicon', 'Rubicon X'],
        engines: [
          { name: '3.6L Pentastar V6 (285 hp)', fuelType: 'Gasoline', tankCapacity: 22.0 },
          { name: '3.0L EcoDiesel V6 (260 hp / 442 lb-ft)', fuelType: 'Diesel', tankCapacity: 19.0 },
        ],
        defaultTankCapacity: 22.0,
      },
    ],
  },
  {
    make: 'Kia',
    models: [
      {
        name: 'K5 (Optima)',
        startYear: 2000,
        endYear: 9999,
        trims: ['LXS', 'GT-Line', 'EX', 'GT'],
        engines: [
          { name: '2.5L GDI I4 (191 hp)', fuelType: 'Gasoline', tankCapacity: 15.8 },
          { name: '1.6L Turbo I4 (180 hp)', fuelType: 'Gasoline', tankCapacity: 15.8 },
          { name: '2.5L Turbo I4 (290 hp - GT)', fuelType: 'Gasoline', tankCapacity: 15.8 },
        ],
        defaultTankCapacity: 15.8,
      },
      {
        name: 'Stinger',
        startYear: 2018,
        endYear: 2023,
        trims: ['GT-Line', 'GT1', 'GT2', 'Tribute Edition'],
        engines: [
          { name: '2.5L Turbo I4 (300 hp)', fuelType: 'Gasoline', tankCapacity: 15.9 },
          { name: '3.3L Twin-Turbo V6 (368 hp - GT)', fuelType: 'Gasoline', tankCapacity: 15.9 },
          { name: '2.0L Turbo I4 (255 hp)', fuelType: 'Gasoline', tankCapacity: 15.9 },
        ],
        defaultTankCapacity: 15.9,
      },
      {
        name: 'Telluride',
        startYear: 2020,
        endYear: 9999,
        trims: ['LX', 'S', 'EX', 'SX', 'SX Prestige', 'X-Line', 'X-Pro'],
        engines: [
          { name: '3.8L Lambda II V6 (291 hp)', fuelType: 'Gasoline', tankCapacity: 18.8 },
        ],
        defaultTankCapacity: 18.8,
      },
      {
        name: 'EV6 / EV6 GT',
        startYear: 2022,
        endYear: 9999,
        trims: ['Light RWD', 'Wind RWD', 'Wind AWD', 'GT-Line RWD', 'GT-Line AWD', 'GT'],
        engines: [
          { name: 'Single Motor RWD (225 hp)', fuelType: 'Electric' },
          { name: 'Dual Motor AWD (320 hp)', fuelType: 'Electric' },
          { name: 'Dual Motor GT AWD (576 hp)', fuelType: 'Electric' },
        ],
      },
      {
        name: 'EV9',
        startYear: 2024,
        endYear: 9999,
        trims: ['Light RWD', 'Wind AWD', 'Land AWD', 'GT-Line AWD'],
        engines: [
          { name: 'Single Motor Long Range RWD (201 hp)', fuelType: 'Electric' },
          { name: 'Dual Motor AWD (379 hp)', fuelType: 'Electric' },
        ],
      },
    ],
  },
  {
    make: 'Lexus',
    models: [
      {
        name: 'IS',
        startYear: 1999,
        endYear: 9999,
        trims: ['IS 300', 'IS 300 AWD', 'IS 350 F SPORT', 'IS 500 F SPORT Performance', 'IS F'],
        engines: [
          { name: '2.0L Turbo I4 (241 hp - IS 300)', fuelType: 'Gasoline', tankCapacity: 17.4 },
          { name: '3.5L V6 (260 hp - IS 300 AWD)', fuelType: 'Gasoline', tankCapacity: 17.4 },
          { name: '3.5L V6 (311 hp - IS 350)', fuelType: 'Gasoline', tankCapacity: 17.4 },
          { name: '5.0L 2UR-GSE V8 (472 hp - IS 500)', fuelType: 'Gasoline', tankCapacity: 17.4 },
          { name: '5.0L 2UR-GSE V8 (416 hp - IS F)', fuelType: 'Gasoline', tankCapacity: 16.9 },
        ],
        defaultTankCapacity: 17.4,
      },
      {
        name: 'ES',
        startYear: 1989,
        endYear: 9999,
        trims: ['ES 250 AWD', 'ES 350', 'ES 350 F SPORT', 'ES 300h Hybrid', 'ES 300h Ultra Luxury'],
        engines: [
          { name: '2.5L I4 AWD (203 hp - ES 250)', fuelType: 'Gasoline', tankCapacity: 15.9 },
          { name: '3.5L V6 (302 hp - ES 350)', fuelType: 'Gasoline', tankCapacity: 15.9 },
          { name: '2.5L Hybrid (215 hp - ES 300h)', fuelType: 'Hybrid', tankCapacity: 13.2 },
        ],
        defaultTankCapacity: 15.9,
      },
      {
        name: 'RX',
        startYear: 1998,
        endYear: 9999,
        trims: ['RX 350', 'RX 350 Premium', 'RX 350 F SPORT', 'RX 350h Hybrid', 'RX 450h+ PHEV', 'RX 500h F SPORT Performance'],
        engines: [
          { name: '2.4L Turbo I4 (275 hp - RX 350)', fuelType: 'Gasoline', tankCapacity: 17.8 },
          { name: '2.5L Hybrid AWD (246 hp - RX 350h)', fuelType: 'Hybrid', tankCapacity: 17.2 },
          { name: '2.5L Plug-In Hybrid AWD (304 hp - RX 450h+)', fuelType: 'Hybrid', tankCapacity: 14.5 },
          { name: '2.4L Turbo Hybrid AWD (366 hp - RX 500h)', fuelType: 'Hybrid', tankCapacity: 17.2 },
        ],
        defaultTankCapacity: 17.8,
      },
      {
        name: 'GX',
        startYear: 2002,
        endYear: 9999,
        trims: ['GX 550 Premium', 'GX 550 Luxury', 'GX 550 Overtrail', 'GX 550 Overtrail+', 'GX 460'],
        engines: [
          { name: '3.4L Twin-Turbo V6 (349 hp / 479 lb-ft - GX 550)', fuelType: 'Gasoline', tankCapacity: 21.1 },
          { name: '4.6L 1UR-FE V8 (301 hp - GX 460)', fuelType: 'Gasoline', tankCapacity: 23.0 },
          { name: '4.7L 2UZ-FE V8 (263 hp - GX 470)', fuelType: 'Gasoline', tankCapacity: 23.0 },
        ],
        defaultTankCapacity: 21.1,
      },
      {
        name: 'LC',
        startYear: 2018,
        endYear: 9999,
        trims: ['LC 500 Coupe', 'LC 500 Convertible', 'LC 500h Hybrid', 'Bespoke Build', 'Inspiration Series'],
        engines: [
          { name: '5.0L Naturally Aspirated 2UR-GSE V8 (471 hp)', fuelType: 'Gasoline', tankCapacity: 21.7 },
          { name: '3.5L Multi-Stage Hybrid V6 (354 hp)', fuelType: 'Hybrid', tankCapacity: 22.2 },
        ],
        defaultTankCapacity: 21.7,
      },
    ],
  },
  {
    make: 'Mazda',
    models: [
      {
        name: 'Mazda3',
        startYear: 2004,
        endYear: 9999,
        trims: ['2.5 S', 'Select Sport', 'Preferred', 'Carbon Edition', 'Premium', 'Carbon Turbo', 'Turbo Premium Plus', 'Speed3 (Past Gen)'],
        engines: [
          { name: '2.5L Skyactiv-G I4 (191 hp)', fuelType: 'Gasoline', tankCapacity: 13.2 },
          { name: '2.5L Skyactiv-G Dynamic Pressure Turbo I4 (250 hp / 320 lb-ft)', fuelType: 'Gasoline', tankCapacity: 12.7 },
          { name: '2.3L MZR DISI Turbo I4 (263 hp - Mazdaspeed3)', fuelType: 'Gasoline', tankCapacity: 15.9 },
        ],
        defaultTankCapacity: 13.2,
      },
      {
        name: 'CX-5',
        startYear: 2013,
        endYear: 9999,
        trims: ['2.5 S Select', '2.5 S Preferred', '2.5 S Carbon', '2.5 S Premium', '2.5 Carbon Turbo', '2.5 Turbo Signature'],
        engines: [
          { name: '2.5L Skyactiv-G I4 (187 hp)', fuelType: 'Gasoline', tankCapacity: 15.3 },
          { name: '2.5L Skyactiv-G Turbo I4 (256 hp)', fuelType: 'Gasoline', tankCapacity: 15.3 },
        ],
        defaultTankCapacity: 15.3,
      },
      {
        name: 'CX-50',
        startYear: 2023,
        endYear: 9999,
        trims: ['2.5 S Select', '2.5 S Preferred', '2.5 S Premium', '2.5 Turbo', '2.5 Turbo Meridian Edition', 'Hybrid Preferred', 'Hybrid Premium'],
        engines: [
          { name: '2.5L Skyactiv-G I4 (187 hp)', fuelType: 'Gasoline', tankCapacity: 15.8 },
          { name: '2.5L Skyactiv-G Turbo I4 (256 hp)', fuelType: 'Gasoline', tankCapacity: 15.8 },
          { name: '2.5L Toyota-Hybrid System AWD (219 hp)', fuelType: 'Hybrid', tankCapacity: 14.5 },
        ],
        defaultTankCapacity: 15.8,
      },
      {
        name: 'CX-90',
        startYear: 2024,
        endYear: 9999,
        trims: ['3.3 Turbo Select', '3.3 Turbo Preferred', '3.3 Turbo Premium', '3.3 Turbo S', '3.3 Turbo S Premium Plus', 'PHEV Preferred', 'PHEV Premium'],
        engines: [
          { name: '3.3L e-Skyactiv Turbo Inline-6 (280 hp)', fuelType: 'Gasoline', tankCapacity: 19.6 },
          { name: '3.3L e-Skyactiv Turbo Inline-6 High-Output (340 hp)', fuelType: 'Gasoline', tankCapacity: 19.6 },
          { name: '2.5L e-Skyactiv Plug-In Hybrid AWD (323 hp)', fuelType: 'Hybrid', tankCapacity: 18.5 },
        ],
        defaultTankCapacity: 19.6,
      },
      {
        name: 'MX-5 Miata',
        startYear: 1989,
        endYear: 9999,
        trims: ['Sport', 'Club', 'Club w/ Brembo BBS', 'Grand Touring', 'RF Club', 'RF Grand Touring'],
        engines: [
          { name: '2.0L Skyactiv-G I4 7500RPM (181 hp - ND2/ND3)', fuelType: 'Gasoline', tankCapacity: 11.9 },
          { name: '2.0L Skyactiv-G I4 (155 hp - ND1)', fuelType: 'Gasoline', tankCapacity: 11.9 },
          { name: '2.0L MZR I4 (167 hp - NC)', fuelType: 'Gasoline', tankCapacity: 12.7 },
          { name: '1.8L BP-4W / BP-Z3 I4 (142 hp - NB)', fuelType: 'Gasoline', tankCapacity: 12.7 },
          { name: '1.6L / 1.8L B6ZE / BP-ZE (116-133 hp - NA)', fuelType: 'Gasoline', tankCapacity: 11.9 },
        ],
        defaultTankCapacity: 11.9,
      },
    ],
  },
  {
    make: 'Mercedes-Benz',
    models: [
      {
        name: 'C-Class / C 43 / C 63',
        startYear: 1993,
        endYear: 9999,
        trims: ['C 300', 'C 300 4MATIC', 'Pinnacle', 'AMG C 43', 'AMG C 63 S E PERFORMANCE'],
        engines: [
          { name: '2.0L Turbo Mild-Hybrid I4 (255 hp - C 300)', fuelType: 'Gasoline', tankCapacity: 17.4 },
          { name: '2.0L Turbo Electric-Exhaust I4 (402 hp - AMG C 43)', fuelType: 'Gasoline', tankCapacity: 17.4 },
          { name: '2.0L Turbo + Rear Electric Motor Plug-In (671 hp - AMG C 63 S)', fuelType: 'Hybrid', tankCapacity: 17.4 },
          { name: '4.0L Bi-Turbo V8 (503 hp - Past AMG C 63 S)', fuelType: 'Gasoline', tankCapacity: 17.4 },
        ],
        defaultTankCapacity: 17.4,
      },
      {
        name: 'E-Class / E 53 / E 63',
        startYear: 1993,
        endYear: 9999,
        trims: ['E 350', 'E 450 4MATIC', 'AMG E 53 Hybrid', 'AMG E 63 S'],
        engines: [
          { name: '2.0L Turbo Mild-Hybrid I4 (255 hp - E 350)', fuelType: 'Gasoline', tankCapacity: 17.4 },
          { name: '3.0L Turbo Mild-Hybrid Inline-6 (375 hp - E 450)', fuelType: 'Gasoline', tankCapacity: 17.4 },
          { name: '3.0L Turbo Inline-6 Hybrid (577 hp - AMG E 53)', fuelType: 'Hybrid', tankCapacity: 17.4 },
          { name: '4.0L Bi-Turbo V8 (603 hp - AMG E 63 S)', fuelType: 'Gasoline', tankCapacity: 17.4 },
        ],
        defaultTankCapacity: 17.4,
      },
      {
        name: 'GLC / GLC Coupe',
        startYear: 2016,
        endYear: 9999,
        trims: ['GLC 300', 'GLC 300 4MATIC', 'AMG GLC 43', 'AMG GLC 63 S E PERFORMANCE'],
        engines: [
          { name: '2.0L Turbo Mild-Hybrid I4 (255 hp)', fuelType: 'Gasoline', tankCapacity: 16.4 },
          { name: '2.0L Turbo AMG I4 (416 hp - GLC 43)', fuelType: 'Gasoline', tankCapacity: 16.4 },
          { name: '2.0L Turbo Hybrid (671 hp - GLC 63 S)', fuelType: 'Hybrid', tankCapacity: 16.4 },
        ],
        defaultTankCapacity: 16.4,
      },
      {
        name: 'GLE / GLE Coupe',
        startYear: 1997,
        endYear: 9999,
        trims: ['GLE 350', 'GLE 450', 'GLE 450e PHEV', 'GLE 580', 'AMG GLE 53', 'AMG GLE 63 S'],
        engines: [
          { name: '2.0L Turbo I4 (255 hp - GLE 350)', fuelType: 'Gasoline', tankCapacity: 22.5 },
          { name: '3.0L Turbo Inline-6 (375 hp - GLE 450)', fuelType: 'Gasoline', tankCapacity: 22.5 },
          { name: '2.0L Turbo Plug-In Hybrid (381 hp - GLE 450e)', fuelType: 'Hybrid', tankCapacity: 17.2 },
          { name: '4.0L Bi-Turbo V8 (510 hp - GLE 580)', fuelType: 'Gasoline', tankCapacity: 22.5 },
          { name: '3.0L Turbo Inline-6 (429 hp - AMG 53)', fuelType: 'Gasoline', tankCapacity: 22.5 },
          { name: '4.0L Bi-Turbo V8 (603 hp - AMG 63 S)', fuelType: 'Gasoline', tankCapacity: 22.5 },
        ],
        defaultTankCapacity: 22.5,
      },
      {
        name: 'G-Class (G-Wagon)',
        startYear: 1979,
        endYear: 9999,
        trims: ['G 550', 'AMG G 63', 'G 580 with EQ Technology'],
        engines: [
          { name: '3.0L Turbo Inline-6 Mild-Hybrid (443 hp - G 550)', fuelType: 'Gasoline', tankCapacity: 26.4 },
          { name: '4.0L Bi-Turbo V8 (577 hp - AMG G 63)', fuelType: 'Gasoline', tankCapacity: 26.4 },
          { name: 'Quad-Motor Electric AWD (579 hp - G 580 EQ)', fuelType: 'Electric' },
        ],
        defaultTankCapacity: 26.4,
      },
    ],
  },
  {
    make: 'Nissan',
    models: [
      {
        name: 'Z (350Z / 370Z / Fairlady Z)',
        startYear: 1969,
        endYear: 9999,
        trims: ['Sport', 'Performance', 'NISMO', 'Heritage Edition', 'Touring (370Z)', 'Track (350Z)'],
        engines: [
          { name: '3.0L Twin-Turbo VR30DDTT V6 (400 hp - Z)', fuelType: 'Gasoline', tankCapacity: 16.4 },
          { name: '3.0L Twin-Turbo VR30DDTT V6 (420 hp - NISMO)', fuelType: 'Gasoline', tankCapacity: 16.4 },
          { name: '3.7L VQ37VHR V6 (332-350 hp - 370Z)', fuelType: 'Gasoline', tankCapacity: 19.0 },
          { name: '3.5L VQ35DE / VQ35HR V6 (287-306 hp - 350Z)', fuelType: 'Gasoline', tankCapacity: 20.0 },
        ],
        defaultTankCapacity: 16.4,
      },
      {
        name: 'GT-R',
        startYear: 2008,
        endYear: 2024,
        trims: ['Premium', 'T-spec', 'NISMO', 'NISMO Appearance Package', 'Track Edition'],
        engines: [
          { name: '3.8L Twin-Turbo VR38DETT V6 (565 hp)', fuelType: 'Gasoline', tankCapacity: 19.5 },
          { name: '3.8L Twin-Turbo VR38DETT V6 (600 hp - NISMO)', fuelType: 'Gasoline', tankCapacity: 19.5 },
        ],
        defaultTankCapacity: 19.5,
      },
      {
        name: 'Altima',
        startYear: 1993,
        endYear: 9999,
        trims: ['S', 'SV', 'SR', 'SL', 'SR VC-Turbo'],
        engines: [
          { name: '2.5L DOHC I4 (188 hp)', fuelType: 'Gasoline', tankCapacity: 16.2 },
          { name: '2.0L Variable Compression VC-Turbo I4 (248 hp)', fuelType: 'Gasoline', tankCapacity: 16.2 },
        ],
        defaultTankCapacity: 16.2,
      },
      {
        name: 'Rogue',
        startYear: 2008,
        endYear: 9999,
        trims: ['S', 'SV', 'Midnight Edition', 'SL', 'Platinum'],
        engines: [
          { name: '1.5L VC-Turbo 3-Cylinder (201 hp / 225 lb-ft)', fuelType: 'Gasoline', tankCapacity: 14.5 },
          { name: '2.5L DOHC I4 (181 hp - Past Gen)', fuelType: 'Gasoline', tankCapacity: 14.5 },
        ],
        defaultTankCapacity: 14.5,
      },
      {
        name: 'Frontier',
        startYear: 1997,
        endYear: 9999,
        trims: ['King Cab S', 'Crew Cab SV', 'PRO-X', 'PRO-4X', 'Hardbody Edition', 'SL'],
        engines: [
          { name: '3.8L Direct-Injection V6 (310 hp)', fuelType: 'Gasoline', tankCapacity: 21.0 },
          { name: '4.0L VQ40DE V6 (261 hp - Past Gen)', fuelType: 'Gasoline', tankCapacity: 21.1 },
        ],
        defaultTankCapacity: 21.0,
      },
    ],
  },
  {
    make: 'Porsche',
    models: [
      {
        name: '911',
        startYear: 1964,
        endYear: 9999,
        trims: ['Carrera', 'Carrera T', 'Carrera S', 'Carrera 4S', 'Carrera GTS T-Hybrid', 'Targa 4S', 'Targa 4 GTS', 'Turbo', 'Turbo S', 'GT3', 'GT3 RS', 'GT3 Touring', 'Dakar', 'S/T'],
        engines: [
          { name: '3.0L Twin-Turbo Boxer-6 (388 hp - Carrera)', fuelType: 'Gasoline', tankCapacity: 16.9 },
          { name: '3.0L Twin-Turbo Boxer-6 (443 hp - Carrera S)', fuelType: 'Gasoline', tankCapacity: 16.9 },
          { name: '3.6L Boxer-6 e-Turbo T-Hybrid (532 hp - GTS 992.2)', fuelType: 'Hybrid', tankCapacity: 16.9 },
          { name: '3.7L Twin-Turbo Boxer-6 (640 hp - Turbo S)', fuelType: 'Gasoline', tankCapacity: 17.6 },
          { name: '4.0L Naturally Aspirated Boxer-6 9000RPM (518 hp - GT3 RS)', fuelType: 'Gasoline', tankCapacity: 16.9 },
        ],
        defaultTankCapacity: 16.9,
      },
      {
        name: '718 Cayman / Boxster',
        startYear: 1996,
        endYear: 9999,
        trims: ['Base', 'Style Edition', 'S', 'GTS 4.0', 'GT4', 'GT4 RS', 'Spyder', 'Spyder RS'],
        engines: [
          { name: '2.0L Turbo Boxer-4 (300 hp)', fuelType: 'Gasoline', tankCapacity: 14.3 },
          { name: '2.5L Turbo Boxer-4 (350 hp - S)', fuelType: 'Gasoline', tankCapacity: 14.3 },
          { name: '4.0L Naturally Aspirated Boxer-6 (394 hp - GTS 4.0)', fuelType: 'Gasoline', tankCapacity: 14.3 },
          { name: '4.0L Naturally Aspirated Boxer-6 9000RPM (493 hp - GT4 RS)', fuelType: 'Gasoline', tankCapacity: 14.3 },
        ],
        defaultTankCapacity: 14.3,
      },
      {
        name: 'Macan',
        startYear: 2015,
        endYear: 9999,
        trims: ['Base', 'T', 'S', 'GTS', 'Macan 4 EV', 'Macan Turbo EV'],
        engines: [
          { name: '2.0L Turbo I4 (261 hp)', fuelType: 'Gasoline', tankCapacity: 17.1 },
          { name: '2.9L Twin-Turbo V6 (375 hp - Macan S)', fuelType: 'Gasoline', tankCapacity: 17.1 },
          { name: '2.9L Twin-Turbo V6 (434 hp - Macan GTS)', fuelType: 'Gasoline', tankCapacity: 17.1 },
          { name: 'Dual Motor Electric AWD (402 hp - Macan 4 EV)', fuelType: 'Electric' },
          { name: 'Dual Motor Electric AWD (630 hp - Macan Turbo EV)', fuelType: 'Electric' },
        ],
        defaultTankCapacity: 17.1,
      },
      {
        name: 'Cayenne',
        startYear: 2003,
        endYear: 9999,
        trims: ['Base', 'E-Hybrid', 'S', 'S E-Hybrid', 'GTS', 'Turbo E-Hybrid', 'Turbo GT'],
        engines: [
          { name: '3.0L Turbo V6 (348 hp)', fuelType: 'Gasoline', tankCapacity: 23.7 },
          { name: '4.0L Twin-Turbo V8 (468 hp - S)', fuelType: 'Gasoline', tankCapacity: 23.7 },
          { name: '4.0L Twin-Turbo V8 (493 hp - GTS)', fuelType: 'Gasoline', tankCapacity: 23.7 },
          { name: '4.0L Twin-Turbo V8 Hybrid (729 hp - Turbo E-Hybrid)', fuelType: 'Hybrid', tankCapacity: 18.5 },
          { name: '4.0L Twin-Turbo V8 (650 hp - Turbo GT)', fuelType: 'Gasoline', tankCapacity: 23.7 },
        ],
        defaultTankCapacity: 23.7,
      },
      {
        name: 'Taycan',
        startYear: 2020,
        endYear: 9999,
        trims: ['Base RWD', '4S', 'GTS', 'Turbo', 'Turbo S', 'Turbo GT with Weissach Package', 'Cross Turismo', 'Sport Turismo'],
        engines: [
          { name: 'Single Motor RWD (402-429 hp)', fuelType: 'Electric' },
          { name: 'Dual Motor AWD (536-590 hp - 4S/GTS)', fuelType: 'Electric' },
          { name: 'Dual Motor AWD (871-938 hp - Turbo S)', fuelType: 'Electric' },
          { name: 'Dual Motor AWD (1019 hp - Turbo GT)', fuelType: 'Electric' },
        ],
      },
    ],
  },
  {
    make: 'Ram',
    models: [
      {
        name: '1500',
        startYear: 2011,
        endYear: 9999,
        trims: ['Tradesman', 'Big Horn / Lone Star', 'Laramie', 'Rebel', 'Limited Longhorn', 'Limited', 'Tungsten', 'RHO', 'TRX', 'RAMCHARGER'],
        engines: [
          { name: '3.0L Hurricane Twin-Turbo Standard-Output I6 (420 hp / 469 lb-ft)', fuelType: 'Gasoline', tankCapacity: 26.0 },
          { name: '3.0L Hurricane Twin-Turbo High-Output I6 (540 hp / 521 lb-ft - RHO/Tungsten)', fuelType: 'Gasoline', tankCapacity: 33.0 },
          { name: '3.6L Pentastar V6 eTorque (305 hp)', fuelType: 'Gasoline', tankCapacity: 26.0 },
          { name: '5.7L HEMI V8 MDS (395 hp)', fuelType: 'Gasoline', tankCapacity: 26.0 },
          { name: '6.2L Supercharged HEMI V8 (702 hp - TRX)', fuelType: 'Gasoline', tankCapacity: 33.0 },
          { name: '3.6L V6 Extended Range EV Generator (663 hp - Ramcharger)', fuelType: 'Hybrid', tankCapacity: 27.0 },
        ],
        defaultTankCapacity: 26.0,
      },
      {
        name: '2500 / 3500 Heavy Duty',
        startYear: 2011,
        endYear: 9999,
        trims: ['Tradesman', 'Big Horn', 'Laramie', 'Power Wagon', 'Rebel HD', 'Limited Longhorn', 'Limited'],
        engines: [
          { name: '6.4L Heavy Duty HEMI V8 (410 hp)', fuelType: 'Gasoline', tankCapacity: 31.0 },
          { name: '6.7L Cummins Turbo-Diesel I6 (370 hp / 850 lb-ft)', fuelType: 'Diesel', tankCapacity: 31.0 },
          { name: '6.7L High-Output Cummins Turbo-Diesel (420 hp / 1075 lb-ft)', fuelType: 'Diesel', tankCapacity: 50.0 },
        ],
        defaultTankCapacity: 31.0,
      },
    ],
  },
  {
    make: 'Rivian',
    models: [
      {
        name: 'R1T',
        startYear: 2022,
        endYear: 9999,
        trims: ['Dual-Motor Standard', 'Dual-Motor Large', 'Dual-Motor Max', 'Performance Dual-Motor Max', 'Tri-Motor Max', 'Quad-Motor Max'],
        engines: [
          { name: 'Dual-Motor AWD (533 hp)', fuelType: 'Electric' },
          { name: 'Performance Dual-Motor AWD (665 hp)', fuelType: 'Electric' },
          { name: 'Tri-Motor AWD (850 hp)', fuelType: 'Electric' },
          { name: 'Quad-Motor AWD (1025 hp)', fuelType: 'Electric' },
        ],
      },
      {
        name: 'R1S',
        startYear: 2022,
        endYear: 9999,
        trims: ['Dual-Motor Standard', 'Dual-Motor Large', 'Dual-Motor Max', 'Performance Dual-Motor Max', 'Tri-Motor Max', 'Quad-Motor Max'],
        engines: [
          { name: 'Dual-Motor AWD (533 hp)', fuelType: 'Electric' },
          { name: 'Performance Dual-Motor AWD (665 hp)', fuelType: 'Electric' },
          { name: 'Tri-Motor AWD (850 hp)', fuelType: 'Electric' },
          { name: 'Quad-Motor AWD (1025 hp)', fuelType: 'Electric' },
        ],
      },
      {
        name: 'R2',
        startYear: 2026,
        endYear: 9999,
        trims: ['Single Motor RWD', 'Dual Motor AWD', 'Tri-Motor AWD'],
        engines: [
          { name: 'Single Motor RWD (300 hp)', fuelType: 'Electric' },
          { name: 'Dual Motor AWD (450 hp)', fuelType: 'Electric' },
          { name: 'Tri-Motor AWD (600+ hp)', fuelType: 'Electric' },
        ],
      },
    ],
  },
  {
    make: 'Subaru',
    models: [
      {
        name: 'WRX / STI',
        startYear: 1992,
        endYear: 9999,
        trims: ['Base', 'Premium', 'Limited', 'GT', 'TR', 'tS', 'STI Base', 'STI Limited', 'STI Type RA', 'S209'],
        engines: [
          { name: '2.4L Turbo Boxer-4 FA24F (271 hp - VB)', fuelType: 'Gasoline', tankCapacity: 16.6 },
          { name: '2.0L Turbo Boxer-4 FA20F (268 hp - VA)', fuelType: 'Gasoline', tankCapacity: 15.9 },
          { name: '2.5L Turbo Boxer-4 EJ257 (310 hp - STI)', fuelType: 'Gasoline', tankCapacity: 15.9 },
          { name: '2.5L Turbo Boxer-4 EJ257 High-Output (341 hp - S209)', fuelType: 'Gasoline', tankCapacity: 15.9 },
        ],
        defaultTankCapacity: 16.6,
      },
      {
        name: 'BRZ',
        startYear: 2013,
        endYear: 9999,
        trims: ['Premium', 'Limited', 'tS', 'Series.Blue', 'Series.Gray'],
        engines: [
          { name: '2.4L Naturally Aspirated Boxer-4 FA24D (228 hp - 2nd Gen)', fuelType: 'Gasoline', tankCapacity: 13.2 },
          { name: '2.0L Naturally Aspirated Boxer-4 FA20D (205 hp - 1st Gen)', fuelType: 'Gasoline', tankCapacity: 13.2 },
        ],
        defaultTankCapacity: 13.2,
      },
      {
        name: 'Outback',
        startYear: 1994,
        endYear: 9999,
        trims: ['Base', 'Premium', 'Onyx Edition', 'Limited', 'Touring', 'Onyx Edition XT', 'Wilderness', 'Limited XT', 'Touring XT'],
        engines: [
          { name: '2.5L DOHC Boxer-4 FB25 (182 hp)', fuelType: 'Gasoline', tankCapacity: 18.5 },
          { name: '2.4L Turbo Boxer-4 FA24F (260 hp / 277 lb-ft - XT/Wilderness)', fuelType: 'Gasoline', tankCapacity: 18.5 },
          { name: '3.6L Boxer-6 EZ36D (256 hp - Past Gen)', fuelType: 'Gasoline', tankCapacity: 18.5 },
        ],
        defaultTankCapacity: 18.5,
      },
      {
        name: 'Forester',
        startYear: 1997,
        endYear: 9999,
        trims: ['Base', 'Premium', 'Sport', 'Limited', 'Touring', 'Wilderness', 'XT (Past Gen)'],
        engines: [
          { name: '2.5L DOHC Boxer-4 FB25 (180 hp)', fuelType: 'Gasoline', tankCapacity: 16.6 },
          { name: '2.0L Turbo Boxer-4 (250 hp - Past Gen XT)', fuelType: 'Gasoline', tankCapacity: 15.9 },
        ],
        defaultTankCapacity: 16.6,
      },
      {
        name: 'Crosstrek',
        startYear: 2012,
        endYear: 9999,
        trims: ['Base', 'Premium', 'Sport', 'Limited', 'Wilderness', 'Hybrid'],
        engines: [
          { name: '2.0L DOHC Boxer-4 (152 hp)', fuelType: 'Gasoline', tankCapacity: 16.6 },
          { name: '2.5L DOHC Boxer-4 FB25 (182 hp - Sport/Limited/Wilderness)', fuelType: 'Gasoline', tankCapacity: 16.6 },
        ],
        defaultTankCapacity: 16.6,
      },
    ],
  },
  {
    make: 'Tesla',
    models: [
      {
        name: 'Model 3',
        startYear: 2017,
        endYear: 9999,
        trims: ['Standard Range RWD', 'Long Range RWD', 'Long Range AWD', 'Performance AWD (Highland)'],
        engines: [
          { name: 'Single Motor RWD (271 hp)', fuelType: 'Electric' },
          { name: 'Dual Motor Long Range AWD (394 hp)', fuelType: 'Electric' },
          { name: 'Dual Motor Performance AWD (510 hp - 0-60 in 2.9s)', fuelType: 'Electric' },
        ],
      },
      {
        name: 'Model Y',
        startYear: 2020,
        endYear: 9999,
        trims: ['Standard Range RWD', 'Long Range RWD', 'Long Range AWD', 'Performance AWD'],
        engines: [
          { name: 'Single Motor RWD (295 hp)', fuelType: 'Electric' },
          { name: 'Dual Motor Long Range AWD (384 hp)', fuelType: 'Electric' },
          { name: 'Dual Motor Performance AWD (456 hp)', fuelType: 'Electric' },
        ],
      },
      {
        name: 'Model S',
        startYear: 2012,
        endYear: 9999,
        trims: ['Long Range AWD', 'Plaid Tri-Motor', 'Performance (P100D/P90D)', '75D'],
        engines: [
          { name: 'Dual Motor Long Range AWD (670 hp)', fuelType: 'Electric' },
          { name: 'Tri-Motor Plaid AWD (1020 hp - 0-60 in 1.99s)', fuelType: 'Electric' },
        ],
      },
      {
        name: 'Model X',
        startYear: 2015,
        endYear: 9999,
        trims: ['Long Range AWD', 'Plaid Tri-Motor', 'Performance (P100D)'],
        engines: [
          { name: 'Dual Motor Long Range AWD (670 hp)', fuelType: 'Electric' },
          { name: 'Tri-Motor Plaid AWD (1020 hp)', fuelType: 'Electric' },
        ],
      },
      {
        name: 'Cybertruck',
        startYear: 2023,
        endYear: 9999,
        trims: ['Rear-Wheel Drive', 'All-Wheel Drive Dual-Motor', 'Cyberbeast Tri-Motor', 'Foundation Series'],
        engines: [
          { name: 'Single Motor RWD (315 hp)', fuelType: 'Electric' },
          { name: 'Dual Motor AWD (600 hp)', fuelType: 'Electric' },
          { name: 'Tri-Motor Cyberbeast AWD (845 hp)', fuelType: 'Electric' },
        ],
      },
    ],
  },
  {
    make: 'Toyota',
    models: [
      {
        name: 'Camry',
        startYear: 1983,
        endYear: 9999,
        trims: ['LE', 'SE', 'SE Nightshade', 'XLE', 'XSE', 'TRD', 'LE Hybrid', 'SE Hybrid', 'XSE Hybrid', 'XLE Hybrid'],
        engines: [
          { name: '2.5L 4-Cylinder Hybrid FWD/AWD (225-232 hp - 2025+)', fuelType: 'Hybrid', tankCapacity: 13.0 },
          { name: '2.5L Dynamic Force I4 (203 hp - Past Gen)', fuelType: 'Gasoline', tankCapacity: 15.8 },
          { name: '3.5L 2GR-FKS V6 (301 hp - Past Gen TRD/XSE)', fuelType: 'Gasoline', tankCapacity: 15.8 },
        ],
        defaultTankCapacity: 14.5,
      },
      {
        name: 'Corolla / GR Corolla',
        startYear: 1966,
        endYear: 9999,
        trims: ['LE', 'SE', 'Nightshade', 'XSE', 'Hybrid LE', 'Hybrid SE', 'Hybrid XLE', 'GR Corolla Core', 'GR Corolla Premium', 'GR Corolla Circuit', 'GR Corolla MORIZO'],
        engines: [
          { name: '2.0L Dynamic Force I4 (169 hp)', fuelType: 'Gasoline', tankCapacity: 13.2 },
          { name: '1.8L Hybrid FWD/AWD (138 hp)', fuelType: 'Hybrid', tankCapacity: 11.3 },
          { name: '1.6L Turbo G16E-GTS 3-Cylinder GR-FOUR AWD (300 hp / 295 lb-ft)', fuelType: 'Gasoline', tankCapacity: 13.2 },
        ],
        defaultTankCapacity: 13.2,
      },
      {
        name: 'Tacoma',
        startYear: 1995,
        endYear: 9999,
        trims: ['SR', 'SR5', 'TRD PreRunner', 'TRD Sport', 'TRD Off-Road', 'Limited', 'TRD Pro i-FORCE MAX', 'Trailhunter i-FORCE MAX'],
        engines: [
          { name: '2.4L Turbo i-FORCE I4 (278 hp / 317 lb-ft)', fuelType: 'Gasoline', tankCapacity: 18.2 },
          { name: '2.4L Turbo i-FORCE MAX Hybrid (326 hp / 465 lb-ft)', fuelType: 'Hybrid', tankCapacity: 18.2 },
          { name: '3.5L 2GR-FKS V6 (278 hp - Past Gen)', fuelType: 'Gasoline', tankCapacity: 21.1 },
          { name: '2.7L 2TR-FE I4 (159 hp - Past Gen)', fuelType: 'Gasoline', tankCapacity: 21.1 },
          { name: '4.0L 1GR-FE V6 (236 hp - 2nd Gen)', fuelType: 'Gasoline', tankCapacity: 21.1 },
        ],
        defaultTankCapacity: 18.2,
      },
      {
        name: 'Tundra',
        startYear: 2000,
        endYear: 9999,
        trims: ['SR', 'SR5', 'Limited', 'Platinum', '1794 Edition', 'TRD Pro', 'Capstone'],
        engines: [
          { name: '3.4L Twin-Turbo i-FORCE V6 (389 hp / 479 lb-ft)', fuelType: 'Gasoline', tankCapacity: 22.5 },
          { name: '3.4L Twin-Turbo i-FORCE MAX Hybrid V6 (437 hp / 583 lb-ft)', fuelType: 'Hybrid', tankCapacity: 32.2 },
          { name: '5.7L i-FORCE 3UR-FE V8 (381 hp - Past Gen)', fuelType: 'Gasoline', tankCapacity: 38.0 },
          { name: '4.6L 1UR-FE V8 (310 hp - Past Gen)', fuelType: 'Gasoline', tankCapacity: 26.4 },
        ],
        defaultTankCapacity: 32.2,
      },
      {
        name: '4Runner',
        startYear: 1984,
        endYear: 9999,
        trims: ['SR5', 'TRD Sport', 'TRD Off-Road', 'TRD Off-Road Premium', 'Limited', 'Platinum', 'TRD Pro', 'Trailhunter'],
        engines: [
          { name: '2.4L Turbo i-FORCE I4 (278 hp)', fuelType: 'Gasoline', tankCapacity: 19.0 },
          { name: '2.4L Turbo i-FORCE MAX Hybrid (326 hp / 465 lb-ft)', fuelType: 'Hybrid', tankCapacity: 19.0 },
          { name: '4.0L 1GR-FE V6 (270 hp - 5th Gen)', fuelType: 'Gasoline', tankCapacity: 23.0 },
          { name: '4.7L 2UZ-FE V8 (260 hp - 4th Gen)', fuelType: 'Gasoline', tankCapacity: 23.0 },
        ],
        defaultTankCapacity: 23.0,
      },
      {
        name: 'RAV4',
        startYear: 1994,
        endYear: 9999,
        trims: ['LE', 'XLE', 'XLE Premium', 'Adventure', 'TRD Off-Road', 'Limited', 'Hybrid LE', 'Hybrid XSE', 'Hybrid Woodland', 'Prime Plug-In Hybrid SE', 'Prime XSE'],
        engines: [
          { name: '2.5L Dynamic Force I4 (203 hp)', fuelType: 'Gasoline', tankCapacity: 14.5 },
          { name: '2.5L Hybrid AWD (219 hp)', fuelType: 'Hybrid', tankCapacity: 14.5 },
          { name: '2.5L Plug-In Hybrid Prime AWD (302 hp)', fuelType: 'Hybrid', tankCapacity: 14.5 },
        ],
        defaultTankCapacity: 14.5,
      },
      {
        name: 'GR86',
        startYear: 2012,
        endYear: 9999,
        trims: ['Base', 'Premium', 'Trueno Edition', 'Special Edition', 'Hakone Edition'],
        engines: [
          { name: '2.4L Naturally Aspirated Boxer-4 FA24 (228 hp)', fuelType: 'Gasoline', tankCapacity: 13.2 },
          { name: '2.0L Naturally Aspirated Boxer-4 FA20 (205 hp - GT86/Scion FR-S)', fuelType: 'Gasoline', tankCapacity: 13.2 },
        ],
        defaultTankCapacity: 13.2,
      },
      {
        name: 'GR Supra',
        startYear: 1978,
        endYear: 9999,
        trims: ['2.0', '3.0', '3.0 Premium', 'A91-MT Edition', '45th Anniversary Edition', 'Turbo (A80/MK4)'],
        engines: [
          { name: '3.0L Twin-Scroll Turbo B58 Inline-6 (382 hp / 368 lb-ft - A90)', fuelType: 'Gasoline', tankCapacity: 13.7 },
          { name: '2.0L Turbo B48 I4 (255 hp - A90)', fuelType: 'Gasoline', tankCapacity: 13.7 },
          { name: '3.0L Twin-Turbo 2JZ-GTE Inline-6 (320 hp - MK4)', fuelType: 'Gasoline', tankCapacity: 18.5 },
          { name: '3.0L Naturally Aspirated 2JZ-GE Inline-6 (220 hp - MK4)', fuelType: 'Gasoline', tankCapacity: 18.5 },
        ],
        defaultTankCapacity: 13.7,
      },
      {
        name: 'Prius / Prius Prime',
        startYear: 1997,
        endYear: 9999,
        trims: ['LE', 'XLE', 'Limited', 'Prime SE', 'Prime XSE', 'Prime XSE Premium'],
        engines: [
          { name: '2.0L Hybrid FWD/AWD (194-196 hp - 5th Gen)', fuelType: 'Hybrid', tankCapacity: 11.3 },
          { name: '2.0L Plug-In Hybrid Prime (220 hp - 5th Gen)', fuelType: 'Hybrid', tankCapacity: 10.6 },
          { name: '1.8L Hybrid (121 hp - 4th Gen)', fuelType: 'Hybrid', tankCapacity: 11.3 },
        ],
        defaultTankCapacity: 11.3,
      },
      {
        name: 'Land Cruiser',
        startYear: 1951,
        endYear: 9999,
        trims: ['1958', 'Land Cruiser', 'First Edition', 'Heritage Edition', 'Base (200 Series)'],
        engines: [
          { name: '2.4L Turbo i-FORCE MAX Hybrid (326 hp / 465 lb-ft - LC250)', fuelType: 'Hybrid', tankCapacity: 17.9 },
          { name: '5.7L 3UR-FE V8 (381 hp - LC200)', fuelType: 'Gasoline', tankCapacity: 24.6 },
          { name: '4.7L 2UZ-FE V8 (275 hp - LC100)', fuelType: 'Gasoline', tankCapacity: 25.4 },
        ],
        defaultTankCapacity: 24.0,
      },
      {
        name: 'Highlander / Grand Highlander',
        startYear: 2001,
        endYear: 9999,
        trims: ['LE', 'XLE', 'XSE', 'Limited', 'Platinum', 'Hybrid MAX Platinum', 'Nightshade'],
        engines: [
          { name: '2.4L Turbo I4 (265 hp)', fuelType: 'Gasoline', tankCapacity: 17.9 },
          { name: '2.5L Hybrid AWD (245 hp)', fuelType: 'Hybrid', tankCapacity: 17.2 },
          { name: '2.4L Turbo Hybrid MAX AWD (362 hp / 400 lb-ft)', fuelType: 'Hybrid', tankCapacity: 17.2 },
          { name: '3.5L 2GR-FKS V6 (295 hp - Past Gen)', fuelType: 'Gasoline', tankCapacity: 17.9 },
        ],
        defaultTankCapacity: 17.9,
      },
    ],
  },
  {
    make: 'Volkswagen',
    models: [
      {
        name: 'Golf / GTI / Golf R',
        startYear: 1974,
        endYear: 9999,
        trims: ['GTI S', 'GTI SE', 'GTI Autobahn', 'GTI 380', 'Golf R', 'Golf R 20th Anniversary', 'TSI'],
        engines: [
          { name: '2.0L Turbo EA888 evo4 I4 (241 hp - GTI)', fuelType: 'Gasoline', tankCapacity: 13.2 },
          { name: '2.0L Turbo EA888 evo4 I4 (315 hp / 310 lb-ft - Golf R)', fuelType: 'Gasoline', tankCapacity: 14.5 },
          { name: '1.4L Turbo TSI I4 (147 hp)', fuelType: 'Gasoline', tankCapacity: 13.2 },
        ],
        defaultTankCapacity: 13.2,
      },
      {
        name: 'Jetta / GLI',
        startYear: 1979,
        endYear: 9999,
        trims: ['S', 'Sport', 'SE', 'SEL', 'GLI Autobahn', 'GLI 40th Anniversary'],
        engines: [
          { name: '1.5L Turbo TSI I4 (158 hp)', fuelType: 'Gasoline', tankCapacity: 13.2 },
          { name: '2.0L Turbo EA888 I4 (228 hp - GLI)', fuelType: 'Gasoline', tankCapacity: 13.2 },
        ],
        defaultTankCapacity: 13.2,
      },
      {
        name: 'Tiguan',
        startYear: 2007,
        endYear: 9999,
        trims: ['S', 'SE', 'SE R-Line Black', 'SEL R-Line'],
        engines: [
          { name: '2.0L Turbo TSI I4 (184-201 hp)', fuelType: 'Gasoline', tankCapacity: 15.3 },
        ],
        defaultTankCapacity: 15.3,
      },
      {
        name: 'Atlas / Atlas Cross Sport',
        startYear: 2018,
        endYear: 9999,
        trims: ['SE', 'SE with Technology', 'Peak Edition', 'SEL', 'SEL Premium R-Line'],
        engines: [
          { name: '2.0L Turbo TSI I4 (269 hp / 273 lb-ft)', fuelType: 'Gasoline', tankCapacity: 18.6 },
          { name: '3.6L VR6 (276 hp - Past Gen)', fuelType: 'Gasoline', tankCapacity: 18.6 },
        ],
        defaultTankCapacity: 18.6,
      },
      {
        name: 'ID.4 / ID. Buzz',
        startYear: 2021,
        endYear: 9999,
        trims: ['Standard RWD', 'Pro RWD', 'Pro S RWD', 'Pro AWD', 'Pro S AWD', 'Pro S Plus AWD'],
        engines: [
          { name: 'Single Motor RWD (201-282 hp)', fuelType: 'Electric' },
          { name: 'Dual Motor AWD (295-335 hp)', fuelType: 'Electric' },
        ],
      },
    ],
  },
  {
    make: 'Volvo',
    models: [
      {
        name: 'XC90 / EX90',
        startYear: 2002,
        endYear: 9999,
        trims: ['Core B5', 'Plus B6', 'Ultimate B6', 'Recharge T8 PHEV Ultimate', 'EX90 Twin Motor'],
        engines: [
          { name: '2.0L Turbo Mild-Hybrid I4 (247 hp - B5)', fuelType: 'Gasoline', tankCapacity: 18.8 },
          { name: '2.0L Turbo + Supercharged Mild-Hybrid I4 (295 hp - B6)', fuelType: 'Gasoline', tankCapacity: 18.8 },
          { name: '2.0L Turbo Plug-In Hybrid AWD (455 hp - T8 Recharge)', fuelType: 'Hybrid', tankCapacity: 18.8 },
          { name: 'Dual Motor Electric AWD (402-510 hp - EX90)', fuelType: 'Electric' },
        ],
        defaultTankCapacity: 18.8,
      },
      {
        name: 'XC60',
        startYear: 2008,
        endYear: 9999,
        trims: ['Core', 'Plus', 'Ultimate', 'Polestar Engineered', 'Recharge T8'],
        engines: [
          { name: '2.0L Turbo Mild-Hybrid I4 (247 hp - B5)', fuelType: 'Gasoline', tankCapacity: 18.8 },
          { name: '2.0L Turbo Plug-In Hybrid AWD (455 hp - T8)', fuelType: 'Hybrid', tankCapacity: 18.8 },
        ],
        defaultTankCapacity: 18.8,
      },
      {
        name: 'S60 / V60',
        startYear: 2000,
        endYear: 9999,
        trims: ['Core', 'Plus', 'Ultimate', 'Polestar Engineered', 'Recharge T8'],
        engines: [
          { name: '2.0L Turbo Mild-Hybrid I4 (247 hp - B5)', fuelType: 'Gasoline', tankCapacity: 15.9 },
          { name: '2.0L Turbo Plug-In Hybrid AWD (455 hp - T8 Recharge)', fuelType: 'Hybrid', tankCapacity: 15.9 },
        ],
        defaultTankCapacity: 15.9,
      },
    ],
  },
];

// Additional popular brands list for seamless type-ahead expansion
export const ALL_BRANDS = [
  'Acura',
  'Alfa Romeo',
  'Aston Martin',
  'Audi',
  'Bentley',
  'BMW',
  'Bugatti',
  'Buick',
  'Cadillac',
  'Chevrolet',
  'Chrysler',
  'Dodge',
  'Ferrari',
  'Fiat',
  'Ford',
  'Genesis',
  'GMC',
  'Honda',
  'Hyundai',
  'Infiniti',
  'Jaguar',
  'Jeep',
  'Kia',
  'Lamborghini',
  'Land Rover',
  'Lexus',
  'Lincoln',
  'Lotus',
  'Lucid',
  'Maserati',
  'Mazda',
  'McLaren',
  'Mercedes-Benz',
  'Mini',
  'Mitsubishi',
  'Nissan',
  'Polestar',
  'Pontiac',
  'Porsche',
  'Ram',
  'Rivian',
  'Rolls-Royce',
  'Saab',
  'Saturn',
  'Scion',
  'Subaru',
  'Suzuki',
  'Tesla',
  'Toyota',
  'Volkswagen',
  'Volvo',
];

// Generate years from next year down to 1960
export const YEARS_LIST: number[] = Array.from(
  { length: new Date().getFullYear() + 2 - 1960 },
  (_, i) => new Date().getFullYear() + 1 - i
);

/**
 * Get all available models for a given Make, filtered optionally by Year
 */
export function getModelsForMake(makeName: string, year?: number): ModelSpec[] {
  if (!makeName) return [];
  const makeEntry = VEHICLE_DATABASE.find(
    (m) => m.make.toLowerCase() === makeName.trim().toLowerCase()
  );
  if (!makeEntry) return [];

  if (!year) return makeEntry.models;

  return makeEntry.models.filter(
    (model) => year >= model.startYear && year <= model.endYear
  );
}

/**
 * Get Trims and Engines for a specific Make and Model
 */
export function getModelDetails(makeName: string, modelName: string) {
  if (!makeName || !modelName) return null;
  const makeEntry = VEHICLE_DATABASE.find(
    (m) => m.make.toLowerCase() === makeName.trim().toLowerCase()
  );
  if (!makeEntry) return null;

  const modelEntry = makeEntry.models.find(
    (m) =>
      m.name.toLowerCase() === modelName.trim().toLowerCase() ||
      m.name.toLowerCase().includes(modelName.trim().toLowerCase()) ||
      modelName.trim().toLowerCase().includes(m.name.toLowerCase())
  );

  return modelEntry || null;
}
