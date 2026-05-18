import { useEffect, useState } from 'react';
import { User, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { collection, onSnapshot, query, setDoc, doc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { LogIn, LogOut, Search, Plus, Phone, Clock, DollarSign, Edit, Trash2, Check, Star, TrendingUp, Instagram, BarChart3, Users, ListTodo, Circle, CheckCircle2 } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';

import { auth, db } from './lib/firebase';
import { handleFirestoreError, OperationType } from './lib/firebase-utils';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ----- Types -----
interface Customer {
  id: string;
  name: string;
  phone?: string;
  lastContactDate: number;
  price: number;
  isWashing: boolean;
  isLoyal: boolean;
  createdAt: number;
  updatedAt: number;
}

interface Task {
  id: string;
  title: string;
  isCompleted: boolean;
  createdAt: number;
  updatedAt: number;
}

// ----- Components -----
function MetricsDashboard({ customers }: { customers: Customer[] }) {
  // Aggregate data by date
  // Sort customers by creation date ascending for charts
  const sortedCustomers = [...customers].sort((a, b) => a.createdAt - b.createdAt);
  
  const dailyStats = sortedCustomers.reduce((acc, curr) => {
    const date = format(new Date(curr.createdAt), 'MMM dd', { locale: es });
    if (!acc[date]) {
      acc[date] = { date, revenue: 0, newCustomers: 0 };
    }
    acc[date].revenue += curr.price;
    acc[date].newCustomers += 1;
    return acc;
  }, {} as Record<string, { date: string; revenue: number; newCustomers: number }>);

  const chartData = Object.values(dailyStats);

  const totalRevenue = customers.reduce((sum, c) => sum + c.price, 0);

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-10">
      {/* Instagram Stats Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Instagram className="w-6 h-6 text-pink-500" />
          <h2 className="text-xl font-bold text-slate-800">Métricas de Instagram</h2>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center text-slate-500">
           <Instagram className="w-12 h-12 text-slate-200 mx-auto mb-3" />
           <p className="font-medium text-slate-700 mb-1">Conexión con Instagram pendiente</p>
           <p className="text-sm max-w-md mx-auto">Para ver tus métricas reales de Instagram (seguidores, alcance, interacciones), necesitamos integrar la API de Instagram Graph o puedes ingresar tus métricas manualmente. ¿Qué prefieres?</p>
           <Button variant="outline" className="mt-6 mx-auto">
             Configurar Instagram (Próximamente)
           </Button>
        </div>
      </section>

      {/* Business Stats Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <BarChart3 className="w-6 h-6 text-cyan-600" />
          <h2 className="text-xl font-bold text-slate-800">Negocio y Clientes</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 text-slate-500 mb-2">
              <DollarSign className="w-4 h-4" />
              <p className="text-xs font-semibold uppercase tracking-wider">Ingresos Totales</p>
            </div>
            <p className="text-3xl font-bold text-slate-800">${totalRevenue.toFixed(2)}</p>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 text-slate-500 mb-2">
              <Users className="w-4 h-4" />
              <p className="text-xs font-semibold uppercase tracking-wider">Total Clientes</p>
            </div>
            <p className="text-3xl font-bold text-slate-800">{customers.length}</p>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 text-slate-500 mb-2">
              <TrendingUp className="w-4 h-4" />
              <p className="text-xs font-semibold uppercase tracking-wider">Ticket Promedio</p>
            </div>
            <p className="text-3xl font-bold text-slate-800">
              ${customers.length > 0 ? (totalRevenue / customers.length).toFixed(2) : '0.00'}
            </p>
          </div>
        </div>

        {chartData.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-6">Ingresos ($) a lo largo del tiempo</h3>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} dx={-10} tickFormatter={(val) => `$${val}`} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: number) => [`$${value.toFixed(2)}`, 'Ingresos']}
                    />
                    <Line type="monotone" dataKey="revenue" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-6">Nuevos Clientes a lo largo del tiempo</h3>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} allowDecimals={false} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: number) => [value, 'Clientes']}
                    />
                    <Bar dataKey="newCustomers" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <BarChart3 className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="font-medium text-slate-500">No hay suficientes datos para mostrar gráficos.</p>
          </div>
        )}
      </section>
    </div>
  );
}

function TasksDashboard({ tasks }: { tasks: Task[] }) {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [loadingTask, setLoadingTask] = useState(false);

  // Separate tasks into incomplete and complete, sort by creation/update
  const incompleteTasks = tasks.filter(t => !t.isCompleted).sort((a, b) => b.createdAt - a.createdAt);
  const completedTasks = tasks.filter(t => t.isCompleted).sort((a, b) => b.updatedAt - a.updatedAt);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    
    setLoadingTask(true);
    try {
      const now = Date.now();
      const newId = doc(collection(db, 'tasks')).id;
      await setDoc(doc(db, 'tasks', newId), {
        title: newTaskTitle.trim(),
        isCompleted: false,
        createdAt: now,
        updatedAt: now,
      }).catch(err => handleFirestoreError(err, OperationType.CREATE, `tasks/${newId}`));
      setNewTaskTitle('');
    } catch (err) {
      console.error(err);
      alert('Error al crear tarea.');
    } finally {
      setLoadingTask(false);
    }
  };

  const handleToggleTask = async (task: Task) => {
    try {
      await updateDoc(doc(db, 'tasks', task.id), {
        isCompleted: !task.isCompleted,
        updatedAt: Date.now(),
      }).catch(err => handleFirestoreError(err, OperationType.UPDATE, `tasks/${task.id}`));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (confirm('¿Eliminar esta tarea?')) {
      try {
        await deleteDoc(doc(db, 'tasks', id)).catch(err => handleFirestoreError(err, OperationType.DELETE, `tasks/${id}`));
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col items-center">
      <div className="w-full max-w-2xl space-y-6">
        
        {/* Header & Add Form */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <ListTodo className="w-6 h-6 text-indigo-500" />
            <h2 className="text-xl font-bold text-slate-800">Cosas por hacer</h2>
          </div>
          
          <form onSubmit={handleAddTask} className="flex gap-3">
            <input 
              type="text" 
              placeholder="Ej. Comprar más jabón, Llamar al proveedor..." 
              className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-shadow text-sm text-slate-800"
              value={newTaskTitle}
              onChange={e => setNewTaskTitle(e.target.value)}
              disabled={loadingTask}
            />
            <Button type="submit" disabled={loadingTask || !newTaskTitle.trim()} className="shrink-0">
              <Plus className="w-5 h-5 md:mr-2" />
              <span className="hidden md:inline">Agregar</span>
            </Button>
          </form>
        </section>

        {/* Task List */}
        <div className="space-y-6">
          {incompleteTasks.length === 0 && completedTasks.length === 0 ? (
            <div className="text-center p-10 bg-slate-50 border border-slate-200 rounded-xl border-dashed">
              <p className="text-slate-500 font-medium">No hay tareas pendientes.</p>
              <p className="text-slate-400 text-sm">Agrega una nueva tarea arriba.</p>
            </div>
          ) : (
             <>
               {/* Incomplete */}
               {incompleteTasks.length > 0 && (
                 <div className="space-y-2">
                   <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 mb-3">Pendientes ({incompleteTasks.length})</h3>
                   <div className="space-y-2">
                     {incompleteTasks.map(task => (
                       <div key={task.id} className="group bg-white rounded-xl border border-slate-200 p-3 flex items-center gap-3 shadow-sm hover:border-cyan-200 transition-colors">
                         <button onClick={() => handleToggleTask(task)} className="text-slate-300 hover:text-cyan-500 transition-colors shrink-0">
                           <Circle className="w-6 h-6" />
                         </button>
                         <p className="text-slate-800 font-medium text-sm flex-1">{task.title}</p>
                         <button onClick={() => handleDeleteTask(task.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-2 shrink-0">
                           <Trash2 className="w-4 h-4" />
                         </button>
                       </div>
                     ))}
                   </div>
                 </div>
               )}
               
               {/* Completed */}
               {completedTasks.length > 0 && (
                 <div className="space-y-2">
                   <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 mb-3 mt-8">Completadas ({completedTasks.length})</h3>
                   <div className="space-y-2">
                     {completedTasks.map(task => (
                       <div key={task.id} className="group bg-slate-50 rounded-xl border border-slate-100 p-3 flex items-center gap-3">
                         <button onClick={() => handleToggleTask(task)} className="text-emerald-500 shrink-0">
                           <CheckCircle2 className="w-6 h-6" />
                         </button>
                         <p className="text-slate-400 font-medium text-sm flex-1 line-through">{task.title}</p>
                         <button onClick={() => handleDeleteTask(task.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-2 shrink-0">
                           <Trash2 className="w-4 h-4" />
                         </button>
                       </div>
                     ))}
                   </div>
                 </div>
               )}
             </>
          )}
        </div>
      </div>
    </div>
  );
}

function Button({ className, variant = 'primary', size = 'default', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger', size?: 'default' | 'sm' | 'icon' }) {
  return (
    <button 
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
        {
          'bg-slate-900 text-white hover:bg-slate-800 shadow-sm': variant === 'primary',
          'bg-slate-100 text-slate-900 hover:bg-slate-200': variant === 'secondary',
          'border border-slate-200 bg-white hover:bg-slate-50 text-slate-800': variant === 'outline',
          'hover:bg-slate-100 text-slate-700': variant === 'ghost',
          'bg-red-500 text-white hover:bg-red-600': variant === 'danger',
          'h-10 px-5 py-2': size === 'default',
          'h-9 rounded-md px-3': size === 'sm',
          'h-10 w-10': size === 'icon',
        },
        className
      )}
      {...props}
    />
  );
}

// ----- Main App -----
export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loadingAction, setLoadingAction] = useState(false);
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTab, setActiveTab] = useState<'washing' | 'loyal' | 'metrics' | 'tasks'>('washing');
  
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    price: 0,
    isWashing: true,
    isLoyal: false,
  });

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      setUser(u);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) {
      setCustomers([]);
      return;
    }

    const q = query(collection(db, 'customers'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const custData: Customer[] = [];
      snapshot.forEach((doc) => {
        custData.push({ id: doc.id, ...doc.data() } as Customer);
      });
      // Sort by recently updated first, or recently contacted
      custData.sort((a, b) => b.lastContactDate - a.lastContactDate);
      setCustomers(custData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'customers');
    });

    const tasksQ = query(collection(db, 'tasks'));
    const unsubscribeTasks = onSnapshot(tasksQ, (snapshot) => {
      const taskData: Task[] = [];
      snapshot.forEach((doc) => {
        taskData.push({ id: doc.id, ...doc.data() } as Task);
      });
      setTasks(taskData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'tasks');
    });

    return () => {
      unsubscribe();
      unsubscribeTasks();
    };
  }, [user]);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error(error);
    }
  };

  const openForm = (customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData({
        name: customer.name,
        phone: customer.phone || '',
        price: customer.price,
        isWashing: customer.isWashing,
        isLoyal: customer.isLoyal,
      });
    } else {
      setEditingCustomer(null);
      setFormData({
        name: '',
        phone: '',
        price: 0,
        isWashing: true,
        isLoyal: false,
      });
    }
    setIsModalOpen(true);
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingAction(true);
    
    try {
      const now = Date.now();
      const customerData = {
        name: formData.name,
        phone: formData.phone || '',
        price: Number(formData.price),
        isWashing: formData.isWashing,
        isLoyal: formData.isLoyal,
        lastContactDate: editingCustomer ? editingCustomer.lastContactDate : now,
        updatedAt: now,
      };

      if (editingCustomer) {
        await updateDoc(doc(db, 'customers', editingCustomer.id), customerData).catch(e => handleFirestoreError(e, OperationType.UPDATE, `customers/${editingCustomer.id}`));
      } else {
        const newId = doc(collection(db, 'customers')).id;
        await setDoc(doc(db, 'customers', newId), {
          ...customerData,
          createdAt: now,
        }).catch(e => handleFirestoreError(e, OperationType.CREATE, `customers/${newId}`));
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('Error guardando cliente.');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleToggleWash = async (customer: Customer) => {
    try {
      await updateDoc(doc(db, 'customers', customer.id), {
        isWashing: !customer.isWashing,
        updatedAt: Date.now(),
      }).catch(e => handleFirestoreError(e, OperationType.UPDATE, `customers/${customer.id}`));
    } catch (err) {
      console.error(err);
    }
  };
  
  const handleToggleLoyal = async (customer: Customer) => {
    try {
      await updateDoc(doc(db, 'customers', customer.id), {
        isLoyal: !customer.isLoyal,
        updatedAt: Date.now(),
      }).catch(e => handleFirestoreError(e, OperationType.UPDATE, `customers/${customer.id}`));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este cliente?')) {
      try {
        await deleteDoc(doc(db, 'customers', id)).catch(e => handleFirestoreError(e, OperationType.DELETE, `customers/${id}`));
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleUpdateContact = async (customer: Customer) => {
    try {
      await updateDoc(doc(db, 'customers', customer.id), {
        lastContactDate: Date.now(),
        updatedAt: Date.now()
      }).catch(e => handleFirestoreError(e, OperationType.UPDATE, `customers/${customer.id}`));
    } catch (err) {
      console.error(err);
    }
  };

  // derived lists
  const filteredCustomers = customers.filter(c => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = c.name.toLowerCase().includes(searchLower) || (c.phone && c.phone.includes(searchLower));
    
    if (!matchesSearch) return false;
    
    if (activeTab === 'washing') return c.isWashing;
    if (activeTab === 'loyal') return c.isLoyal;
    return true;
  });

  // Stats calculations
  const totalInProcess = customers.filter(c => c.isWashing).length;
  const inactiveAlerts = customers.filter(c => (Date.now() - c.lastContactDate) > 15 * 24 * 60 * 60 * 1000).length;
  const loyaltyRate = customers.length > 0 ? Math.round((customers.filter(c => c.isLoyal).length / customers.length) * 100) : 0;
  const todayRevenue = customers.filter(c => new Date(c.createdAt).toDateString() === new Date().toDateString()).reduce((sum, c) => sum + c.price, 0);

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-slate-200">
          <div className="w-16 h-16 bg-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg rotate-3">
            <Check className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight mb-2">Clean Sneakers CRM</h1>
          <p className="text-slate-500 mb-8">Inicia sesión para gestionar clientes y pedidos</p>
          <Button onClick={handleLogin} className="w-full h-12 text-lg gap-3 bg-slate-900 border border-slate-800">
            <LogIn className="w-5 h-5" />
            Ingresar con Google
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-slate-100 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 flex flex-col text-white shadow-2xl shrink-0 hidden md:flex">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-cyan-500 rounded-lg flex items-center justify-center shadow-lg">
              <Check className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Clean Sneakers</h1>
          </div>
        </div>
        <nav className="flex-1 py-4 overflow-y-auto">
          <div className="px-4 mb-2">
            <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">Operaciones</span>
          </div>
          
          <button 
            onClick={() => setActiveTab('washing')}
            className={cn("w-full flex items-center gap-3 px-6 py-3 transition-colors", 
              activeTab === 'washing' ? 'bg-cyan-600/10 text-cyan-400 border-r-4 border-cyan-500' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            )}
          >
            <span className="font-medium">Clientes Actuales</span>
          </button>
          
          <button 
             onClick={() => setActiveTab('loyal')}
             className={cn("w-full flex items-center gap-3 px-6 py-3 transition-colors", 
               activeTab === 'loyal' ? 'bg-cyan-600/10 text-cyan-400 border-r-4 border-cyan-500' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
             )}
          >
            <span className="font-medium">Fidelizados</span>
          </button>
          
          <div className="px-4 mt-8 mb-2">
            <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">Estadísticas</span>
          </div>
          <button 
             onClick={() => setActiveTab('metrics')}
             className={cn("w-full flex items-center gap-3 px-6 py-3 transition-colors", 
               activeTab === 'metrics' ? 'bg-cyan-600/10 text-cyan-400 border-r-4 border-cyan-500' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
             )}
          >
            <span className="font-medium">Métricas</span>
          </button>

          <div className="px-4 mt-8 mb-2">
            <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">Gestión Interna</span>
          </div>
          <button 
             onClick={() => setActiveTab('tasks')}
             className={cn("w-full flex items-center gap-3 px-6 py-3 transition-colors", 
               activeTab === 'tasks' ? 'bg-cyan-600/10 text-cyan-400 border-r-4 border-cyan-500' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
             )}
          >
            <span className="font-medium">Tareas (To-Do)</span>
          </button>

          <div className="px-4 mt-8 mb-2">
            <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">Equipo</span>
          </div>
          <div className="px-6 flex items-center gap-2">
            <div className="flex -space-x-2">
              <div className="w-8 h-8 rounded-full border-2 border-slate-900 bg-indigo-500 flex items-center justify-center text-[10px] font-bold text-white uppercase" title={user.email || 'User'}>
                {user.email?.substring(0, 2) || 'UU'}
              </div>
            </div>
            <span className="text-xs text-slate-400">Activo ahora</span>
          </div>
        </nav>
        
        <div className="p-6 bg-slate-950 mt-auto">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-3 opacity-70">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="truncate max-w-[120px]">{user.email}</span>
            </div>
            <button onClick={() => signOut(auth)} className="text-slate-500 hover:text-white transition-colors" title="Cerrar sesión">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <header className="h-auto md:h-20 bg-white border-b border-slate-200 px-4 md:px-8 py-4 md:py-0 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Panel de Lavado</h2>
            <p className="text-sm text-slate-500">Gestión de pedidos en curso</p>
          </div>
          
          {/* Mobile Tabs */}
          <div className="flex md:hidden bg-slate-100 rounded-lg p-1">
            <button 
              onClick={() => setActiveTab('washing')}
              className={cn("flex-1 text-sm font-semibold rounded-md py-1.5", activeTab === 'washing' ? 'bg-white shadow text-slate-800' : 'text-slate-500')}
            >
              Actuales
            </button>
            <button 
              onClick={() => setActiveTab('loyal')}
              className={cn("flex-1 text-sm font-semibold rounded-md py-1.5", activeTab === 'loyal' ? 'bg-white shadow text-slate-800' : 'text-slate-500')}
            >
              Fidelizados
            </button>
            <button 
              onClick={() => setActiveTab('metrics')}
              className={cn("flex-1 text-sm font-semibold rounded-md py-1.5", activeTab === 'metrics' ? 'bg-white shadow text-slate-800' : 'text-slate-500')}
            >
              Métricas
            </button>
            <button 
              onClick={() => setActiveTab('tasks')}
              className={cn("flex-1 text-sm font-semibold rounded-md py-1.5", activeTab === 'tasks' ? 'bg-white shadow text-slate-800' : 'text-slate-500')}
            >
              Tareas
            </button>
          </div>
          
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-lg border border-slate-200">
              <span className="text-sm font-semibold text-slate-600">Hoy: ${todayRevenue.toFixed(2)}</span>
            </div>
            <Button onClick={() => openForm()} className="shrink-0">
              + Nueva Orden
            </Button>
          </div>
        </header>

        {activeTab === 'metrics' ? (
          <MetricsDashboard customers={customers} />
        ) : activeTab === 'tasks' ? (
          <TasksDashboard tasks={tasks} />
        ) : (
          <div className="flex-1 overflow-y-auto flex flex-col">
            {/* Stats Grid */}
            <section className="p-4 md:p-8 grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 shrink-0">
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">En Proceso</p>
              <p className="text-3xl font-bold text-slate-800">{totalInProcess} <span className="text-sm font-normal text-slate-400">Pares</span></p>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Inactivos {'>'} 15 días</p>
              <p className={cn("text-3xl font-bold", inactiveAlerts > 0 ? "text-red-500" : "text-slate-800")}>{inactiveAlerts.toString().padStart(2, '0')} <span className="text-sm font-normal text-slate-400">Alertas</span></p>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Tasa Fidelidad</p>
              <p className="text-3xl font-bold text-emerald-500">{loyaltyRate}%</p>
            </div>
          </section>

          {/* Table Area */}
          <section className="px-4 md:px-8 pb-8 flex-1 flex flex-col min-h-0">
            <div className="relative mb-4 shrink-0">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Buscar cliente por nombre o teléfono..." 
                className="w-full h-10 pl-10 pr-4 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all text-slate-800 placeholder:text-slate-400"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col flex-1 min-h-[300px] overflow-hidden">
              <div className="hidden lg:grid grid-cols-6 bg-slate-50 py-3 px-6 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-widest shrink-0">
                <div className="col-span-2">Cliente / Teléfono</div>
                <div>Fecha Contacto</div>
                <div>Precio</div>
                <div className="text-center">Estado</div>
                <div className="text-right">Acciones</div>
              </div>
              
              <div className="flex-1 overflow-y-auto">
                {filteredCustomers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-12 h-full text-center">
                    <p className="text-slate-500 font-semibold mb-1">No hay clientes</p>
                    <p className="text-slate-400 text-sm">Crea un registro de orden para visualizar la tabla.</p>
                  </div>
                ) : (
                  filteredCustomers.map((customer) => (
                    <div key={customer.id} className={cn("flex flex-col lg:grid lg:grid-cols-6 px-4 lg:px-6 py-4 border-b border-slate-100 items-start lg:items-center gap-4 lg:gap-0 transition-colors hover:bg-slate-50", customer.isLoyal ? "bg-emerald-50/20" : "")}>
                      <div className="col-span-2 w-full flex items-center justify-between lg:block">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-slate-800">{customer.name}</p>
                          {customer.isLoyal && (
                            <span className="text-[8px] bg-emerald-100 text-emerald-700 font-black px-1.5 py-0.5 rounded uppercase tracking-tighter">
                              Fidelizado
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 font-mono mt-0.5 flex items-center gap-1">
                           <Phone className="w-3 h-3"/> {customer.phone || 'Sin número'}
                        </p>
                      </div>

                      <div className="text-sm text-slate-600 flex items-center gap-2 lg:block">
                        <span className="lg:hidden text-xs font-bold uppercase text-slate-400">Contacto: </span>
                        {new Date(customer.lastContactDate).toLocaleDateString()}
                      </div>

                      <div className="text-sm font-bold text-slate-800 flex items-center gap-2 lg:block">
                        <span className="lg:hidden text-xs font-bold uppercase text-slate-400">Precio: </span>
                        ${customer.price.toFixed(2)}
                      </div>

                      <div className="flex items-center lg:justify-center gap-2">
                        {customer.isWashing ? (
                           <div className="flex items-center gap-1.5">
                             <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                             <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-tighter">En Lavado</span>
                           </div>
                        ) : (
                           <div className="flex items-center gap-1.5">
                             <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                             <span className="bg-slate-200 text-slate-600 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-tighter">Entregado</span>
                           </div>
                        )}
                        <span className="text-xs text-slate-500 hidden lg:inline">
                           ({formatDistanceToNow(customer.lastContactDate, { locale: es }).replace('alrededor de', '')})
                        </span>
                      </div>

                      <div className="w-full lg:w-auto flex items-center justify-between lg:justify-end gap-2 border-t border-slate-100 pt-3 lg:border-none lg:pt-0">
                        <button 
                          onClick={() => handleUpdateContact(customer)}
                          className="text-[10px] font-bold bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 py-1.5 px-2.5 rounded uppercase tracking-wider transition-colors"
                        >
                          Tocar Hoy
                        </button>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleToggleWash(customer)} title={customer.isWashing ? "Marcar entregado" : "Poner a lavar"}>
                            <Check className={cn("w-4 h-4", customer.isWashing ? "text-cyan-600" : "text-slate-400")} />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleToggleLoyal(customer)} title="Fidelizado">
                            <Star className={cn("w-4 h-4", customer.isLoyal ? "fill-amber-400 text-amber-400" : "text-slate-300")} />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openForm(customer)} title="Editar">
                            <Edit className="w-4 h-4 text-slate-400" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-red-600" onClick={() => handleDelete(customer.id)} title="Eliminar">
                            <Trash2 className="w-4 h-4 text-slate-400" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              {filteredCustomers.length > 0 && (
                <div className="bg-slate-50 border-t border-slate-200 p-4 flex items-center justify-between text-xs shrink-0">
                  <p className="text-slate-500 italic font-medium hidden sm:block">Actualizado en tiempo real • {customers.length} registros</p>
                </div>
              )}
            </div>
          </section>
        </div>
        )}
      </main>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800 tracking-tight">
                {editingCustomer ? 'Editar Orden' : 'Nueva Orden'}
              </h2>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                &times;
              </button>
            </div>
            
            <form onSubmit={handleSaveCustomer} className="p-6 bg-white">
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nombre del Cliente</label>
                  <input 
                    required 
                    type="text" 
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-shadow text-sm text-slate-800"
                    placeholder="Ej. Carlos Ruiz"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Teléfono</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-shadow text-sm font-mono text-slate-800"
                      placeholder="11 5555 4444"
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Precio ($)</label>
                    <input 
                      required 
                      type="number" 
                      min="0"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-shadow text-sm font-mono text-slate-800"
                      value={formData.price}
                      onChange={e => setFormData({...formData, price: Number(e.target.value)})}
                    />
                  </div>
                </div>

                <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="flex items-start gap-3 p-4 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                    <input 
                      type="checkbox" 
                      className="mt-0.5 w-4 h-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 cursor-pointer"
                      checked={formData.isWashing}
                      onChange={e => setFormData({...formData, isWashing: e.target.checked})}
                    />
                    <div className="flex-1">
                      <div className="text-sm font-bold text-slate-800 leading-none mb-1">En Lavado</div>
                      <div className="text-xs text-slate-500 leading-tight">Posesión actual de las zapatillas.</div>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-4 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                    <input 
                      type="checkbox" 
                      className="mt-0.5 w-4 h-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 cursor-pointer"
                      checked={formData.isLoyal}
                      onChange={e => setFormData({...formData, isLoyal: e.target.checked})}
                    />
                    <div className="flex-1">
                      <div className="text-sm font-bold text-slate-800 leading-none mb-1 flex items-center gap-1">Fiel <Star className="w-3 h-3 text-amber-500 fill-amber-500"/></div>
                      <div className="text-xs text-slate-500 leading-tight">Cliente recurrente del local.</div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-slate-100">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loadingAction} className="min-w-[120px]">
                  {loadingAction ? 'Guardando...' : 'Guardar'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
