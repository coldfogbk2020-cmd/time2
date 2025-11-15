
import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInAnonymously, Auth } from 'firebase/auth';
import { 
    getFirestore, 
    collection, 
    onSnapshot, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    doc, 
    getDocs, 
    setDoc, 
    Timestamp, 
    Firestore,
    getDoc
} from 'firebase/firestore';

import { Users, Briefcase, Moon, Sun, X, Info, RotateCw } from 'lucide-react';

import KioskView from './components/KioskView';
import ClockTerminal from './components/ClockTerminal';
import AdminView from './components/AdminView';
import AdminPasswordPrompt from './components/AdminPasswordPrompt';
import Spinner from './components/ui/Spinner';
import DemoInfoModal from './components/DemoInfoModal';

import { Employee, AttendanceRecord, FirestoreAttendanceRecord, Theme, Schedule } from './types';


const DemoToast = ({ message, show, onDismiss }: { message: string; show: boolean; onDismiss: () => void; }) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onDismiss, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onDismiss]);

  if (!show) return null;

  return (
    <div className={`fixed bottom-5 right-5 z-50 transform rounded-lg bg-yellow-500 px-4 py-3 text-yellow-900 shadow-xl transition-all duration-300 ${show ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
      <div className="flex items-center">
        <p className="font-medium">{message}</p>
        <button onClick={onDismiss} className="ml-4 -mr-1 flex h-6 w-6 items-center justify-center rounded-full text-yellow-800 hover:bg-yellow-600/50">
          <X size={18} />
        </button>
      </div>
    </div>
  );
};

const toLocalDateISOString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};


export default function App() {
  const [auth, setAuth] = useState<Auth | null>(null);
  const [db, setDb] = useState<Firestore | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  const [config, setConfig] = useState<any | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  const [showDemoToast, setShowDemoToast] = useState(false);
  const [isDemoInfoModalOpen, setIsDemoInfoModalOpen] = useState(false);


  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [schedules, setSchedules] = useState<Schedule>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ code: string; message: string } | null>(null);

  const [view, setView] = useState<'kiosk' | 'admin'>('kiosk');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isPasswordPromptOpen, setIsPasswordPromptOpen] = useState(false);
  const [isAdminAuthed, setIsAdminAuthed] = useState(false);
  
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('theme') as Theme) || 'light');

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };
  
  const isAdmin = view === 'admin' && isAdminAuthed;

  // Configuration and Initialization Flow
  useEffect(() => {
    // This is hardcoded now.
    const hardcodedConfig = {
      apiKey: "AIzaSyDgHIhwE3PdnyDM91HOtorvTOnWfutJ9Y4",
      authDomain: "sklad-5cfe2.firebaseapp.com",
      projectId: "sklad-5cfe2",
      storageBucket: "sklad-5cfe2.firebasestorage.app",
      messagingSenderId: "678741965852",
      appId: "1:678741965852:web:6a1dd3deba83f7ad5ab3d9",
    };
    setConfig(hardcodedConfig);
  }, []);

  useEffect(() => {
    if (!config && !isDemoMode) return;

    if (isDemoMode) {
      // --- ENTER DEMO MODE ---
      const mockEmployees: Employee[] = [
        { id: 'demo1', name: 'Иван Петров (Демо)', rate: 350 },
        { id: 'demo2', name: 'Мария Сидорова (Демо)', rate: 400 },
        { id: 'demo3', name: 'Алексей Смирнов (Демо)', rate: 375 },
      ];
      
      const now = new Date();
      const todayKey = toLocalDateISOString(now);
      const mockSchedules: Schedule = {
        [todayKey]: ['demo1', 'demo3']
      };

      const mockAttendance: AttendanceRecord[] = [
        { 
          id: 'att-demo1', 
          employeeId: 'demo1', 
          employeeName: 'Иван Петров (Демо)', 
          clockInTime: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
          clockInPhoto: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
          clockOutTime: null,
          clockOutPhoto: null,
          status: 'clocked-in'
        },
        { 
          id: 'att-demo2', 
          employeeId: 'demo2', 
          employeeName: 'Мария Сидорова (Демо)', 
          clockInTime: new Date(now.getTime() - 9 * 60 * 60 * 1000), // 9 hours ago
          clockInPhoto: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
          clockOutTime: new Date(now.getTime() - 1 * 60 * 60 * 1000), // 1 hour ago
          clockOutPhoto: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
          status: 'clocked-out'
        }
      ];

      setEmployees(mockEmployees);
      setAttendance(mockAttendance);
      setSchedules(mockSchedules);
      setLoading(false);
      setIsAuthReady(true);
      return;
    }

    if (config) {
        try {
            const app = initializeApp(config);
            const authInstance = getAuth(app);
            const dbInstance = getFirestore(app);
            setAuth(authInstance);
            setDb(dbInstance);

            const unsubscribe = onAuthStateChanged(authInstance, async (user) => {
                if (user) {
                    setUserId(user.uid);
                    setIsAuthReady(true);
                } else {
                    try {
                        await signInAnonymously(authInstance);
                    } catch (e) {
                        console.error('Anonymous sign-in failed:', e);
                        setError({ code: 'E002', message: 'Не удалось анонимно войти в систему. Проверьте настройки аутентификации Firebase.' });
                        setLoading(false);
                    }
                }
            });

            return () => unsubscribe();
        } catch (e) {
            console.error('Firebase initialization error:', e);
            setError({ code: 'E003', message: 'Ошибка инициализации Firebase. Проверьте правильность введенной конфигурации.' });
            setLoading(false);
        }
    }
  }, [config, isDemoMode]);
  
  const getCollectionPath = (collectionName: string) => {
    const appId = config?.projectId || 'default-time-tracker';
    return `artifacts/${appId}/public/data/${collectionName}`;
  };
  
  useEffect(() => {
    if (isDemoMode || !isAuthReady || !db) {
      return;
    }
    
    setLoading(true);
    const employeesPath = getCollectionPath('employees');
    const attendancePath = getCollectionPath('attendance');
    const schedulesPath = getCollectionPath('schedules');
    const employeesCollectionRef = collection(db, employeesPath);

    const seedEmployees = async () => {
      const currentEmployees = await getDocs(employeesCollectionRef);
      if (currentEmployees.empty) {
        const dummyEmployees = [
          { name: 'Иван Петров (Тест)', rate: 350 },
          { name: 'Мария Сидорова (Тест)', rate: 400 },
          { name: 'Алексей Смирнов (Тест)', rate: 375 },
        ];
        await Promise.all(
          dummyEmployees.map((emp) => addDoc(employeesCollectionRef, emp))
        );
      }
    };

    const unsubEmployees = onSnapshot(employeesCollectionRef, (snapshot) => {
      const empList: Employee[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name,
        rate: doc.data().rate,
      }));
      setEmployees(empList);
      if (empList.length === 0) {
        seedEmployees().catch(console.error);
      }
      setLoading(false);
    }, (err) => {
      console.error('Error fetching employees:', err);
      setError({ code: 'E004', message: 'Не удалось загрузить список сотрудников.' });
      setLoading(false);
    });

    const unsubAttendance = onSnapshot(collection(db, attendancePath), (snapshot) => {
      const attList: AttendanceRecord[] = snapshot.docs.map((doc) => {
        const data = doc.data() as FirestoreAttendanceRecord;
        return {
          id: doc.id,
          ...data,
          clockInTime: data.clockInTime.toDate(),
          clockOutTime: data.clockOutTime?.toDate() || null,
        };
      });
      setAttendance(attList);
    }, (err) => {
      console.error('Error fetching attendance:', err);
      setError({ code: 'E005', message: 'Не удалось загрузить данные о посещаемости.' });
    });
    
    const unsubSchedules = onSnapshot(collection(db, schedulesPath), (snapshot) => {
        const scheduleData: Schedule = {};
        snapshot.forEach((doc) => {
            scheduleData[doc.id] = doc.data().employeeIds;
        });
        setSchedules(scheduleData);
    }, (err) => {
        console.error("Error fetching schedules:", err);
        // This is not a critical error, so we don't set the main error state
    });

    return () => {
      unsubEmployees();
      unsubAttendance();
      unsubSchedules();
    };
  }, [isAuthReady, db, isDemoMode, config]);

  useEffect(() => {
    if (!loading) return;
    const timeoutId = window.setTimeout(() => {
      if(loading) {
        setError({ code: 'E007', message: 'Не удалось загрузить приложение. Проверьте подключение к интернету и обновите страницу.' });
        setLoading(false);
      }
    }, 15000);
    return () => clearTimeout(timeoutId);
  }, [loading]);

  const displayDemoToast = () => {
    setShowDemoToast(true);
  };
  
  const handleEnterDemoMode = () => {
    setError(null);
    setIsDemoMode(true);
  };
  
  const handleResetToDemo = () => {
    setIsDemoMode(true);
    setError(null);
  };

  const handleSelectEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
  };

  const handleBackToKiosk = () => {
    setSelectedEmployee(null);
  };

  const handleClockAction = async (employee: Employee, action: 'clock-in' | 'clock-out', photoDataUrl: string) => {
    if (isDemoMode) {
      displayDemoToast();
      const now = new Date();
      if (action === 'clock-in' && !attendance.find(a => a.employeeId === employee.id && a.status === 'clocked-in')) {
        setAttendance(prev => [...prev, {
          id: `demo-att-${Date.now()}`, employeeId: employee.id, employeeName: employee.name,
          clockInTime: now, clockInPhoto: photoDataUrl, clockOutTime: null, clockOutPhoto: null, status: 'clocked-in'
        }]);
      } else if (action === 'clock-out') {
        setAttendance(prev => prev.map(att => (att.employeeId === employee.id && att.status === 'clocked-in')
          ? { ...att, status: 'clocked-out', clockOutTime: now, clockOutPhoto: photoDataUrl } : att));
      }
      return;
    }

    if (!db) return;
    const attendancePath = getCollectionPath('attendance');
    const openShift = attendance.find(
      (att) => att.employeeId === employee.id && att.status === 'clocked-in'
    );
    try {
      if (action === 'clock-in' && !openShift) {
        await addDoc(collection(db, attendancePath), {
          employeeId: employee.id, employeeName: employee.name,
          clockInTime: Timestamp.now(), clockInPhoto: photoDataUrl,
          clockOutTime: null, clockOutPhoto: null, status: 'clocked-in',
        });
      } else if (action === 'clock-out' && openShift) {
        await updateDoc(doc(db, attendancePath, openShift.id), {
          clockOutTime: Timestamp.now(), clockOutPhoto: photoDataUrl, status: 'clocked-out',
        });
      }
    } catch (e) {
      console.error('Error clocking action:', e);
      setError({ code: 'E006', message: 'Произошла ошибка. Пожалуйста, попробуйте еще раз.' });
    }
  };

  const handleAddEmployee = async (name: string, rate: string) => {
    if (isDemoMode) {
      displayDemoToast();
      if (!name || !rate || isNaN(parseFloat(rate))) { return; }
      setEmployees(prev => [...prev, { id: `demo-emp-${Date.now()}`, name, rate: parseFloat(rate) }]);
      return;
    }
    if (!db) return;
    if (!name || !rate || isNaN(parseFloat(rate))) {
      setError({ code: 'E008', message: 'Пожалуйста, введите корректное имя и ставку.' });
      return;
    }
    await addDoc(collection(db, getCollectionPath('employees')), { name, rate: parseFloat(rate) });
  };

  const handleUpdateEmployee = async (id: string, newName: string, newRate: number) => {
    if (isDemoMode) {
      displayDemoToast();
      setEmployees(prev => prev.map(emp => emp.id === id ? { ...emp, name: newName, rate: newRate } : emp));
      return;
    }
    if (!db) return;
    await updateDoc(doc(db, getCollectionPath('employees'), id), { name: newName, rate: newRate });
  };

  const handleDeleteEmployee = async (id: string) => {
    if (isDemoMode) {
      displayDemoToast();
      setEmployees(prev => prev.filter(emp => emp.id !== id));
      setAttendance(prev => prev.filter(att => att.employeeId !== id));
      return;
    }
    if (!db) return;
    await deleteDoc(doc(db, getCollectionPath('employees'), id));
  };
  
  const handleUpdateSchedule = async (date: Date, employeeIds: string[]) => {
      const dateKey = toLocalDateISOString(date);
      if (isDemoMode) {
          displayDemoToast();
          setSchedules(prev => ({ ...prev, [dateKey]: employeeIds }));
          return;
      }

      if (!db) return;
      const schedulePath = getCollectionPath('schedules');
      try {
          if (employeeIds.length > 0) {
              await setDoc(doc(db, schedulePath, dateKey), { employeeIds });
          } else {
              // If no one is scheduled, delete the document to keep the collection clean
              await deleteDoc(doc(db, schedulePath, dateKey));
          }
      } catch (e) {
          console.error('Error updating schedule:', e);
          setError({ code: 'E010', message: 'Не удалось обновить расписание.' });
      }
  };


  const handleAdminClick = () => {
    if (isDemoMode) {
      setView('admin');
      setIsAdminAuthed(true);
      return;
    }
    if (isAdminAuthed) setView('admin');
    else setIsPasswordPromptOpen(true);
  };
  
  if (error) {
    const isConfigError = ['E002', 'E003'].includes(error.code);
    const isDataLoadError = ['E004', 'E005', 'E007'].includes(error.code);

    if (isConfigError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-red-50 dark:bg-gray-900 p-4">
          <div className="w-full max-w-2xl rounded-lg bg-white dark:bg-gray-800 p-8 shadow-2xl">
            <h2 className="mb-4 text-3xl font-bold text-red-700 dark:text-red-400">Ошибка подключения</h2>
            <p className="mb-6 text-gray-700 dark:text-gray-300">
              Не удалось подключиться к базе данных Firebase с предоставленной конфигурацией.
            </p>

            <div className="mb-6 rounded-lg bg-red-100 dark:bg-red-900/50 p-4">
              <p className="font-mono text-red-800 dark:text-red-200">
                <span className="mr-2 rounded bg-red-200 px-2 py-1 dark:bg-red-800">
                  {error.code}
                </span>
                {error.message}
              </p>
            </div>

            <div className="mb-6 text-gray-700 dark:text-gray-300">
              <h4 className="mb-2 font-semibold">Возможные причины:</h4>
              <ul className="list-disc space-y-1 pl-5 text-sm">
                <li>Введенные данные конфигурации (API Key, Project ID и т.д.) неверны.</li>
                <li>Анонимный вход не включен в настройках аутентификации вашего проекта Firebase.</li>
                <li>Проблемы с сетью блокируют доступ к серверам Google.</li>
              </ul>
            </div>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <button
                onClick={() => window.location.reload()}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-lg font-semibold text-white shadow-md transition-all hover:bg-indigo-700"
              >
                Попробовать снова
              </button>
              <button
                onClick={handleEnterDemoMode}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-600 px-6 py-3 text-lg font-semibold text-white shadow-md transition-all hover:bg-gray-700"
              >
                Продолжить в Демо-режиме
              </button>
            </div>
          </div>
        </div>
      );
    }
    
    if (isDataLoadError) {
       return (
        <div className="flex min-h-screen items-center justify-center bg-red-50 dark:bg-gray-900 p-4">
          <div className="w-full max-w-2xl rounded-lg bg-white dark:bg-gray-800 p-8 shadow-2xl">
            <h2 className="mb-4 text-3xl font-bold text-red-700 dark:text-red-400">Ошибка загрузки данных</h2>
            <p className="mb-6 text-gray-700 dark:text-gray-300">
              Приложение успешно подключилось, но не смогло загрузить данные из базы данных Firestore.
            </p>

            <div className="mb-6 rounded-lg bg-red-100 dark:bg-red-900/50 p-4">
              <p className="font-mono text-red-800 dark:text-red-200">
                <span className="mr-2 rounded bg-red-200 px-2 py-1 dark:bg-red-800">
                  {error.code}
                </span>
                {error.message}
              </p>
            </div>

            <div className="mb-6 text-gray-700 dark:text-gray-300">
              <h4 className="mb-2 font-semibold">Наиболее частые причины:</h4>
              <ul className="list-disc space-y-1 pl-5 text-sm">
                <li>База данных Firestore еще не создана в вашем проекте Firebase.</li>
                <li>Неправильные правила безопасности (Security Rules) блокируют доступ.</li>
                <li>Проблемы с подключением к интернету.</li>
              </ul>
            </div>
            
            <div className="mb-6 text-gray-700 dark:text-gray-300">
              <h4 className="mb-2 font-semibold">Что делать дальше?</h4>
              <ol className="list-decimal space-y-2 pl-5 text-sm">
                <li>Зайдите в ваш проект Firebase и убедитесь, что вы создали базу данных Firestore (в режиме Production или Test).</li>
                <li>Перейдите в раздел <strong>Firestore Database &gt; Rules</strong> и вставьте следующие правила, чтобы разрешить анонимным пользователям читать и писать данные для этого приложения:
                  <pre className="mt-2 rounded-md bg-gray-100 dark:bg-gray-900 p-2 text-xs overflow-x-auto">
                    <code>
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Make sure this path matches your getCollectionPath function
    match /artifacts/{appId}/public/data/{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}`}
                    </code>
                  </pre>
                </li>
              </ol>
            </div>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <button
                onClick={() => window.location.reload()}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-lg font-semibold text-white shadow-md transition-all hover:bg-indigo-700"
              >
                <RotateCw size={18} />
                Попробовать снова
              </button>
               <button
                onClick={handleEnterDemoMode}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-600 px-6 py-3 text-lg font-semibold text-white shadow-md transition-all hover:bg-gray-700"
              >
                Продолжить в Демо-режиме
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex h-screen w-full items-center justify-center bg-red-100 dark:bg-gray-900 p-4">
        <div className="rounded-lg bg-white dark:bg-gray-800 p-8 shadow-2xl">
          <h2 className="mb-4 text-2xl font-bold text-red-700 dark:text-red-400">Критическая ошибка</h2>
          <p className="text-gray-700 dark:text-gray-300">
            <span className="mr-2 rounded bg-red-200 px-2 py-1 font-mono text-red-800 dark:bg-red-900/50 dark:text-red-200">
              {error.code}
            </span>
            {error.message}
          </p>
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            Пожалуйста, обновите страницу. Если ошибка повторяется, сообщите код ошибки для помощи.
          </p>
        </div>
      </div>
    );
  }

  if (loading || (!isDemoMode && !isAuthReady)) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-900 text-white">
        <Spinner />
        <span className="ml-3 text-lg">Загрузка и подключение к базе данных...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
      {isDemoMode && (
        <div className="flex items-center justify-center bg-yellow-400 p-2 text-center text-sm font-semibold text-yellow-900 dark:bg-yellow-600 dark:text-yellow-100">
          <span>Режим Демонстрации: Подключение к базе данных не настроено. Изменения не будут сохранены.</span>
          <button onClick={() => setIsDemoInfoModalOpen(true)} className="ml-3 flex h-6 w-6 items-center justify-center rounded-full transition-colors hover:bg-yellow-500/50 dark:hover:bg-yellow-700/50" aria-label="Подробнее о демо-режиме">
            <Info size={18} />
          </button>
        </div>
      )}
      <header className="flex items-center justify-between bg-white dark:bg-gray-800 p-4 shadow-md">
        <h1 className="text-3xl font-bold text-brand-blue dark:text-blue-400">Система Учета Времени</h1>
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => { setView('kiosk'); if (!isDemoMode) setIsAdminAuthed(false); }}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 font-semibold transition-all ${
                view === 'kiosk'
                  ? 'bg-brand-blue text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <Users size={20} />
              Склад
            </button>
            <button
              onClick={handleAdminClick}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 font-semibold transition-all ${
                isAdmin
                  ? 'bg-brand-indigo text-yellow-300'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <Briefcase size={20} />
              Админ
            </button>
          </div>
          <button
            onClick={toggleTheme}
            className="rounded-full p-2 text-gray-600 transition-colors hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
          <button
            onClick={() => window.location.reload()}
            className="rounded-full p-2 text-gray-600 transition-colors hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700"
            aria-label="Обновить страницу"
          >
            <RotateCw size={20} />
          </button>
        </div>
      </header>

      <main className="p-4 md:p-8">
        {view === 'kiosk' && !selectedEmployee && (
          <KioskView
            employees={employees}
            onSelect={handleSelectEmployee}
            attendance={attendance}
            schedules={schedules}
            onUpdateSchedule={handleUpdateSchedule}
          />
        )}
        {view === 'kiosk' && selectedEmployee && (
          <ClockTerminal
            employee={selectedEmployee}
            onBack={handleBackToKiosk}
            onClockAction={handleClockAction}
            attendance={attendance.filter(
              (a) => a.employeeId === selectedEmployee.id
            )}
          />
        )}
        {view === 'admin' && isAdmin && (
          <AdminView
            employees={employees}
            attendance={attendance}
            onAddEmployee={handleAddEmployee}
            onUpdateEmployee={handleUpdateEmployee}
            onDeleteEmployee={handleDeleteEmployee}
            db={isDemoMode ? null : db}
            settingsPath={getCollectionPath('settings')}
          />
        )}
      </main>

      {isPasswordPromptOpen && !isAdmin && db && (
        <AdminPasswordPrompt
          onClose={() => setIsPasswordPromptOpen(false)}
          onSuccess={() => {
            setIsAdminAuthed(true);
            setView('admin');
            setIsPasswordPromptOpen(false);
          }}
          db={db}
          settingsPath={getCollectionPath('settings')}
        />
      )}
      {isDemoInfoModalOpen && <DemoInfoModal onClose={() => setIsDemoInfoModalOpen(false)} onClearConfig={handleResetToDemo} />}
      <DemoToast message="Изменения не сохраняются в демо-режиме." show={showDemoToast} onDismiss={() => setShowDemoToast(false)} />
    </div>
  );
}