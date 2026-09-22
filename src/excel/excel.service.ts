import { Injectable } from '@nestjs/common';
import * as xlsx from 'xlsx';
import * as fs from 'fs';

@Injectable()
export class ExcelService {
  constructor() {}
  parseExcel(path) {
    console.log('RUNNING PARSE EXCEL');
    const workbook = xlsx.readFile(path);

    const firstSheetName = workbook.SheetNames[0];

    // Get the worksheet
    const worksheet = workbook.Sheets[firstSheetName];

    // To read a specific cell value, specify the cell address
    let addressOfCell = 'J6';

    // Parsing inverter s/l numbers
    let inverterSerialNumbers = [];
    for (let i = 6; ; i++) {
      addressOfCell = 'J' + i;
      const desiredCell = worksheet[addressOfCell];
      const desiredValue = desiredCell ? desiredCell.v : undefined;
      //;
      if (desiredValue === undefined) break;
      inverterSerialNumbers.push({ iterator: i, serialNumber: desiredValue });
    }
    //;

    const range = xlsx.utils.decode_range(worksheet['!ref']);
    console.log(
      '🚀 ~ file: excel.service.ts:32 ~ ExcelService ~ parseExcel ~ range:',
      range,
    );

    // Get the last column in the range (0-indexed)
    const lastCol = range.e.c;
    console.log(
      '🚀 ~ file: excel.service.ts:36 ~ ExcelService ~ parseExcel ~ lastCol:',
      lastCol,
    );

    function convertExcelDate(excelDateStr) {
      const dateObj = new Date((excelDateStr - (25567 + 2)) * 86400 * 1000);
      const year = dateObj.getUTCFullYear();
      const month = ('0' + (dateObj.getUTCMonth() + 1)).slice(-2);
      const day = ('0' + dateObj.getUTCDate()).slice(-2);
      return `${year}-${month}-${day}`;
    }

    let result = {};
    for (let i = 0; i < inverterSerialNumbers.length; i++) {
      const slNumber = inverterSerialNumbers[i].serialNumber;
      const rowNumber = inverterSerialNumbers[i].iterator;
      for (let j = 11; j <= lastCol; j++) {
        // Check if cell contains a date
        const cellAddress = xlsx.utils.encode_col(j) + rowNumber;
        const cellValue = worksheet[cellAddress]
          ? worksheet[cellAddress].v
          : undefined;
        if (isNaN(Date.parse(cellValue))) {
          // break;
          continue;
        }
        const dateCellAddress = xlsx.utils.encode_col(j) + 4;
        const dateCellValue = worksheet[dateCellAddress]
          ? worksheet[dateCellAddress].v
          : undefined;
        if (!result[slNumber]) {
          result[slNumber] = {};
        }
        result[slNumber][convertExcelDate(dateCellValue)] = cellValue;
      }
    }
    //     //
    return result;
  }
}
