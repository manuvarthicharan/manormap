import { VentureLayout } from '../types';

/**
 * Demo Geo-Referenced HMDA & BMRDA Venture Layouts
 * Located in high-demand plotted development corridors:
 * 1. Mokila / Shankarpally HMDA Corridor, Hyderabad
 * 2. Devanahalli BMRDA Airport Corridor, Bengaluru
 */
export const SAMPLE_VENTURE_LAYOUTS: VentureLayout[] = [
  {
    id: 'venture-hmda-mokila',
    name: 'Sylvan County HMDA Venture',
    developerName: 'Aparna Infra Developers',
    authority: 'HMDA',
    lpNumber: 'LP No. 000142/LO/Plg/HMDA/2024',
    reraId: 'P02400007890',
    totalPlots: 12,
    availablePlots: 5,
    center: [78.1884, 17.4128], // Mokila corridor [lng, lat]
    contactPhone: '+91 98490 87654',
    plots: [
      {
        id: 'plot-101',
        plotNumber: 'Plot #101',
        areaSqYards: 200,
        dimensions: '40 x 45 ft',
        facing: 'East (100% Vastu)',
        status: 'available',
        pricePerSqYd: 38500,
        totalPrice: 7700000,
        surveyNo: 'Sy. No. 142/2',
        center: [78.1880, 17.4132],
        coordinates: [
          [78.1878, 17.4134],
          [78.1882, 17.4134],
          [78.1882, 17.4130],
          [78.1878, 17.4130]
        ]
      },
      {
        id: 'plot-102',
        plotNumber: 'Plot #102',
        areaSqYards: 240,
        dimensions: '40 x 54 ft',
        facing: 'North-East Corner',
        status: 'available',
        pricePerSqYd: 41000,
        totalPrice: 9840000,
        surveyNo: 'Sy. No. 142/2',
        center: [78.1885, 17.4132],
        coordinates: [
          [78.1883, 17.4134],
          [78.1887, 17.4134],
          [78.1887, 17.4130],
          [78.1883, 17.4130]
        ]
      },
      {
        id: 'plot-103',
        plotNumber: 'Plot #103',
        areaSqYards: 200,
        dimensions: '40 x 45 ft',
        facing: 'West Facing',
        status: 'hold',
        pricePerSqYd: 38000,
        totalPrice: 7600000,
        surveyNo: 'Sy. No. 142/3',
        center: [78.1890, 17.4132],
        coordinates: [
          [78.1888, 17.4134],
          [78.1892, 17.4134],
          [78.1892, 17.4130],
          [78.1888, 17.4130]
        ]
      },
      {
        id: 'plot-104',
        plotNumber: 'Plot #104',
        areaSqYards: 300,
        dimensions: '50 x 54 ft',
        facing: 'North Facing',
        status: 'sold',
        pricePerSqYd: 39000,
        totalPrice: 11700000,
        surveyNo: 'Sy. No. 142/3',
        center: [78.1895, 17.4132],
        coordinates: [
          [78.1893, 17.4134],
          [78.1897, 17.4134],
          [78.1897, 17.4130],
          [78.1893, 17.4130]
        ]
      },
      {
        id: 'plot-105',
        plotNumber: 'Plot #105',
        areaSqYards: 200,
        dimensions: '40 x 45 ft',
        facing: 'East Facing',
        status: 'available',
        pricePerSqYd: 38500,
        totalPrice: 7700000,
        surveyNo: 'Sy. No. 143/1',
        center: [78.1880, 17.4126],
        coordinates: [
          [78.1878, 17.4128],
          [78.1882, 17.4128],
          [78.1882, 17.4124],
          [78.1878, 17.4124]
        ]
      },
      {
        id: 'plot-106',
        plotNumber: 'Plot #106',
        areaSqYards: 200,
        dimensions: '40 x 45 ft',
        facing: 'East Facing',
        status: 'available',
        pricePerSqYd: 38500,
        totalPrice: 7700000,
        surveyNo: 'Sy. No. 143/1',
        center: [78.1885, 17.4126],
        coordinates: [
          [78.1883, 17.4128],
          [78.1887, 17.4128],
          [78.1887, 17.4124],
          [78.1883, 17.4124]
        ]
      },
      {
        id: 'plot-107',
        plotNumber: 'Plot #107',
        areaSqYards: 200,
        dimensions: '40 x 45 ft',
        facing: 'West Facing',
        status: 'sold',
        pricePerSqYd: 38000,
        totalPrice: 7600000,
        surveyNo: 'Sy. No. 143/2',
        center: [78.1890, 17.4126],
        coordinates: [
          [78.1888, 17.4128],
          [78.1892, 17.4128],
          [78.1892, 17.4124],
          [78.1888, 17.4124]
        ]
      },
      {
        id: 'plot-108',
        plotNumber: 'Plot #108',
        areaSqYards: 250,
        dimensions: '45 x 50 ft',
        facing: 'North Facing',
        status: 'available',
        pricePerSqYd: 39500,
        totalPrice: 9875000,
        surveyNo: 'Sy. No. 143/2',
        center: [78.1895, 17.4126],
        coordinates: [
          [78.1893, 17.4128],
          [78.1897, 17.4128],
          [78.1897, 17.4124],
          [78.1893, 17.4124]
        ]
      }
    ]
  }
];

export function getVentureLayoutById(id: string): VentureLayout | undefined {
  return SAMPLE_VENTURE_LAYOUTS.find((v) => v.id === id);
}

export function getAllVentureLayouts(): VentureLayout[] {
  return SAMPLE_VENTURE_LAYOUTS;
}
