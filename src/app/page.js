"use client";

import { useState, useEffect, useRef } from 'react';
// Firebase: Corregimos la ruta de importación para que sea más robusta
import { db } from '@/firebase/config'; 
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";

// --- Componente Principal de la Página ---
export default function HomePage() {
  const [view, setView] = useState('home'); // 'home', 'register', 'reports'

  const navigateTo = (viewName) => {
    setView(viewName);
  };

  return (
    // Fondo con degradado
    <div className="bg-gradient-to-br from-pink-50 via-purple-50 to-blue-100 text-gray-800 font-sans min-h-screen">
      <div id="app" className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
        <Header />
        
        <main>
          {view === 'home' && <HomeView navigateTo={navigateTo} />}
          {view === 'register' && <RegisterView />}
          {view === 'reports' && <ReportsView />}
        </main>
        
        {view !== 'home' && (
          <button 
            className="mt-8 w-full bg-gray-400 text-white px-4 py-3 rounded-xl hover:bg-gray-500 transition-transform transform hover:scale-105 shadow-lg text-lg"
            onClick={() => navigateTo('home')}
          >
            🏠 Volver al Inicio
          </button>
        )}
        <Footer />
      </div>
    </div>
  );
}

// --- Sub-componentes ---

function Header() {
  return (
    <header className="text-center mb-8 lg:mb-12">
      <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600">
        CEI Mundo de los niños
      </h1>
      <p className="text-gray-500 mt-2 text-lg">Registro de Asistencias ☀️</p>
    </header>
  );
}

function HomeView({ navigateTo }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
      <button 
        onClick={() => navigateTo('register')} 
        className="bg-gradient-to-r from-green-400 to-blue-500 text-white p-8 lg:p-12 rounded-2xl shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1"
      >
        <h2 className="text-xl sm:text-2xl font-bold">📲 Registrar Asistencia</h2>
        <p className="mt-2 sm:text-lg opacity-90">Escanear QR para entradas y salidas.</p>
      </button>
      <button 
        onClick={() => navigateTo('reports')} 
        className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-8 lg:p-12 rounded-2xl shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1"
      >
        <h2 className="text-xl sm:text-2xl font-bold">📊 Ver Reportes</h2>
        <p className="mt-2 sm:text-lg opacity-90">Consultar y exportar el historial.</p>
      </button>
    </div>
  );
}

function RegisterView() {
  const [scanStatus, setScanStatus] = useState({ message: '', type: '' });
  const scannerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(err => console.error("Failed to stop scanner", err));
      }
    };
  }, []);
  
  const startScanner = async (scanType) => {
    setScanStatus({ message: 'Iniciando cámara...', type: 'loading' });
    const { Html5Qrcode } = await import('html5-qrcode');
    const qrScanner = new Html5Qrcode('qr-reader');
    scannerRef.current = qrScanner;

    const qrboxSize = window.innerWidth < 640 ? 220 : 300;
    const config = { fps: 10, qrbox: { width: qrboxSize, height: qrboxSize } };
    
    const onScanSuccess = async (decodedText) => {
      if (!scannerRef.current || !scannerRef.current.isScanning) return;
      await scannerRef.current.stop();
      
      const personName = decodedText.trim();
      const q = query(collection(db, "personas"), where("name", "==", personName));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setScanStatus({ message: `🚫 Error: "${personName}" no se encontró.`, type: 'error' });
        return;
      }

      const personDoc = querySnapshot.docs[0];
      const personData = personDoc.data();

      try {
        // --- INICIO DE LA CORRECCIÓN ---
        // Forzamos el uso de la fecha local en lugar de UTC
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const localDate = `${year}-${month}-${day}`;
        // --- FIN DE LA CORRECCIÓN ---

        await addDoc(collection(db, "asistencias"), {
          personId: personData.id,
          personName: personData.name,
          personType: personData.type,
          type: scanType,
          timestamp: new Date(),
          date: localDate // Usamos la fecha local corregida
        });
        setScanStatus({ message: `✅ ¡Listo! ${personData.name} registró su ${scanType}.`, type: 'success' });
      } catch (error) {
        setScanStatus({ message: '❌ Error al guardar el registro.', type: 'error' });
      }
    };

    scannerRef.current.start({ facingMode: "environment" }, config, onScanSuccess)
      .then(() => setScanStatus({ message: `Acerque el código QR para escanear ${scanType}...`, type: 'loading' }))
      .catch(err => setScanStatus({ message: '⚠️ Error al iniciar la cámara. Revisa los permisos.', type: 'error' }));
  };

  const getStatusColor = () => {
    if (scanStatus.type === 'success') return 'bg-green-100 text-green-800 border-l-4 border-green-500';
    if (scanStatus.type === 'error') return 'bg-red-100 text-red-800 border-l-4 border-red-500';
    if (scanStatus.type === 'loading') return 'bg-blue-100 text-blue-800 border-l-4 border-blue-500';
    return '';
  };
  
  return (
    <div className="bg-white/70 backdrop-blur-xl p-6 rounded-2xl shadow-lg animate-fadeIn">
      <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4 text-gray-700">Registro de Asistencia</h2>
      <div id="qr-reader" className="mb-4 w-full max-w-sm md:max-w-md mx-auto border-2 rounded-lg bg-gray-50"></div>
      {scanStatus.message && <p className={`text-center font-medium p-3 rounded-lg my-4 ${getStatusColor()}`}>{scanStatus.message}</p>}
      <div className="flex flex-col sm:flex-row justify-center gap-4 mt-4">
        <button onClick={() => startScanner('entrada')} className="bg-gradient-to-r from-emerald-400 to-cyan-500 text-white px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-all transform hover:scale-105 text-lg">☀️ Registrar Entrada</button>
        <button onClick={() => startScanner('salida')} className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-all transform hover:scale-105 text-lg">🌙 Registrar Salida</button>
      </div>
    </div>
  );
}

