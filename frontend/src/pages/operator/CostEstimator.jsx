import React, { useState } from 'react';
import {
  Calculator,
  DollarSign,
  TrendingUp,
  ShieldCheck,
  Building,
  RefreshCw,
  Download
} from 'lucide-react';

export default function CostEstimator() {
  const [tab, setTab] = useState('TOUR_COST');

  // Pre-booking Tour Cost State
  const [tourForm, setTourForm] = useState({
    touristCount: 20,
    transportationCost: 45000,
    accommodationCost: 75000,
    foodCost: 40000,
    activityCost: 20000,
    guideCost: 15000,
    miscCost: 5000,
    contingencyPercent: 5
  });

  const [tourResult, setTourResult] = useState({
    totalTourCost: 210000,
    perPersonCost: 10500,
    contingencyCost: 10000
  });

  // Emergency Expense Estimator State
  const [emgForm, setEmgForm] = useState({
    distanceKm: 18,
    transportType: 'Emergency Vehicle',
    availableReserve: 20000
  });

  const [emgResult, setEmgResult] = useState({
    minCost: 1500,
    maxCost: 2500,
    remainingMin: 17500,
    remainingMax: 18500
  });

  // Handle Tour Cost Calculation
  const handleCalculateTourCost = () => {
    const subtotal =
      Number(tourForm.transportationCost) +
      Number(tourForm.accommodationCost) +
      Number(tourForm.foodCost) +
      Number(tourForm.activityCost) +
      Number(tourForm.guideCost) +
      Number(tourForm.miscCost);
    const contingency = subtotal * (Number(tourForm.contingencyPercent) / 100);
    const total = subtotal + contingency;
    const count = Math.max(1, Number(tourForm.touristCount));

    setTourResult({
      totalTourCost: total,
      perPersonCost: total / count,
      contingencyCost: contingency
    });
  };

  // Handle Emergency Expense Calculation
  const handleCalculateEmergency = () => {
    const dist = Number(emgForm.distanceKm);
    const reserve = Number(emgForm.availableReserve);
    const base = 800;
    const rate = 65;
    const calculated = base + dist * rate + 500;
    const min = Math.round(calculated * 0.85);
    const max = Math.round(calculated * 1.35);

    setEmgResult({
      minCost: min,
      maxCost: max,
      remainingMin: Math.max(0, reserve - max),
      remainingMax: Math.max(0, reserve - min)
    });
  };

  const exportBudgetCSV = () => {
    const headers = ['Cost Component', 'Amount (INR)'];
    const rows = [
      ['Tourist Count', tourForm.touristCount],
      ['Transportation', tourForm.transportationCost],
      ['Accommodation', tourForm.accommodationCost],
      ['Food & Dining', tourForm.foodCost],
      ['Activity Admissions', tourForm.activityCost],
      ['Guide Fees', tourForm.guideCost],
      ['Miscellaneous Logistics', tourForm.miscCost],
      ['Contingency Reserve (' + tourForm.contingencyPercent + '%)', tourResult.contingencyCost],
      ['TOTAL ESTIMATED TOUR BUDGET', tourResult.totalTourCost],
      ['PER PERSON COST', tourResult.perPersonCost]
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Tour_Budget_Statement_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-slate-800">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center space-x-1">
              <Calculator className="w-3.5 h-3.5" />
              <span>Financial Forecasting & Risk Analytics</span>
            </span>
          </div>
          <h2 className="text-2xl font-extrabold mt-1 text-slate-900 tracking-tight">
            Tour & Emergency Cost Estimator
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Pre-booking budget estimation, per-person pricing breakdown, and operational emergency reserve modeling.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {tab === 'TOUR_COST' && (
            <button
              onClick={exportBudgetCSV}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold shadow-xs flex items-center space-x-1.5 transition-all"
              title="Download Itemized Budget Statement CSV"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>Export Budget (CSV)</span>
            </button>
          )}

          {/* Tab Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs">
          <button
            onClick={() => setTab('TOUR_COST')}
            className={`px-4 py-2 rounded-xl font-bold transition-all ${
              tab === 'TOUR_COST' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pre-Booking Tour Cost
          </button>
          <button
            onClick={() => setTab('EMERGENCY')}
            className={`px-4 py-2 rounded-xl font-bold transition-all ${
              tab === 'EMERGENCY' ? 'bg-white text-rose-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Emergency Expense Reserve
          </button>
        </div>
      </div>
      </div>

      {tab === 'TOUR_COST' ? (
        /* Pre-booking Tour Cost Estimator */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Inputs */}
          <div className="lg:col-span-2 glass-card rounded-3xl p-6 border border-slate-200 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Building className="w-4 h-4 text-blue-600" />
              <span>Cost Component Breakdown</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Tourist Capacity (Pax)</label>
                <input
                  type="number"
                  value={tourForm.touristCount}
                  onChange={(e) => setTourForm({ ...tourForm, touristCount: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Transportation Cost (₹)</label>
                <input
                  type="number"
                  value={tourForm.transportationCost}
                  onChange={(e) => setTourForm({ ...tourForm, transportationCost: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Accommodation Cost (₹)</label>
                <input
                  type="number"
                  value={tourForm.accommodationCost}
                  onChange={(e) => setTourForm({ ...tourForm, accommodationCost: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Food & Dining Cost (₹)</label>
                <input
                  type="number"
                  value={tourForm.foodCost}
                  onChange={(e) => setTourForm({ ...tourForm, foodCost: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Activities & Entry Fees (₹)</label>
                <input
                  type="number"
                  value={tourForm.activityCost}
                  onChange={(e) => setTourForm({ ...tourForm, activityCost: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Guide & Support Charges (₹)</label>
                <input
                  type="number"
                  value={tourForm.guideCost}
                  onChange={(e) => setTourForm({ ...tourForm, guideCost: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Miscellaneous (₹)</label>
                <input
                  type="number"
                  value={tourForm.miscCost}
                  onChange={(e) => setTourForm({ ...tourForm, miscCost: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Contingency Buffer (%)</label>
                <input
                  type="number"
                  value={tourForm.contingencyPercent}
                  onChange={(e) => setTourForm({ ...tourForm, contingencyPercent: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium"
                />
              </div>
            </div>

            <button
              onClick={handleCalculateTourCost}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 flex items-center justify-center space-x-2 transition-all mt-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Calculate Tour Total & Per-Person Cost</span>
            </button>
          </div>

          {/* Results Card */}
          <div className="glass-card rounded-3xl p-6 border border-slate-200 space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900">Estimation Summary</h3>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div>
                  <span className="text-[11px] text-slate-500 font-semibold">Total Tour Cost</span>
                  <p className="text-3xl font-extrabold text-slate-900 mt-0.5">
                    ₹{Number(tourResult.totalTourCost).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-200">
                  <span className="text-[11px] text-slate-500 font-semibold">Cost Per Person</span>
                  <p className="text-2xl font-bold text-emerald-700 mt-0.5">
                    ₹{Number(tourResult.perPersonCost).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Based on {tourForm.touristCount} tourists
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
                  <span>Contingency Reserve:</span>
                  <span className="text-slate-800 font-bold">
                    ₹{Number(tourResult.contingencyCost).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-[11px] text-blue-900 leading-snug font-medium">
              Formula: (Transport + Hotel + Food + Activities + Guides + Misc) + {tourForm.contingencyPercent}% Contingency Buffer.
            </div>
          </div>
        </div>
      ) : (
        /* Emergency Expense & Reserve Estimator */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Inputs */}
          <div className="lg:col-span-2 glass-card rounded-3xl p-6 border border-slate-200 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-rose-600" />
              <span>Emergency Parameters & Logistics</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Estimated Distance to Support (km)</label>
                <input
                  type="number"
                  value={emgForm.distanceKm}
                  onChange={(e) => setEmgForm({ ...emgForm, distanceKm: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Available Emergency Reserve (₹)</label>
                <input
                  type="number"
                  value={emgForm.availableReserve}
                  onChange={(e) => setEmgForm({ ...emgForm, availableReserve: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-600 font-semibold mb-1">Transportation Type</label>
                <select
                  value={emgForm.transportType}
                  onChange={(e) => setEmgForm({ ...emgForm, transportType: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium"
                >
                  <option value="Emergency Vehicle">Emergency Vehicle (Mountain 4x4)</option>
                  <option value="Electric Golf Cart">Electric Garden Cart (Local Sight)</option>
                  <option value="Private Transit">Private Emergency Cab</option>
                  <option value="Air/Special Rescue">Air Ambulance / Special Mountain Unit</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleCalculateEmergency}
              className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-500/20 flex items-center justify-center space-x-2 transition-all mt-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Calculate Emergency Range & Reserve Impact</span>
            </button>
          </div>

          {/* Emergency Output Card */}
          <div className="glass-card rounded-3xl p-6 border border-slate-200 space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900">Emergency Reserve Forecast</h3>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div>
                  <span className="text-[11px] text-slate-500 font-semibold">Estimated Distance</span>
                  <p className="text-base font-bold text-slate-800 mt-0.5">{emgForm.distanceKm} km</p>
                </div>

                <div className="pt-2 border-t border-slate-200">
                  <span className="text-[11px] text-slate-500 font-semibold">Estimated Cost Range</span>
                  <p className="text-2xl font-bold text-amber-700 mt-0.5">
                    ₹{emgResult.minCost.toLocaleString()} – ₹{emgResult.maxCost.toLocaleString()}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-200">
                  <span className="text-[11px] text-slate-500 font-semibold">Available Emergency Reserve</span>
                  <p className="text-xl font-bold text-emerald-700 mt-0.5">
                    ₹{emgForm.availableReserve.toLocaleString()}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-200">
                  <span className="text-[11px] text-slate-500 font-semibold">Remaining Estimated Reserve</span>
                  <p className="text-xl font-bold text-indigo-700 mt-0.5">
                    ₹{emgResult.remainingMin.toLocaleString()} – ₹{emgResult.remainingMax.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 leading-snug">
              ⚠️ <strong>Disclaimer:</strong> This is an approximate operational estimate, not an exact medical or financial prediction.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
