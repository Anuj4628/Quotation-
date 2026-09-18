// ==============================================================================
// JUBILANT METAL AND ALLOYS - COMMERCIAL & GST CALCULATION ENGINE
// ==============================================================================

import { QuotationItem, UnitType } from '../types';

export interface CalculationInput {
  items: Array<{
    id?: string;
    srNo?: number;
    productId?: string;
    productName: string;
    description: string;
    material: string;
    grade: string;
    size: string;
    schedule?: string;
    thickness?: string;
    standard?: string;
    quantity: number;
    unit: UnitType;
    rate: number;
    discountPercent: number;
    gstRate: number;
    hsnCode: string;
  }>;
  companyState: string;
  customerState: string;
  freightAmount?: number;
  packingAmount?: number;
  insuranceAmount?: number;
  loadingAmount?: number;
  otherChargesAmount?: number;
}

export interface CalculationResult {
  items: QuotationItem[];
  subtotal: number;
  totalDiscount: number;
  taxableAmount: number;
  isInterstate: boolean;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  totalTax: number;
  freightCharges: number;
  packingCharges: number;
  insuranceCharges: number;
  loadingCharges: number;
  otherCharges: number;
  extraChargesTotal: number;
  unroundedGrandTotal: number;
  roundOff: number;
  grandTotal: number;
  amountInWords: string;
}

/**
 * Normalizes state name or code for robust comparison (e.g., "Maharashtra" vs "MH" vs "maharashtra")
 */
export function isSameState(stateA: string, stateB: string): boolean {
  if (!stateA || !stateB) return true; // default intra-state if undefined
  const cleanA = stateA.trim().toLowerCase();
  const cleanB = stateB.trim().toLowerCase();

  if (cleanA === cleanB) return true;

  // Common Indian state code mappings
  const stateMap: Record<string, string[]> = {
    maharashtra: ['mh', '27', 'maharashtra'],
    gujarat: ['gj', '24', 'gujarat'],
    delhi: ['dl', '07', 'delhi'],
    karnataka: ['ka', '29', 'karnataka'],
    tamilnadu: ['tn', '33', 'tamil nadu', 'tamilnadu'],
    telangana: ['ts', 'tg', '36', 'telangana'],
    rajasthan: ['rj', '08', 'rajasthan'],
    uttarpradesh: ['up', '09', 'uttar pradesh', 'uttarpradesh'],
    westbengal: ['wb', '19', 'west bengal', 'westbengal'],
    haryana: ['hr', '06', 'haryana'],
    punjab: ['pb', '03', 'punjab'],
    madhyapradesh: ['mp', '23', 'madhya pradesh', 'madhyapradesh'],
    andhrapradesh: ['ap', '37', 'andhra pradesh', 'andhrapradesh'],
  };

  for (const key of Object.keys(stateMap)) {
    const list = stateMap[key];
    if (list.includes(cleanA) && list.includes(cleanB)) {
      return true;
    }
  }

  return false;
}

/**
 * Resolves 2-digit Indian GST State Code from state name or GSTIN
 */
export function getStateCodeByName(stateName: string, gstin?: string): string {
  if (gstin && gstin.trim().length >= 2) {
    const code = gstin.trim().substring(0, 2);
    if (!isNaN(Number(code))) return code;
  }

  if (!stateName) return '27';
  const clean = stateName.trim().toLowerCase().replace(/[^a-z]/g, '');

  const stateToCode: Record<string, string> = {
    jammuandkashmir: '01',
    jammukashmir: '01',
    himachalpradesh: '02',
    punjab: '03',
    chandigarh: '04',
    uttarakhand: '05',
    haryana: '06',
    delhi: '07',
    rajasthan: '08',
    uttarpradesh: '09',
    bihar: '10',
    sikkim: '11',
    arunachalpradesh: '12',
    nagaland: '13',
    manipur: '14',
    mizoram: '15',
    tripura: '16',
    meghalaya: '17',
    assam: '18',
    westbengal: '19',
    bengal: '19',
    jharkhand: '20',
    odisha: '21',
    orissa: '21',
    chhattisgarh: '22',
    madhyapradesh: '23',
    gujarat: '24',
    damananddiu: '26',
    dadraandnagarhaveli: '26',
    maharashtra: '27',
    karnataka: '29',
    goa: '30',
    kerala: '32',
    tamilnadu: '33',
    puducherry: '34',
    pondicherry: '34',
    telangana: '36',
    andhrapradesh: '37',
    ladakh: '38',
  };

  return stateToCode[clean] || '27';
}

/**
 * Executes full quotation commercial & tax calculations
 */
