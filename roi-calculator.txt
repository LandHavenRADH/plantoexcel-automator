import React, { useState, useEffect } from 'react';
import { Calculator, DollarSign, Percent, Calendar, TrendingUp, CheckCircle2, XCircle, Info, Clock, Wallet, Download, FileSpreadsheet } from 'lucide-react';

const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden ${className}`}>
    {children}
  </div>
);

const InputField = ({ label, value, onChange, icon: Icon, type = "number", step = "any", suffix, tooltip, placeholder }) => (
  <div className="mb-4">
    <div className="flex items-center gap-2 mb-1.5">
      <label className="text-sm font-semibold text-slate-700 block">
        {label}
      </label>
      {tooltip && (
        <div className="group relative">
          <Info className="w-3.5 h-3.5 text-slate-400 cursor-help" />
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-800 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
            {tooltip}
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-800"></div>
          </div>
        </div>
      )}
    </div>
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
        <Icon className="w-4 h-4" />
      </div>
      <input
        type={type}
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="block w-full pl-10 pr-12 py-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 text-sm transition-all placeholder:text-slate-300"
        placeholder={placeholder || "0"}
      />
      {suffix && (
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-500 text-sm font-medium">
          {suffix}
        </div>
      )}
    </div>
  </div>
);

const ResultRow = ({ label, value, subValue, highlight = false, positive, negative }) => (
  <div className={`flex justify-between items-start py-3 border-b border-slate-100 last:border-0 ${highlight ? 'bg-slate-50 -mx-4 px-4' : ''}`}>
    <span className="text-sm text-slate-600 font-medium pt-0.5">{label}</span>
    <div className="text-right">
      <div className={`text-base font-bold ${positive ? 'text-emerald-600' : negative ? 'text-red-600' : 'text-slate-900'}`}>
        {value}
      </div>
      {subValue && <div className="text-xs text-slate-500 mt-0.5">{subValue}</div>}
    </div>
  </div>
);

const App = () => {
  // Inputs
  const [purchasePrice, setPurchasePrice] = useState(500000);
  const [purchaseLtv, setPurchaseLtv] = useState(100); 
  const [marketLtv, setMarketLtv] = useState(70);    
  const [interestRate, setInterestRate] = useState(6.0);
  const [amortization, setAmortization] = useState(300);
  const [dscr, setDscr] = useState(1.20);
  const [capRate, setCapRate] = useState(6.0);

  // Expense Inputs
  const [taxes, setTaxes] = useState(5000);
  const [taxInflation, setTaxInflation] = useState(2.0); // Separate inflation for taxes
  const [insurance, setInsurance] = useState(2500);
  const [insuranceInflation, setInsuranceInflation] = useState(2.0); // Separate inflation for insurance

  // New Inputs for Holding Period
  const [holdingPeriod, setHoldingPeriod] = useState(5);
  const [initialRentInput, setInitialRentInput] = useState(''); 
  const [annualRentIncrease, setAnnualRentIncrease] = useState(3.0);
  const [rentIncreaseFrequency, setRentIncreaseFrequency] = useState(1);
  const [discountRate, setDiscountRate] = useState(0.0);

  // Calculated States
  const [loanAmount, setLoanAmount] = useState(0);
  const [monthlyPayment, setMonthlyPayment] = useState(0);
  const [annualDebtService, setAnnualDebtService] = useState(0);
  const [requiredNOI, setRequiredNOI] = useState(0);
  const [requiredGrossRent, setRequiredGrossRent] = useState(0);
  const [marketValue, setMarketValue] = useState(0);
  const [impliedLtv, setImpliedLtv] = useState(0);
  const [canFinance100, setCanFinance100] = useState(false);
  
  // Return Analysis States
  const [potentialProfit, setPotentialProfit] = useState(0);
  const [totalCashFlow, setTotalCashFlow] = useState(0);
  const [totalReturn, setTotalReturn] = useState(0);
  const [roi, setRoi] = useState(0);
  
  // Discounted Analysis States
  const [discountedTotalReturn, setDiscountedTotalReturn] = useState(0);
  const [discountedRoi, setDiscountedRoi] = useState(0);

  // Load xlsx-js-style for Styled Excel Export
  useEffect(() => {
    const script = document.createElement('script');
    // Using xlsx-js-style which is a fork of SheetJS that supports styling
    script.src = "https://cdn.jsdelivr.net/npm/xlsx-js-style@1.2.0/dist/xlsx.bundle.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    }
  }, []);

  useEffect(() => {
    // 1. Calculate Loan Amount
    const calculatedLoan = purchasePrice * (purchaseLtv / 100);
    setLoanAmount(calculatedLoan);

    // 2. Calculate Debt Service (PMT Formula)
    const r = (interestRate / 100) / 12;
    const n = amortization; 
    let pmt = 0;
    if (r > 0 && n > 0 && calculatedLoan > 0) {
      pmt = (calculatedLoan * r) / (1 - Math.pow(1 + r, -n));
    } else if (n > 0 && calculatedLoan > 0) {
      pmt = calculatedLoan / n;
    }

    const monthlyPmt = pmt;
    const annualService = pmt * 12;
    
    setMonthlyPayment(monthlyPmt);
    setAnnualDebtService(annualService);

    // 3. Calculate Required NOI & Required Gross Rent
    // Required NOI is purely based on Debt Service and DSCR
    const calculatedRequiredNOI = annualService * dscr;
    setRequiredNOI(calculatedRequiredNOI);

    // Required Gross Rent = Required NOI + Current Expenses
    const currentYear1Expenses = parseFloat(taxes || 0) + parseFloat(insurance || 0);
    const calculatedRequiredGrossRent = calculatedRequiredNOI + currentYear1Expenses;
    setRequiredGrossRent(calculatedRequiredGrossRent);

    // 4. Calculate Market Value (Based on Required NOI)
    let calculatedMarketValue = 0;
    if (capRate > 0) {
      calculatedMarketValue = calculatedRequiredNOI / (capRate / 100);
    }
    setMarketValue(calculatedMarketValue);

    // 5. Calculate Implied LTV
    let calculatedImpliedLtv = 0;
    if (calculatedMarketValue > 0) {
      calculatedImpliedLtv = purchasePrice / calculatedMarketValue;
    }
    setImpliedLtv(calculatedImpliedLtv);

    // 6. Check 100% Financing
    const isFinancable = calculatedImpliedLtv < (marketLtv / 100);
    setCanFinance100(isFinancable);

    // 7. Calculate Returns (Holding Period Analysis)
    // A. Capital Gains (Appreciation at Market Value)
    const capitalGains = calculatedMarketValue - purchasePrice;
    setPotentialProfit(capitalGains);

    // B. Cash Flow Analysis
    let accumulatedCashFlow = 0;
    let accumulatedDiscountedCashFlow = 0;

    // Determine starting Gross Rent: User Input OR fallback to Required Gross Rent
    let currentAnnualGrossRent = (initialRentInput !== '' && !isNaN(initialRentInput)) 
      ? parseFloat(initialRentInput) 
      : calculatedRequiredGrossRent;
    
    // Safe Frequency
    const safeFrequency = Math.max(1, Math.round(rentIncreaseFrequency || 1));

    // Loop through holding period
    for (let year = 1; year <= holdingPeriod; year++) {
      // Calculate Expenses for this year (separately inflated)
      // Year 1 = Base. Year 2 = Base * (1 + inflation)^1
      
      const currentYearTaxes = (parseFloat(taxes) || 0) * Math.pow(1 + (taxInflation / 100), year - 1);
      const currentYearInsurance = (parseFloat(insurance) || 0) * Math.pow(1 + (insuranceInflation / 100), year - 1);
      
      const currentYearExpenses = currentYearTaxes + currentYearInsurance;

      // Calculate Net Operating Income (NOI)
      const currentYearNOI = currentAnnualGrossRent - currentYearExpenses;

      // Annual Cash Flow = NOI - Debt Service
      const annualCashFlow = currentYearNOI - annualService;
      accumulatedCashFlow += annualCashFlow;
      
      // Discounting Logic
      const discountFactor = Math.pow(1 + (discountRate / 100), year);
      accumulatedDiscountedCashFlow += (annualCashFlow / discountFactor);

      // Increase rent for NEXT year if frequency matches
      if (year % safeFrequency === 0) {
        currentAnnualGrossRent = currentAnnualGrossRent * (1 + (annualRentIncrease / 100));
      }
    }
    setTotalCashFlow(accumulatedCashFlow);

    // C. Total Return & ROI
    const totalCalcReturn = capitalGains + accumulatedCashFlow;
    setTotalReturn(totalCalcReturn);
    
    const calculatedRoi = purchasePrice > 0 ? (totalCalcReturn / purchasePrice) * 100 : 0;
    setRoi(calculatedRoi);

    // D. Discounted Return & ROI
    // Discount Capital Gains (Terminal Value)
    const terminalDiscountFactor = Math.pow(1 + (discountRate / 100), holdingPeriod);
    const discountedCapitalGains = capitalGains / terminalDiscountFactor;

    const totalCalcDiscountedReturn = discountedCapitalGains + accumulatedDiscountedCashFlow;
    setDiscountedTotalReturn(totalCalcDiscountedReturn);

    const calculatedDiscountedRoi = purchasePrice > 0 ? (totalCalcDiscountedReturn / purchasePrice) * 100 : 0;
    setDiscountedRoi(calculatedDiscountedRoi);

  }, [purchasePrice, purchaseLtv, marketLtv, interestRate, amortization, dscr, capRate, holdingPeriod, initialRentInput, annualRentIncrease, rentIncreaseFrequency, taxes, insurance, taxInflation, insuranceInflation, discountRate]);

  // Excel Export Handler
  const handleExport = () => {
    if (!window.XLSX) {
      alert("Excel library is loading, please try again in a moment.");
      return;
    }

    const XLSX = window.XLSX;

    // Helper to format currency for Excel
    const fmt = (num) => {
        return { v: num, t: 'n', s: { numFmt: '"$"#,##0' } };
    };
    
    // Helper for styled text cells
    const txt = (str, style = {}) => {
        return { v: str, t: 's', s: style };
    };

    // Styles
    const headerStyle = { 
        font: { bold: true, color: { rgb: "FFFFFF" } }, 
        fill: { fgColor: { rgb: "2563EB" } }, // Blue-600
        alignment: { horizontal: "center", vertical: "center" },
        border: { bottom: { style: "medium", color: { rgb: "000000" } } }
    };
    
    const rowHeaderStyle = {
        font: { bold: true, color: { rgb: "334155" } },
        alignment: { horizontal: "left" }
    };

    const subItemStyle = {
        font: { color: { rgb: "64748B" }, italic: true },
        alignment: { horizontal: "left", indent: 1 } // Indented
    };

    const boldRowStyle = {
        font: { bold: true },
        border: { top: { style: "thin" } }
    };

    const titleStyle = {
        font: { bold: true, sz: 14, color: { rgb: "1E293B" } }
    };

    // --- Sheet 1: Investment Summary ---
    // (Keeping Summary simple but formatted)
    const summaryData = [
      [txt("Investment Summary", titleStyle), null],
      [txt("Generated by Rental Calculator", { font: { italic: true, color: { rgb: "64748B" } } }), null],
      [null, null],
      [txt("Inputs", { font: { bold: true, color: { rgb: "2563EB" } } }), null],
      [txt("Purchase Price", rowHeaderStyle), fmt(purchasePrice)],
      [txt("Purchase LTV", rowHeaderStyle), { v: purchaseLtv/100, t: 'n', s: { numFmt: "0.00%" } }],
      [txt("Interest Rate", rowHeaderStyle), { v: interestRate/100, t: 'n', s: { numFmt: "0.00%" } }],
      [txt("Amortization", rowHeaderStyle), txt(`${amortization} months`)],
      [txt("DSCR Target", rowHeaderStyle), { v: dscr, t: 'n', s: { numFmt: "0.00x" } }],
      [txt("Market Cap Rate", rowHeaderStyle), { v: capRate/100, t: 'n', s: { numFmt: "0.00%" } }],
      [null, null],
      [txt("Financial Analysis", { font: { bold: true, color: { rgb: "2563EB" } } }), null],
      [txt("Loan Amount", rowHeaderStyle), fmt(loanAmount)],
      [txt("Annual Debt Service", rowHeaderStyle), fmt(annualDebtService)],
      [txt("Required NOI", rowHeaderStyle), fmt(requiredNOI)],
      [txt("Required Gross Rent", rowHeaderStyle), fmt(requiredGrossRent)],
      [txt("Projected Market Value", rowHeaderStyle), fmt(marketValue)],
      [txt("Implied LTV", rowHeaderStyle), { v: impliedLtv, t: 'n', s: { numFmt: "0.00%" } }],
      [txt("100% Financing Viable?", rowHeaderStyle), txt(canFinance100 ? "YES" : "NO", { font: { bold: true, color: { rgb: canFinance100 ? "16A34A" : "DC2626" } } })],
      [null, null],
      [txt("Return Analysis", { font: { bold: true, color: { rgb: "2563EB" } } }), null],
      [txt("Holding Period", rowHeaderStyle), txt(`${holdingPeriod} Years`)],
      [txt("Total Cash Flow", rowHeaderStyle), fmt(totalCashFlow)],
      [txt("Potential Profit (Appreciation)", rowHeaderStyle), fmt(potentialProfit)],
      [txt("Total Return", rowHeaderStyle), fmt(totalReturn)],
      [txt("ROI", rowHeaderStyle), { v: roi/100, t: 'n', s: { numFmt: "0.00%" } }],
      [txt("Discounted ROI", rowHeaderStyle), { v: discountedRoi/100, t: 'n', s: { numFmt: "0.00%" } }]
    ];

    // --- Sheet 2: Annual Proforma (Transposed) ---
    // Structure:
    // Metric       | Year 1 | Year 2 | Year 3 ...
    // Gross Rent   | ...
    // - Taxes      | ...
    
    // 1. Prepare Data Arrays
    const years = Array.from({length: holdingPeriod}, (_, i) => i + 1);
    const rowHeaders = ["Year", "Gross Rent", "Real Estate Taxes", "Insurance", "Total Expenses", "Net Operating Income", "Debt Service", "Cash Flow"];
    
    // Initialize rows with headers
    const rows = {
        year: [txt("Period", headerStyle)],
        grossRent: [txt("Gross Scheduled Income", rowHeaderStyle)],
        taxes: [txt("Real Estate Taxes", subItemStyle)],
        insurance: [txt("Insurance", subItemStyle)],
        totalExp: [txt("Total Expenses", { font: { bold: true } })],
        noi: [txt("Net Operating Income (NOI)", { font: { bold: true }, fill: { fgColor: { rgb: "F1F5F9" } } })],
        debt: [txt("Debt Service", { font: { color: { rgb: "DC2626" } } })],
        cashFlow: [txt("Net Cash Flow", { font: { bold: true, color: { rgb: "16A34A" } }, border: { top: { style: "double" } } })]
    };

    // 2. Loop and Calculate
    let currentAnnualGrossRent = (initialRentInput !== '' && !isNaN(initialRentInput)) 
      ? parseFloat(initialRentInput) 
      : requiredGrossRent;
    const safeFrequency = Math.max(1, Math.round(rentIncreaseFrequency || 1));

    for (let year = 1; year <= holdingPeriod; year++) {
      const currentYearTaxes = (parseFloat(taxes) || 0) * Math.pow(1 + (taxInflation / 100), year - 1);
      const currentYearInsurance = (parseFloat(insurance) || 0) * Math.pow(1 + (insuranceInflation / 100), year - 1);
      const currentYearExpenses = currentYearTaxes + currentYearInsurance;
      const currentYearNOI = currentAnnualGrossRent - currentYearExpenses;
      const annualCashFlow = currentYearNOI - annualDebtService;

      // Push styled cells
      rows.year.push(txt(`Year ${year}`, headerStyle));
      rows.grossRent.push(fmt(currentAnnualGrossRent));
      rows.taxes.push(fmt(currentYearTaxes));
      rows.insurance.push(fmt(currentYearInsurance));
      rows.totalExp.push(fmt(currentYearExpenses));
      rows.noi.push({ v: currentYearNOI, t: 'n', s: { numFmt: '"$"#,##0', font: { bold: true }, fill: { fgColor: { rgb: "F1F5F9" } } } });
      rows.debt.push(fmt(annualDebtService));
      rows.cashFlow.push({ v: annualCashFlow, t: 'n', s: { numFmt: '"$"#,##0', font: { bold: true, color: { rgb: "16A34A" } }, border: { top: { style: "double" } } } });

      if (year % safeFrequency === 0) {
        currentAnnualGrossRent = currentAnnualGrossRent * (1 + (annualRentIncrease / 100));
      }
    }

    // 3. Assemble Rows in Order
    const proformaData = [
        rows.year,
        rows.grossRent,
        rows.taxes,
        rows.insurance,
        rows.totalExp,
        rows.noi,
        rows.debt,
        rows.cashFlow
    ];

    // Create Sheets
    const wb = XLSX.utils.book_new();
    
    // Summary Sheet
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    wsSummary['!cols'] = [{ wch: 30 }, { wch: 20 }]; // Column widths
    XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

    // Proforma Sheet
    const wsProforma = XLSX.utils.aoa_to_sheet(proformaData);
    // Auto-width columns based on holding period
    const proformaCols = [{ wch: 30 }]; // First column width
    for(let i=0; i<holdingPeriod; i++) proformaCols.push({ wch: 15 });
    wsProforma['!cols'] = proformaCols;
    
    XLSX.utils.book_append_sheet(wb, wsProforma, "Annual Proforma");

    // Save File
    XLSX.writeFile(wb, "Investment_Proforma_Professional.xlsx");
  };

  // Formatters
  const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
  const formatPercent = (val) => new Intl.NumberFormat('en-US', { style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-800">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <Calculator className="w-8 h-8 text-blue-600" />
              Investment Financing Calculator
            </h1>
            <p className="text-slate-500 mt-2">
              Calculate required rental rates, market valuation, and 100% financing viability.
            </p>
          </div>
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-lg shadow-md transition-colors font-semibold"
          >
            <FileSpreadsheet className="w-5 h-5" />
            Export to Excel
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Input Section */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-5 pb-2 border-b border-slate-100 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Loan & Value Parameters
              </h2>
              
              <InputField 
                label="Purchase Price" 
                value={purchasePrice} 
                onChange={setPurchasePrice} 
                icon={DollarSign} 
                suffix="USD"
              />

              <div className="grid grid-cols-2 gap-4">
                <InputField 
                  label="Purchase LTV" 
                  value={purchaseLtv} 
                  onChange={setPurchaseLtv} 
                  icon={Percent} 
                  suffix="%"
                  tooltip="The % of Purchase Price you wish to borrow (determines Debt Service)."
                />
                <InputField 
                  label="Interest Rate" 
                  value={interestRate} 
                  onChange={setInterestRate} 
                  icon={Percent} 
                  suffix="%"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <InputField 
                  label="Amortization" 
                  value={amortization} 
                  onChange={setAmortization} 
                  icon={Calendar} 
                  suffix="Months"
                />
                <InputField 
                  label="DSCR Target" 
                  value={dscr} 
                  onChange={setDscr} 
                  icon={TrendingUp} 
                  suffix="Ratio"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <InputField 
                  label="Market Cap Rate" 
                  value={capRate} 
                  onChange={setCapRate} 
                  icon={Percent} 
                  suffix="%"
                />
                <InputField 
                  label="Market LTV (Limit)" 
                  value={marketLtv} 
                  onChange={setMarketLtv} 
                  icon={Percent} 
                  suffix="%"
                />
              </div>

              {/* Expenses Section */}
              <div className="mt-8 pt-6 border-t border-slate-200">
                <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-blue-600" />
                  Expenses (Year 1) & Inflation
                </h3>
                
                {/* Taxes Block */}
                <div className="grid grid-cols-2 gap-4 mb-2">
                  <InputField 
                    label="RE Taxes" 
                    value={taxes} 
                    onChange={setTaxes} 
                    icon={DollarSign} 
                    suffix="USD"
                  />
                  <InputField 
                    label="Tax Inflation" 
                    value={taxInflation} 
                    onChange={setTaxInflation} 
                    icon={TrendingUp} 
                    suffix="% / Yr"
                  />
                </div>

                {/* Insurance Block */}
                <div className="grid grid-cols-2 gap-4">
                  <InputField 
                    label="Insurance" 
                    value={insurance} 
                    onChange={setInsurance} 
                    icon={DollarSign} 
                    suffix="USD"
                  />
                  <InputField 
                    label="Ins. Inflation" 
                    value={insuranceInflation} 
                    onChange={setInsuranceInflation} 
                    icon={TrendingUp} 
                    suffix="% / Yr"
                  />
                </div>
              </div>

              {/* Holding Period Section */}
              <div className="mt-8 pt-6 border-t border-slate-200">
                <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  Holding Period Assumptions
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <InputField 
                    label="Holding Period" 
                    value={holdingPeriod} 
                    onChange={setHoldingPeriod} 
                    icon={Calendar} 
                    suffix="Years"
                  />
                   <InputField 
                    label="Discount Rate" 
                    value={discountRate} 
                    onChange={setDiscountRate} 
                    icon={Percent} 
                    suffix="%"
                    tooltip="Rate used to discount future cash flows for ROI calculation."
                  />
                </div>
                
                <InputField 
                  label="Initial Gross Rent" 
                  value={initialRentInput} 
                  onChange={setInitialRentInput} 
                  icon={DollarSign} 
                  suffix="USD"
                  placeholder={formatCurrency(requiredGrossRent)}
                  tooltip="Total Rent Collected (Year 1). Defaults to 'Required Gross Rent' if empty."
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <InputField 
                    label="Rent Increase %" 
                    value={annualRentIncrease} 
                    onChange={setAnnualRentIncrease} 
                    icon={TrendingUp} 
                    suffix="%"
                  />
                  <InputField 
                    label="Increase Freq." 
                    value={rentIncreaseFrequency} 
                    onChange={setRentIncreaseFrequency} 
                    icon={Calendar} 
                    suffix="Years"
                  />
                </div>
              </div>

              <div className="mt-6 bg-blue-50 rounded-lg p-4 border border-blue-100">
                <div className="text-sm text-blue-800 font-medium mb-1">Loan Summary</div>
                <div className="flex justify-between items-center">
                  <span className="text-blue-600 text-sm">Principal Amount</span>
                  <span className="text-blue-900 font-bold">{formatCurrency(loanAmount)}</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Results Section */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Main Results */}
            <Card className="p-6 h-full flex flex-col">
              <h2 className="text-lg font-bold text-slate-800 mb-5 pb-2 border-b border-slate-100 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                Financial Analysis
              </h2>

              <div className="space-y-1 flex-grow">
                <ResultRow 
                  label="Annual Debt Service" 
                  value={formatCurrency(annualDebtService)} 
                  subValue={`${formatCurrency(monthlyPayment)} / month`}
                />
                
                <ResultRow 
                  label="Required Net Operating Income (NOI)" 
                  value={formatCurrency(requiredNOI)}
                  subValue={`Based on ${dscr}x DSCR`}
                  highlight
                />

                <ResultRow 
                  label="Required Gross Rent" 
                  value={formatCurrency(requiredGrossRent)}
                  subValue="Required NOI + Taxes + Insurance"
                />

                <ResultRow 
                  label="Projected Market Value" 
                  value={formatCurrency(marketValue)}
                  subValue={`Based on Required NOI @ ${capRate}% Cap`}
                  positive={marketValue > purchasePrice}
                />

                <ResultRow 
                  label="Implied LTV" 
                  value={formatPercent(impliedLtv)}
                  subValue="Purchase Price / Market Value"
                  positive={impliedLtv < (marketLtv/100)}
                  negative={impliedLtv > (marketLtv/100)}
                />

                <div className="my-6 pt-6 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">100% Financing Viable?</h3>
                      <p className="text-sm text-slate-500 mt-1">
                        Is Implied LTV &lt; Market LTV ({marketLtv}%)?
                      </p>
                    </div>
                    
                    <div className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-lg border ${
                      canFinance100 
                        ? 'bg-emerald-100 text-emerald-700 border-emerald-200' 
                        : 'bg-red-50 text-red-700 border-red-200'
                    }`}>
                      {canFinance100 ? (
                        <>
                          <CheckCircle2 className="w-6 h-6" />
                          YES
                        </>
                      ) : (
                        <>
                          <XCircle className="w-6 h-6" />
                          NO
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* Explanation Logic Display */}
                  <div className="mt-4 p-4 bg-slate-50 rounded-lg text-sm text-slate-600">
                    <div className="flex justify-between mb-1">
                      <span>Lender Max Loan Amount:</span>
                      <span className="font-semibold">{formatCurrency(marketValue * (marketLtv/100))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Purchase Price:</span>
                      <span className="font-semibold">{formatCurrency(purchasePrice)}</span>
                    </div>
                    <div className="mt-2 text-xs text-slate-400 border-t border-slate-200 pt-2">
                      {canFinance100 
                        ? "Since the lender's max loan on the new Market Value exceeds your Purchase Price, you can likely finance the entire purchase."
                        : "The lender's max loan on the Market Value is less than the Purchase Price. Down payment required."}
                    </div>
                  </div>
                </div>

                {/* Return Analysis */}
                <div className="mt-4">
                  <h3 className="text-sm font-semibold text-slate-900 mb-4 uppercase tracking-wider flex items-center justify-between">
                    <span>{holdingPeriod}-Year Investor Return</span>
                    <span className="text-xs text-slate-400 normal-case font-normal">(Assuming sale at Market Value)</span>
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Breakdown Column */}
                    <div className="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">Capital Gains</span>
                        <span className="font-semibold text-slate-700">{formatCurrency(potentialProfit)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">Total Cash Flow</span>
                        <span className="font-semibold text-emerald-600">+{formatCurrency(totalCashFlow)}</span>
                      </div>
                      <div className="pt-2 mt-2 border-t border-slate-200 flex justify-between items-center text-sm font-bold">
                        <span className="text-slate-700">Total Return</span>
                        <span className="text-slate-900">{formatCurrency(totalReturn)}</span>
                      </div>
                      
                      {/* Show Discounted Total Return if discount > 0 */}
                      {discountRate > 0 && (
                        <div className="pt-2 mt-2 border-t border-slate-200 flex justify-between items-center text-sm">
                          <span className="text-slate-500">Discounted Return</span>
                          <span className="font-bold text-slate-700">{formatCurrency(discountedTotalReturn)}</span>
                        </div>
                      )}
                    </div>

                    {/* ROI Column */}
                    <div className="bg-blue-600 p-4 rounded-lg border border-blue-700 text-white flex flex-col justify-center items-center text-center">
                      <div className="text-sm text-blue-100 font-medium mb-1">Total ROI (On Price)</div>
                      <div className="text-3xl font-bold">{Math.round(roi)}%</div>
                      
                      {/* Discounted ROI Display */}
                      {discountRate > 0 ? (
                        <div className="mt-2 pt-2 border-t border-blue-500 w-full">
                           <div className="text-xs text-blue-200 mb-0.5">Discounted ROI (@ {discountRate}%)</div>
                           <div className="text-xl font-bold text-white">{Math.round(discountedRoi)}%</div>
                        </div>
                      ) : (
                        <div className="text-xs text-blue-200 mt-2">
                          {Math.round(roi / holdingPeriod)}% Avg / Year
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;