import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Server, 
  HardDrive, 
  Layers, 
  Search, 
  CheckCircle2, 
  FileCode,
  Zap,
  Activity
} from 'lucide-react';
import { ElasticIndex } from '../types';

export const ElasticvueExplorer: React.FC = () => {
  const [indices, setIndices] = useState<ElasticIndex[]>([]);
  const [clusterData, setClusterData] = useState<{
    clusterHealth: string;
    nodeCount: number;
    totalDocs: number;
    totalStorage: string;
  } | null>(null);
  const [selectedIdx, setSelectedIdx] = useState<ElasticIndex | null>(null);

  useEffect(() => {
    fetch('/api/indices')
      .then((res) => res.json())
      .then((data) => {
        setIndices(data.indices || []);
        setClusterData(data);
        if (data.indices && data.indices.length > 0) {
          setSelectedIdx(data.indices[0]);
        }
      })
      .catch((err) => console.error('Error fetching Elasticvue data:', err));
  }, []);

  return (
    <div className="space-y-6">
      
      {/* Elasticvue Header Banner */}
      <div className="bg-gray-900/90 p-4 rounded-xl border border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-cyan-500/20 text-cyan-400">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <div className="font-russo text-xl text-white flex items-center gap-2">
              ELASTICVUE <span className="text-cyan-400">CLUSTER MANAGER</span>
            </div>
            <div className="text-xs text-gray-400 font-mono">
              Connected to <span className="text-emerald-400 font-bold">http://127.0.0.1:9200</span>
            </div>
          </div>
        </div>

        {/* Cluster Health Indicators */}
        <div className="flex items-center gap-4 font-mono text-xs">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-400">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>HEALTH: {clusterData?.clusterHealth?.toUpperCase() || 'GREEN'}</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-800 text-gray-300">
            <Server className="w-4 h-4 text-cyan-400" />
            <span>NODES: {clusterData?.nodeCount || 1}</span>
          </div>
        </div>
      </div>

      {/* Cluster Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="cyber-box p-5 border-l-4 border-l-cyan-500">
          <div className="flex items-center justify-between text-gray-400 text-xs font-mono mb-2">
            <span>TOTAL INDEXED DOCUMENTS</span>
            <Layers className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="font-russo text-2xl text-white">
            {clusterData?.totalDocs ? clusterData.totalDocs.toLocaleString() : '2,880,900'}
          </div>
        </div>

        <div className="cyber-box p-5 border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between text-gray-400 text-xs font-mono mb-2">
            <span>CLUSTER STORAGE USAGE</span>
            <HardDrive className="w-4 h-4 text-purple-400" />
          </div>
          <div className="font-russo text-2xl text-white">
            {clusterData?.totalStorage || '1.75 GB'}
          </div>
        </div>

        <div className="cyber-box p-5 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between text-gray-400 text-xs font-mono mb-2">
            <span>ACTIVE INDICES</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="font-russo text-2xl text-white">
            {indices.length} indices
          </div>
        </div>
      </div>

      {/* Indices Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Index List Panel */}
        <div className="lg:col-span-2 cyber-box p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-russo text-lg text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-cyan-400" />
              ELASTICSEARCH INDICES ({indices.length})
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-gray-800 text-gray-500 uppercase">
                  <th className="py-2.5 px-3">HEALTH</th>
                  <th className="py-2.5 px-3">INDEX NAME</th>
                  <th className="py-2.5 px-3">DOC COUNT</th>
                  <th className="py-2.5 px-3">SIZE</th>
                  <th className="py-2.5 px-3">SHARDS</th>
                  <th className="py-2.5 px-3">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {indices.map((idx) => (
                  <tr
                    key={idx.name}
                    className={`hover:bg-gray-800/40 transition-colors cursor-pointer ${
                      selectedIdx?.name === idx.name ? 'bg-cyan-950/40 border-l-2 border-l-cyan-400' : ''
                    }`}
                    onClick={() => setSelectedIdx(idx)}
                  >
                    <td className="py-2.5 px-3">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                    </td>
                    <td className="py-2.5 px-3 text-cyan-300 font-bold">{idx.name}</td>
                    <td className="py-2.5 px-3 text-white">{idx.docsCount.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-gray-400">{idx.size}</td>
                    <td className="py-2.5 px-3 text-gray-400">{idx.primaryShards}P / {idx.replicaShards}R</td>
                    <td className="py-2.5 px-3">
                      <button className="px-2 py-0.5 rounded bg-cyan-900/50 text-cyan-300 hover:bg-cyan-800 transition-colors">
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Index Mappings / Detail Panel */}
        <div className="cyber-box p-6 space-y-4">
          <h3 className="font-russo text-lg text-white flex items-center gap-2 border-b border-gray-800 pb-3">
            <FileCode className="w-5 h-5 text-cyan-400" />
            INDEX MAPPING SUMMARY
          </h3>

          {selectedIdx ? (
            <div className="space-y-4 font-mono text-xs">
              <div>
                <div className="text-gray-500 text-[10px] uppercase">Index Identifier</div>
                <div className="text-cyan-400 font-bold text-sm">{selectedIdx.name}</div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-900 p-3 rounded-lg border border-gray-800">
                  <div className="text-gray-500 text-[10px]">DOCUMENTS</div>
                  <div className="text-white font-bold text-sm">{selectedIdx.docsCount.toLocaleString()}</div>
                </div>
                <div className="bg-gray-900 p-3 rounded-lg border border-gray-800">
                  <div className="text-gray-500 text-[10px]">TOTAL SIZE</div>
                  <div className="text-white font-bold text-sm">{selectedIdx.size}</div>
                </div>
              </div>

              <div>
                <div className="text-gray-500 text-[10px] uppercase mb-2">Detected Field Types</div>
                <div className="p-3 bg-black rounded-lg border border-gray-800 space-y-1 text-emerald-400">
                  <div>@timestamp → <span className="text-amber-400">date</span></div>
                  <div>srcIp → <span className="text-amber-400">ip</span></div>
                  <div>service → <span className="text-amber-400">keyword</span></div>
                  <div>payload → <span className="text-amber-400">text</span></div>
                  <div>geo.country → <span className="text-amber-400">keyword</span></div>
                  <div>dstPort → <span className="text-amber-400">integer</span></div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-gray-500 text-xs font-mono">Select an index to inspect mapping</div>
          )}
        </div>

      </div>

    </div>
  );
};
