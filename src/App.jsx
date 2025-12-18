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

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setAnalysisComplete(false);
    setProgress(0);
    setStatusMsg('Starting sequential analysis...');
    
    let currentFormData = [...formData];
    const apiKey = ""; // Environment provides this automatically

    for (let i = 0; i < uploadedFiles.length; i++) {
      if (abortAnalysis.current) break;
      const file = uploadedFiles[i];
      setStatusMsg(`Analyzing ${file.name}...`);
      
      try {
        const reader = new FileReader();
        const base64Promise = new Promise(resolve => {
          reader.onload = () => resolve(reader.result.split(',')[1]);
          reader.readAsDataURL(file.rawFile);
        });
        const base64Data = await base64Promise;

        const payload = {
          contents: [{
            parts: [
              { text: `Extract construction details for: ${currentFormData.filter(f => f.type === 'field').map(f => f.label).join(', ')}. Return JSON only.` },
              { inlineData: { mimeType: file.type, data: base64Data } }
            ]
          }]
        };

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
          method: 'POST',
          body: JSON.stringify(payload)
        });

        const result = await response.json();
        const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          setRawResponse(prev => prev + text);
          // Simple JSON extractor logic would go here to update currentFormData
        }
        setProgress(((i + 1) / uploadedFiles.length) * 100);
      } catch (e) {
        console.error(e);
      }
    }
    setIsAnalyzing(false);
    setAnalysisComplete(true);
    setStatusMsg('Analysis Complete.');
  };

  const exportExcel = () => {
    const XLSX = window.XLSX;
    const data = formData.map(f => [f.label, f.value]);
    const ws = XLSX.utils.aoa_to_sheet([["Field", "Value"], ...data]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Details");
    XLSX.writeFile(wb, "Construction_Details.xlsx");
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <header className="flex justify-between items-center mb-8 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3">
          <FileSpreadsheet className="text-blue-600 w-8 h-8" />
          <h1 className="text-xl font-bold">PlanToExcel Automator</h1>
        </div>
        {activeTab === 'analyze' && (
          <button onClick={() => { setUploadedFiles([]); setActiveTab('upload'); setFormData(getInitialFormData()); }} className="text-sm text-slate-500 flex items-center gap-1 hover:text-red-500">
            <RotateCcw size={14}/> Reset
          </button>
        )}
      </header>

      {activeTab === 'upload' ? (
        <div className="border-4 border-dashed border-slate-200 rounded-3xl p-20 text-center bg-white hover:border-blue-400 transition-colors">
          <Upload className="mx-auto w-16 h-16 text-slate-300 mb-4" />
          <h2 className="text-2xl font-semibold mb-4">Upload Construction Documents</h2>
          <label className="bg-blue-600 text-white px-8 py-3 rounded-lg cursor-pointer hover:bg-blue-700 transition-colors inline-block font-medium">
            Select Plans/Photos
            <input type="file" multiple className="hidden" onChange={handleFileUpload} />
          </label>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
            <div className="flex-1 mr-4">
              <div className="flex justify-between text-sm mb-1 font-medium">
                <span>{statusMsg}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-blue-600 h-full transition-all" style={{ width: `${progress}%` }}></div>
              </div>
            </div>
            <div className="flex gap-2">
              {!isAnalyzing && !analysisComplete && <button onClick={handleAnalyze} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"><Play size={16}/> Analyze</button>}
              {analysisComplete && <button onClick={exportExcel} className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"><Download size={16}/> Export</button>}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-slate-700">Extraction Results</div>
            <div className="divide-y divide-slate-100 max-h-[60vh] overflow-y-auto">
              {formData.map((item, idx) => (
                <div key={idx} className={`p-3 flex items-center gap-4 ${item.type === 'header' ? 'bg-slate-50 font-bold text-xs uppercase tracking-wider text-slate-500' : ''}`}>
                  <div className="w-1/3 text-sm">{item.label}</div>
                  {item.type === 'field' && (
                    <input 
                      className="flex-1 bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                      value={item.value} 
                      onChange={(e) => {
                        const next = [...formData];
                        next[idx].value = e.target.value;
                        setFormData(next);
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;