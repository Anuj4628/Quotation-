// ==============================================================================
// PRO COMPREHENSIVE TEST SUITE FOR DOCUMENT TEMPLATE & THEME SYSTEM
// Tests: Data integrity, Calculations, All 17 Themes, Multi-Currency, Pagination,
// A4/A5 Dimensions, Fallbacks, and Zero-Error React Component Rendering
// ==============================================================================

import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { QUOTATION_THEMES, resolveTheme } from '../src/types/theme';
import { getTemplate } from '../src/components/quotation/templates/TemplateRegistry';
import { getConvertedQuotationDisplay, formatCurrency } from '../src/services/currencyService';
import { Quotation, QuotationItem, CompanyProfile, BankAccount } from '../src/types';
import { DocumentData } from '../src/components/quotation/templates/types';

// 1. Mock Complete Company Profile
const mockCompany: CompanyProfile = {
  id: 'comp-test',
  name: 'JUBILANT METAL AND ALLOYS',
  tagline: 'Govt. Recognized Star Export House • Importers, Exporters & Stockists',
  logo: '/assets/New logo.png',
  gstin: '27AABCJ1234F1Z5',
  pan: 'AABCJ1234F',
  cin: 'U28112MH2010PTC123456',
  addressLine1: 'Plot No. 42, Sector 19-C, Steel Market',
  addressLine2: 'Kalamboli, Navi Mumbai',
  city: 'Navi Mumbai',
  state: 'Maharashtra',
  stateCode: '27',
  country: 'India',
  pinCode: '410218',
  phone: '+91 98200 12345',
  email: 'sales@jubilantmetal.com',
  website: 'www.jubilantmetal.com',
};

// 2. Mock Bank Account
const mockBank: BankAccount = {
  id: 'bank-test',
  bankName: 'HDFC Bank Ltd',
  accountName: 'Jubilant Metal and Alloys',
  accountNumber: '50200012345678',
  ifscCode: 'HDFC0001234',
  branchName: 'Kalamboli SME Branch',
  isDefault: true,
};

// 3. Mock Quotation Items
function createMockItems(count: number): QuotationItem[] {
  const items: QuotationItem[] = [];
  for (let i = 1; i <= count; i++) {
    const qty = i * 2;
    const rate = 1500 + i * 250;
    const gross = qty * rate;
    const discPct = i % 2 === 0 ? 5 : 0;
    const discAmt = (gross * discPct) / 100;
    const taxable = gross - discAmt;
    const gstRate = 18;
    const taxAmt = (taxable * gstRate) / 100;
    const cgst = taxAmt / 2;
    const sgst = taxAmt / 2;

    items.push({
      id: `item-${i}`,
      srNo: i,
      productName: `Stainless Steel Seamless Pipe TP${304 + (i % 2) * 12}L`,
      description: `ASTM A312 / ASME SA312, Schedule ${40 + (i % 3) * 40}, Solution Annealed & Pickled, Random Length 6 Meters`,
      material: 'Stainless Steel',
      grade: i % 2 === 0 ? 'TP316L' : 'TP304L',
      size: `${i}" NB`,
      schedule: `SCH ${40 + (i % 3) * 40}`,
      quantity: qty,
      unit: 'MTR',
      rate: rate,
      grossAmount: gross,
      discountPercent: discPct,
      discountAmount: discAmt,
      taxableAmount: taxable,
      hsnCode: '7304',
      gstRate: gstRate,
      cgstAmount: cgst,
      sgstAmount: sgst,
      igstAmount: 0,
      totalAmount: taxable + taxAmt,
    });
  }
  return items;
}

