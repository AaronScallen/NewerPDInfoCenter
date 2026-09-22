import React, { useState, useEffect, useCallback } from 'react';
import { api } from './services/api';
import { connectWebSocket, sendWebSocketMessage } from './services/websocket';
import { playCriticalAlertSound, playUrgentAlertSound, playStandardNoticeSound, playAckChirp } from './services/audioAlert';

import Navbar from './components/Navbar';
import ActiveNoticeBanner from './components/ActiveNoticeBanner';
import EmergencyOverlay from './components/EmergencyOverlay';
import DispatchConsoleModal from './components/DispatchConsoleModal';
import DashboardOverview from './components/DashboardOverview';
import DepartmentRoster from './components/DepartmentRoster';
import EmployeeFormModal from './components/EmployeeFormModal';
import ShiftAbsenceTracker from './components/ShiftAbsenceTracker';
import AssetManager from './components/AssetManager';
import NoticeManagerModal from './components/NoticeManagerModal';
import AlertHistoryModal from './components/AlertHistoryModal';
import LoginScreen from './components/LoginScreen';
import RoleManagerModal from './components/RoleManagerModal';
import { useAuth } from './services/AuthContext';

export default function App() {
  const { currentUser, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'roster', 'absences', 'assets'

  // Data State
  const [stats, setStats] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [bodycams, setBodycams] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [cellphones, setCellphones] = useState([]);
  const [absences, setAbsences] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [notices, setNotices] = useState([]);
  const [activeNotices, setActiveNotices] = useState([]);

  // WebSocket State
  const [wsStatus, setWsStatus] = useState('CONNECTING');
  const [activeClients, setActiveClients] = useState(1);

  // Active Emergency Overlay for Priority 1 & 2
  const [activeEmergencyAlert, setActiveEmergencyAlert] = useState(null);

  // Modals
  const [isDispatchOpen, setIsDispatchOpen] = useState(false);
  const [isNoticesModalOpen, setIsNoticesModalOpen] = useState(false);
  const [isAlertHistoryOpen, setIsAlertHistoryOpen] = useState(false);
  const [isRoleManagerOpen, setIsRoleManagerOpen] = useState(false);
  const [employeeModalState, setEmployeeModalState] = useState({ isOpen: false, officer: null });

  // Real-time Toast Notifications
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  // Fetch all core datasets
  const fetchAllData = useCallback(async () => {
    try {
      const [
        statsData,
        empData,
        assnData,
        bwcData,
        vehData,
        phoneData,
        absData,
        alertData,
        allNotices,
        activeNoticesData
      ] = await Promise.all([
        api.getStats(),
        api.getEmployees(),
        api.getAssignments(),
        api.getBodycams(),
        api.getVehicles(),
        api.getCellphones(),
        api.getAbsences(),
        api.getAlerts(),
        api.getNotices(false),
        api.getNotices(true)
      ]);

      setStats(statsData);
      setEmployees(empData);
      setAssignments(assnData);
      setBodycams(bwcData);
      setVehicles(vehData);
      setCellphones(phoneData);
      setAbsences(absData);
      setAlerts(alertData);
      setNotices(allNotices);
      setActiveNotices(activeNoticesData);
    } catch (err) {
      console.error('Error fetching department data:', err);
    }
  }, []);

  // Initial Data Load (only once authenticated)
  useEffect(() => {
    if (currentUser) {
      fetchAllData();
    }
  }, [fetchAllData, currentUser]);

  // WebSocket Connection & Real-Time Dispatch Handling
  useEffect(() => {
    if (!currentUser) return undefined;

    const disconnect = connectWebSocket(
      (data) => {
        console.log('[WS Message Received]', data);

        if (data.type === 'EMERGENCY_ALERT_BROADCAST') {
          const alert = data.alert;
          // Prepend to alerts list
          setAlerts((prev) => [alert, ...prev]);

          if (alert.priority === 1 || alert.priority === 2) {
            // TRIGGER UN-DISMISSIBLE OVERLAY ON ALL ACTIVE CLIENT TERMINALS
            setActiveEmergencyAlert(alert);
            if (alert.priority === 1) playCriticalAlertSound();
            if (alert.priority === 2) playUrgentAlertSound();
          } else {
            // Priority 3 Standard Notice
            playStandardNoticeSound();
            addToast(`[PRIORITY 3 BROADCAST] ${alert.title}: ${alert.message}`, 'alert');
          }
          fetchAllData();
        } else if (data.type === 'ALERT_ACKNOWLEDGED') {
          addToast(`Officer ${data.officerName} (#${data.badge}) acknowledged Incident #${data.alertId}`, 'success');
        } else if (data.type === 'ROSTER_UPDATED' || data.type === 'ABSENCE_UPDATED' || data.type === 'NOTICES_UPDATED' || data.type === 'ALERT_HISTORY_UPDATED' || data.type === 'SYSTEM_RESEEDED') {
          fetchAllData();
          if (data.type === 'SYSTEM_RESEEDED') {
            addToast('Database reseeded with default tactical records.', 'info');
          }
        } else if (data.type === 'CLIENT_COUNT_UPDATE' || data.type === 'CONNECTION_ESTABLISHED') {
          if (data.activeClients) setActiveClients(data.activeClients);
        }
      },
      (status) => {
        setWsStatus(status);
      }
    );

    return () => disconnect();
  }, [fetchAllData, currentUser]);

  // Handle Overlay Acknowledgment
  const handleAcknowledgeAlert = (ackData) => {
    sendWebSocketMessage({
      type: 'ACK_ALERT',
      alertId: ackData.alertId,
      badge: ackData.badge,
      officerName: ackData.officerName
    });
    setActiveEmergencyAlert(null);
  };

  const handleReseed = async () => {
    try {
      await api.reseed();
      await fetchAllData();
      addToast('Database reset to original seed dataset.', 'success');
    } catch (e) {
      alert(`Reseed failed: ${e.message}`);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-tactical-950 flex items-center justify-center text-slate-400 font-mono text-sm">
        Establishing secure session...
      </div>
    );
  }

  if (!currentUser) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans relative selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Tactical Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        wsStatus={wsStatus}
        activeClients={activeClients}
        openRoleManagerModal={() => setIsRoleManagerOpen(true)}
        openDispatchModal={() => setIsDispatchOpen(true)}
        openNoticesModal={() => setIsNoticesModalOpen(true)}
        openAlertHistoryModal={() => setIsAlertHistoryOpen(true)}
        activeNoticesCount={activeNotices.length}
        onReseed={handleReseed}
        stats={stats}
      />

      {/* Active Notice Banner (Datetime filtered) */}
      <ActiveNoticeBanner
        notices={activeNotices}
        onManageNotices={() => setIsNoticesModalOpen(true)}
      />

      {/* Main Tabbed Views */}
      <main className="flex-1 p-4 md:p-6 max-w-[1700px] w-full mx-auto">
        {activeTab === 'dashboard' && (
          <DashboardOverview
            stats={stats}
            alerts={alerts}
            employees={employees}
            assignments={assignments}
            absences={absences}
            notices={notices}
            openDispatchModal={() => setIsDispatchOpen(true)}
            openNoticesModal={() => setIsNoticesModalOpen(true)}
            openAddOfficerModal={() => setEmployeeModalState({ isOpen: true, officer: null })}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'roster' && (
          <DepartmentRoster
            employees={employees}
            assignments={assignments}
            bodycams={bodycams}
            vehicles={vehicles}
            cellphones={cellphones}
            onRefresh={fetchAllData}
            onOpenAddModal={() => setEmployeeModalState({ isOpen: true, officer: null })}
            onOpenEditModal={(officer) => setEmployeeModalState({ isOpen: true, officer })}
            onOpenAbsenceModal={() => setActiveTab('absences')}
          />
        )}

        {activeTab === 'absences' && (
          <ShiftAbsenceTracker
            absences={absences}
            employees={employees}
            assignments={assignments}
            onRefresh={fetchAllData}
          />
        )}

        {activeTab === 'assets' && (
          <AssetManager
            vehicles={vehicles}
            bodycams={bodycams}
            cellphones={cellphones}
            assignments={assignments}
            onRefresh={fetchAllData}
          />
        )}
      </main>

      {/* Footer Ribbon */}
      <footer className="bg-tactical-950 border-t border-tactical-800/80 px-4 py-2.5 text-center text-xs font-mono text-slate-500 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <span className="inline-block w-2 h-2 rounded-full bg-cyan-500"></span>
          <span>POLICE DEPT DISPATCH SYSTEM // LOCAL DATABASE: <strong className="text-slate-400">police_dept.db</strong></span>
        </div>
        <div>
          <span>Strict Foreign Keys: <strong className="text-emerald-400">ENABLED (PRAGMA foreign_keys = ON)</strong></span>
        </div>
        <div>
          <span>WebSocket Real-Time Dispatch: <strong className="text-cyan-400">ONLINE</strong></span>
        </div>
      </footer>

      {/* UN-DISMISSIBLE REAL-TIME EMERGENCY OVERLAY (PRIORITY 1 & 2) */}
      {activeEmergencyAlert && (
        <EmergencyOverlay
          alert={activeEmergencyAlert}
          onAcknowledge={handleAcknowledgeAlert}
        />
      )}

      {/* Dispatch Emergency Broadcast Modal */}
      <DispatchConsoleModal
        isOpen={isDispatchOpen}
        onClose={() => setIsDispatchOpen(false)}
        onAlertBroadcasted={() => {
          fetchAllData();
        }}
      />

      {/* Employee Add/Edit Modal */}
      <EmployeeFormModal
        isOpen={employeeModalState.isOpen}
        officer={employeeModalState.officer}
        onClose={() => setEmployeeModalState({ isOpen: false, officer: null })}
        onSaved={fetchAllData}
        assignments={assignments}
        bodycams={bodycams}
        vehicles={vehicles}
        cellphones={cellphones}
      />

      {/* Important Notices Manager Modal */}
      <NoticeManagerModal
        isOpen={isNoticesModalOpen}
        onClose={() => setIsNoticesModalOpen(false)}
        notices={notices}
        employees={employees}
        onRefresh={fetchAllData}
      />

      {/* Alert History Archive Modal */}
      <AlertHistoryModal
        isOpen={isAlertHistoryOpen}
        onClose={() => setIsAlertHistoryOpen(false)}
        alerts={alerts}
        onRefresh={fetchAllData}
      />

      {/* Role & Access Management Modal (Super Admin & Command only) */}
      <RoleManagerModal
        isOpen={isRoleManagerOpen}
        onClose={() => setIsRoleManagerOpen(false)}
      />

      {/* Real-Time Floating Toasts */}
      <div className="fixed bottom-4 right-4 z-40 space-y-2 max-w-sm pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`p-3 rounded-lg border text-xs font-mono shadow-xl animate-in slide-in-from-right duration-200 pointer-events-auto ${
              t.type === 'alert'
                ? 'bg-rose-950/90 border-rose-500 text-rose-200'
                : t.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500 text-emerald-200'
                : 'bg-tactical-900/90 border-cyan-500/50 text-cyan-200'
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
}
