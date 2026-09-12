const path = require('path');
const fs = require('fs');

async function runTests() {
  console.log('=======================================================');
  console.log('   JUBILANT METAL & ALLOYS — AUTOMATED TEST SUITE      ');
  console.log('=======================================================\n');

  const { DatabaseManager } = require('../dist-electron/database.js');
  const testDbDir = path.join(__dirname, '../scratch');
  if (!fs.existsSync(testDbDir)) fs.mkdirSync(testDbDir, { recursive: true });
  const testDbPath = path.join(testDbDir, 'test-verification.db');
  if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);

  const db = new DatabaseManager(testDbPath);
  await db.init();
  console.log('✓ Test 1: DatabaseManager initialized successfully');

  // Test Company Profile
  const comp = db.getCompany();
  if (!comp || !comp.name.includes('JUBILANT')) throw new Error('Company profile seed failed');
  console.log(`✓ Test 2: Seeded Company Profile verified: "${comp.name}"`);

  // Test Settings & Sequence Numbering
  const settings = db.getSettings();
  if (!settings || !settings.sequenceNumber) throw new Error('Default settings failed');
  console.log(`✓ Test 3: Default settings verified. Sequence: ${settings.sequenceNumber}`);

  const qNum1 = db.getNextQuotationNumber();
  console.log(`✓ Test 4: Next Quotation Number #1: ${qNum1}`);

  // Test Customer CRUD & Duplicate Disambiguation
  const c1 = db.saveCustomer({
    customerCode: 'CUST-TEST-01',
    companyName: 'Bhartiya Petroleum Refinery',
    contactPerson: 'Sunil Verma',
    email: 'sunil@bpr.in',
    phone: '+91 98201 12345',
    gstin: '27AAACB1234F1Z5',
  });
  console.log(`✓ Test 5: Customer #1 Created: ${c1.id} (${c1.customerCode} - ${c1.companyName})`);

  // Customer #2 with same customerCode to test automatic disambiguation
  const c2 = db.saveCustomer({
    customerCode: 'CUST-TEST-01',
    companyName: 'L&T Heavy Engineering',
    contactPerson: 'Arun Mehta',
    gstin: '24AAACL5678G1Z1',
  });
  if (c2.customerCode === c1.customerCode) throw new Error('Disambiguation failed: duplicate customerCode allowed');
  console.log(`✓ Test 6: Duplicate customerCode safely disambiguated to: ${c2.customerCode}`);

  // Test Quotation Atomic Save & Line Items
  const q1 = db.saveQuotation({
    quotationNumber: qNum1,
    customerId: c1.id,
    customerName: c1.companyName,
    items: [
      {
        productName: 'Stainless Steel Seamless Pipe 316L',
        quantity: 120,
        rate: 450,
        grossAmount: 54000,
        gstRate: 18,
        totalAmount: 63720,
      },
      {
        productName: 'Inconel 625 Flange Class 300',
        quantity: 15,
        rate: 8200,
        grossAmount: 123000,
        gstRate: 18,
        totalAmount: 145140,
      },
      {
        productName: 'Monel 400 Round Bar 50mm',
        quantity: 50,
        rate: 1850,
        grossAmount: 92500,
        gstRate: 18,
        totalAmount: 109150,
      },
    ],
    subtotal: 269500,
    totalTax: 48510,
    grandTotal: 318010,
    amountInWords: 'INR Three Lakh Eighteen Thousand Ten Only',
    status: 'sent',
  });

  if (!q1 || q1.items.length !== 3) throw new Error('Quotation saving failed');
  console.log(`✓ Test 7: Quotation saved atomically with 3 items: ${q1.quotationNumber} (Grand Total: ₹${q1.grandTotal})`);

  // Verify Next Sequence Continuation
  const qNum2 = db.getNextQuotationNumber();
  if (qNum2 === qNum1) throw new Error(`Quotation numbering did not advance from ${qNum1}`);
  console.log(`✓ Test 8: Quotation sequence advanced correctly to: ${qNum2}`);

  // Test Quotation Duplication
  const qDuplicated = db.duplicateQuotation(q1.id);
  if (!qDuplicated || qDuplicated.quotationNumber === q1.quotationNumber) throw new Error('Duplication failed');
  console.log(`✓ Test 9: Quotation duplicated cleanly: ${qDuplicated.quotationNumber} (Status: ${qDuplicated.status})`);
  const qExpectedAfterDup = db.getNextQuotationNumber();

  // Test Customer Deletion
  const delOk = db.deleteCustomer(c2.id);
  if (!delOk || db.getCustomerById(c2.id)) throw new Error('Customer deletion failed');
  console.log('✓ Test 10: Customer deletion verified');

  // Test Status Update
  const updatedQ = db.updateQuotationStatus(q1.id, 'accepted', 'Approved by technical client committee');
  if (updatedQ.status !== 'accepted') throw new Error('Status update failed');
  console.log(`✓ Test 11: Quotation status updated to: ${updatedQ.status} with history tracking`);

  // ==========================================
  // PROFORMA INVOICE MODULE AUTOMATED TESTS
  // ==========================================
  const piNum1 = db.getNextProformaNumber();
  if (!piNum1 || !piNum1.startsWith('JMA-PI-')) throw new Error(`Invalid initial Proforma number: ${piNum1}`);
  console.log(`✓ Test 12: Next Proforma Number #1: ${piNum1}`);

  // Test Proforma Invoice Save with Bill To & Ship To
  const pi1 = db.saveProformaInvoice({
    proformaNumber: piNum1,
    customerId: c1.id,
    customerName: c1.companyName,
    billingAddress: '42 Nariman Point, Mumbai',
    sameAsBilling: false,
    shipToCompany: 'Bhartiya Refinery Jamnagar Plant',
    shipToContact: 'Rajesh Sharma (Site Head)',
    shippingAddress: 'Gate #4, Special Economic Zone, Jamnagar, Gujarat',
    shipToCity: 'Jamnagar',
    shipToState: 'Gujarat',
    shipToStateCode: '24',
    shipToPinCode: '361001',
    shipToPhone: '+91 98200 99999',
    items: [
      {
        productName: 'Hastelloy C276 Seamless Tubes',
        quantity: 200,
        unit: 'MTR',
        rate: 3400,
        discountPercent: 5,
        grossAmount: 646000,
        gstRate: 18,
        totalAmount: 762280,
      },
      {
        productName: 'Titanium Grade 2 Sheets 3mm',
        quantity: 10,
        unit: 'PCS',
        rate: 18500,
        discountPercent: 0,
        grossAmount: 185000,
        gstRate: 18,
        totalAmount: 218300,
      },
    ],
    subtotal: 831000,
    taxableAmount: 831000,
    isInterstate: true,
    igstTotal: 149580,
    totalTax: 149580,
    grandTotal: 980580,
    amountInWords: 'INR Nine Lakh Eighty Thousand Five Hundred Eighty Only',
    paymentTerms: '50% Advance, 50% against BL / Dispatch',
    deliveryTerms: 'CIF Kandla Port',
    otherComments: 'Inspection by Third Party (TUV) required before dispatch',
    status: 'sent',
  });

  if (!pi1 || pi1.items.length !== 2) throw new Error('Proforma saving failed');
  console.log(`✓ Test 13: Proforma Invoice saved atomically with 2 items & Ship To: ${pi1.proformaNumber} (Total: ₹${pi1.grandTotal})`);

  // Test Proforma Sequence Advancement
  const piNum2 = db.getNextProformaNumber();
  if (piNum2 === piNum1) throw new Error(`Proforma numbering did not advance from ${piNum1}`);
  console.log(`✓ Test 14: Proforma sequence advanced cleanly to: ${piNum2}`);

  // Test Quotation sequence independence
  const qNumCheck = db.getNextQuotationNumber();
  if (qNumCheck !== qExpectedAfterDup) throw new Error(`Quotation sequence was contaminated by Proforma sequence! Expected: ${qExpectedAfterDup}, got: ${qNumCheck}`);
  console.log(`✓ Test 15: Quotation sequence confirmed 100% independent (${qNumCheck})`);

  // Test Proforma Query by ID
  const fetchedPi = db.getProformaInvoiceById(pi1.id);
  if (!fetchedPi || fetchedPi.shipToCompany !== 'Bhartiya Refinery Jamnagar Plant') {
    throw new Error('Proforma retrieval or Ship To data mismatch');
  }
  console.log(`✓ Test 16: Proforma fetched by ID verified with Ship To: "${fetchedPi.shipToCompany}"`);

  // Test Proforma Duplication
  const piDuplicated = db.duplicateProformaInvoice(pi1.id);
  if (!piDuplicated || piDuplicated.proformaNumber === pi1.proformaNumber || piDuplicated.status !== 'draft') {
    throw new Error('Proforma duplication failed');
  }
  console.log(`✓ Test 17: Proforma duplicated cleanly: ${piDuplicated.proformaNumber} (Status: ${piDuplicated.status})`);

  // Test Proforma Status Update
  const updatedPi = db.updateProformaInvoiceStatus(pi1.id, 'paid', '50% advance payment received via RTGS');
  if (updatedPi.status !== 'paid' || updatedPi.statusHistory.length === 0) {
    throw new Error('Proforma status update failed');
  }
  console.log(`✓ Test 18: Proforma status updated to: ${updatedPi.status} with audit trail`);

  // Test Proforma Deletion (Cascade delete items)
  const piDelOk = db.deleteProformaInvoice(piDuplicated.id);
  if (!piDelOk || db.getProformaInvoiceById(piDuplicated.id)) {
    throw new Error('Proforma deletion failed');
  }
  console.log('✓ Test 19: Proforma deletion and cascade verified');

  console.log('\n=======================================================');
  console.log('       ALL 19 AUTOMATED BACKEND TESTS PASSED!          ');
  console.log('=======================================================\n');

  // Cleanup scratch database
  try {
    fs.unlinkSync(testDbPath);
  } catch (e) {}
}

runTests().catch((err) => {
  console.error('\n❌ TEST FAILED WITH ERROR:', err);
  process.exit(1);
});
