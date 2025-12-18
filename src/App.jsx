import React, { useState, useEffect, useRef } from 'react';
import { Upload, FileSpreadsheet, Check, Download, RefreshCw, FileText, Bug, Play, RotateCcw, X, Plus, Trash2, StopCircle, BrainCircuit, AlertCircle } from 'lucide-react';

const MAX_FILE_SIZE_MB = 25; 

const getInitialFormData = () => [
  { section: "Header", label: "Construction Details", value: "", type: "header" },
  { section: "Spacer", label: "", value: "", type: "spacer" },
  { section: "Structural", label: "Foundation", value: "", type: "field" },
  { section: "Structural", label: "Basement", value: "", type: "field" },
  { section: "Structural", label: "Structural Frame", value: "", type: "field" },
  { section: "Structural", label: "Corridor", value: "", type: "field" },
  { section: "Structural", label: "Exterior Walls", value: "", type: "field" },
  { section: "Structural", label: "Windows", value: "", type: "field" },
  { section: "Structural", label: "Roof Framing and Finish", value: "", type: "field" },
  { section: "Spacer", label: "", value: "", type: "spacer" },
  { section: "Dimensions", label: "Ceiling Height in Feet", value: "", type: "field" },
  { section: "Dimensions", label: "Clear Height in Feet", value: "", type: "field" },
  { section: "Dimensions", label: "Bay Depth in Feet", value: "", type: "field" },
  { section: "Dimensions", label: "Column Spacing in Feet", value: "", type: "field" },
  { section: "Dimensions", label: "Number of Dock Height Loading Doors", value: "", type: "field" },
  { section: "Dimensions", label: "Number of Drive-In Doors", value: "", type: "field" },
  { section: "Spacer", label: "", value: "", type: "spacer" },
  { section: "Header", label: "Interior Finishes", value: "", type: "header" },
  { section: "Finishes", label: "Interior Floors", value: "", type: "field" },
  { section: "Finishes", label: "Interior Walls", value: "", type: "field" },
  { section: "Finishes", label: "Interior Ceilings", value: "", type: "field" },
  { section: "Finishes", label: "Interior Lighting", value: "", type: "field" },
  { section: "Finishes", label: "Floor Plate", value: "", type: "field" },
  { section: "Spacer", label: "", value: "", type: "spacer" },
  { section: "Systems", label: "HVAC", value: "", type: "field" },
  { section: "Systems", label: "Electrical", value: "", type: "field" },
  { section: "Systems", label: "Plumbing", value: "", type: "field" },
  { section: "Systems", label: "Heating", value: "", type: "field" },
  { section: "Systems", label: "Air Conditioning", value: "", type: "field" },
  { section: "Systems", label: "Hot Water", value: "", type: "field" },
  { section: "Systems", label: "Utility Meters - Tenants", value: "", type: "field" },
  { section: "Systems", label: "Utility Meters - Central", value: "", type: "field" },
  { section: "Systems", label: "Elevators", value: "", type: "field" },
  { section: "Systems", label: "Restrooms", value: "", type: "field" },
  { section: "Systems", label: "Sprinklers", value: "", type: "field" },
  { section: "Systems", label: "Other Fire Safety", value: "", type: "field" },
  { section: "Systems", label: "Security", value: "", type: "field" },
  { section: "Systems", label: "Climate Control", value: "", type: "field" },
  { section: "Systems", label: "Drive Aisles", value: "", type: "field" },
  { section: "Systems", label: "Manager's Residence", value: "", type: "field" },
  { section: "Systems", label: "Office", value: "", type: "field" },
  { section: "Systems", label: "Call Systems", value: "", type: "field" },
  { section: "Systems", label: "Care Stations", value: "", type: "field" },
  { section: "Systems", label: "Memory Care Security", value: "", type: "field" },
  { section: "Header", label: "Unit Description", value: "", type: "header" },
  { section: "Units", label: "Entry Type", value: "", type: "field" },
  { section: "Units", label: "Kitchen Equipment", value: "", type: "field" },
  { section: "Units", label: "Laundry Facilities", value: "", type: "field" },
  { section: "Units", label: "Bathroom Fixtures", value: "", type: "field" },
  { section: "Units", label: "Garages", value: "", type: "field" },
  { section: "Units", label: "Doors", value: "", type: "field" },
  { section: "Units", label: "Partitions", value: "", type: "field" },
  { section: "Header", label: "Site Improvements", value: "", type: "header" },
  { section: "Site", label: "Landscaping", value: "", type: "field" },
  { section: "Site", label: "No. of Customer Parking Spaces", value: "", type: "field" },
  { section: "Site", label: "Gates/Fencing", value: "", type: "field" },
  { section: "Site", label: "Paving", value: "", type: "field" },
];