function ReportsView() {
    // Corregimos también la fecha inicial para que sea la local
    const getLocalDate = () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    const [date, setDate] = useState(getLocalDate());
    const [reportData, setReportData] = useState({ students: [], teachers: [] });

    useEffect(() => {
        const fetchReport = async () => {
            const q = query(collection(db, "asistencias"), where("date", "==", date));
            const querySnapshot = await getDocs(q);
            const attendanceByPerson = {};

            querySnapshot.forEach((doc) => {
                const record = doc.data();
                if (!attendanceByPerson[record.personId]) {
                    attendanceByPerson[record.personId] = { name: record.personName, type: record.personType, entries: [], exits: [] };
                }
                if (record.type === 'entrada') attendanceByPerson[record.personId].entries.push(record.timestamp.toDate());
                else attendanceByPerson[record.personId].exits.push(record.timestamp.toDate());
            });

            const students = [], teachers = [];
            Object.values(attendanceByPerson).forEach(person => {
                person.entries.sort((a, b) => a - b);
                person.exits.sort((a, b) => a - b);
                const entryTime = person.entries.length > 0 ? person.entries[0].toLocaleTimeString('es-MX') : '---';
                const exitTime = person.exits.length > 0 ? person.exits[person.exits.length - 1].toLocaleTimeString('es-MX') : '---';
                const row = { name: person.name, entryTime, exitTime };
                
                if (person.type === 'student') students.push(row);
                else teachers.push(row);
            });
            setReportData({ students, teachers });
        };
        fetchReport();
    }, [date]);

    const exportPDF = async () => {
        const { jsPDF } = await import('jspdf');
        const { default: autoTable } = await import('jspdf-autotable');
        const doc = new jsPDF();
        
        doc.text(`Reporte de Asistencia - CEI Mundo de los niños`, 14, 16);
        doc.text(`Fecha: ${date}`, 14, 24);
        
        autoTable(doc, {
            head: [['Alumnos', 'Entrada', 'Salida']],
            body: reportData.students.map(s => [s.name, s.entryTime, s.exitTime]),
            startY: 30,
            theme: 'grid',
            headStyles: { fillColor: [76, 175, 80] } // Green
        });
        
        autoTable(doc, {
            head: [['Maestras', 'Entrada', 'Salida']],
            body: reportData.teachers.map(t => [t.name, t.entryTime, t.exitTime]),
            startY: doc.lastAutoTable.finalY + 10,
            theme: 'grid',
            headStyles: { fillColor: [33, 150, 243] } // Blue
        });
        
        doc.save(`Reporte_Asistencia_${date}.pdf`);
    };

    return (
        <div className="bg-white/70 backdrop-blur-xl p-6 rounded-2xl shadow-lg animate-fadeIn">
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6 text-gray-700">Reporte de Asistencia</h2>
            <div className="flex flex-col md:flex-row gap-4 mb-6 items-center justify-center">
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="border-gray-300 rounded-lg shadow-sm p-3 text-lg focus:ring-purple-500 focus:border-purple-500" />
                <button onClick={exportPDF} className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-all transform hover:scale-105 text-lg">📄 Exportar a PDF</button>
            </div>
            <ReportTable title="Alumnos" data={reportData.students} />
            <ReportTable title="Maestras" data={reportData.teachers} />
        </div>
    );
}

function ReportTable({ title, data }) {
    return (
        <>
            <h3 className="text-xl sm:text-2xl font-semibold mt-6 mb-3 text-gray-600">{title}</h3>
            <div className="overflow-x-auto rounded-lg shadow">
                <table className="min-w-full bg-white text-sm sm:text-base">
                    <thead className="bg-gray-200">
                        <tr><th className="py-3 px-4 text-left font-semibold text-gray-600">Nombre</th><th className="py-3 px-4 text-left font-semibold text-gray-600">Hora de Entrada</th><th className="py-3 px-4 text-left font-semibold text-gray-600">Hora de Salida</th></tr>
                    </thead>
                    <tbody>
                        {data.length > 0 ? data.map((item, index) => (
                            <tr key={index} className="border-b border-gray-200 hover:bg-gray-50"><td className="py-3 px-4">{item.name}</td><td className="py-3 px-4">{item.entryTime}</td><td className="py-3 px-4">{item.exitTime}</td></tr>
                        )) : (
                            <tr><td colSpan="3" className="text-center p-4 text-gray-500">No hay registros para esta fecha.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </>
    );
}

function Footer() {
  return (
    <footer className="text-center text-gray-500 mt-8 py-4">
      <p>Hecho con ❤️ para CEI Mundo de los niños</p>
    </footer>
  );
}