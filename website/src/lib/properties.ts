import { parse } from "csv-parse/sync";
import fs from "fs";
import path from "path";
import { Property, addScores, ScoredProperty, getPropertyImage } from "./scoring";

let cachedProperties: ScoredProperty[] | null = null;

export function loadProperties(): ScoredProperty[] {
  if (cachedProperties) return cachedProperties;

  const csvPath = path.join(process.cwd(), "public", "data", "vic_properties_1000.csv");
  const csvContent = fs.readFileSync(csvPath, "utf-8");

  const records: Property[] = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    cast: (value, context) => {
      if (context.header) return value;
      const numericColumns = ["price", "rent_estimate", "land_size", "bedrooms"];
      if (numericColumns.includes(context.column as string)) {
        return Number(value);
      }
      return value;
    },
  }).map((row: Omit<Property, "id" | "image">, index: number) => ({
    ...row,
    id: index,
    image: getPropertyImage(index, row.property_type),
  }));

  cachedProperties = addScores(records);
  return cachedProperties;
}

export function getPropertyById(id: number): ScoredProperty | undefined {
  const all = loadProperties();
  return all.find((p) => p.id === id);
}