const App = () => {
  const [activeTab, setActiveTab] = useState('upload');
  const [uploadedFiles, setUploadedFiles] = useState([]); 
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [progress, setProgress] = useState(0); 
  const [rawResponse, setRawResponse] = useState('');
  const [showDebug, setShowDebug] = useState(false);
  const [formData, setFormData] = useState(getInitialFormData());
  const abortAnalysis = useRef(false);

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    const newFiles = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      type: file.type,
      rawFile: file, 
      previewUrl: URL.createObjectURL(file) 
    }));
    setUploadedFiles(prev => [...prev, ...newFiles]);
    setActiveTab('analyze');
  };

  const callGeminiWithRetry = async (payload, retries = 5) => {
    const apiKey = ""; // Runtime provides this
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
    
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        if (response.ok) return await response.json();
        
        // Exponential backoff: 1s, 2s, 4s, 8s, 16s
        const delay = Math.pow(2, i) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      } catch (err) {
        if (i === retries - 1) throw err;
        const delay = Math.pow(2, i) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    throw new Error("Maximum retries reached");
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setAnalysisComplete(false);
    setErrorMsg('');
    setProgress(0);
    setStatusMsg('Preparing documents...');
    abortAnalysis.current = false;
    
    let updatedFormData = [...formData];

    for (let i = 0; i < uploadedFiles.length; i++) {
      if (abortAnalysis.current) break;
      const file = uploadedFiles[i];
      setStatusMsg(`Analyzing ${file.name}...`);
      
      try {
        const base64Data = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result.split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(file.rawFile);
        });

        const fieldLabels = updatedFormData.filter(f => f.type === 'field').map(f => f.label).join(', ');
        
        const payload = {
          contents: [{
            parts: [
              { text: `You are a professional construction estimator. Extract data for these fields: ${fieldLabels}. 
              Return ONLY valid JSON. Use field labels as keys. If a value is missing or "N/A", use "Not specified". 
              Do not include conversational text or markdown blocks, just the JSON object.` },
              { inlineData: { mimeType: file.type, data: base64Data } }
            ]
          }]
        };

        const result = await callGeminiWithRetry(payload);
        const textResponse = result.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (textResponse) {
          setRawResponse(prev => prev + `\n--- [FILE: ${file.name}] ---\n` + textResponse);
          try {
            // Clean markdown artifacts if present
            const cleanJson = textResponse.replace(/```json|```/g, '').trim();
            const parsed = JSON.parse(cleanJson);
            
            updatedFormData = updatedFormData.map(item => {
              if (item.type === 'field' && parsed[item.label] && parsed[item.label] !== "Not specified") {
                // Only overwrite if we found something new and valid
                return { ...item, value: parsed[item.label] };
              }
              return item;
            });
            setFormData(updatedFormData);
          } catch (e) {
            console.error("JSON Parse Error on file:", file.name, e);
          }
        }
        setProgress(((i + 1) / uploadedFiles.length) * 100);
      } catch (e) {
        console.error("Analysis Error:", e);
        setErrorMsg(`Failed to analyze ${file.name}. Continuing with next...`);
      }
    }
    
    setIsAnalyzing(false);
    setAnalysisComplete(true);
    setStatusMsg(errorMsg ? 'Analysis finished with some errors.' : 'Analysis Complete.');
  };

  const exportExcel = () => {
    const XLSX = window.XLSX;
    if (!XLSX) {
      setErrorMsg("Excel library failed to load. Please check your connection.");
      return;
    }
    const data = formData.map(f => [f.label, f.value]);
    const ws = XLSX.utils.aoa_to_sheet([["Construction Field", "Extracted Value"], ...data]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Construction Details");
    XLSX.writeFile(wb, "Construction_Extraction_Report.xlsx");
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <header className="flex justify-between items-center mb-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 p-3 rounded-xl text-white shadow-lg shadow-blue-200">
              <BrainCircuit size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">PlanToExcel</h1>
              <p className="text-slate-500 text-xs font-medium uppercase tracking-widest">Construction Detail Automator</p>
            </div>
          </div>
          {activeTab === 'analyze' && (
            <button 
              onClick={() => { setUploadedFiles([]); setFormData(getInitialFormData()); setActiveTab('upload'); setRawResponse(''); setErrorMsg(''); }}
              className="flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-red-500 transition-colors"
            >
              <RotateCcw size={16} /> Reset All
            </button>
          )}
        </header>

        {activeTab === 'upload' ? (
          <div className="bg-white border-4 border-dashed border-slate-200 rounded-3xl p-16 text-center hover:border-blue-400 transition-all cursor-pointer group shadow-sm">
            <input type="file" multiple className="hidden" id="file-upload" onChange={handleFileUpload} accept="image/*,application/pdf" />
            <label htmlFor="file-upload" className="cursor-pointer block">
              <div className="bg-slate-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-105 transition-transform">
                <Upload className="text-slate-300 group-hover:text-blue-500 transition-colors" size={40} />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Upload Project Documents</h2>
              <p className="text-slate-400 mb-8 max-w-xs mx-auto text-sm">Select architectural plans, engineering drawings, or site photos for analysis.</p>
              <span className="bg-blue-600 text-white px-10 py-4 rounded-xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 hover:-translate-y-0.5 transition-all inline-block">
                Choose Files
              </span>
            </label>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                  {isAnalyzing ? <RefreshCw className="animate-spin text-blue-500" size={18} /> : <Check className="text-green-500" size={18} />}
                  <span className="font-bold text-slate-700">{statusMsg}</span>
                </div>
                <span className="text-sm font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full">{Math.round(progress)}%</span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 transition-all duration-500 ease-out" style={{ width: `${progress}%` }}></div>
              </div>
              
              {errorMsg && (
                <div className="mt-4 flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-xl text-sm font-medium border border-red-100">
                  <AlertCircle size={16} />
                  {errorMsg}
                </div>
              )}

              <div className="flex gap-4 mt-8">
                {!isAnalyzing && !analysisComplete && (
                  <button onClick={handleAnalyze} className="flex-1 bg-blue-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all">
                    <Play size={20} /> Start AI Extraction
                  </button>
                )}
                {analysisComplete && (
                  <button onClick={exportExcel} className="flex-1 bg-emerald-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all">
                    <Download size={20} /> Export to Excel (.xlsx)
                  </button>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <h3 className="font-bold text-slate-700 flex items-center gap-2">
                  <FileText size={18} className="text-slate-400" />
                  Extraction Results
                </h3>
                <button onClick={() => setShowDebug(!showDebug)} className="text-slate-400 hover:text-slate-600 p-1">
                  <Bug size={16} />
                </button>
              </div>
              
              <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
                <div className="divide-y divide-slate-100">
                  {formData.map((item, idx) => (
                    <div key={idx} className={`px-6 py-4 flex flex-col md:flex-row md:items-center gap-3 transition-colors hover:bg-slate-50/50 ${item.type === 'header' ? 'bg-slate-50/80 sticky top-0 z-10' : ''}`}>
                      <label className={`md:w-1/3 text-sm ${item.type === 'header' ? 'font-black uppercase tracking-widest text-slate-500 text-xs' : 'font-semibold text-slate-600'}`}>
                        {item.label}
                      </label>
                      
                      {item.type === 'field' && (
                        <div className="flex-1 relative group">
                          <input 
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                            value={item.value} 
                            placeholder="Waiting for analysis..."
                            onChange={(e) => {
                              const next = [...formData];
                              next[idx].value = e.target.value;
                              setFormData(next);
                            }}
                          />
                          {analysisComplete && item.value && item.value !== "" && item.value !== "Not specified" && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              <Check size={14} className="text-blue-500" />
                            </div>
                          )}
                        </div>
                      )}
                      
                      {item.type === 'spacer' && <div className="h-4 w-full"></div>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {showDebug && (
              <div className="animate-in fade-in slide-in-from-top-4">
                <div className="bg-slate-900 rounded-2xl p-6 shadow-xl border border-slate-800">
                  <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-4">
                    <h4 className="text-white font-bold text-sm uppercase tracking-widest">AI Raw Response Logs</h4>
                    <button onClick={() => setRawResponse('')} className="text-slate-500 hover:text-white transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <pre className="text-emerald-400 font-mono text-[11px] leading-relaxed overflow-x-auto max-h-64 custom-scrollbar whitespace-pre-wrap">
                    {rawResponse || "No logs available. Start analysis to see raw data."}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
      `}</style>
    </div>
  );
};

export default App;