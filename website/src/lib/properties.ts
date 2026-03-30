import { parse } from "csv-parse/sync";
import fs from "fs";
import path from "path";
import { Property, addScores, ScoredProperty } from "./scoring";

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
  });

  cachedProperties = addScores(records);
  return cachedProperties;
}
