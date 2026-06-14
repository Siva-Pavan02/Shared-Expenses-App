import { parse } from 'csv-parse/sync';

export class CsvParserService {
  parseCsv(fileBuffer: Buffer) {
    const rawData = fileBuffer.toString('utf-8');
    
    // Parse using csv-parse
    const records = parse(rawData, {
      columns: true,
      skip_empty_lines: true,
      trim: true // Basic trim
    });

    return records.map((record: any) => {
      // Create a deep copy for normalized data
      const normalized = { ...record };

      // 1. Normalize casing for Split Type
      if (normalized['Split Type']) {
        normalized['Split Type'] = String(normalized['Split Type']).toUpperCase().trim();
      }

      // 2. Normalize Amount (remove commas, trim)
      if (normalized['Amount']) {
        normalized['Amount'] = String(normalized['Amount']).replace(/,/g, '').trim();
      }

      // 3. Trim all other fields
      for (const key of Object.keys(normalized)) {
        if (typeof normalized[key] === 'string') {
          normalized[key] = normalized[key].trim();
        }
      }

      return {
        raw: record, // Original raw row
        normalized   // Cleaned row
      };
    });
  }
}
