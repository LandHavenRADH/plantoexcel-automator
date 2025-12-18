import React, { useState, useEffect, useRef } from 'react';
import { Upload, FileSpreadsheet, Check, Download, RefreshCw, FileText, Bug, Play, RotateCcw, X, Plus, Trash2, StopCircle, BrainCircuit, AlertCircle } from 'lucide-react';

// Mandatory Model for this environment
const GEMINI_MODEL = "gemini-2.5-flash-preview-09-2025";

const getInitialFormData = () => [
  { section: "Header", label: "Construction Details", value: "", type: "header" },
  { section: "Structural", label: "Foundation", value: "", type: "field" },
  { section: "Structural", label: "Basement", value: "", type: "field" },
  { section: "Structural", label: "Structural Frame", value: "", type: "field" },
  { section: "Structural", label: "Exterior Walls", value: "", type: "field" },
  { section: "Structural", label: "Windows", value: "", type: "field" },
  { section: "Structural", label: "Roof Framing and Finish", value: "", type: "field" },
  { section: "Dimensions", label: "Ceiling Height in Feet", value: "", type: "field" },
  { section: "Dimensions", label: "Clear Height in Feet", value: "", type: "field" },
  { section: "Dimensions", label: "Bay Depth in Feet", value: "", type: "field" },
  { section: "Dimensions", label: "Column Spacing in Feet", value: "", type: "field" },
  { section: "Dimensions", label: "Number of Dock Height Loading Doors", value: "", type: "field" },
  { section: "Dimensions", label: "Number of Drive-In Doors", value: "", type: "field" },
  { section: "Systems", label: "HVAC", value: "", type: "field" },
  { section: "Systems", label: "Electrical", value: "", type: "field" },
  { section: "Systems", label: "Plumbing", value: "", type: "field" },
  { section: "Systems", label: "Sprinklers", value: "", type: "field" },
  { section: "Systems", label: "Security", value: "", type: "field" },
  { section: "Site", label: "Landscaping", value: "", type: "field" },
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
  const [formData, setFormData] = useState(getInitialFormData());

  const callGemini = async (payload) => {
    // Empty string is REQUIRED. The environment injects the key automatically.
    const apiKey = ""; 
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
    
    // Exponential backoff retry logic
    for (let i = 0; i < 5; i++) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        if (response.ok) return await response.json();
        
        const delay = Math.pow(2, i) * 1000;
        await new Promise(r => setTimeout(r, delay));
      } catch (err) {
        if (i === 4) throw err;
        await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000));
      }
    }
    throw new Error("API Connection Failed");
  };

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    const newFiles = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      type: file.type,
      rawFile: file
    }));
    setUploadedFiles(prev => [...prev, ...newFiles]);
    setActiveTab('analyze');
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setAnalysisComplete(false);
    setErrorMsg('');
    setProgress(0);
    setStatusMsg('Initializing AI...');
    
    let currentData = [...formData];

    for (let i = 0; i < uploadedFiles.length; i++) {
      const file = uploadedFiles[i];
      setStatusMsg(`Analyzing ${file.name}...`);
      
      try {
        const base64Data = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result.split(',')[1]);
          reader.readAsDataURL(file.rawFile);
        });

        const fieldList = currentData.filter(f => f.type !== 'header').map(f => f.label).join(', ');
        
        const payload = {
          contents: [{
            parts: [
              { text: `Analyze this construction document. Extract data for these fields: ${fieldList}. Return ONLY a JSON object. If a field is not found, use "Not specified".` },
              { inlineData: { mimeType: file.type, data: base64Data } }
            ]
          }]
        };

        const result = await callGemini(payload);
        const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (text) {
          try {
            const cleanJson = text.replace(/```json|```/g, '').trim();
            const parsed = JSON.parse(cleanJson);
            
            currentData = currentData.map(item => {
              if (parsed[item.label] && parsed[item.label] !== "Not specified") {
                return { ...item, value: parsed[item.label] };
              }
              return item;
            });
            setFormData(currentData);
          } catch (e) { console.error("JSON Parse Error", e); }
        }
        setProgress(((i + 1) / uploadedFiles.length) * 100);
      } catch (e) {
        console.error("Analysis Error", e);
        setErrorMsg(`Error processing ${file.name}`);
      }
    }
    
    setIsAnalyzing(false);
    setAnalysisComplete(true);
    setStatusMsg(errorMsg ? 'Finished with errors' : 'Analysis Complete');
  };

  const exportExcel = () => {
    if (!window.XLSX) return;
    const data = [["Field", "Value"], ...formData.map(f => [f.label, f.value])];
    const ws = window.XLSX.utils.aoa_to_sheet(data);
    const wb = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(wb, ws, "Construction Details");
    window.XLSX.writeFile(wb, "Project_Specs.xlsx");
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-8 bg-white p-6 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3">
            <BrainCircuit className="text-blue-600" size={32} />
            <h1 className="text-xl font-bold text-slate-800">PlanToExcel Automator</h1>
          </div>
          {activeTab === 'analyze' && (
            <button onClick={() => window.location.reload()} className="text-sm text-slate-400 hover:text-red-500">Reset</button>
          )}
        </header>

        {activeTab === 'upload' ? (
          <div className="bg-white border-4 border-dashed border-slate-200 rounded-3xl p-20 text-center hover:border-blue-400 transition-all cursor-pointer">
            <input type="file" multiple className="hidden" id="file-up" onChange={handleFileUpload} accept="image/*,application/pdf" />
            <label htmlFor="file-up" className="cursor-pointer">
              <Upload className="mx-auto text-slate-300 mb-4" size={48} />
              <h2 className="text-xl font-bold mb-2">Upload Documents</h2>
              <p className="text-slate-400 mb-6">Upload plans or photos to extract data</p>
              <span className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold">Choose Files</span>
            </label>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border">
              <div className="flex justify-between mb-2 text-sm font-bold">
                <span>{statusMsg}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 transition-all" style={{ width: `${progress}%` }}></div>
              </div>
              <div className="mt-6 flex gap-3">
                {!isAnalyzing && !analysisComplete && (
                  <button onClick={handleAnalyze} className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold">Start AI Analysis</button>
                )}
                {analysisComplete && (
                  <button onClick={exportExcel} className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-bold">Download Excel</button>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
              <div className="divide-y divide-slate-100">
                {formData.map((item, idx) => (
                  <div key={idx} className={`px-6 py-3 flex flex-col md:flex-row md:items-center gap-2 ${item.type === 'header' ? 'bg-slate-50 font-bold text-xs uppercase text-slate-500' : ''}`}>
                    <div className="md:w-1/3 text-sm text-slate-600">{item.label}</div>
                    {item.type === 'field' && (
                      <input 
                        className="flex-1 border rounded-lg px-3 py-1.5 text-sm" 
                        value={item.value} 
                        onChange={(e) => {
                          const n = [...formData];
                          n[idx].value = e.target.value;
                          setFormData(n);
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
    </div>
  );
};

export default App;