// 4. Create Mock Quotation Object
function createMockQuotation(itemCount = 3, targetCurrency = 'INR'): Quotation {
  const items = createMockItems(itemCount);
  const subtotal = items.reduce((acc, it) => acc + it.grossAmount, 0);
  const totalDiscount = items.reduce((acc, it) => acc + it.discountAmount, 0);
  const taxableAmount = items.reduce((acc, it) => acc + it.taxableAmount, 0);
  const cgstTotal = items.reduce((acc, it) => acc + it.cgstAmount, 0);
  const sgstTotal = items.reduce((acc, it) => acc + it.sgstAmount, 0);
  const igstTotal = items.reduce((acc, it) => acc + it.igstAmount, 0);
  const totalTax = cgstTotal + sgstTotal + igstTotal;
  const grandTotal = Math.round(taxableAmount + totalTax);

  return {
    id: `quot-test-${Date.now()}`,
    quotationNumber: 'JMA/2026-27/0482',
    quotationDate: '2026-10-05',
    validUntil: '2026-10-13',
    referenceNumber: 'PO-REF-9921',
    customerReference: 'Inquiry via Email dtd 03/10',
    salesperson: 'Rajesh Sharma',
    customerId: 'cust-1',
    customerName: 'RELIANCE INFRASTRUCTURE & ENGINEERING LTD',
    customerContactPerson: 'Mr. Arvind Mehta (VP Procurement)',
    customerEmail: 'arvind.mehta@relinfra.com',
    customerPhone: '+91 98201 99887',
    customerGstin: '27AAACR1234K1Z2',
    customerPan: 'AAACR1234K',
    billingAddress: 'Reliance Complex, Gate No. 3, Thane-Belapur Road, Digha',
    shippingAddress: 'Plant Site No. 4, MIDC Industrial Area, Tarapur, Palghar - 401506',
    customerCity: 'Navi Mumbai',
    customerState: 'Maharashtra',
    customerStateCode: '27',
    customerPinCode: '400701',
    items,
    subtotal,
    totalDiscount,
    taxableAmount,
    isInterstate: false,
    cgstTotal,
    sgstTotal,
    igstTotal,
    totalTax,
    freightCharges: 0,
    packingCharges: 0,
    insuranceCharges: 0,
    loadingCharges: 0,
    otherCharges: 0,
    extraChargesTotal: 0,
    roundOff: 0,
    grandTotal,
    amountInWords: 'Fifty-Eight Thousand Nine Hundred Eighty-Four Rupees Only',
    paymentTerms: '100% Advance against Proforma Invoice',
    deliveryTerms: 'Ex-Works Kalamboli Warehouse',
    termsAndConditions: [
      'Prices: Ex-Works Kalamboli Godown.',
      'Delivery: Ready stock subject to prior sale.',
      'Taxes: GST 18% as applicable.',
      'Payment: 100% advance against Proforma Invoice.',
      'Validity: 08 days from the quotation date.',
      'Material Test Certificate (MTC) 3.1 provided along with dispatch.',
    ],
    bankAccountId: mockBank.id,
    bankDetails: mockBank,
    status: 'approved',
    statusHistory: [],
    signatureUrl: '/assets/signature.png',
    stampUrl: '/assets/stamp.png',
    signatureEnabled: true,
    stampEnabled: true,
    signatureSize: 'md',
    stampSize: 'md',
    signatoryName: 'Amit Patel',
    signatoryDesignation: 'Head - Commercial & Contracts',
    displayCurrency: targetCurrency,
    createdBy: 'admin',
    createdByName: 'Admin User',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

async function runTestSuite() {
  console.log('================================================================');
  console.log('🚀 STARTING PRO COMPREHENSIVE VERIFICATION TEST SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, details?: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName} ${details ? '- ' + details : ''}`);
      failed++;
    }
  }

  // --------------------------------------------------------------------------
  // TEST GROUP 1: THEME REGISTRATION & ATTRIBUTES
  // --------------------------------------------------------------------------
  console.log('📦 TEST GROUP 1: THEME REGISTRY & PAPER SIZES');
  const allThemes = QUOTATION_THEMES;
  assert(allThemes.length === 17, 'Total themes count equals 17 (11 Professional + 6 Festive)');

  const businessThemes = allThemes.filter((t) => t.category === 'business');
  assert(businessThemes.length === 11, 'Professional Document Templates count is 11');

  const festiveThemes = allThemes.filter((t) => t.category === 'festive');
  assert(festiveThemes.length === 6, 'Festive Themes count is 6');

  // Verify Tally Theme Specific Requirements
  const tallyTheme = allThemes.find((t) => t.id === 'tally');
  assert(!!tallyTheme, 'Tally theme exists with id "tally"');
  assert(tallyTheme?.name === 'Tally', 'Tally theme name is exactly "Tally"');
  assert(tallyTheme?.paperSize === 'A4', 'Tally theme paper size is A4');
  assert(tallyTheme?.primaryColor === '#000000', 'Tally theme uses black color palette');

  // Verify A5 Themes
  const a5Themes = allThemes.filter((t) => t.paperSize === 'A5');
  assert(a5Themes.length === 2, 'Exactly 2 themes have native A5 paper size (Advanced GST A5 & Billbook A5)');
  assert(a5Themes.some((t) => t.id === 'advanced_gst_a5'), 'advanced_gst_a5 has paperSize A5');
  assert(a5Themes.some((t) => t.id === 'billbook_a5'), 'billbook_a5 has paperSize A5');

  // --------------------------------------------------------------------------
  // TEST GROUP 2: BACKWARD COMPATIBILITY & ALIAS RESOLUTION
  // --------------------------------------------------------------------------
  console.log('\n🔄 TEST GROUP 2: BACKWARD COMPATIBILITY & ALIAS RESOLUTION');
  const aliasTests = [
    { input: 'professional', expectedId: 'classic' },
    { input: 'corporate', expectedId: 'classic' },
    { input: 'business', expectedId: 'billbook' },
    { input: 'minimal', expectedId: 'simple' },
    { input: 'premium_dark', expectedId: 'modern' },
    { input: undefined, expectedId: 'modern' },
    { input: 'unknown_custom_id', expectedId: 'modern' },
  ];

  for (const { input, expectedId } of aliasTests) {
    const resolved = resolveTheme(input);
    assert(
      resolved.id === expectedId,
      `Alias "${input || 'undefined'}" correctly resolves to fallback "${expectedId}"`
    );
  }

  // --------------------------------------------------------------------------
  // TEST GROUP 3: REACT COMPONENT SERVER-SIDE RENDERING FOR ALL 17 THEMES
  // --------------------------------------------------------------------------
  console.log('\n🖥️ TEST GROUP 3: ZERO-ERROR RENDERING FOR ALL 17 TEMPLATES');
  const testQuotation = createMockQuotation(3, 'INR');
  const display = getConvertedQuotationDisplay(testQuotation, 'INR');

  const docData: DocumentData = {
    quotation: testQuotation,
    display,
    company: mockCompany,
    bank: mockBank,
    terms: testQuotation.termsAndConditions,
    signature: {
      url: testQuotation.signatureUrl,
      enabled: true,
      size: 'md',
      signatoryName: testQuotation.signatoryName,
      signatoryDesignation: testQuotation.signatoryDesignation,
    },
    stamp: {
      url: testQuotation.stampUrl,
      enabled: true,
      size: 'md',
    },
    logoUrl: mockCompany.logo,
    documentTitle: 'TAX INVOICE',
    theme: tallyTheme!,
    paperSize: 'A4',
    isFestive: false,
  };

  for (const theme of allThemes) {
    try {
      const template = getTemplate(theme.id);
      const Component = template.component;
      const themeDocData = { ...docData, theme, paperSize: template.paperSize, isFestive: theme.category === 'festive' };

      // Render Page 1 (Single Page)
      const htmlSingle = ReactDOMServer.renderToStaticMarkup(
        React.createElement(Component, {
          data: themeDocData,
          pageNumber: 1,
          totalPages: 1,
          items: display.items,
          startIndex: 0,
          isSinglePage: true,
          isContinuationPage: false,
        })
      );

      // Verify essential data presence in rendered HTML
      const escapedCustomer = testQuotation.customerName.replace(/&/g, '&amp;');
      const hasCompanyName = htmlSingle.includes(mockCompany.name);
      const hasCustomerName = htmlSingle.includes(testQuotation.customerName) || htmlSingle.includes(escapedCustomer);
      const hasQuoteNum = htmlSingle.includes(testQuotation.quotationNumber);

      assert(
        htmlSingle.length > 500 && hasCompanyName && hasCustomerName && hasQuoteNum,
        `Template "${theme.name}" (${theme.id}) rendered successfully with company, customer & quote details`
      );

      // If Tally theme: Verify original logo is NOT grayscaled and includes "ORIGINAL FOR RECIPIENT"
      if (theme.id === 'tally') {
        assert(
          !htmlSingle.includes('grayscale'),
          'Tally theme does NOT grayscale company logo (Original Color preserved)'
        );
        assert(
          htmlSingle.includes('ORIGINAL FOR RECIPIENT'),
          'Tally theme includes classic "ORIGINAL FOR RECIPIENT" accounting badge'
        );
        assert(
          htmlSingle.includes('BILL TO (BUYER)'),
          'Tally theme includes structured "BILL TO (BUYER)" block'
        );
        assert(
          htmlSingle.includes('SHIP TO (DELIVERY ADDRESS)'),
          'Tally theme includes structured "SHIP TO (DELIVERY ADDRESS)" block'
        );
      }

      // If Festival theme: Verify watermark component is present
      if (theme.category === 'festive') {
        assert(
          htmlSingle.includes('<svg') || htmlSingle.includes('pointer-events-none'),
          `Festive theme "${theme.name}" renders background watermark elements`
        );
      }
    } catch (err: any) {
      assert(false, `Rendering template "${theme.name}" (${theme.id}) threw an error: ${err.message}`);
    }
  }

  // --------------------------------------------------------------------------
  // TEST GROUP 4: MULTI-PAGE & PAGINATION INTEGRITY
  // --------------------------------------------------------------------------
  console.log('\n📄 TEST GROUP 4: MULTI-PAGE PAGINATION INTEGRITY');
  const longQuotation = createMockQuotation(15, 'INR');
  const longDisplay = getConvertedQuotationDisplay(longQuotation, 'INR');

  try {
    const tallyReg = getTemplate('tally');
    const TallyComponent = tallyReg.component;

    // Page 1 of 2
    const htmlPage1 = ReactDOMServer.renderToStaticMarkup(
      React.createElement(TallyComponent, {
        data: { ...docData, quotation: longQuotation, display: longDisplay },
        pageNumber: 1,
        totalPages: 2,
        items: longDisplay.items.slice(0, 6),
        startIndex: 0,
        isSinglePage: false,
        isContinuationPage: false,
      })
    );

    // Page 2 of 2 (Continuation page)
    const htmlPage2 = ReactDOMServer.renderToStaticMarkup(
      React.createElement(TallyComponent, {
        data: { ...docData, quotation: longQuotation, display: longDisplay },
        pageNumber: 2,
        totalPages: 2,
        items: longDisplay.items.slice(6),
        startIndex: 6,
        isSinglePage: false,
        isContinuationPage: true,
      })
    );

    assert(htmlPage1.includes('Page 1 of 2'), 'Page 1 renders "Page 1 of 2" footer');
    assert(htmlPage2.includes('Page 2 of 2'), 'Page 2 renders "Page 2 of 2" footer');
    assert(htmlPage2.includes(longDisplay.amountInWords), 'Page 2 includes final grand total amount in words');
    assert(htmlPage2.includes(mockBank.accountNumber), 'Page 2 includes Bank Remittance details');
    assert(htmlPage2.includes(longQuotation.signatoryName!), 'Page 2 includes Authorized Signatory');
  } catch (err: any) {
    assert(false, `Multi-page rendering threw an error: ${err.message}`);
  }

  // --------------------------------------------------------------------------
  // TEST GROUP 5: MULTI-CURRENCY CONVERSION & FINANCIAL ACCURACY
  // --------------------------------------------------------------------------
  console.log('\n💱 TEST GROUP 5: MULTI-CURRENCY CONVERSION & CALCULATION INTEGRITY');
  const currenciesToTest = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SAR'];

  for (const curr of currenciesToTest) {
    const convDisplay = getConvertedQuotationDisplay(testQuotation, curr);
    assert(
      convDisplay.currency.code === curr,
      `Currency engine converts to ${curr} with correct code`
    );

    const formattedTotal = convDisplay.format(convDisplay.grandTotal);
    assert(
      formattedTotal.includes(convDisplay.currency.symbol) || formattedTotal.includes('د.إ') || formattedTotal.includes('ر.س'),
      `Formatted total "${formattedTotal}" contains correct symbol for ${curr}`
    );

    assert(
      convDisplay.amountInWords.length > 5,
      `Amount in words in ${curr} is generated: "${convDisplay.amountInWords}"`
    );
  }

  // Verify Calculations Remain 100% Identical Across Theme Switches
  const classicHtml = ReactDOMServer.renderToStaticMarkup(
    React.createElement(getTemplate('classic').component, {
      data: docData,
      pageNumber: 1,
      totalPages: 1,
      items: display.items,
      startIndex: 0,
      isSinglePage: true,
      isContinuationPage: false,
    })
  );

  const tallyHtml = ReactDOMServer.renderToStaticMarkup(
    React.createElement(getTemplate('tally').component, {
      data: docData,
      pageNumber: 1,
      totalPages: 1,
      items: display.items,
      startIndex: 0,
      isSinglePage: true,
      isContinuationPage: false,
    })
  );

  const formattedGrandTotal = formatCurrency(testQuotation.grandTotal, 'INR');
  assert(
    classicHtml.includes(formattedGrandTotal) && tallyHtml.includes(formattedGrandTotal),
    `Grand Total ${formattedGrandTotal} is strictly identical across both Classic and Tally layouts`
  );

  // --------------------------------------------------------------------------
  // TEST SUMMARY
  // --------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`📊 TEST SUITE SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('🎉 ALL PRO TESTS PASSED WITH 100% SUCCESS!');
    process.exit(0);
  }
}

runTestSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
