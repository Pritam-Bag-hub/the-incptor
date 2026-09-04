import { QuantityUnit } from "@prisma/client";

/**
 * Normalizes any quantity value with a given unit to base unit: Kilograms (KG).
 * 
 * 1 KG = 1 KG
 * 1 QUINTAL = 100 KG
 * 1 TONNE = 1000 KG
 */
export function normalizeQuantityToKg(value: number, unit: QuantityUnit): number {
  if (typeof value !== "number" || isNaN(value)) return 0;
  
  switch (unit) {
    case "KG":
      return value;
    case "QUINTAL":
      return value * 100;
    case "TONNE":
      return value * 1000;
    default:
      return value;
  }
}

/**
 * Converts a quantity value in Kilograms (KG) back to the target unit.
 */
export function convertKgToUnit(valueKg: number, unit: QuantityUnit): number {
  if (typeof valueKg !== "number" || isNaN(valueKg)) return 0;

  switch (unit) {
    case "KG":
      return valueKg;
    case "QUINTAL":
      return valueKg / 100;
    case "TONNE":
      return valueKg / 1000;
    default:
      return valueKg;
  }
}
