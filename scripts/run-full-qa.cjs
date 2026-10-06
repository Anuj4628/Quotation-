const fs = require('fs');
const path = require('path');
const os = require('os');
const { DatabaseManager } = require('../dist-electron/database.js');

async function runQATests() {
  console.log('====================================================');
  console.log('   COMPREHENSIVE BACKEND & DATABASE QA TEST SUITE   ');
  console.log('====================================================\n');

  const testDbDir = path.join(os.tmpdir(), 'bhawal-qa-test-' + Date.now());
  fs.mkdirSync(testDbDir, { recursive: true });
  const testDbPath = path.join(testDbDir, 'test-qa.sqlite');

  console.log('1. INITIALIZING TEST DATABASE AT:', testDbPath);
  const db = new DatabaseManager(testDbPath);
  await db.init();

  let passed = 0;
  let failed = 0;
  function assert(condition, message) {
    if (condition) {
      console.log('  ✓ ' + message);
      passed++;
    } else {
      console.error('  ✗ FAILED: ' + message);
      failed++;
    }
  }

  // --- SECTION A: DEFAULT SETTINGS & TERMS ---
  console.log('\n--- SECTION A: DEFAULT SETTINGS, TERMS & 8-DAY VALIDITY ---');
  const settings = db.getSettings();
  assert(settings.defaultValidityDays === 8, 'defaultValidityDays is 8 (actual: ' + settings.defaultValidityDays + ')');
  assert(settings.defaultPaymentTerms === '100% ADVANCE AGAINST PERFORMA INVOICE', 'defaultPaymentTerms is 100% ADVANCE AGAINST PERFORMA INVOICE');
  assert(settings.defaultDeliveryTerms === 'READY STOCK', 'defaultDeliveryTerms is READY STOCK');

  const templates = db.getTermsTemplates();
  assert(templates.length >= 1, 'Default terms template exists in database');
  const defaultTmpl = templates.find((t) => t.isDefault) || templates[0];
  const terms = defaultTmpl.terms;
  assert(terms.length === 6, 'Terms template has exactly 6 terms (count: ' + terms.length + ')');
  assert(terms[0] === 'Prices: EX-WORKS', 'Term 1 is Prices: EX-WORKS');
  assert(terms[1] === 'Delivery: READY STOCK', 'Term 2 is Delivery: READY STOCK');
  assert(terms[2] === 'Loading / Packing: EXTRA', 'Term 3 is Loading / Packing: EXTRA');
  assert(terms[3] === 'Taxes: GST EXTRA 18%', 'Term 4 is Taxes: GST EXTRA 18%');
  assert(terms[4] === 'Payment: 100% ADVANCE AGAINST PERFORMA INVOICE', 'Term 5 is Payment: 100% ADVANCE AGAINST PERFORMA INVOICE');
  assert(terms[5] === 'Validity: 08 DAYS', 'Term 6 is Validity: 08 DAYS');

  // --- SECTION B: CUSTOMER MODULE ---
  console.log('\n--- SECTION B: CUSTOMER MODULE CRUD & EDGE CASES ---');
  // 1. Minimum valid fields
  const custMin = db.saveCustomer({
    companyName: 'Minimal Steel Works',
  });
  assert(custMin && custMin.id, 'Created customer with minimum valid fields');
  assert(custMin.customerCode.startsWith('CUST-JMA-'), 'Auto-generated customer code: ' + custMin.customerCode);

  // 2. Full fields + Special characters + Long text
  const longName = "Bharat Heavy Steel & Alloys Industrial Fabrication Private Limited (Unit - IV) O'Connor Complex";
  const longAddress = 'Plot No. 124/A & 124/B, MIDC Industrial Area, Near Fire Station, Phase II, Taloja, Navi Mumbai, District Raigad, Maharashtra - 410208, Landmark: Opposite Jindal SAW Gate #3';
  const custFull = db.saveCustomer({
    companyName: longName,
    contactPerson: "Mr. Arvind O'Connor-Deshmukh",
    designation: 'VP - Procurement & Logistics',
    email: 'arvind.deshmukh+procurement@bharatheavy.co.in',
    phone: '+91 98200 12345',
    whatsapp: '+91 98200 12345',
    gstin: '27AABCB1234F1Z5',
    pan: 'AABCB1234F',
    billingAddress: longAddress,
    shippingAddress: longAddress,
    city: 'Navi Mumbai',
    state: 'Maharashtra',
    stateCode: '27',
    country: 'India',
    pinCode: '410208',
    paymentTerms: '100% ADVANCE AGAINST PERFORMA INVOICE',
    creditLimit: 25000000,
    notes: 'Key Tier-1 EPC Contractor. Approved for nuclear grade 316L pipes & fittings.',
  });
  assert(custFull && custFull.id, 'Created full customer with special chars and long text');
  assert(custFull.companyName === longName, 'Long company name preserved accurately');

  // 3. Edit customer
  const updatedCust = db.saveCustomer({
    id: custFull.id,
    companyName: longName + ' [UPDATED]',
    phone: '+91 98200 99999',
  });
  assert(updatedCust.companyName.includes('[UPDATED]'), 'Customer updated successfully');
  assert(updatedCust.id === custFull.id, 'Customer ID remained unchanged after edit');

  // Verify other customer was NOT affected
  const custMinCheck = db.getCustomerById(custMin.id);
  assert(custMinCheck.companyName === 'Minimal Steel Works', 'Editing custFull did NOT modify custMin');

  // 4. Duplicate code collision handling
  const custDup = db.saveCustomer({
    customerCode: custFull.customerCode,
    companyName: 'Duplicate Code Tester Co',
  });
  assert(custDup.customerCode !== custFull.customerCode, 'Customer code collision resolved safely: ' + custDup.customerCode);

  // 5. Delete customer
  const delCustRes = db.deleteCustomer(custMin.id);
  assert(delCustRes === true, 'Deleted minimal customer successfully');
  assert(!db.getCustomerById(custMin.id), 'Deleted customer no longer exists');

  // --- SECTION C: QUOTATION MODULE ---
  console.log('\n--- SECTION C: QUOTATION MODULE CRUD, CALCULATIONS & EDITS ---');
  const quote1 = db.saveQuotation({
    quotationNumber: 'JMA-2026-TEST01',
    quotationDate: '2026-10-01',
    validUntil: '2026-10-09',
    customerId: custFull.id,
    customerName: custFull.companyName,
    isInterstate: 0,
    subtotal: 100000,
    totalDiscount: 5000,
    taxableAmount: 95000,
    cgstTotal: 8550,
    sgstTotal: 8550,
    igstTotal: 0,
    totalTax: 17100,
    freightCharges: 2500,
    packingCharges: 1000,
    insuranceCharges: 500,
    loadingCharges: 400,
    otherCharges: 0,
    extraChargesTotal: 4400,
    roundOff: 0,
    grandTotal: 116500,
    amountInWords: 'One Lakh Sixteen Thousand Five Hundred Rupees Only',
    termsAndConditions: terms,
    status: 'draft',
    items: [
      {
        productName: 'SS 304 Seamless Pipe Schedule 40',
        description: 'Size 2" NB, Sch 40, ASTM A312 TP304, Length 6 Meters',
        material: 'Stainless Steel',
        grade: 'SS 304',
        size: '2" NB',
        schedule: 'Sch 40',
        thickness: '3.91mm',
        quantity: 50,
        unit: 'MTR',
        rate: 2000,
        grossAmount: 100000,
        discountPercent: 5,
        discountAmount: 5000,
        taxableAmount: 95000,
        gstRate: 18,
        cgstAmount: 8550,
        sgstAmount: 8550,
        igstAmount: 0,
        totalAmount: 112100,
        hsnCode: '7304',
      },
    ],
  });
  assert(quote1 && quote1.id, 'Quotation saved successfully with ID: ' + quote1?.id);
  assert(quote1.quotationNumber === 'JMA-2026-TEST01', 'Quotation number preserved');
  assert(quote1.items && quote1.items.length === 1, 'Quotation item saved successfully');

  // Edit Quotation without duplicating
  const quote1Edited = db.saveQuotation({
    id: quote1.id,
    quotationNumber: quote1.quotationNumber,
    quotationDate: '2026-10-01',
    validUntil: '2026-10-09',
    customerId: custFull.id,
    customerName: custFull.companyName,
    subtotal: 200000,
    totalDiscount: 10000,
    taxableAmount: 190000,
    cgstTotal: 17100,
    sgstTotal: 17100,
    igstTotal: 0,
    totalTax: 34200,
    extraChargesTotal: 0,
    grandTotal: 224200,
    status: 'approved',
    termsAndConditions: terms,
    items: [
      {
        productName: 'SS 304 Seamless Pipe Schedule 40',
        description: 'Updated size 3" NB',
        quantity: 100,
        unit: 'MTR',
        rate: 2000,
        grossAmount: 200000,
        taxableAmount: 190000,
        totalAmount: 224200,
        gstRate: 18,
      },
    ],
  });
  assert(quote1Edited.id === quote1.id, 'Quotation editing preserved exact same ID');
  assert(quote1Edited.grandTotal === 224200, 'Quotation grand total updated to 224200');
  assert(quote1Edited.status === 'approved', 'Quotation status updated to approved');

  // Verify total count did not increase
  const quotesList = db.getQuotations();
  assert(quotesList.length === 1, 'No duplicate quotation created on edit (count is 1)');

  // Status history verification
  const readBack = db.getQuotationById(quote1.id);
  assert(readBack.statusHistory && readBack.statusHistory.length >= 2, 'Status history tracked transitions');

  // --- SECTION D: PROFORMA MODULE ---
  console.log('\n--- SECTION D: PROFORMA MODULE CRUD ---');
  const pi1 = db.saveProformaInvoice({
    proformaNumber: 'JMA-PI-2026-501',
    proformaDate: '2026-10-01',
    validUntil: '2026-10-09',
    customerId: custFull.id,
    customerName: custFull.companyName,
    grandTotal: 224200,
    status: 'draft',
    termsAndConditions: terms,
    items: [
      {
        productName: 'SS 304 Seamless Pipe',
        quantity: 100,
        unit: 'MTR',
        rate: 2000,
        taxableAmount: 190000,
        totalAmount: 224200,
        gstRate: 18,
      },
    ],
  });
  assert(pi1 && pi1.id, 'Proforma Invoice created successfully with ID: ' + pi1?.id);
  assert(pi1.validUntil === '2026-10-09', 'Proforma validity date is 2026-10-09 (8 days)');

  // --- SECTION E: FLUSH & PERSISTENCE CHECK ---
  console.log('\n--- SECTION E: PERSISTENCE, RELOAD & RESTART TEST ---');
  db.flush();

  // Create a brand new DatabaseManager pointing to the exact same file to simulate application restart
  const dbRestarted = new DatabaseManager(testDbPath);
  await dbRestarted.init();

  const restartedQuotes = dbRestarted.getQuotations();
  assert(restartedQuotes.length === 1, 'Quotations survived application restart');
  assert(restartedQuotes[0].quotationNumber === 'JMA-2026-TEST01', 'Quotation number matches after restart');
  assert(restartedQuotes[0].grandTotal === 224200, 'Quotation grand total matches after restart');
  assert(restartedQuotes[0].items.length === 1, 'Quotation line items intact after restart');
  assert(restartedQuotes[0].validUntil === '2026-10-09', 'Validity date intact after restart');

  const restartedCust = dbRestarted.getCustomerById(custFull.id);
  assert(restartedCust !== undefined, 'Customer survived application restart');
  assert(restartedCust.companyName.includes('[UPDATED]'), 'Customer updated values intact after restart');

  const restartedPIs = dbRestarted.getProformaInvoices();
  assert(restartedPIs.length === 1, 'Proforma invoice survived application restart');

  // --- SECTION F: BACKUP & RESTORE TEST ---
  console.log('\n--- SECTION F: BACKUP & RESTORE TEST ---');
  const backupPath = path.join(testDbDir, 'backup-test.sqlite');
  const backupSuccess = dbRestarted.backupDatabase(backupPath);
  assert(backupSuccess === true && fs.existsSync(backupPath), 'Database backup file created successfully');

  // Modify database after backup
  dbRestarted.deleteQuotation(quote1.id);
  assert(dbRestarted.getQuotations().length === 0, 'Deleted quotation for restore test');

  // Restore database
  const restoreSuccess = await dbRestarted.restoreDatabase(backupPath);
  assert(restoreSuccess === true, 'Database restore reported success');
  const restoredQuotes = dbRestarted.getQuotations();
  assert(restoredQuotes.length === 1, 'Quotation restored from backup file successfully');

  // Clean up test dir
  try {
    dbRestarted.close();
    fs.rmSync(testDbDir, { recursive: true, force: true });
  } catch (e) {}

  console.log('\n====================================================');
  console.log('   TEST RESULTS: ' + passed + ' PASSED, ' + failed + ' FAILED');
  console.log('====================================================');
  if (failed > 0) process.exit(1);
}

runQATests().catch((err) => {
  console.error('Test script crashed:', err);
  process.exit(1);
});
