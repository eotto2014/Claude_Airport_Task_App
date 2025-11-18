import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, MessageSquare, X, Check, Calendar, AlertCircle, Repeat, Settings, Printer } from 'lucide-react';

const AirportTaskTracker = () => {
  const [tasks, setTasks] = useState([]);
  const [activeTab, setActiveTab] = useState('active');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showRemarksModal, setShowRemarksModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [currentTaskForRemarks, setCurrentTaskForRemarks] = useState(null);
  const [newRemark, setNewRemark] = useState('');
  const [newTeamMember, setNewTeamMember] = useState('');
  const [newEquipment, setNewEquipment] = useState('');
  
  // Filters
  const [filters, setFilters] = useState({
    category: 'all',
    priority: 'all',
    assignee: 'all',
    status: 'all',
    equipment: 'all',
    dueDate: 'all'
  });

  const [taskForm, setTaskForm] = useState({
    title: '',
    category: 'fuel-qc',
    priority: 'none',
    assignee: '',
    status: 'not-started',
    equipment: '',
    dueDate: '',
    notes: '',
    isRecurring: false,
    recurringInterval: 'weekly',
    remarks: []
  });

  const categories = [
    { id: 'fuel-qc', label: 'Fuel Quality Control', color: 'bg-violet-500' },
    { id: 'services', label: 'Scheduled Services', color: 'bg-blue-500' },
    { id: 'faults', label: 'Faults and Repairs', color: 'bg-red-500' },
    { id: 'capital', label: 'Capital Improvement Projects', color: 'bg-amber-500' },
    { id: 'administrative', label: 'Administrative Tasks', color: 'bg-cyan-500' }
  ];

  const priorities = [
    { id: 'none', label: 'None', color: 'bg-slate-500' },
    { id: 'low', label: 'Low', color: 'bg-green-500' },
    { id: 'medium', label: 'Medium', color: 'bg-yellow-500' },
    { id: 'high', label: 'High', color: 'bg-orange-500' },
    { id: 'mission-critical', label: 'Mission Critical', color: 'bg-red-600' }
  ];

  const statuses = [
    { id: 'not-started', label: 'Not Started' },
    { id: 'in-progress', label: 'In Progress' },
    { id: 'on-hold', label: 'On Hold' },
    { id: 'completed', label: 'Completed' }
  ];

  const [teamMembers, setTeamMembers] = useState(['Pat', 'Evan', 'Cody', 'Wyatt', 'Carlos']);
  const [equipment, setEquipment] = useState([
    'Jet Fuel Truck 1', 'Jet Fuel Truck 2', 'Avgas Truck 1', 'Fire Truck',
    'Hangar 1', 'Hangar 2', 'Hangar 3', 'Hangar 4', 'Terminal Building',
    'Fuel Storage Tank 1', 'Fuel Storage Tank 2', 'Fuel Storage Tank 3',
    'Runway Lighting System', 'AWOS Station'
  ]);

  useEffect(() => {
    const saved = localStorage.getItem('airportTasksV2');
    if (saved) {
      setTasks(JSON.parse(saved));
    }
    const savedTeam = localStorage.getItem('airportTeamMembers');
    if (savedTeam) {
      setTeamMembers(JSON.parse(savedTeam));
    }
    const savedEquipment = localStorage.getItem('airportEquipment');
    if (savedEquipment) {
      setEquipment(JSON.parse(savedEquipment));
    }
  }, []);

  useEffect(() => {
    if (tasks.length > 0) {
      localStorage.setItem('airportTasksV2', JSON.stringify(tasks));
    }
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('airportTeamMembers', JSON.stringify(teamMembers));
  }, [teamMembers]);

  useEffect(() => {
    localStorage.setItem('airportEquipment', JSON.stringify(equipment));
  }, [equipment]);

  const resetTaskForm = () => {
    setTaskForm({
      title: '',
      category: 'fuel-qc',
      priority: 'none',
      assignee: '',
      status: 'not-started',
      equipment: '',
      dueDate: '',
      notes: '',
      isRecurring: false,
      recurringInterval: 'weekly',
      remarks: []
    });
  };

  const openAddTask = () => {
    resetTaskForm();
    setEditingTask(null);
    setShowTaskModal(true);
  };

  const openEditTask = (task) => {
    setTaskForm(task);
    setEditingTask(task);
    setShowTaskModal(true);
  };

  const saveTask = () => {
    if (!taskForm.title.trim()) return;

    if (editingTask) {
      setTasks(tasks.map(t => t.id === editingTask.id ? { ...taskForm, id: editingTask.id } : t));
    } else {
      const newTask = {
        ...taskForm,
        id: Date.now(),
        createdAt: new Date().toISOString()
      };
      setTasks([...tasks, newTask]);
    }
    
    setShowTaskModal(false);
    resetTaskForm();
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const updateTaskStatus = (id, newStatus) => {
    const task = tasks.find(t => t.id === id);
    
    // If marking a recurring task as completed, handle it specially
    if (task && task.isRecurring && newStatus === 'completed') {
      // Calculate next due date based on interval
      const currentDueDate = task.dueDate ? new Date(task.dueDate) : new Date();
      let nextDueDate = new Date(currentDueDate);
      
      switch (task.recurringInterval) {
        case 'daily':
          nextDueDate.setDate(nextDueDate.getDate() + 1);
          break;
        case 'weekly':
          nextDueDate.setDate(nextDueDate.getDate() + 7);
          break;
        case 'monthly':
          nextDueDate.setMonth(nextDueDate.getMonth() + 1);
          break;
        case 'quarterly':
          nextDueDate.setMonth(nextDueDate.getMonth() + 3);
          break;
        case 'annually':
          nextDueDate.setFullYear(nextDueDate.getFullYear() + 1);
          break;
      }
      
      // Format the next due date
      const formattedNextDueDate = nextDueDate.toISOString().split('T')[0];
      
      // Create the completed version of the task
      const completedTask = {
        ...task,
        status: 'completed',
        completedAt: new Date().toISOString()
      };
      
      // Create the new active version with next due date
      const newActiveTask = {
        ...task,
        id: Date.now(),
        dueDate: formattedNextDueDate,
        status: 'not-started',
        remarks: [], // Start fresh remarks for new cycle
        createdAt: new Date().toISOString()
      };
      
      // Update tasks: replace old task with completed version, add new active task
      setTasks(tasks.map(t => t.id === id ? completedTask : t).concat(newActiveTask));
    } else {
      // Normal status update for non-recurring tasks
      setTasks(tasks.map(t => t.id === id ? { ...t, status: newStatus } : t));
    }
  };

  const openRemarksModal = (task) => {
    setCurrentTaskForRemarks(task);
    setNewRemark('');
    setShowRemarksModal(true);
  };

  const addRemark = () => {
    if (!newRemark.trim()) return;
    
    const remark = {
      id: Date.now(),
      text: newRemark,
      timestamp: new Date().toISOString()
    };
    
    setTasks(tasks.map(t => 
      t.id === currentTaskForRemarks.id 
        ? { ...t, remarks: [...(t.remarks || []), remark] }
        : t
    ));
    
    setNewRemark('');
  };

  const addTeamMember = () => {
    if (newTeamMember.trim() && !teamMembers.includes(newTeamMember.trim())) {
      setTeamMembers([...teamMembers, newTeamMember.trim()]);
      setNewTeamMember('');
    }
  };

  const removeTeamMember = (member) => {
    alert(`Attempting to remove: ${member}`);
    const confirmed = window.confirm(`Remove ${member} from team members?`);
    if (confirmed) {
      const newMembers = teamMembers.filter(m => m !== member);
      setTeamMembers(newMembers);
    }
  };

  const addEquipment = () => {
    if (newEquipment.trim() && !equipment.includes(newEquipment.trim())) {
      setEquipment([...equipment, newEquipment.trim()]);
      setNewEquipment('');
    }
  };

  const removeEquipment = (equip) => {
    alert(`Attempting to remove: ${equip}`);
    const confirmed = window.confirm(`Remove ${equip} from equipment list?`);
    if (confirmed) {
      const newEquipment = equipment.filter(e => e !== equip);
      setEquipment(newEquipment);
    }
  };

  const getFilteredTasks = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const monthFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    return tasks.filter(task => {
      // Tab filter
      const tabMatch = activeTab === 'active' ? task.status !== 'completed' : task.status === 'completed';
      if (!tabMatch) return false;

      // Category filter
      if (filters.category !== 'all' && task.category !== filters.category) return false;
      
      // Priority filter
      if (filters.priority !== 'all' && task.priority !== filters.priority) return false;
      
      // Assignee filter
      if (filters.assignee !== 'all' && task.assignee !== filters.assignee) return false;
      
      // Status filter
      if (filters.status !== 'all' && task.status !== filters.status) return false;
      
      // Equipment filter
      if (filters.equipment !== 'all' && task.equipment !== filters.equipment) return false;
      
      // Due date filter
      if (filters.dueDate !== 'all' && task.dueDate) {
        const dueDate = new Date(task.dueDate);
        switch (filters.dueDate) {
          case 'today':
            if (dueDate.toDateString() !== today.toDateString()) return false;
            break;
          case 'week':
            if (dueDate > weekFromNow) return false;
            break;
          case 'month':
            if (dueDate > monthFromNow) return false;
            break;
        }
      }
      
      return true;
    });
  };

  const getCategoryInfo = (id) => categories.find(c => c.id === id);
  const getPriorityInfo = (id) => priorities.find(p => p.id === id);
  const getStatusLabel = (id) => statuses.find(s => s.id === id)?.label;

  const filteredTasks = getFilteredTasks();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-slate-800 rounded-xl shadow-2xl p-6 mb-6 border border-slate-700">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">Airport Operations Task Tracker</h1>
              <p className="text-slate-400">Manage tasks, track progress, and maintain operations</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSettingsModal(true)}
                className="flex items-center gap-2 bg-slate-700 text-white px-4 py-2 rounded-lg hover:bg-slate-600 transition-all shadow-lg border border-slate-600"
              >
                <Settings size={20} />
                Settings
              </button>
              <button
                onClick={() => {
                  alert('BANANA CLICKED!');
                  window.print();
                }}
                className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-lg hover:from-green-500 hover:to-emerald-500 transition-all shadow-lg"
              >
                <Plus size={20} />
                BANANA
              </button>
              <button
                onClick={openAddTask}
                className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-lg hover:from-green-500 hover:to-emerald-500 transition-all shadow-lg"
              >
                <Plus size={20} />
                Add Task
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 border-b border-slate-700 no-print">
            <button
              onClick={() => setActiveTab('active')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'active'
                  ? 'text-cyan-400 border-b-2 border-cyan-400'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              Active Tasks ({tasks.filter(t => t.status !== 'completed').length})
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'completed'
                  ? 'text-cyan-400 border-b-2 border-cyan-400'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              Completed Tasks ({tasks.filter(t => t.status === 'completed').length})
            </button>
          </div>
          
          {/* Print header - only visible when printing */}
          <div className="print-only">
            <h2 className="text-xl font-bold mb-2">
              {activeTab === 'active' ? 'Active Tasks' : 'Completed Tasks'}
            </h2>
            <p className="text-sm mb-2">Printed: {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
            {(filters.category !== 'all' || filters.priority !== 'all' || filters.assignee !== 'all' || 
              filters.status !== 'all' || filters.equipment !== 'all' || filters.dueDate !== 'all') && (
              <p className="text-sm mb-2"><strong>Filters Applied:</strong> 
                {filters.category !== 'all' && ` Category: ${getCategoryLabel(filters.category)}`}
                {filters.priority !== 'all' && ` Priority: ${getPriorityInfo(filters.priority)?.label}`}
                {filters.assignee !== 'all' && ` Assignee: ${filters.assignee}`}
                {filters.status !== 'all' && ` Status: ${getStatusLabel(filters.status)}`}
                {filters.equipment !== 'all' && ` Equipment: ${filters.equipment}`}
                {filters.dueDate !== 'all' && ` Due: ${filters.dueDate}`}
              </p>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-slate-800 rounded-xl shadow-xl p-4 mb-6 border border-slate-700 no-print">
          <div className="flex flex-wrap gap-3">
            <select
              value={filters.category}
              onChange={(e) => setFilters({...filters, category: e.target.value})}
              className="bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="all">All Categories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>

            <select
              value={filters.priority}
              onChange={(e) => setFilters({...filters, priority: e.target.value})}
              className="bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="all">All Priorities</option>
              {priorities.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>

            <select
              value={filters.assignee}
              onChange={(e) => setFilters({...filters, assignee: e.target.value})}
              className="bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="all">All Team Members</option>
              {teamMembers.map(m => <option key={m} value={m}>{m}</option>)}
            </select>

            <select
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="all">All Statuses</option>
              {statuses.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>

            <select
              value={filters.equipment}
              onChange={(e) => setFilters({...filters, equipment: e.target.value})}
              className="bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="all">All Equipment</option>
              {equipment.map(e => <option key={e} value={e}>{e}</option>)}
            </select>

            <select
              value={filters.dueDate}
              onChange={(e) => setFilters({...filters, dueDate: e.target.value})}
              className="bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="all">All Due Dates</option>
              <option value="today">Due Today</option>
              <option value="week">Due This Week</option>
              <option value="month">Due This Month</option>
            </select>
          </div>
        </div>

        {/* Tasks List */}
        <div className="space-y-4">
          {filteredTasks.length === 0 ? (
            <div className="bg-slate-800 rounded-xl p-12 text-center border border-slate-700">
              <p className="text-slate-400 text-lg">No tasks found</p>
            </div>
          ) : (
            filteredTasks.map(task => {
              const categoryInfo = getCategoryInfo(task.category);
              const priorityInfo = getPriorityInfo(task.priority);
              
              return (
                <div key={task.id} className="bg-slate-800 rounded-xl p-5 border border-slate-700 hover:border-slate-600 transition-all task-card">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className={`badge ${categoryInfo.color} text-white px-3 py-1 rounded-lg text-xs font-semibold`}>
                          {categoryInfo.label}
                        </span>
                        <span className={`badge ${priorityInfo.color} text-white px-3 py-1 rounded-lg text-xs font-semibold`}>
                          {priorityInfo.label}
                        </span>
                        {task.assignee && (
                          <span className="badge bg-indigo-600 text-white px-2 py-1 rounded-lg text-xs font-semibold">
                            👤 {task.assignee}
                          </span>
                        )}
                        {task.equipment && (
                          <span className="badge bg-teal-600 text-white px-2 py-1 rounded-lg text-xs font-semibold">
                            🔧 {task.equipment}
                          </span>
                        )}
                        {task.isRecurring && (
                          <span className="badge bg-purple-600 text-white px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1">
                            <Repeat size={12} />
                            {task.recurringInterval}
                          </span>
                        )}
                        {task.dueDate && (
                          <span className="badge bg-slate-600 text-white px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1">
                            <Calendar size={12} />
                            {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      <h3 className="text-lg font-semibold text-white mb-1">{task.title}</h3>
                      {task.notes && (
                        <p className="text-slate-400 text-sm mb-3">{task.notes}</p>
                      )}

                      {/* Status Buttons */}
                      <div className="flex items-center gap-2 flex-wrap no-print">
                        {statuses.map(status => (
                          <button
                            key={status.id}
                            onClick={() => updateTaskStatus(task.id, status.id)}
                            className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                              task.status === status.id
                                ? 'bg-cyan-600 text-white shadow-lg'
                                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                            }`}
                          >
                            {status.label}
                          </button>
                        ))}
                      </div>

                      {/* Print-only status display */}
                      <div className="print-only">
                        <p className="text-sm mt-2"><strong>Status:</strong> {getStatusLabel(task.status)}</p>
                      </div>

                      {/* Remarks count */}
                      {task.remarks && task.remarks.length > 0 && (
                        <div className="mt-2 text-slate-400 text-sm">
                          💬 {task.remarks.length} remark{task.remarks.length !== 1 ? 's' : ''}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 no-print">
                      <button
                        onClick={() => openRemarksModal(task)}
                        className="text-cyan-400 hover:text-cyan-300 p-2 hover:bg-slate-700 rounded-lg transition-all"
                        title="View/Add Remarks"
                      >
                        <MessageSquare size={20} />
                      </button>
                      <button
                        onClick={() => openEditTask(task)}
                        className="text-blue-400 hover:text-blue-300 p-2 hover:bg-slate-700 rounded-lg transition-all"
                        title="Edit Task"
                      >
                        <Edit2 size={20} />
                      </button>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="text-red-400 hover:text-red-300 p-2 hover:bg-slate-700 rounded-lg transition-all"
                        title="Delete Task"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Add/Edit Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl shadow-2xl max-w-2xl w-full border border-slate-700 flex flex-col" style={{maxHeight: 'calc(100vh - 4rem)'}}>
            <div className="bg-slate-800 border-b border-slate-700 p-6 flex justify-between items-center flex-shrink-0">
              <h2 className="text-2xl font-bold text-white">
                {editingTask ? 'Edit Task' : 'Add New Task'}
              </h2>
              <button
                onClick={() => setShowTaskModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4 flex-1" style={{overflowY: 'auto'}}>
              <div>
                <label className="block text-white font-medium mb-2">Task Title *</label>
                <input
                  type="text"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({...taskForm, title: e.target.value})}
                  placeholder="Enter task title..."
                  className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white font-medium mb-2">Category</label>
                  <select
                    value={taskForm.category}
                    onChange={(e) => setTaskForm({...taskForm, category: e.target.value})}
                    className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    {categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">Priority</label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({...taskForm, priority: e.target.value})}
                    className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    {priorities.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white font-medium mb-2">Assigned To</label>
                  <select
                    value={taskForm.assignee}
                    onChange={(e) => setTaskForm({...taskForm, assignee: e.target.value})}
                    className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="">Unassigned</option>
                    {teamMembers.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">Status</label>
                  <select
                    value={taskForm.status}
                    onChange={(e) => setTaskForm({...taskForm, status: e.target.value})}
                    className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    {statuses.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-white font-medium mb-2">Equipment/Facility</label>
                <select
                  value={taskForm.equipment}
                  onChange={(e) => setTaskForm({...taskForm, equipment: e.target.value})}
                  className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="">None</option>
                  {equipment.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-white font-medium mb-2">Due Date</label>
                <input
                  type="date"
                  value={taskForm.dueDate}
                  onChange={(e) => setTaskForm({...taskForm, dueDate: e.target.value})}
                  className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-white font-medium mb-2">
                  <input
                    type="checkbox"
                    checked={taskForm.isRecurring}
                    onChange={(e) => setTaskForm({...taskForm, isRecurring: e.target.checked})}
                    className="w-4 h-4 rounded"
                  />
                  Recurring Task
                </label>
                {taskForm.isRecurring && (
                  <select
                    value={taskForm.recurringInterval}
                    onChange={(e) => setTaskForm({...taskForm, recurringInterval: e.target.value})}
                    className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="annually">Annually</option>
                  </select>
                )}
              </div>

              <div>
                <label className="block text-white font-medium mb-2">Notes</label>
                <textarea
                  value={taskForm.notes}
                  onChange={(e) => setTaskForm({...taskForm, notes: e.target.value})}
                  placeholder="Add additional details..."
                  rows={3}
                  className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>

            <div className="sticky bottom-0 bg-slate-800 border-t border-slate-700 p-4 flex justify-end gap-3 flex-shrink-0">
              <button
                onClick={() => setShowTaskModal(false)}
                className="bg-slate-700 text-white px-6 py-2 rounded-lg hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveTask}
                className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-2 rounded-lg hover:from-green-500 hover:to-emerald-500 transition-colors"
              >
                {editingTask ? 'Save Changes' : 'Add Task'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remarks Modal */}
      {showRemarksModal && currentTaskForRemarks && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl shadow-2xl max-w-2xl w-full border border-slate-700 flex flex-col" style={{maxHeight: 'calc(100vh - 4rem)'}}>
            <div className="bg-slate-800 border-b border-slate-700 p-6 flex justify-between items-center flex-shrink-0">
              <h2 className="text-2xl font-bold text-white">Task Remarks</h2>
              <button
                onClick={() => setShowRemarksModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 flex-1" style={{overflowY: 'auto'}}>
              <h3 className="text-lg font-semibold text-white mb-4">{currentTaskForRemarks.title}</h3>
              
              {/* Existing Remarks */}
              <div className="space-y-3 mb-6">
                {currentTaskForRemarks.remarks && currentTaskForRemarks.remarks.length > 0 ? (
                  currentTaskForRemarks.remarks.map(remark => (
                    <div key={remark.id} className="bg-slate-700 rounded-lg p-4 border border-slate-600">
                      <p className="text-white mb-2">{remark.text}</p>
                      <p className="text-slate-400 text-xs">
                        {new Date(remark.timestamp).toLocaleString()}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 text-center py-4">No remarks yet</p>
                )}
              </div>

              {/* Add New Remark */}
              <div>
                <label className="block text-white font-medium mb-2">Add New Remark</label>
                <textarea
                  value={newRemark}
                  onChange={(e) => setNewRemark(e.target.value)}
                  placeholder="Enter your remark..."
                  rows={3}
                  className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 mb-3"
                />
                <button
                  onClick={addRemark}
                  className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-cyan-500 hover:to-blue-500 transition-colors"
                >
                  Add Remark
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowSettingsModal(false)}></div>
          <div className="bg-slate-800 rounded-xl shadow-2xl max-w-4xl w-full border border-slate-700 flex flex-col relative z-50" style={{maxHeight: 'calc(100vh - 4rem)'}}>
            <div className="bg-slate-800 border-b border-slate-700 p-6 flex justify-between items-center flex-shrink-0">
              <h2 className="text-2xl font-bold text-white">Settings</h2>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-8 flex-1 overflow-y-auto">
              {/* Team Members Section */}
              <div>
                <h3 className="text-xl font-semibold text-white mb-4">Team Members</h3>

                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={newTeamMember}
                    onChange={(e) => setNewTeamMember(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addTeamMember()}
                    placeholder="Enter team member name..."
                    className="flex-1 bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 placeholder-slate-400"
                  />
                  <button
                    onClick={addTeamMember}
                    className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-cyan-500 hover:to-blue-500 transition-colors flex items-center gap-2"
                  >
                    <Plus size={18} />
                    Add
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {teamMembers.map((member, index) => (
                    <div key={`${member}-${index}`} className="bg-slate-700 border border-slate-600 rounded-lg p-3 flex justify-between items-center gap-2">
                      <span className="text-white font-medium">👤 {member}</span>
                      <button
                        onClick={() => {
                          const newMembers = teamMembers.filter((m, i) => i !== index);
                          setTeamMembers(newMembers);
                        }}
                        className="text-red-400 hover:text-red-300 transition-colors p-2 hover:bg-slate-600 rounded cursor-pointer flex-shrink-0"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
                {teamMembers.length === 0 && (
                  <p className="text-slate-400 text-center py-4">No team members added yet</p>
                )}
              </div>

              {/* Equipment/Facilities Section */}
              <div>
                <h3 className="text-xl font-semibold text-white mb-4">Equipment & Facilities</h3>
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={newEquipment}
                    onChange={(e) => setNewEquipment(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addEquipment()}
                    placeholder="Enter equipment or facility name..."
                    className="flex-1 bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 placeholder-slate-400"
                  />
                  <button
                    onClick={addEquipment}
                    className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-cyan-500 hover:to-blue-500 transition-colors flex items-center gap-2"
                  >
                    <Plus size={18} />
                    Add
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {equipment.map((equip, index) => (
                    <div key={`${equip}-${index}`} className="bg-slate-700 border border-slate-600 rounded-lg p-3 flex justify-between items-center gap-2">
                      <span className="text-white font-medium">🔧 {equip}</span>
                      <button
                        onClick={() => {
                          const newEquipment = equipment.filter((e, i) => i !== index);
                          setEquipment(newEquipment);
                        }}
                        className="text-red-400 hover:text-red-300 transition-colors p-2 hover:bg-slate-600 rounded cursor-pointer flex-shrink-0"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
                {equipment.length === 0 && (
                  <p className="text-slate-400 text-center py-4">No equipment or facilities added yet</p>
                )}
              </div>
            </div>

            <div className="bg-slate-800 border-t border-slate-700 p-4 flex justify-end flex-shrink-0">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-2 rounded-lg hover:from-green-500 hover:to-emerald-500 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AirportTaskTracker;