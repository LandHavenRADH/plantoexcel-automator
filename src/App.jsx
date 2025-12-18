import React, { useState, useEffect, useRef } from 'react';
import { Upload, FileSpreadsheet, Check, Download, RefreshCw, FileText, Bug, Play, RotateCcw, X, Plus, Trash2, StopCircle } from 'lucide-react';

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

const isValidValue = (val) => {
  if (!val) return false;
  const lower = val.toString().toLowerCase().trim();
  const forbidden = ["not specified", "not visible", "n/a", "unknown", "see plan", "refer to structural", "cannot be determined", "none found", "not applicable", "undetermined"];
  return !forbidden.some(f => lower.includes(f));
};

const App = () => {
  const [activeTab, setActiveTab] = useState('upload');
  const [uploadedFiles, setUploadedFiles] = useState([]); 
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [statusMsg, setStatusMsg] = useState('');
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
    const apiKey = ""; // Environment provides this automatically
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
    
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        if (response.ok) return await response.json();
        
        // Exponential backoff
        const delay = Math.pow(2, i) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      } catch (err) {
        if (i === retries - 1) throw err;
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
      }
    }
    throw new Error("Maximum retries reached");
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setAnalysisComplete(false);
    setProgress(0);
    setErrorMsg(null);
    setStatusMsg('Starting analysis...');
    
    let currentFormData = [...formData];

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

        const fieldLabels = currentFormData.filter(f => f.type === 'field').map(f => f.label).join(', ');

        const payload = {
          contents: [{
            parts: [
              { text: `You are a senior construction estimator. Analyze this document and extract data for these fields: ${fieldLabels}. 
              Return ONLY a valid JSON object where keys match the field names exactly. 
              If a value is not found or is "N/A", use "Not specified".` },
              { inlineData: { mimeType: file.type, data: base64Data } }
            ]
          }]
        };

        const result = await callGeminiWithRetry(payload);
        const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (text) {
          setRawResponse(prev => prev + `\n--- ${file.name} ---\n` + text);
          try {
            const cleanJson = text.replace(/```json|```/g, '').trim();
            const parsed = JSON.parse(cleanJson);
            
            setFormData(prev => prev.map(item => {
              if (parsed[item.label] && isValidValue(parsed[item.label])) {
                // Keep existing value if it's already set and new value is not specified
                return { ...item, value: parsed[item.label] };
              }
              return item;
            }));
          } catch (e) {
            console.error("JSON parse error", e);
          }
        }
        setProgress(((i + 1) / uploadedFiles.length) * 100);
      } catch (e) {
        console.error(e);
        setErrorMsg(`Failed to analyze ${file.name}.`);
      }
    }
    setIsAnalyzing(false);
    setAnalysisComplete(true);
    setStatusMsg(errorMsg ? 'Analysis completed with some errors.' : 'Analysis Complete.');
  };

  const exportExcel = () => {
    const XLSX = window.XLSX;
    if (!XLSX) return;
    const data = formData.map(f => [f.label, f.value]);
    const ws = XLSX.utils.aoa_to_sheet([["Construction Field", "Extracted Value"], ...data]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Details");
    XLSX.writeFile(wb, "Construction_Details_Extraction.xlsx");
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 min-h-screen bg-slate-50">
      <header className="flex justify-between items-center mb-8 bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 p-2.5 rounded-xl text-white">
            <FileSpreadsheet size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 leading-tight">PlanToExcel Automator</h1>
            <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest">Construction AI</p>
          </div>
        </div>
        {activeTab === 'analyze' && (
          <button 
            onClick={() => { setUploadedFiles([]); setActiveTab('upload'); setFormData(getInitialFormData()); setRawResponse(''); setErrorMsg(null); }} 
            className="text-sm font-semibold text-slate-400 flex items-center gap-2 hover:text-red-500 transition-colors"
          >
            <RotateCcw size={16}/> Start Over
          </button>
        )}
      </header>

      {activeTab === 'upload' ? (
        <div className="border-4 border-dashed border-slate-200 rounded-3xl p-16 md:p-24 text-center bg-white hover:border-blue-400 transition-all cursor-pointer group shadow-sm">
          <input type="file" multiple className="hidden" id="file-upload" onChange={handleFileUpload} accept="image/*,application/pdf" />
          <label htmlFor="file-upload" className="cursor-pointer block">
            <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
              <Upload className="text-slate-300 group-hover:text-blue-500 transition-colors" size={32} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Upload Project Files</h2>
            <p className="text-slate-400 mb-8 max-w-xs mx-auto text-sm">Upload blueprints, photos, or spec sheets to extract details.</p>
            <span className="bg-blue-600 text-white px-10 py-4 rounded-xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 hover:-translate-y-1 transition-all inline-block">
              Select Documents
            </span>
          </label>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                {isAnalyzing ? <RefreshCw className="animate-spin text-blue-500" size={20} /> : <Check className="text-green-500" size={20} />}
                <span className="font-bold text-slate-700">{statusMsg}</span>
              </div>
              <span className="text-sm font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full">{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden mb-6">
              <div className="bg-blue-600 h-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }}></div>
            </div>
            
            {errorMsg && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl flex items-center gap-2 text-sm font-medium">
                <Trash2 size={16}/> {errorMsg}
              </div>
            )}

            <div className="flex gap-4">
              {!isAnalyzing && !analysisComplete && (
                <button onClick={handleAnalyze} className="flex-1 bg-blue-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-50">
                  <Play size={18}/> Run AI Extraction
                </button>
              )}
              {analysisComplete && (
                <button onClick={exportExcel} className="flex-1 bg-emerald-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-50">
                  <Download size={18}/> Export to Excel
                </button>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-700 flex items-center gap-2">
                <FileText size={18} className="text-slate-400" />
                Review Specifications
              </h3>
              <button onClick={() => setShowDebug(!showDebug)} className="text-slate-300 hover:text-slate-500 transition-colors">
                <Bug size={16} />
              </button>
            </div>
            
            <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto custom-scrollbar">
              {formData.map((item, idx) => (
                <div key={idx} className={`px-6 py-4 flex flex-col md:flex-row md:items-center gap-4 transition-colors hover:bg-slate-50/50 ${item.type === 'header' ? 'bg-slate-50/80 sticky top-0 z-10' : ''}`}>
                  <div className={`md:w-1/3 text-sm ${item.type === 'header' ? 'font-black uppercase tracking-widest text-slate-500 text-[10px]' : 'font-semibold text-slate-600'}`}>
                    {item.label}
                  </div>
                  
                  {item.type === 'field' && (
                    <div className="flex-1">
                      <input 
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium text-slate-800 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                        value={item.value} 
                        placeholder="Awaiting extraction..."
                        onChange={(e) => {
                          const next = [...formData];
                          next[idx].value = e.target.value;
                          setFormData(next);
                        }}
                      />
                    </div>
                  )}
                  
                  {item.type === 'spacer' && <div className="h-2 w-full"></div>}
                </div>
              ))}
            </div>
          </div>
          
          {showDebug && rawResponse && (
            <div className="bg-slate-900 rounded-2xl p-6 text-emerald-400 font-mono text-xs overflow-x-auto max-h-60 border border-slate-800">
              <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-2">
                <span className="text-slate-500 uppercase font-bold tracking-tighter">Raw AI Output</span>
                <button onClick={() => setRawResponse('')} className="text-slate-600 hover:text-red-400"><X size={14}/></button>
              </div>
              <pre className="whitespace-pre-wrap">{rawResponse}</pre>
            </div>
          )}
        </div>
      )}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default App;