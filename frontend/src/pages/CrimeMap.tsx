import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Circle, CircleMarker, Polyline, Popup, useMap } from 'react-leaflet';
import { Map, Layers, Navigation, PlusCircle, X, ShieldCheck as DispatchIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { getWorkflowState, updateWorkflowData, setWorkflowStep } from '../lib/workflow';
import { 
  getHeatmap, 
  getIncidents, 
  getFICNSeizures, 
  getHotspots, 
  getCorridors, 
  getPatrolRecommendations, 
  reportMapIncident 
} from '../lib/api';

// Standard dark matter map tile coordinates
const TILE_URL = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

export const CrimeMap: React.FC = () => {
  const navigate = useNavigate();
  const workflow = getWorkflowState();

  // Layer Toggles
  const [showHeatmap, setShowHeatmap] = useState<boolean>(true);
  const [showFICN, setShowFICN] = useState<boolean>(true);
  const [showHotspots, setShowHotspots] = useState<boolean>(true);
  const [showCorridors, setShowCorridors] = useState<boolean>(true);
  const [showIncidents, setShowIncidents] = useState<boolean>(true);

  // Data States
  const [heatmapPoints, setHeatmapPoints] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [seizures, setSeizures] = useState<any[]>([]);
  const [hotspots, setHotspots] = useState<any[]>([]);
  const [corridors, setCorridors] = useState<any[]>([]);

  // Selected Detail Area State
  const [selectedArea, setSelectedArea] = useState<any>(null);
  const [patrolData, setPatrolData] = useState<any>(null);
  const [loadingPatrol, setLoadingPatrol] = useState<boolean>(false);

  // Modal States
  const [patrolModalOpen, setPatrolModalOpen] = useState<boolean>(false);
  const [reportModalOpen, setReportModalOpen] = useState<boolean>(false);
  const [patrolDistrictInput, setPatrolDistrictInput] = useState<string>('New Delhi');

  // New incident report form states
  const [newCrimeType, setNewCrimeType] = useState<string>('UPI Fraud');
  const [newSeverity, setNewSeverity] = useState<string>('MEDIUM');
  const [newDesc, setNewDesc] = useState<string>('');
  const [newState, setNewState] = useState<string>('Delhi');
  const [newDistrict, setNewDistrict] = useState<string>('New Delhi');
  const [newLat, setNewLat] = useState<number>(28.6139);
  const [newLng, setNewLng] = useState<number>(77.2090);

  // Fetch all GIS vectors on load
  const loadMapData = async () => {
    try {
      const heatRes = await getHeatmap();
      setHeatmapPoints(heatRes.data || []);

      const incRes = await getIncidents();
      setIncidents(incRes.data || []);

      const seizureRes = await getFICNSeizures();
      setSeizures(seizureRes.data || []);

      const hotspotRes = await getHotspots();
      setHotspots(hotspotRes.data || []);

      const corrRes = await getCorridors();
      setCorridors(corrRes.data || []);
    } catch (err) {
      console.error('Error fetching map layer coordinates:', err);
    }
  };

  useEffect(() => {
    loadMapData();
    const activeState = getWorkflowState();
    if (activeState.activeStep === 'crime_map') {
      handleAreaSelect('New Delhi', 'Delhi');
    }
  }, []);

  // Fetch patrol recommendations when select district changes
  const handleQueryPatrol = async (districtName: string) => {
    try {
      setLoadingPatrol(true);
      const res = await getPatrolRecommendations(districtName);
      setPatrolData(res.data);
    } catch (err) {
      console.error('Error fetching patrol details:', err);
    } finally {
      setLoadingPatrol(false);
    }
  };

  // Click handler on area/district
  const handleAreaSelect = (areaName: string, state: string) => {
    setSelectedArea({ name: areaName, state: state });
    handleQueryPatrol(areaName);
  };

  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await reportMapIncident({
        crime_type: newCrimeType,
        severity: newSeverity,
        description: newDesc,
        state: newState,
        district: newDistrict,
        latitude: Number(newLat),
        longitude: Number(newLng)
      });
      alert('Incident report successfully pinned to map layers.');
      setReportModalOpen(false);
      loadMapData(); // Refresh Map
    } catch (err) {
      console.error('Error dispatching map incident:', err);
    }
  };

  // Severity color utility
  const getSevColor = (sev: string) => {
    switch (sev.toUpperCase()) {
      case 'CRITICAL':
        return '#EF4444'; // Red
      case 'HIGH':
        return '#F59E0B'; // Amber
      case 'MEDIUM':
        return '#3B82F6'; // Blue
      default:
        return '#9CA3AF'; // Gray
    }
  };

  // Helper component to handle reactive Leaflet map focus
  const MapWorkflowFocus: React.FC<{ active: boolean }> = ({ active }) => {
    const map = useMap();
    useEffect(() => {
      if (active) {
        map.setView([28.6139, 77.2090], 12);
      }
    }, [active, map]);
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="h-[calc(100vh-100px)] relative overflow-hidden rounded-2xl border border-border-custom"
    >
      
      {/* Fullscreen Leaflet Map Grid Container */}
      <div className="w-full h-full z-0 relative">
        <MapContainer 
          center={[20.5937, 78.9629]} 
          zoom={5} 
          scrollWheelZoom={true}
          style={{ width: '100%', height: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://carto.com/attributions">CartoDB</a>'
            url={TILE_URL}
          />
          <MapWorkflowFocus active={workflow.activeStep === 'crime_map'} />

          {/* 1. Heatmap density indicators layer */}
          {showHeatmap && heatmapPoints.map((pt, idx) => (
            <CircleMarker
              key={`heat-${idx}`}
              center={[pt.lat, pt.lng]}
              radius={18}
              fillColor={pt.intensity > 0.7 ? '#EF4444' : pt.intensity > 0.5 ? '#F59E0B' : '#3B82F6'}
              color="transparent"
              fillOpacity={0.15}
            />
          ))}

          {/* 2. Crime incidents markers layer */}
          {showIncidents && incidents.map((inc) => (
            <CircleMarker
              key={`inc-${inc.id}`}
              center={[inc.latitude, inc.longitude]}
              radius={6}
              fillColor={getSevColor(inc.severity)}
              color="#0A0F1E"
              weight={1.5}
              fillOpacity={0.85}
              eventHandlers={{
                click: () => handleAreaSelect(inc.district, inc.state)
              }}
            >
              <Popup>
                <div className="text-xs font-mono p-1">
                  <div className="font-bold text-text-primary flex justify-between">
                    <span>{inc.crime_type}</span>
                    <span style={{ color: getSevColor(inc.severity) }}>{inc.severity}</span>
                  </div>
                  <p className="text-[10px] text-text-secondary mt-1">{inc.description}</p>
                  <div className="text-[9px] text-accent-blue/80 mt-1 uppercase">{inc.district}, {inc.state}</div>
                </div>
              </Popup>
            </CircleMarker>
          ))}

          {/* 3. FICN Seizure markers layer */}
          {showFICN && seizures.map((sz) => (
            <CircleMarker
              key={`sz-${sz.id}`}
              center={[sz.latitude, sz.longitude]}
              radius={8}
              fillColor="#10B981" // Safe/Genuine Green for note flags
              color="#0A0F1E"
              weight={1.5}
              fillOpacity={0.8}
            >
              <Popup>
                <div className="text-xs font-mono p-1">
                  <div className="font-bold text-success">FICN Seizure Point</div>
                  <div className="mt-1">Denom: <span className="text-text-primary font-bold">₹{sz.denomination}</span></div>
                  <div>Count: <span className="text-text-primary font-bold">{sz.count} fake notes</span></div>
                  <div className="text-[9px] text-text-secondary mt-1">{sz.district}, {sz.state}</div>
                </div>
              </Popup>
            </CircleMarker>
          ))}

          {/* 4. Hotspots pulsing zones */}
          {showHotspots && hotspots.map((ht) => (
            <React.Fragment key={`hot-${ht.id}`}>
              {/* Outer pulsing ring simulator */}
              <Circle
                center={[ht.lat, ht.lng]}
                radius={ht.radius}
                pathOptions={{
                  fillColor: ht.severity === 'CRITICAL' ? '#EF4444' : '#F59E0B',
                  fillOpacity: 0.08,
                  color: ht.severity === 'CRITICAL' ? '#EF4444' : '#F59E0B',
                  weight: 1,
                  dashArray: "5, 10"
                }}
              />
              <CircleMarker
                center={[ht.lat, ht.lng]}
                radius={12}
                fillColor={ht.severity === 'CRITICAL' ? '#EF4444' : '#F59E0B'}
                color="#0A0F1E"
                weight={2}
                fillOpacity={0.9}
                eventHandlers={{
                  click: () => handleAreaSelect(ht.area.split(',')[0], ht.area.split(',')[1])
                }}
              >
                <Popup>
                  <div className="text-xs font-mono p-1">
                    <div className="font-bold text-danger">{ht.area}</div>
                    <div className="mt-1">Forecast: <span className="text-text-primary font-bold">{ht.growth_forecast}</span></div>
                    <div>Dominant Fraud: <span className="text-accent-blue font-bold">{ht.dominant_crime}</span></div>
                  </div>
                </Popup>
              </CircleMarker>
            </React.Fragment>
          ))}

          {/* 5. Fraud Corridors flow lines */}
          {showCorridors && corridors.map((c) => (
            <Polyline
              key={`corr-${c.id}`}
              positions={[c.from_coords, c.to_coords]}
              pathOptions={{
                color: c.risk === 'CRITICAL' ? '#EF4444' : '#F59E0B',
                weight: 3,
                dashArray: "10, 10",
                opacity: 0.65
              }}
            >
              <Popup>
                <div className="text-xs font-mono p-1">
                  <div className="font-bold text-accent-blue">Inter-State Fraud Route</div>
                  <div className="mt-1">{c.from_name} &rarr; {c.to_name}</div>
                  <div className="text-[10px] text-text-secondary mt-1">Transacted: <span className="text-text-primary font-bold">{c.flow_volume}</span></div>
                  <div>Risk Factor: <span className="text-danger font-bold">{c.risk}</span></div>
                </div>
              </Popup>
            </Polyline>
          ))}
        </MapContainer>
      </div>

      {/* Floating Top KPI Stats Bar */}
      <section className="absolute top-4 left-4 right-4 lg:left-[300px] bg-bg-surface/85 backdrop-blur-md border border-border-custom rounded-xl p-3 z-10 flex flex-wrap gap-4 items-center justify-between text-xs font-mono select-none">
        <div className="flex items-center space-x-1.5 text-accent-blue">
          <Navigation className="w-4 h-4 animate-pulse" />
          <span className="font-bold uppercase tracking-wider text-[10px]">Command map indices</span>
        </div>
        <div className="flex items-center space-x-4">
          <div>Loss: <span className="text-danger font-bold">₹11,269 Cr</span></div>
          <div>Complaints (2026): <span className="text-text-primary font-bold">1,140,000+</span></div>
          <div>Forecast Hotspots: <span className="text-warning font-bold">3 zones</span></div>
        </div>
      </section>

      {/* Floating Left Control Panel (Layer select) */}
      <section className="absolute top-20 right-4 bg-bg-surface/85 backdrop-blur-md border border-border-custom rounded-xl p-4 z-10 w-64 space-y-3 shadow-2xl select-none">
        <div className="flex items-center space-x-2 border-b border-border-custom pb-2">
          <Layers className="w-4 h-4 text-accent-blue" />
          <span className="text-xs font-bold font-mono text-text-primary uppercase tracking-wider">Map GIS Layers</span>
        </div>

        <div className="space-y-2 text-xs font-mono text-text-secondary">
          <label className="flex items-center justify-between cursor-pointer">
            <span>Cybercrime Heatmap</span>
            <input 
              type="checkbox" 
              checked={showHeatmap} 
              onChange={() => setShowHeatmap(!showHeatmap)} 
              className="accent-accent-blue"
            />
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <span>Crime Incident Points</span>
            <input 
              type="checkbox" 
              checked={showIncidents} 
              onChange={() => setShowIncidents(!showIncidents)}
              className="accent-accent-blue"
            />
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <span>FICN Seizure Flags</span>
            <input 
              type="checkbox" 
              checked={showFICN} 
              onChange={() => setShowFICN(!showFICN)}
              className="accent-accent-blue"
            />
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <span>Pulsing Hotspots</span>
            <input 
              type="checkbox" 
              checked={showHotspots} 
              onChange={() => setShowHotspots(!showHotspots)}
              className="accent-accent-blue"
            />
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <span>Mule Corridors</span>
            <input 
              type="checkbox" 
              checked={showCorridors} 
              onChange={() => setShowCorridors(!showCorridors)}
              className="accent-accent-blue"
            />
          </label>
        </div>

        <div className="pt-2 border-t border-border-custom flex gap-2">
          <button
            onClick={() => setPatrolModalOpen(true)}
            className="flex-1 py-1.5 bg-bg-primary hover:bg-bg-surface2 text-[10px] font-bold text-text-primary rounded border border-border-custom text-center transition"
          >
            Patrol Dispatch
          </button>
          <button
            onClick={() => setReportModalOpen(true)}
            className="flex-1 py-1.5 bg-accent-blue text-[10px] font-bold text-text-primary rounded text-center hover:bg-accent-blue-hover transition flex items-center justify-center gap-1"
          >
            <PlusCircle className="w-3.5 h-3.5" /> Filed Report
          </button>
        </div>
      </section>

      {/* Left Float Info Panel (drill down detail card) */}
      <section className="absolute top-20 left-4 bg-bg-surface/85 backdrop-blur-md border border-border-custom rounded-xl p-4 z-10 w-72 h-[calc(100%-110px)] overflow-y-auto shadow-2xl flex flex-col justify-between">
        
        <div className="space-y-4 flex-1">
          {!selectedArea ? (
            // Default View
            <div className="space-y-4">
              <div className="border-b border-border-custom pb-2">
                <h3 className="text-xs font-bold font-mono text-text-primary uppercase tracking-widest flex items-center gap-1.5">
                  <Map className="w-4 h-4 text-accent-blue" />
                  National GIS intelligence
                </h3>
              </div>

              {/* Mini stats cards */}
              <div className="grid grid-cols-2 gap-2 text-center text-xs font-mono">
                <div className="bg-bg-primary p-2 rounded border border-border-custom">
                  <span className="text-[8px] text-text-secondary uppercase">Hotspots</span>
                  <div className="font-bold text-warning text-sm mt-0.5">{hotspots.length} Areas</div>
                </div>
                <div className="bg-bg-primary p-2 rounded border border-border-custom">
                  <span className="text-[8px] text-text-secondary uppercase">RBI Seizures</span>
                  <div className="font-bold text-success text-sm mt-0.5">{seizures.length} Cases</div>
                </div>
              </div>

              {/* Hotspots scroll list */}
              <div className="space-y-2 pt-2 border-t border-border-custom">
                <span className="text-[10px] font-mono text-text-secondary uppercase block mb-1">Active forecast zones</span>
                {hotspots.slice(0, 3).map((ht) => (
                  <div
                    key={ht.id}
                    onClick={() => handleAreaSelect(ht.area.split(',')[0], ht.area.split(',')[1] || 'National')}
                    className="p-2 bg-bg-primary hover:bg-bg-surface-hover rounded border border-border-custom transition cursor-pointer text-[10px] font-mono"
                  >
                    <div className="flex justify-between font-bold text-text-primary">
                      <span>{ht.area}</span>
                      <span className="text-danger">{ht.severity}</span>
                    </div>
                    <div className="text-text-secondary mt-1">{ht.dominant_crime}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // Drill down detail view
            <div className="space-y-4 animate-fade-in">
              <button 
                onClick={() => {
                  setSelectedArea(null);
                  setPatrolData(null);
                }}
                className="text-[9px] font-mono font-bold text-accent-blue uppercase hover:underline"
              >
                &larr; Back to National Overview
              </button>

              <div className="border-b border-border-custom pb-2">
                <h3 className="text-sm font-bold text-text-primary">{selectedArea.name}</h3>
                <span className="text-[10px] font-mono text-text-secondary uppercase">{selectedArea.state} Sector</span>
              </div>

              {/* AI Case Audit Timeline */}
              {workflow.activeStep === 'crime_map' && (
                <div className="bg-[#070b16]/75 border border-border-custom/40 rounded-xl p-3 space-y-3 font-mono text-[9px] select-none shadow-md">
                  <span className="text-[10px] text-accent-blue font-bold block border-b border-border-custom/30 pb-1.5 uppercase">
                    AI Tactical Case Timeline
                  </span>
                  <div className="space-y-2.5">
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-success mt-1 shrink-0" />
                      <div>
                        <span className="text-text-primary font-bold block">1. CASE INTAKE</span>
                        <span className="text-text-secondary">Citizen transcript analyzed. Source vectors logged.</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-success mt-1 shrink-0" />
                      <div>
                        <span className="text-text-primary font-bold block">2. CLASS SCORE</span>
                        <span className="text-text-secondary">Category: Digital Arrest. Threat: CRITICAL.</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-success mt-1 shrink-0" />
                      <div>
                        <span className="text-text-primary font-bold block">3. GRAPH MAPPED</span>
                        <span className="text-text-secondary">Louvain cluster mule nodes isolated (Ring #7).</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-accent-blue mt-1 shrink-0 animate-pulse glow-accent" />
                      <div>
                        <span className="text-accent-blue font-bold block">4. GIS DEPLOYMENT</span>
                        <span className="text-text-secondary">Localizing suspect coordinates & dispatch recommendations...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Patrol recommendations list */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono text-text-secondary uppercase font-bold tracking-wider block">
                  AI Tactical Patrol Recommendations:
                </span>
                
                {loadingPatrol ? (
                  <div className="space-y-2 animate-pulse">
                    <div className="h-6 bg-bg-primary rounded" />
                    <div className="h-6 bg-bg-primary rounded" />
                  </div>
                ) : patrolData ? (
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center text-[10px] font-mono bg-bg-primary p-2 rounded border border-border-custom">
                      <span className="text-text-secondary">Dispatch priority:</span>
                      <span className="text-danger font-bold uppercase">{patrolData.patrol_priority}</span>
                    </div>

                    <ul className="space-y-2">
                      {patrolData.recommendations.map((rec: string, idx: number) => (
                        <li key={idx} className="p-2 bg-bg-primary border border-border-custom rounded text-[10px] font-mono leading-relaxed text-text-secondary">
                          {idx + 1}. {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <span className="text-[10px] text-text-secondary">No patrol coordinates logged.</span>
                )}
              </div>

              {/* Actions & Dispatch confirmation */}
              {workflow.activeStep === 'crime_map' && (
                <div className="pt-3 border-t border-border-custom">
                  <button
                    onClick={() => {
                      updateWorkflowData({
                        patrolRecommendations: patrolData?.recommendations || [
                          "Deploy New Delhi Cyber Cell unit to localized coordinates.",
                          "Coordinate with nodal bank officers to flag transaction accounts."
                        ]
                      });
                      setWorkflowStep('case_package');
                      navigate('/');
                    }}
                    className="w-full py-2 bg-success text-text-primary hover:bg-green-600 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 glow-accent cursor-pointer"
                  >
                    <DispatchIcon className="w-4 h-4 animate-bounce" />
                    Approve Case Dispatch &rarr;
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Form modal for dispatcher filed reports */}
      {reportModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-bg-surface border border-border-custom rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative">
            <div className="px-6 py-4 border-b border-border-custom flex justify-between items-center bg-bg-primary/40">
              <span className="text-xs font-bold font-mono text-accent-blue uppercase tracking-widest">
                File incident dispatch log
              </span>
              <button onClick={() => setReportModalOpen(false)} className="text-text-secondary hover:text-text-primary transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateReport} className="p-6 space-y-4 text-xs font-mono">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-text-secondary">Crime Type:</label>
                  <select 
                    value={newCrimeType} 
                    onChange={(e) => setNewCrimeType(e.target.value)}
                    className="w-full bg-bg-primary border border-border-custom rounded px-3 py-2 text-text-primary"
                  >
                    <option value="UPI Fraud">UPI Fraud</option>
                    <option value="Digital Arrest">Digital Arrest</option>
                    <option value="Phishing">Phishing</option>
                    <option value="Identity Theft">Identity Theft</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-text-secondary">Severity:</label>
                  <select 
                    value={newSeverity} 
                    onChange={(e) => setNewSeverity(e.target.value)}
                    className="w-full bg-bg-primary border border-border-custom rounded px-3 py-2 text-text-primary"
                  >
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-text-secondary">State:</label>
                  <input
                    type="text"
                    required
                    value={newState}
                    onChange={(e) => setNewState(e.target.value)}
                    className="w-full bg-bg-primary border border-border-custom rounded px-3 py-2 text-text-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-text-secondary">District:</label>
                  <input
                    type="text"
                    required
                    value={newDistrict}
                    onChange={(e) => setNewDistrict(e.target.value)}
                    className="w-full bg-bg-primary border border-border-custom rounded px-3 py-2 text-text-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-text-secondary">Latitude:</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={newLat}
                    onChange={(e) => setNewLat(Number(e.target.value))}
                    className="w-full bg-bg-primary border border-border-custom rounded px-3 py-2 text-text-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-text-secondary">Longitude:</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={newLng}
                    onChange={(e) => setNewLng(Number(e.target.value))}
                    className="w-full bg-bg-primary border border-border-custom rounded px-3 py-2 text-text-primary"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-text-secondary">Description:</label>
                <textarea
                  required
                  rows={3}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Detail transaction metrics, spoof calls vectors..."
                  className="w-full bg-bg-primary border border-border-custom rounded px-3 py-2 text-text-primary resize-none"
                />
              </div>

              <div className="flex justify-end pt-3">
                <button
                  type="submit"
                  className="px-4 py-2 bg-accent-blue text-text-primary hover:bg-accent-blue-hover text-xs font-bold rounded-lg transition"
                >
                  File Incident
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Patrol Dispatch Modal */}
      {patrolModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-bg-surface border border-border-custom rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative">
            <div className="px-6 py-4 border-b border-border-custom flex justify-between items-center bg-bg-primary/40">
              <span className="text-xs font-bold font-mono text-accent-blue uppercase tracking-widest">
                Search tactical dispatch guide
              </span>
              <button onClick={() => setPatrolModalOpen(false)} className="text-text-secondary hover:text-text-primary transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4 text-xs font-mono">
              <div className="space-y-1.5">
                <label className="text-text-secondary">District Name:</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={patrolDistrictInput}
                    onChange={(e) => setPatrolDistrictInput(e.target.value)}
                    className="flex-1 bg-bg-primary border border-border-custom rounded px-3 py-2 text-text-primary"
                  />
                  <button
                    onClick={() => handleQueryPatrol(patrolDistrictInput)}
                    className="px-4 py-2 bg-bg-surface border border-border-custom rounded hover:bg-bg-surface-hover font-bold text-text-primary"
                  >
                    Query
                  </button>
                </div>
              </div>

              {patrolData && (
                <div className="space-y-3 bg-[#070b16] p-4 rounded-xl border border-border-custom animate-fade-in">
                  <div className="flex justify-between font-bold">
                    <span>Priority:</span>
                    <span className="text-danger uppercase">{patrolData.patrol_priority}</span>
                  </div>
                  <ul className="space-y-1.5 list-decimal list-inside text-text-secondary leading-relaxed">
                    {patrolData.recommendations.map((rec: string, idx: number) => (
                      <li key={idx} className="text-[11px]">{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default CrimeMap;
