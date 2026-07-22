import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Transforms a Qualtrics CSV export of research metrics into a clean CSV
 * suitable for GCS upload and subsequent PostgreSQL import via the archive
 * import script.
 *
 * Input:  research-metrics-in.csv  (Qualtrics format, 2 metadata rows after header)
 * Output: research-metrics.csv     (flat, typed, ready for \copy)
 *
 * Run with: node services/archive/transform-research-metrics.js
 */
class TransformResearchMetrics {

  constructor() {

    this.inputFile = 'data/research_metrics_in.csv';
    this.outputFile = 'data/research_metrics.csv';
    this.skipRowsAfterHeader = 2;
    this.columns = [
      {
        columnIn: 'RecordedDate',
        columnOut: 'survey_recorded_date',
        type: 'date'
      },
      {
        columnIn: 'ResponseId',
        columnOut: 'survey_response_id',
        type: 'string'
      },
      {
        columnIn: 'RecipientLastName',
        columnOut: 'submitter_last_name',
        type: 'string',
        transform: (v) => {
          if ( v === 'Brown') v = 'Browne';
          return v;
        }
      },
      {
        columnIn: 'RecipientFirstName',
        columnOut: 'submitter_first_name',
        type: 'string'
      },
      {
        columnIn: 'RecipientEmail',
        columnOut: 'submitter_email',
        type: 'string'
      },
      {
        columnIn: 'Department',
        columnOut: 'submitter_department',
        type: 'string'
      },
      {
        columnIn: 'Q2',
        columnOut: 'informational_interaction',
        type: 'boolean',
        transform: (v) => {
          if ( v === 'Yes') return true;
          if ( v === 'No') return false;
          return null;
        }
      },
      {
        columnIn: 'Q3',
        columnOut: 'consult_start',
        type: 'date',
        transform: (v) => {
          const m = v.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
          if (m) return `${m[3]}-${m[1]}-${m[2]}`;
          return v;
        }
      },
      {
        columnIn: 'Q4',
        columnOut: 'person_count',
        type: 'integer',
        transform: (v) => {
          if ( v == '5+') return '5';
          return v;
        }
      },
      {
        columnIn: 'Q5',
        columnOut: 'audience_type',
        type: 'string'
      },
      {
        columnIn: 'Q5_12_TEXT',
        columnOut: 'audience_type_other',
        type: 'string'
      },
      {
        columnIn: 'Q6',
        columnOut: 'consult_medium',
        type: 'string'
      },
      {
        columnIn: 'Q7',
        columnOut: 'inperson_consult_format',
        type: 'string'
      },
      {
        columnIn: 'Q7_4_TEXT',
        columnOut: 'inperson_consult_format_other',
        type: 'string'
      },
      {
        columnIn: 'Q8',
        columnOut: 'virtual_consult_format',
        type: 'string'
      },
      {
        columnIn: 'Q8_5_TEXT',
        columnOut: 'virtual_consult_format_other',
        type: 'string'
      },
      {
        columnIn: 'Q9',
        columnOut: 'consult_duration',
        type: 'integer'
      },
      {
        columnIn: 'Q10',
        columnOut: 'read_scale',
        type: 'integer'
      },
      {
        columnIn: 'Q11',
        columnOut: 'subject_area',
        type: 'string'
      },
      {
        columnIn: 'Q11_4_TEXT',
        columnOut: 'subject_area_other',
        type: 'string'
      },
      {
        columnIn: 'Q12',
        columnOut: 'consult_focus',
        type: 'string'
      },
      {
        columnIn: 'Q12_8_TEXT',
        columnOut: 'consult_focus_class_assignment',
        type: 'string'
      },
      {
        columnIn: 'Q12_16_TEXT',
        columnOut: 'consult_focus_other',
        type: 'string'
      },
      {
        columnIn: 'Q13',
        columnOut: 'collaborator',
        type: 'string'
      },
      {
        columnIn: 'Q13_9_TEXT',
        columnOut: 'collaborator_other',
        type: 'string'
      },
      {
        columnIn: 'Q14',
        columnOut: 'notes',
        type: 'string'
      }
    ];
  }

  /**
   * Coerces a (possibly transformed) cell value to the target column type,
   * returning a string suitable for CSV output. Empty string signals NULL to
   * the PostgreSQL COPY command.
   *
   * @param {*} value - Cell value after any transform has been applied.
   * @param {string} type - Column type: 'date', 'integer', 'boolean', or 'string'.
   * @returns {string} Serialised value, or empty string for NULL.
   */
  coerceType(value, type) {
    if (value === null || value === undefined || value === '') return 'NULL';

    if (type === 'date') {
      const match = String(value).match(/\d{4}-\d{2}-\d{2}/);
      return match ? match[0] : 'NULL';
    }

    if (type === 'integer') {
      const n = parseInt(value, 10);
      return isNaN(n) ? 'NULL' : String(n);
    }

    if (type === 'boolean') {
      if (value === true) return 'true';
      if (value === false) return 'false';
      return 'NULL';
    }

    // string
    return String(value).trim();
  }

  /**
   * Reads the Qualtrics CSV, drops the metadata rows, maps and coerces each
   * column per this.columns, then writes the result to this.outputFile.
   *
   * @returns {void}
   */
  run() {
    const inputPath = path.join(__dirname, this.inputFile);
    const outputPath = path.join(__dirname, this.outputFile);

    const raw = fs.readFileSync(inputPath, 'utf8');

    // parse returns string[][], one entry per row
    const rows = parse(raw, { relax_quotes: true, skip_empty_lines: false });

    if (!rows.length) {
      console.error('Input file is empty.');
      process.exit(1);
    }

    // Build a name → index map from the header row
    const header = rows[0];
    const colIndex = {};
    header.forEach((name, i) => { colIndex[name] = i; });

    // Rows to skip: header (0) + skipRowsAfterHeader metadata rows
    const dataRows = rows.slice(1 + this.skipRowsAfterHeader);

    const outputRows = [];
    for (const row of dataRows) {
      // Skip completely blank rows
      if (row.every(cell => cell.trim() === '')) continue;

      const outRow = {};
      for (const col of this.columns) {
        let value = (colIndex[col.columnIn] !== undefined)
          ? row[colIndex[col.columnIn]]
          : '';

        value = value.trim();

        if (col.transform) value = col.transform(value);

        outRow[col.columnOut] = this.coerceType(value, col.type);
      }
      outputRows.push(outRow);
    }

    const outputColumns = this.columns.map(c => ({ key: c.columnOut, header: c.columnOut }));
    const csv = stringify(outputRows, { header: true, columns: outputColumns });

    fs.writeFileSync(outputPath, csv, 'utf8');
    console.log(`Wrote ${outputRows.length} rows to ${outputPath}`);
  }
}

const transformer = new TransformResearchMetrics();
transformer.run();