export function calculateQuotation(input: CalculationInput): CalculationResult {
  const isInterstate = !isSameState(input.companyState, input.customerState);

  let subtotal = 0;
  let totalDiscount = 0;
  let taxableAmount = 0;
  let cgstTotal = 0;
  let sgstTotal = 0;
  let igstTotal = 0;

  const processedItems: QuotationItem[] = input.items.map((item, index) => {
    const quantity = Number(item.quantity) || 0;
    const rate = Number(item.rate) || 0;
    const discountPercent = Number(item.discountPercent) || 0;
    const gstRate = item.gstRate !== undefined && !isNaN(Number(item.gstRate)) ? Number(item.gstRate) : 18;

    const grossAmount = round2(quantity * rate);
    const discountAmount = round2((grossAmount * discountPercent) / 100);
    const itemTaxable = round2(grossAmount - discountAmount);

    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;

    if (isInterstate) {
      igstAmount = round2((itemTaxable * gstRate) / 100);
    } else {
      cgstAmount = round2((itemTaxable * (gstRate / 2)) / 100);
      sgstAmount = round2((itemTaxable * (gstRate / 2)) / 100);
    }

    const totalAmount = round2(itemTaxable + cgstAmount + sgstAmount + igstAmount);

    subtotal += grossAmount;
    totalDiscount += discountAmount;
    taxableAmount += itemTaxable;
    cgstTotal += cgstAmount;
    sgstTotal += sgstAmount;
    igstTotal += igstAmount;

    return {
      id: item.id || `item-${index + 1}`,
      srNo: item.srNo || index + 1,
      productId: item.productId,
      productName: item.productName || 'Industrial Metal Product',
      description: item.description || '',
      material: item.material || '',
      grade: item.grade || '',
      size: item.size || '',
      schedule: item.schedule || '',
      thickness: item.thickness || '',
      standard: item.standard || '',
      quantity,
      unit: item.unit || 'PCS',
      rate,
      grossAmount,
      discountPercent,
      discountAmount,
      taxableAmount: itemTaxable,
      hsnCode: item.hsnCode || '7304',
      gstRate,
      cgstAmount,
      sgstAmount,
      igstAmount,
      totalAmount,
    };
  });

  const freightCharges = Number(input.freightAmount) || 0;
  const packingCharges = Number(input.packingAmount) || 0;
  const insuranceCharges = Number(input.insuranceAmount) || 0;
  const loadingCharges = Number(input.loadingAmount) || 0;
  const otherCharges = Number(input.otherChargesAmount) || 0;

  const extraChargesTotal = round2(
    freightCharges + packingCharges + insuranceCharges + loadingCharges + otherCharges
  );

  const totalTax = round2(cgstTotal + sgstTotal + igstTotal);
  const unroundedGrandTotal = round2(taxableAmount + totalTax + extraChargesTotal);
  const grandTotal = Math.round(unroundedGrandTotal);
  const roundOff = round2(grandTotal - unroundedGrandTotal);

  const amountInWords = numberToWordsIndian(grandTotal);

  return {
    items: processedItems,
    subtotal: round2(subtotal),
    totalDiscount: round2(totalDiscount),
    taxableAmount: round2(taxableAmount),
    isInterstate,
    cgstTotal: round2(cgstTotal),
    sgstTotal: round2(sgstTotal),
    igstTotal: round2(igstTotal),
    totalTax,
    freightCharges,
    packingCharges,
    insuranceCharges,
    loadingCharges,
    otherCharges,
    extraChargesTotal,
    unroundedGrandTotal,
    roundOff,
    grandTotal,
    amountInWords,
  };
}

export function round2(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

export function formatINR(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '₹0.00';
  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount));
  const sign = amount < 0 ? '-' : '';
  return `${sign}₹${formatted}`;
}

/**
 * Converts numbers into formal Indian Currency English Words:
 * E.g., 160950 -> "Rupees One Lakh Sixty Thousand Nine Hundred Fifty Only"
 */
export function numberToWordsIndian(amount: number): string {
  if (!amount || amount === 0) return 'Rupees Zero Only';

  const singleDigits = [
    '',
    'One',
    'Two',
    'Three',
    'Four',
    'Five',
    'Six',
    'Seven',
    'Eight',
    'Nine',
  ];
  const teens = [
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen',
  ];
  const tens = [
    '',
    '',
    'Twenty',
    'Thirty',
    'Forty',
    'Fifty',
    'Sixty',
    'Seventy',
    'Eighty',
    'Ninety',
  ];

  function convertTwoDigits(n: number): string {
    if (n === 0) return '';
    if (n < 10) return singleDigits[n];
    if (n < 20) return teens[n - 10];
    const unit = n % 10;
    const ten = Math.floor(n / 10);
    return tens[ten] + (unit > 0 ? ' ' + singleDigits[unit] : '');
  }

  function convertThreeDigits(n: number): string {
    const hundred = Math.floor(n / 100);
    const remainder = n % 100;
    let res = '';
    if (hundred > 0) {
      res += singleDigits[hundred] + ' Hundred';
      if (remainder > 0) res += ' ';
    }
    if (remainder > 0) {
      res += convertTwoDigits(remainder);
    }
    return res;
  }

  const intPart = Math.floor(Math.abs(amount));
  const decPart = Math.round((Math.abs(amount) - intPart) * 100);

  if (intPart === 0 && decPart === 0) return 'Rupees Zero Only';

  const crore = Math.floor(intPart / 10000000);
  const lakh = Math.floor((intPart % 10000000) / 100000);
  const thousand = Math.floor((intPart % 100000) / 1000);
  const remaining = intPart % 1000;

  const parts: string[] = [];

  if (crore > 0) {
    parts.push(convertThreeDigits(crore) + ' Crore');
  }
  if (lakh > 0) {
    parts.push(convertTwoDigits(lakh) + ' Lakh');
  }
  if (thousand > 0) {
    parts.push(convertTwoDigits(thousand) + ' Thousand');
  }
  if (remaining > 0) {
    parts.push(convertThreeDigits(remaining));
  }

  let result = '';
  if (parts.length > 0) {
    result = 'Rupees ' + parts.join(' ').trim();
    if (decPart > 0) {
      result += ' and ' + convertTwoDigits(decPart) + ' Paise';
    }
  } else if (decPart > 0) {
    result = 'Rupees ' + convertTwoDigits(decPart) + ' Paise';
  } else {
    return 'Rupees Zero Only';
  }

  return result.trim() + ' Only';
}
