import { AreaUnit } from '../types';

export const AREA_UNIT_KEY = 'manormap_preferred_area_unit';

export const AREA_UNITS: { id: AreaUnit; label: string; short: string; desc: string }[] = [
  { id: 'sqft', label: 'Sq. Ft.', short: 'sq.ft', desc: 'Carpet & Built-Up' },
  { id: 'sqyard', label: 'Sq. Yards (Gaj)', short: 'sq.yd', desc: 'Plots & Layouts' },
  { id: 'acre_gunta', label: 'Acres & Guntas', short: 'Ac-Gta', desc: 'Farmland & Estates' }
];

export function getStoredAreaUnit(): AreaUnit {
  try {
    const stored = localStorage.getItem(AREA_UNIT_KEY);
    if (stored === 'sqft' || stored === 'sqyard' || stored === 'acre_gunta') {
      return stored;
    }
  } catch {}
  return 'sqft';
}

export function setStoredAreaUnit(unit: AreaUnit): void {
  try {
    localStorage.setItem(AREA_UNIT_KEY, unit);
  } catch {}
}

/**
 * Converts area in Sq. Ft. into target unit with precise Indian real-estate notation
 */
export function formatAreaByUnit(sqFt: number, unit: AreaUnit): { value: number; formatted: string; unitLabel: string } {
  if (!sqFt || sqFt <= 0) {
    return { value: 0, formatted: '0 sq.ft', unitLabel: 'sq.ft' };
  }

  if (unit === 'sqyard') {
    const sqYards = Math.round(sqFt / 9);
    return {
      value: sqYards,
      formatted: `${sqYards.toLocaleString('en-IN')} sq.yds (gaj)`,
      unitLabel: 'sq.yds'
    };
  }

  if (unit === 'acre_gunta') {
    const totalAcres = sqFt / 43560;
    const wholeAcres = Math.floor(totalAcres);
    const remainingSqFt = sqFt - (wholeAcres * 43560);
    const guntas = Math.round((remainingSqFt / 1089) * 10) / 10;

    let formatted = '';
    if (wholeAcres > 0 && guntas > 0) {
      formatted = `${wholeAcres} Ac ${guntas} Gts`;
    } else if (wholeAcres > 0) {
      formatted = `${wholeAcres} Acre${wholeAcres > 1 ? 's' : ''}`;
    } else {
      formatted = `${guntas} Guntas`;
    }

    return {
      value: Math.round(totalAcres * 100) / 100,
      formatted,
      unitLabel: 'Acres'
    };
  }

  // Default: sqft
  return {
    value: sqFt,
    formatted: `${sqFt.toLocaleString('en-IN')} sq.ft`,
    unitLabel: 'sq.ft'
  };
}

/**
 * Converts rate per unit according to active unit (e.g. ₹/sq.ft vs ₹/sq.yd vs ₹/Acre)
 */
export function formatRateByUnit(price: number, sqFt: number, unit: AreaUnit): string {
  if (!price || !sqFt || sqFt <= 0) return '';

  if (unit === 'sqyard') {
    const sqYards = sqFt / 9;
    const ratePerSqYd = Math.round(price / sqYards);
    return `₹${ratePerSqYd.toLocaleString('en-IN')} / sq.yd`;
  }

  if (unit === 'acre_gunta') {
    const acres = sqFt / 43560;
    if (acres >= 0.1) {
      const ratePerAcre = Math.round(price / acres);
      if (ratePerAcre >= 10000000) {
        return `₹${(ratePerAcre / 10000000).toFixed(2)} Cr / Acre`;
      }
      return `₹${(ratePerAcre / 100000).toFixed(2)} Lakh / Acre`;
    } else {
      const guntas = sqFt / 1089;
      const ratePerGunta = Math.round(price / guntas);
      return `₹${(ratePerGunta / 100000).toFixed(2)} Lakh / Gunta`;
    }
  }

  const ratePerSqFt = Math.round(price / sqFt);
  return `₹${ratePerSqFt.toLocaleString('en-IN')} / sq.ft`;
}
