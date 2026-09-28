import React, { useState } from 'react';
import { 
  Wrench, 
  Code, 
  Hash, 
  ArrowRight, 
  Copy, 
  Check, 
  Trash2,
  Cpu,
  Layers
} from 'lucide-react';

export const CyberChefSuite: React.FC = () => {
  const [inputData, setInputData] = useState('d2dldCBodHRwOi8vMTg1LjIyMC4xMDEuNS9taXJhaS54ODYgJiYgY2htb2QgK3ggbWlyYWkueDg2ICYmIC4vbWlyYWkueDg2');
  const [outputData, setOutputData] = useState('');
  const [selectedOp, setSelectedOp] = useState<string>('fromBase64');
  const [copied, setCopied] = useState(false);

  const processOperation = (op: string, text: string) => {
    setSelectedOp(op);
    try {
      if (!text) {
        setOutputData('');
        return;
      }

      if (op === 'fromBase64') {
        setOutputData(atob(text));
      } else if (op === 'toBase64') {
        setOutputData(btoa(text));
      } else if (op === 'urlDecode') {
        setOutputData(decodeURIComponent(text));
      } else if (op === 'urlEncode') {
        setOutputData(encodeURIComponent(text));
      } else if (op === 'toHex') {
        let hex = '';
        for (let i = 0; i < text.length; i++) {
          hex += text.charCodeAt(i).toString(16).padStart(2, '0') + ' ';
        }
        setOutputData(hex.trim());
      } else if (op === 'extractIPs') {
        const ipRegex = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g;
        const matches = text.match(ipRegex);
        setOutputData(matches ? matches.join('\n') : 'No IP addresses detected.');
      } else if (op === 'reverse') {
        setOutputData(text.split('').reverse().join(''));
      } else {
        setOutputData(text);
      }
    } catch (e) {
      setOutputData(`[Error executing operation ${op}]: ${(e as Error).message}`);
    }
  };

  // Run initial conversion
  React.useEffect(() => {
    processOperation(selectedOp, inputData);
  }, [inputData, selectedOp]);

  const handleCopy = () => {
    navigator.clipboard.writeText(outputData);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      
      {/* CyberChef Banner */}
      <div className="bg-gray-900/90 p-4 rounded-xl border border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-[#e20074]/20 text-[#e20074]">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <div className="font-russo text-xl text-white flex items-center gap-2">
              CYBERCHEF <span className="text-[#e20074]">CYBER WORKSTATION</span>
            </div>
            <div className="text-xs text-gray-400 font-mono">
              The Cyber Swiss Army Knife for data decoding, hex dump, and payload deobfuscation
            </div>
          </div>
        </div>
      </div>

      {/* Operation Recipe Selector */}
      <div className="cyber-box p-4 flex flex-wrap items-center gap-2">
        <span className="text-xs font-mono text-gray-400 uppercase mr-2 flex items-center gap-1">
          <Layers className="w-3.5 h-3.5 text-[#e20074]" /> SELECT RECIPE:
        </span>

        {[
          { id: 'fromBase64', label: 'From Base64' },
          { id: 'toBase64', label: 'To Base64' },
          { id: 'urlDecode', label: 'URL Decode' },
          { id: 'urlEncode', label: 'URL Encode' },
          { id: 'toHex', label: 'To Hex' },
          { id: 'extractIPs', label: 'Extract IPv4' },
          { id: 'reverse', label: 'Reverse String' }
        ].map((op) => (
          <button
            key={op.id}
            onClick={() => processOperation(op.id, inputData)}
            className={`px-3 py-1.5 rounded-lg font-mono text-xs transition-all ${
              selectedOp === op.id
                ? 'bg-[#e20074] text-white shadow-md shadow-[#e20074]/30 font-bold'
                : 'bg-gray-900 border border-gray-800 text-gray-300 hover:text-white hover:bg-gray-800'
            }`}
          >
            {op.label}
          </button>
        ))}
      </div>

      {/* Input / Output Workspace Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Input Panel */}
        <div className="cyber-box p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-gray-800 pb-2">
            <h3 className="font-russo text-sm text-white flex items-center gap-2">
              <Code className="w-4 h-4 text-pink-400" /> INPUT PAYLOAD
            </h3>
            <button
              onClick={() => setInputData('')}
              className="text-xs font-mono text-gray-500 hover:text-red-400 flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear
            </button>
          </div>
          <textarea
            rows={10}
            value={inputData}
            onChange={(e) => setInputData(e.target.value)}
            placeholder="Paste obfuscated malicious string, base64 blob, or URL encoded payload..."
            className="w-full p-4 bg-black rounded-xl border border-gray-800 font-mono text-xs text-white focus:outline-none focus:border-[#e20074] transition-colors resize-none"
          />
        </div>

        {/* Output Panel */}
        <div className="cyber-box p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-gray-800 pb-2">
            <h3 className="font-russo text-sm text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-400" /> DECODED OUTPUT
            </h3>
            <button
              onClick={handleCopy}
              className="text-xs font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Result'}</span>
            </button>
          </div>
          <textarea
            readOnly
            rows={10}
            value={outputData}
            placeholder="Resulting recipe output will appear here..."
            className="w-full p-4 bg-black rounded-xl border border-gray-800 font-mono text-xs text-emerald-400 focus:outline-none resize-none"
          />
        </div>

      </div>

    </div>
  );
};
