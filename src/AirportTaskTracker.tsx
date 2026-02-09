import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, MessageSquare, X, Calendar, Repeat, Settings, Printer, GripVertical, ArrowUpDown, Truck, Building2, AlertTriangle, ChevronLeft, Wrench, Clock, History, Warehouse, Fuel, Lightbulb, Wind, Flame, Package } from 'lucide-react';
import { supabase, Task, TaskRemark, TeamMember, Equipment, EquipmentPart } from './supabaseClient';

const AirportTaskTracker = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teamMembers, setTeamMembers] = useState<string[]>([]);
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'completed' | 'equipment'>('active');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showRemarksModal, setShowRemarksModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showEquipmentModal, setShowEquipmentModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [currentTaskForRemarks, setCurrentTaskForRemarks] = useState<Task | null>(null);
  const [newRemark, setNewRemark] = useState('');
  const [newTeamMember, setNewTeamMember] = useState('');
  const [sortBy, setSortBy] = useState<'custom' | 'date'>('custom');
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [draggedSubtask, setDraggedSubtask] = useState<Task | null>(null);

  const [equipmentForm, setEquipmentForm] = useState({
    name: '',
    equipment_type: 'vehicle',
    year: '',
    make: '',
    model: '',
    vin: '',
    license_plate: '',
    acquisition_date: '',
    mileage_hours: '',
    registration_date: '',
    registration_renewal_date: '',
    insurance_expiration: '',
    status: 'operational',
    notes: '',
    description: '',
    ownership: 'business',
  });

  const [equipmentViewFilter, setEquipmentViewFilter] = useState<'all' | 'equipment' | 'facilities'>('all');

  // Parts management state
  const [equipmentParts, setEquipmentParts] = useState<EquipmentPart[]>([]);
  const [showPartsModal, setShowPartsModal] = useState(false);
  const [partForm, setPartForm] = useState({
    part_component: '',
    part_number: '',
    last_sourced_from: '',
  });

  // Equipment types (vehicles, trucks, etc.)
  const vehicleEquipmentTypes = [
    { id: 'vehicle', label: 'Vehicle' },
    { id: 'equipment', label: 'Equipment' },
    { id: 'system', label: 'System' },
  ];

  // Facility types
  const facilityTypes = [
    { id: 'hangar-door', label: 'Hangar Door' },
    { id: 'fuel-farm', label: 'Fuel Farm' },
    { id: 'runway-lights', label: 'Runway Lights' },
    { id: 'hvac', label: 'HVAC System' },
    { id: 'boiler', label: 'Boiler' },
    { id: 'facility', label: 'Other Facility' },
  ];

  const allEquipmentTypes = [...vehicleEquipmentTypes, ...facilityTypes];

  const ownershipOptions = [
    { id: 'business', label: 'PJC' },
    { id: 'county', label: 'County' },
    { id: 'shared', label: 'Shared' },
    { id: 'leased', label: 'Leased' },
  ];

  const equipmentStatuses = [
    { id: 'operational', label: 'Operational', color: 'bg-green-500' },
    { id: 'limited', label: 'Limited', color: 'bg-yellow-500' },
    { id: 'down', label: 'Down', color: 'bg-red-500' },
    { id: 'out-of-service', label: 'Out of Service', color: 'bg-slate-500' },
  ];

  const isFacilityType = (type: string) => {
    return facilityTypes.some(t => t.id === type);
  };

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
    recurringDayOfWeek: 1 as number | null, // Monday default
    recurringDayOfMonth: 1 as number | null, // 1st of month default
    recurringMonth: 1 as number | null, // January default for annual, 1st month for quarterly
    isMajorTask: false,
    parentTaskId: null as number | null,
  });

  const daysOfWeek = [
    { id: 0, label: 'Sunday' },
    { id: 1, label: 'Monday' },
    { id: 2, label: 'Tuesday' },
    { id: 3, label: 'Wednesday' },
    { id: 4, label: 'Thursday' },
    { id: 5, label: 'Friday' },
    { id: 6, label: 'Saturday' },
  ];

  // Helper function for ordinal suffixes (defined here to avoid initialization order issues)
  const getOrdinalSuffix = (n: number) => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
  };

  const daysOfMonth = Array.from({ length: 31 }, (_, i) => ({
    id: i + 1,
    label: `${i + 1}${getOrdinalSuffix(i + 1)}`,
  }));

  const monthsOfYear = [
    { id: 1, label: 'January' },
    { id: 2, label: 'February' },
    { id: 3, label: 'March' },
    { id: 4, label: 'April' },
    { id: 5, label: 'May' },
    { id: 6, label: 'June' },
    { id: 7, label: 'July' },
    { id: 8, label: 'August' },
    { id: 9, label: 'September' },
    { id: 10, label: 'October' },
    { id: 11, label: 'November' },
    { id: 12, label: 'December' },
  ];

  const quarterMonths = [
    { id: 1, label: '1st month (Jan, Apr, Jul, Oct)' },
    { id: 2, label: '2nd month (Feb, May, Aug, Nov)' },
    { id: 3, label: '3rd month (Mar, Jun, Sep, Dec)' },
  ];

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

  // Load initial data
  useEffect(() => {
    loadData();
    setupRealtimeSubscriptions();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadTasks(),
        loadTeamMembers(),
        loadEquipment()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Error loading data. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const loadTasks = async () => {
    const { data: tasksData, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .order('display_order', { ascending: true });

    if (tasksError) throw tasksError;

    // Load remarks for all tasks
    const { data: remarksData, error: remarksError } = await supabase
      .from('task_remarks')
      .select('*')
      .order('timestamp', { ascending: true });

    if (remarksError) throw remarksError;

    // Group remarks by task_id
    const remarksMap: { [key: number]: TaskRemark[] } = {};
    remarksData?.forEach((remark) => {
      if (!remarksMap[remark.task_id]) {
        remarksMap[remark.task_id] = [];
      }
      remarksMap[remark.task_id].push(remark);
    });

    // Combine tasks with their remarks and organize subtasks
    const allTasks = tasksData?.map((task) => ({
      ...task,
      remarks: remarksMap[task.id] || [],
      subtasks: []
    })) || [];

    // Organize tasks hierarchically - separate parent tasks and subtasks
    const parentTasks: Task[] = [];
    const subtasksMap: { [key: number]: Task[] } = {};

    allTasks.forEach((task) => {
      if (task.parent_task_id) {
        // This is a subtask
        if (!subtasksMap[task.parent_task_id]) {
          subtasksMap[task.parent_task_id] = [];
        }
        subtasksMap[task.parent_task_id].push(task);
      } else {
        // This is a parent task or regular task
        parentTasks.push(task);
      }
    });

    // Attach subtasks to their parent tasks
    const tasksWithSubtasks = parentTasks.map((task) => ({
      ...task,
      subtasks: subtasksMap[task.id] || []
    }));

    setTasks(tasksWithSubtasks);
  };

  const loadTeamMembers = async () => {
    const { data, error } = await supabase
      .from('team_members')
      .select('name')
      .order('name');

    if (error) throw error;
    setTeamMembers(data?.map(tm => tm.name) || []);
  };

  const loadEquipment = async () => {
    const { data, error } = await supabase
      .from('equipment')
      .select('*')
      .order('name');

    if (error) throw error;
    setEquipmentList(data || []);
  };

  const loadEquipmentParts = async (equipmentId: number) => {
    const { data, error } = await supabase
      .from('equipment_parts')
      .select('*')
      .eq('equipment_id', equipmentId)
      .order('part_component');

    if (error) {
      console.error('Error loading parts:', error);
      return;
    }
    setEquipmentParts(data || []);
  };

  const addPart = async () => {
    if (!selectedEquipment || !partForm.part_component.trim() || !partForm.part_number.trim()) return;

    const { error } = await supabase
      .from('equipment_parts')
      .insert({
        equipment_id: selectedEquipment.id,
        part_component: partForm.part_component.trim(),
        part_number: partForm.part_number.trim(),
        last_sourced_from: partForm.last_sourced_from.trim() || null,
      });

    if (error) {
      console.error('Error adding part:', error);
      return;
    }

    setPartForm({ part_component: '', part_number: '', last_sourced_from: '' });
    loadEquipmentParts(selectedEquipment.id);
  };

  const deletePart = async (partId: number) => {
    if (!selectedEquipment) return;

    const { error } = await supabase
      .from('equipment_parts')
      .delete()
      .eq('id', partId);

    if (error) {
      console.error('Error deleting part:', error);
      return;
    }

    loadEquipmentParts(selectedEquipment.id);
  };

  const printParts = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow || !selectedEquipment) return;

    const partsHtml = equipmentParts.map(part => `
      <tr>
        <td style="border: 1px solid #ddd; padding: 8px;">${part.part_component}</td>
        <td style="border: 1px solid #ddd; padding: 8px; font-family: monospace;">${part.part_number}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${part.last_sourced_from || '-'}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Replacement Parts - ${selectedEquipment.name}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #333; }
          table { border-collapse: collapse; width: 100%; margin-top: 20px; }
          th { background-color: #f4f4f4; border: 1px solid #ddd; padding: 12px; text-align: left; }
          td { border: 1px solid #ddd; padding: 8px; }
          .header { margin-bottom: 20px; }
          .date { color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Replacement Part Numbers</h1>
          <h2>${selectedEquipment.name}</h2>
          <p class="date">Generated: ${new Date().toLocaleDateString()}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Part / Component</th>
              <th>Part Number</th>
              <th>Last Sourced From</th>
            </tr>
          </thead>
          <tbody>
            ${partsHtml || '<tr><td colspan="3" style="text-align: center; padding: 20px;">No parts recorded</td></tr>'}
          </tbody>
        </table>
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.print();
  };

  const setupRealtimeSubscriptions = () => {
    // Subscribe to tasks changes
    const tasksSubscription = supabase
      .channel('tasks_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        loadTasks();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'task_remarks' }, () => {
        loadTasks();
      })
      .subscribe();

    // Subscribe to team members changes
    const teamSubscription = supabase
      .channel('team_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'team_members' }, () => {
        loadTeamMembers();
      })
      .subscribe();

    // Subscribe to equipment changes
    const equipmentSubscription = supabase
      .channel('equipment_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'equipment' }, () => {
        loadEquipment();
      })
      .subscribe();

    return () => {
      tasksSubscription.unsubscribe();
      teamSubscription.unsubscribe();
      equipmentSubscription.unsubscribe();
    };
  };

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
      recurringDayOfWeek: 1,
      recurringDayOfMonth: 1,
      recurringMonth: 1,
      isMajorTask: false,
      parentTaskId: null,
    });
  };

  const openAddTask = (parentTaskId: number | null = null) => {
    resetTaskForm();
    setEditingTask(null);
    if (parentTaskId) {
      setTaskForm(prev => ({ ...prev, parentTaskId }));
    }
    setShowTaskModal(true);
  };

  const openEditTask = (task: Task) => {
    setTaskForm({
      title: task.title,
      category: task.category,
      priority: task.priority,
      assignee: task.assignee || '',
      status: task.status,
      equipment: task.equipment || '',
      dueDate: task.due_date || '',
      notes: task.notes || '',
      isRecurring: task.is_recurring,
      recurringInterval: task.recurring_interval || 'weekly',
      recurringDayOfWeek: task.recurring_day_of_week ?? 1,
      recurringDayOfMonth: task.recurring_day_of_month ?? 1,
      recurringMonth: task.recurring_month ?? 1,
      isMajorTask: task.is_major_task || false,
      parentTaskId: task.parent_task_id || null,
    });
    setEditingTask(task);
    setShowTaskModal(true);
  };

  const saveTask = async () => {
    if (!taskForm.title.trim()) return;

    try {
      const taskData: any = {
        title: taskForm.title,
        category: taskForm.category,
        priority: taskForm.priority,
        assignee: taskForm.assignee || null,
        status: taskForm.status,
        equipment: taskForm.equipment || null,
        due_date: taskForm.dueDate || null,
        notes: taskForm.notes || null,
        is_recurring: taskForm.isRecurring,
        recurring_interval: taskForm.isRecurring ? taskForm.recurringInterval : null,
        recurring_day_of_week: taskForm.isRecurring && taskForm.recurringInterval === 'weekly' ? taskForm.recurringDayOfWeek : null,
        recurring_day_of_month: taskForm.isRecurring && ['monthly', 'quarterly', 'annually'].includes(taskForm.recurringInterval) ? taskForm.recurringDayOfMonth : null,
        recurring_month: taskForm.isRecurring && ['quarterly', 'annually'].includes(taskForm.recurringInterval) ? taskForm.recurringMonth : null,
        is_major_task: taskForm.isMajorTask,
        parent_task_id: taskForm.parentTaskId || null,
      };

      if (editingTask) {
        const { error } = await supabase
          .from('tasks')
          .update(taskData)
          .eq('id', editingTask.id);

        if (error) throw error;
      } else {
        // For new tasks, calculate display_order
        const { data: existingTasks } = await supabase
          .from('tasks')
          .select('display_order')
          .eq('parent_task_id', taskForm.parentTaskId || null)
          .order('display_order', { ascending: false })
          .limit(1);

        const maxOrder = existingTasks && existingTasks.length > 0 ? existingTasks[0].display_order : 0;
        taskData.display_order = maxOrder + 1;

        const { error } = await supabase
          .from('tasks')
          .insert([taskData]);

        if (error) throw error;
      }

      setShowTaskModal(false);
      resetTaskForm();
      loadTasks();
    } catch (error) {
      console.error('Error saving task:', error);
      alert('Error saving task. Please try again.');
    }
  };

  const deleteTask = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Error deleting task. Please try again.');
    }
  };

  // Drag and drop handlers for tasks
  const handleTaskDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleTaskDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleTaskDrop = async (e: React.DragEvent, targetTask: Task) => {
    e.preventDefault();
    if (!draggedTask || draggedTask.id === targetTask.id) {
      setDraggedTask(null);
      return;
    }

    // Only allow reordering tasks at the same level (both parent tasks, not subtasks)
    if (draggedTask.parent_task_id !== targetTask.parent_task_id) {
      setDraggedTask(null);
      return;
    }

    try {
      const parentTasks = tasks.filter(t => !t.parent_task_id);
      const draggedIndex = parentTasks.findIndex(t => t.id === draggedTask.id);
      const targetIndex = parentTasks.findIndex(t => t.id === targetTask.id);

      if (draggedIndex === -1 || targetIndex === -1) return;

      const reorderedTasks = [...parentTasks];
      reorderedTasks.splice(draggedIndex, 1);
      reorderedTasks.splice(targetIndex, 0, draggedTask);

      // Update display_order for all affected tasks
      const updates = reorderedTasks.map((task, index) => ({
        id: task.id,
        display_order: index + 1
      }));

      for (const update of updates) {
        await supabase
          .from('tasks')
          .update({ display_order: update.display_order })
          .eq('id', update.id);
      }

      loadTasks();
    } catch (error) {
      console.error('Error reordering tasks:', error);
      alert('Error reordering tasks. Please try again.');
    } finally {
      setDraggedTask(null);
    }
  };

  const handleTaskDragEnd = () => {
    setDraggedTask(null);
  };

  // Drag and drop handlers for subtasks
  const handleSubtaskDragStart = (e: React.DragEvent, subtask: Task) => {
    setDraggedSubtask(subtask);
    e.dataTransfer.effectAllowed = 'move';
    e.stopPropagation();
  };

  const handleSubtaskDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleSubtaskDrop = async (e: React.DragEvent, targetSubtask: Task, parentTask: Task) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedSubtask || draggedSubtask.id === targetSubtask.id) {
      setDraggedSubtask(null);
      return;
    }

    // Only allow reordering subtasks within the same parent
    if (draggedSubtask.parent_task_id !== targetSubtask.parent_task_id) {
      setDraggedSubtask(null);
      return;
    }

    try {
      const subtasks = parentTask.subtasks || [];
      const draggedIndex = subtasks.findIndex(t => t.id === draggedSubtask.id);
      const targetIndex = subtasks.findIndex(t => t.id === targetSubtask.id);

      if (draggedIndex === -1 || targetIndex === -1) return;

      const reorderedSubtasks = [...subtasks];
      reorderedSubtasks.splice(draggedIndex, 1);
      reorderedSubtasks.splice(targetIndex, 0, draggedSubtask);

      // Update display_order for all subtasks
      const updates = reorderedSubtasks.map((subtask, index) => ({
        id: subtask.id,
        display_order: index + 1
      }));

      for (const update of updates) {
        await supabase
          .from('tasks')
          .update({ display_order: update.display_order })
          .eq('id', update.id);
      }

      loadTasks();
    } catch (error) {
      console.error('Error reordering subtasks:', error);
      alert('Error reordering subtasks. Please try again.');
    } finally {
      setDraggedSubtask(null);
    }
  };

  const handleSubtaskDragEnd = () => {
    setDraggedSubtask(null);
  };

  const toggleSortMode = () => {
    setSortBy(prev => prev === 'custom' ? 'date' : 'custom');
  };

  const updateTaskStatus = async (id: number, newStatus: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    // Check if this is a major task being marked as completed
    if (task.is_major_task && newStatus === 'completed' && task.subtasks && task.subtasks.length > 0) {
      const incompleteSubtasks = task.subtasks.filter(st => st.status !== 'completed');
      if (incompleteSubtasks.length > 0) {
        alert(`Cannot complete major task "${task.title}" until all ${task.subtasks.length} subtasks are completed. ${incompleteSubtasks.length} subtask(s) remaining.`);
        return;
      }
    }

    try {
      // If marking a recurring task as completed, handle it specially
      if (task.is_recurring && newStatus === 'completed') {
        // Calculate next due date based on interval and day settings
        const currentDueDate = task.due_date ? new Date(task.due_date) : new Date();
        let nextDueDate = new Date(currentDueDate);

        switch (task.recurring_interval) {
          case 'daily':
            nextDueDate.setDate(nextDueDate.getDate() + 1);
            break;
          case 'weekly':
            // Find next occurrence of the specified day of week
            if (task.recurring_day_of_week !== null) {
              const targetDay = task.recurring_day_of_week;
              nextDueDate.setDate(nextDueDate.getDate() + 7); // Start from next week
              // Adjust to the correct day of week
              const currentDay = nextDueDate.getDay();
              const daysUntilTarget = (targetDay - currentDay + 7) % 7;
              nextDueDate.setDate(nextDueDate.getDate() - 7 + daysUntilTarget);
              // If we ended up on the same date or earlier, add a week
              if (nextDueDate <= currentDueDate) {
                nextDueDate.setDate(nextDueDate.getDate() + 7);
              }
            } else {
              nextDueDate.setDate(nextDueDate.getDate() + 7);
            }
            break;
          case 'monthly':
            nextDueDate.setMonth(nextDueDate.getMonth() + 1);
            if (task.recurring_day_of_month !== null) {
              // Set to the specified day of month
              const targetDay = Math.min(task.recurring_day_of_month, new Date(nextDueDate.getFullYear(), nextDueDate.getMonth() + 1, 0).getDate());
              nextDueDate.setDate(targetDay);
            }
            break;
          case 'quarterly':
            // recurring_month: 1, 2, or 3 (which month of each quarter)
            // Quarters: Q1 (Jan-Mar), Q2 (Apr-Jun), Q3 (Jul-Sep), Q4 (Oct-Dec)
            {
              const currentQuarter = Math.floor(nextDueDate.getMonth() / 3);
              const nextQuarter = (currentQuarter + 1) % 4;
              const yearOffset = nextQuarter === 0 ? 1 : 0;
              const quarterMonth = task.recurring_month ?? 1; // 1, 2, or 3
              const targetMonth = (nextQuarter * 3) + (quarterMonth - 1);
              nextDueDate.setFullYear(nextDueDate.getFullYear() + yearOffset);
              nextDueDate.setMonth(targetMonth);
              if (task.recurring_day_of_month !== null) {
                const daysInMonth = new Date(nextDueDate.getFullYear(), targetMonth + 1, 0).getDate();
                const targetDay = Math.min(task.recurring_day_of_month, daysInMonth);
                nextDueDate.setDate(targetDay);
              }
            }
            break;
          case 'annually':
            // recurring_month: 1-12 (which month of the year)
            {
              nextDueDate.setFullYear(nextDueDate.getFullYear() + 1);
              if (task.recurring_month !== null) {
                nextDueDate.setMonth(task.recurring_month - 1); // Convert 1-12 to 0-11
              }
              if (task.recurring_day_of_month !== null) {
                const daysInMonth = new Date(nextDueDate.getFullYear(), nextDueDate.getMonth() + 1, 0).getDate();
                const targetDay = Math.min(task.recurring_day_of_month, daysInMonth);
                nextDueDate.setDate(targetDay);
              }
            }
            break;
        }

        const formattedNextDueDate = nextDueDate.toISOString().split('T')[0];

        // Update the current task to completed
        const { error: updateError } = await supabase
          .from('tasks')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString()
          })
          .eq('id', id);

        if (updateError) throw updateError;

        // Create new active task for next cycle
        const { error: insertError } = await supabase
          .from('tasks')
          .insert([{
            title: task.title,
            category: task.category,
            priority: task.priority,
            assignee: task.assignee,
            status: 'not-started',
            equipment: task.equipment,
            due_date: formattedNextDueDate,
            notes: task.notes,
            is_recurring: true,
            recurring_interval: task.recurring_interval,
            recurring_day_of_week: task.recurring_day_of_week,
            recurring_day_of_month: task.recurring_day_of_month,
            recurring_month: task.recurring_month,
          }]);

        if (insertError) throw insertError;
      } else {
        // Normal status update
        const updates: any = { status: newStatus };
        if (newStatus === 'completed') {
          updates.completed_at = new Date().toISOString();
        }

        const { error } = await supabase
          .from('tasks')
          .update(updates)
          .eq('id', id);

        if (error) throw error;
      }

      loadTasks();
    } catch (error) {
      console.error('Error updating task status:', error);
      alert('Error updating task. Please try again.');
    }
  };

  const openRemarksModal = (task: Task) => {
    setCurrentTaskForRemarks(task);
    setNewRemark('');
    setShowRemarksModal(true);
  };

  const addRemark = async () => {
    if (!newRemark.trim() || !currentTaskForRemarks) return;

    try {
      const { error } = await supabase
        .from('task_remarks')
        .insert([{
          task_id: currentTaskForRemarks.id,
          text: newRemark.trim(),
        }]);

      if (error) throw error;

      setNewRemark('');
      loadTasks();
    } catch (error) {
      console.error('Error adding remark:', error);
      alert('Error adding remark. Please try again.');
    }
  };

  const addTeamMember = async () => {
    if (!newTeamMember.trim()) return;

    try {
      const { error } = await supabase
        .from('team_members')
        .insert([{ name: newTeamMember.trim() }]);

      if (error) {
        if (error.code === '23505') {
          alert('This team member already exists.');
        } else {
          throw error;
        }
        return;
      }

      setNewTeamMember('');
      loadTeamMembers();
    } catch (error) {
      console.error('Error adding team member:', error);
      alert('Error adding team member. Please try again.');
    }
  };

  const removeTeamMember = async (memberName: string) => {
    if (!window.confirm(`Remove ${memberName} from team members?`)) return;

    try {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('name', memberName);

      if (error) throw error;
      loadTeamMembers();
    } catch (error) {
      console.error('Error removing team member:', error);
      alert('Error removing team member. Please try again.');
    }
  };

  const resetEquipmentForm = () => {
    setEquipmentForm({
      name: '',
      equipment_type: 'vehicle',
      year: '',
      make: '',
      model: '',
      vin: '',
      license_plate: '',
      acquisition_date: '',
      mileage_hours: '',
      registration_date: '',
      registration_renewal_date: '',
      insurance_expiration: '',
      status: 'operational',
      notes: '',
      description: '',
      ownership: 'business',
    });
  };

  const openAddEquipment = () => {
    resetEquipmentForm();
    setEditingEquipment(null);
    setShowEquipmentModal(true);
  };

  const openEditEquipment = (equip: Equipment) => {
    setEquipmentForm({
      name: equip.name,
      equipment_type: equip.equipment_type || 'vehicle',
      year: equip.year?.toString() || '',
      make: equip.make || '',
      model: equip.model || '',
      vin: equip.vin || '',
      license_plate: equip.license_plate || '',
      acquisition_date: equip.acquisition_date || '',
      mileage_hours: equip.mileage_hours?.toString() || '',
      registration_date: equip.registration_date || '',
      registration_renewal_date: equip.registration_renewal_date || '',
      insurance_expiration: equip.insurance_expiration || '',
      status: equip.status || 'operational',
      notes: equip.notes || '',
      description: equip.description || '',
      ownership: equip.ownership || 'business',
    });
    setEditingEquipment(equip);
    setShowEquipmentModal(true);
  };

  const saveEquipment = async () => {
    if (!equipmentForm.name.trim()) return;

    try {
      const equipmentData: any = {
        name: equipmentForm.name.trim(),
        equipment_type: equipmentForm.equipment_type,
        year: equipmentForm.year ? parseInt(equipmentForm.year) : null,
        make: equipmentForm.make || null,
        model: equipmentForm.model || null,
        vin: equipmentForm.vin || null,
        license_plate: equipmentForm.license_plate || null,
        acquisition_date: equipmentForm.acquisition_date || null,
        mileage_hours: equipmentForm.mileage_hours ? parseInt(equipmentForm.mileage_hours) : null,
        registration_date: equipmentForm.registration_date || null,
        registration_renewal_date: equipmentForm.registration_renewal_date || null,
        insurance_expiration: equipmentForm.insurance_expiration || null,
        status: equipmentForm.status,
        notes: equipmentForm.notes || null,
        description: equipmentForm.description || null,
        ownership: equipmentForm.ownership || null,
      };

      if (editingEquipment) {
        const { error } = await supabase
          .from('equipment')
          .update(equipmentData)
          .eq('id', editingEquipment.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('equipment')
          .insert([equipmentData]);

        if (error) {
          if (error.code === '23505') {
            alert('Equipment with this name already exists.');
            return;
          }
          throw error;
        }
      }

      setShowEquipmentModal(false);
      resetEquipmentForm();
      loadEquipment();

      // Refresh selected equipment if we just edited it
      if (editingEquipment && selectedEquipment?.id === editingEquipment.id) {
        const { data } = await supabase
          .from('equipment')
          .select('*')
          .eq('id', editingEquipment.id)
          .single();
        if (data) setSelectedEquipment(data);
      }
    } catch (error) {
      console.error('Error saving equipment:', error);
      alert('Error saving equipment. Please try again.');
    }
  };

  const removeEquipment = async (equipName: string) => {
    if (!window.confirm(`Remove ${equipName} from equipment list? This will not delete any tasks associated with it.`)) return;

    try {
      const { error } = await supabase
        .from('equipment')
        .delete()
        .eq('name', equipName);

      if (error) throw error;
      loadEquipment();
    } catch (error) {
      console.error('Error removing equipment:', error);
      alert('Error removing equipment. Please try again.');
    }
  };

  const getEquipmentStatusColor = (status: string) => {
    const statusInfo = equipmentStatuses.find(s => s.id === status);
    return statusInfo?.color || 'bg-slate-500';
  };

  const getEquipmentStatusLabel = (status: string) => {
    const statusInfo = equipmentStatuses.find(s => s.id === status);
    return statusInfo?.label || 'Unknown';
  };

  const getEquipmentIcon = (type: string) => {
    switch (type) {
      case 'vehicle':
        return <Truck size={20} />;
      case 'hangar-door':
        return <Warehouse size={20} />;
      case 'fuel-farm':
        return <Fuel size={20} />;
      case 'runway-lights':
        return <Lightbulb size={20} />;
      case 'hvac':
        return <Wind size={20} />;
      case 'boiler':
        return <Flame size={20} />;
      case 'facility':
        return <Building2 size={20} />;
      default:
        return <Wrench size={20} />;
    }
  };

  const getEquipmentTypeLabel = (type: string) => {
    const allTypes = [...vehicleEquipmentTypes, ...facilityTypes];
    return allTypes.find(t => t.id === type)?.label || type;
  };

  const getOwnershipLabel = (ownership: string | null) => {
    if (!ownership) return null;
    return ownershipOptions.find(o => o.id === ownership)?.label || ownership;
  };

  // Get all tasks (including completed) for equipment-related queries
  const getAllTasks = () => tasks;

  // Get tasks for equipment status sheet (includes services and fuel quality control)
  const getUpcomingServices = (equipmentName: string) => {
    return tasks.filter(t =>
      t.equipment === equipmentName &&
      (t.category === 'services' || t.category === 'fuel-qc') &&
      t.status !== 'completed'
    );
  };

  const getCurrentFaults = (equipmentName: string) => {
    return tasks.filter(t =>
      t.equipment === equipmentName &&
      t.category === 'faults' &&
      t.status !== 'completed'
    );
  };

  const getServiceHistory = (equipmentName: string) => {
    return tasks.filter(t =>
      t.equipment === equipmentName &&
      (t.category === 'services' || t.category === 'fuel-qc') &&
      t.status === 'completed'
    ).sort((a, b) => {
      const dateA = a.completed_at ? new Date(a.completed_at).getTime() : 0;
      const dateB = b.completed_at ? new Date(b.completed_at).getTime() : 0;
      return dateB - dateA;
    });
  };

  const getFaultHistory = (equipmentName: string) => {
    return tasks.filter(t =>
      t.equipment === equipmentName &&
      t.category === 'faults' &&
      t.status === 'completed'
    ).sort((a, b) => {
      const dateA = a.completed_at ? new Date(a.completed_at).getTime() : 0;
      const dateB = b.completed_at ? new Date(b.completed_at).getTime() : 0;
      return dateB - dateA;
    });
  };

  const isDateExpiringSoon = (dateStr: string | null, daysThreshold: number = 30) => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    const today = new Date();
    const daysUntil = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntil >= 0 && daysUntil <= daysThreshold;
  };

  const isDateExpired = (dateStr: string | null) => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    const today = new Date();
    return date < today;
  };

  const getFilteredTasks = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const monthFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Don't filter tasks when on equipment tab
    if (activeTab === 'equipment') return [];

    let filtered = tasks.filter(task => {
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
      if (filters.dueDate !== 'all' && task.due_date) {
        const dueDate = new Date(task.due_date);
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

    // Sort based on sort mode
    if (sortBy === 'date') {
      filtered = filtered.sort((a, b) => {
        const dateA = a.due_date ? new Date(a.due_date).getTime() : Infinity;
        const dateB = b.due_date ? new Date(b.due_date).getTime() : Infinity;
        return dateA - dateB;
      });
    } else {
      // Sort by display_order (custom order)
      filtered = filtered.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    }

    return filtered;
  };

  const getDayOfWeekLabel = (dayIndex: number | null) => {
    if (dayIndex === null) return '';
    return daysOfWeek.find(d => d.id === dayIndex)?.label || '';
  };

  const getCategoryInfo = (id: string) => categories.find(c => c.id === id);
  const getPriorityInfo = (id: string) => priorities.find(p => p.id === id);
  const getStatusLabel = (id: string) => statuses.find(s => s.id === id)?.label;

  const filteredTasks = getFilteredTasks();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 via-cyan-50 to-gray-100 flex items-center justify-center">
        <div className="text-gray-700 text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-cyan-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gray-700 rounded-xl shadow-lg p-6 mb-6 border border-cyan-100">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">Airport Operations Task Tracker</h1>
              <p className="text-gray-400">Manage tasks, track progress, and maintain operations</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSettingsModal(true)}
                className="flex items-center gap-2 bg-gray-400 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-500 transition-all shadow border border-gray-600"
              >
                <Settings size={20} />
                Settings
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 bg-gray-400 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-500 transition-all shadow border border-gray-600"
              >
                <Printer size={20} />
                Print
              </button>
              <button
                onClick={() => openAddTask()}
                className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white px-4 py-2 rounded-lg hover:from-cyan-400 hover:to-cyan-500 transition-all shadow-lg"
              >
                <Plus size={20} />
                Add Task
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex justify-center gap-3 py-2 no-print">
            <button
              onClick={() => { setActiveTab('active'); setSelectedEquipment(null); }}
              className={`px-6 py-3 font-semibold rounded-xl transition-all duration-200 shadow ${
                activeTab === 'active'
                  ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white shadow-lg shadow-cyan-500/20 scale-105'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-500 hover:text-white hover:shadow-md border border-gray-600'
              }`}
            >
              Active Tasks ({tasks.filter(t => t.status !== 'completed').length})
            </button>
            <button
              onClick={() => { setActiveTab('equipment'); setSelectedEquipment(null); }}
              className={`px-6 py-3 font-semibold rounded-xl transition-all duration-200 shadow flex items-center gap-2 ${
                activeTab === 'equipment'
                  ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-lg shadow-cyan-500/20 scale-105'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-500 hover:text-white hover:shadow-md border border-gray-600'
              }`}
            >
              <Truck size={18} />
              Equipment & Facilities ({equipmentList.length})
            </button>
            <button
              onClick={() => { setActiveTab('completed'); setSelectedEquipment(null); }}
              className={`px-6 py-3 font-semibold rounded-xl transition-all duration-200 shadow ${
                activeTab === 'completed'
                  ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-lg shadow-teal-500/20 scale-105'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-500 hover:text-white hover:shadow-md border border-gray-600'
              }`}
            >
              Completed Tasks ({tasks.filter(t => t.status === 'completed').length})
            </button>
          </div>

          {/* Print header */}
          <div className="print-only">
            <h2 className="text-xl font-bold mb-2">
              {activeTab === 'active' ? 'Active Tasks' : activeTab === 'completed' ? 'Completed Tasks' : selectedEquipment ? `Equipment Status Sheet: ${selectedEquipment.name}` : 'Equipment & Facilities'}
            </h2>
            <p className="text-sm mb-2">Printed: {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
          </div>
        </div>

        {/* Filters and Tasks List - only show on task tabs */}
        {activeTab !== 'equipment' && (
        <>
        <div className="bg-gray-700 rounded-xl shadow p-4 mb-6 border border-gray-600 no-print">
          <div className="flex flex-wrap gap-3">
            <select
              value={filters.category}
              onChange={(e) => setFilters({...filters, category: e.target.value})}
              className="bg-gray-400 border border-gray-600 text-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
            >
              <option value="all">All Categories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>

            <select
              value={filters.priority}
              onChange={(e) => setFilters({...filters, priority: e.target.value})}
              className="bg-gray-400 border border-gray-600 text-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
            >
              <option value="all">All Priorities</option>
              {priorities.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>

            <select
              value={filters.assignee}
              onChange={(e) => setFilters({...filters, assignee: e.target.value})}
              className="bg-gray-400 border border-gray-600 text-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
            >
              <option value="all">All Team Members</option>
              {teamMembers.map(m => <option key={m} value={m}>{m}</option>)}
            </select>

            <select
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="bg-gray-400 border border-gray-600 text-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
            >
              <option value="all">All Statuses</option>
              {statuses.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>

            <select
              value={filters.equipment}
              onChange={(e) => setFilters({...filters, equipment: e.target.value})}
              className="bg-gray-400 border border-gray-600 text-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
            >
              <option value="all">All Equipment</option>
              {equipmentList.map(e => <option key={e.id} value={e.name}>{e.name}</option>)}
            </select>

            <select
              value={filters.dueDate}
              onChange={(e) => setFilters({...filters, dueDate: e.target.value})}
              className="bg-gray-400 border border-gray-600 text-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
            >
              <option value="all">All Due Dates</option>
              <option value="today">Due Today</option>
              <option value="week">Due This Week</option>
              <option value="month">Due This Month</option>
            </select>

            <button
              onClick={toggleSortMode}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                sortBy === 'date'
                  ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white shadow-lg'
                  : 'bg-gray-400 text-gray-300 hover:bg-gray-500 border border-gray-600'
              }`}
              title={sortBy === 'date' ? 'Click to enable custom order (drag & drop)' : 'Click to sort by due date'}
            >
              <ArrowUpDown size={16} />
              {sortBy === 'date' ? 'Sorted by Date' : 'Custom Order'}
            </button>
          </div>
        </div>

        {/* Tasks List */}
        <div className="space-y-4">
          {filteredTasks.length === 0 ? (
            <div className="bg-gray-700 rounded-xl p-12 text-center border border-gray-600 shadow">
              <p className="text-gray-400 text-lg">No tasks found</p>
            </div>
          ) : (
            filteredTasks.map(task => {
              const categoryInfo = getCategoryInfo(task.category);
              const priorityInfo = getPriorityInfo(task.priority);
              const isMajorTask = task.is_major_task;
              const hasSubtasks = task.subtasks && task.subtasks.length > 0;
              const completedSubtasks = hasSubtasks ? task.subtasks!.filter(st => st.status === 'completed').length : 0;

              return (
                <div
                  key={task.id}
                  draggable={sortBy === 'custom'}
                  onDragStart={(e) => handleTaskDragStart(e, task)}
                  onDragOver={handleTaskDragOver}
                  onDrop={(e) => handleTaskDrop(e, task)}
                  onDragEnd={handleTaskDragEnd}
                  className={`rounded-xl shadow ${isMajorTask ? 'border-2 border-amber-400 bg-gradient-to-br from-amber-50 to-white' : 'bg-gray-700 border border-gray-600'} hover:border-cyan-300 hover:shadow-md transition-all task-card ${draggedTask?.id === task.id ? 'opacity-50' : ''}`}
                >
                  <div className="p-5">
                    <div className="flex items-start gap-4">
                      {/* Drag Handle */}
                      {sortBy === 'custom' && (
                        <div className="cursor-move text-gray-400 hover:text-gray-300 transition-colors no-print pt-1">
                          <GripVertical size={20} />
                        </div>
                      )}

                      <div className="flex-1">
                        {/* Title at the top */}
                        <h3 className="text-lg font-semibold text-white mb-3">{task.title}</h3>

                        {/* Badges */}
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          {isMajorTask && (
                            <span className="badge bg-gradient-to-r from-amber-600 to-orange-600 text-white px-3 py-1 rounded-lg text-sm font-bold shadow-lg">
                              ⭐ MAJOR TASK
                            </span>
                          )}
                          <span className={`badge ${categoryInfo?.color} text-white px-3 py-1 rounded-lg text-xs font-semibold`}>
                            {categoryInfo?.label}
                          </span>
                          <span className={`badge ${priorityInfo?.color} text-white px-3 py-1 rounded-lg text-xs font-semibold`}>
                            {priorityInfo?.label}
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
                          {task.is_recurring && (
                            <span className="badge bg-purple-600 text-white px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1">
                              <Repeat size={12} />
                              {task.recurring_interval}
                            </span>
                          )}
                          {task.due_date && (
                            <span className="badge bg-gray-4000 text-white px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1">
                              <Calendar size={12} />
                              {new Date(task.due_date).toLocaleDateString()}
                            </span>
                          )}
                        </div>

                        {/* Notes */}
                        {task.notes && (
                          <p className="text-gray-400 text-sm mb-3">{task.notes}</p>
                        )}

                      {/* Major Task Progress */}
                      {isMajorTask && hasSubtasks && (
                        <div className="mb-3 bg-amber-50 rounded-lg p-3 border border-amber-300">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-amber-700 font-semibold text-sm">Subtask Progress</span>
                            <span className="text-amber-700 text-sm">{completedSubtasks} / {task.subtasks!.length}</span>
                          </div>
                          <div className="w-full bg-amber-100 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-amber-400 to-orange-400 h-2 rounded-full transition-all"
                              style={{ width: `${(completedSubtasks / task.subtasks!.length) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      )}

                      {/* Status Buttons */}
                      <div className="flex items-center gap-2 flex-wrap no-print">
                        {statuses.map(status => (
                          <button
                            key={status.id}
                            onClick={() => updateTaskStatus(task.id, status.id)}
                            className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                              task.status === status.id
                                ? 'bg-cyan-500 text-white shadow-lg'
                                : 'bg-gray-400 text-gray-300 hover:bg-gray-500 border border-gray-600'
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
                        <div className="mt-2 text-gray-400 text-sm">
                          💬 {task.remarks.length} remark{task.remarks.length !== 1 ? 's' : ''}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 no-print">
                      {isMajorTask && (
                        <button
                          onClick={() => openAddTask(task.id)}
                          className="text-emerald-600 hover:text-emerald-700 p-2 hover:bg-emerald-50 rounded-lg transition-all flex items-center gap-1"
                          title="Add Subtask"
                        >
                          <Plus size={20} />
                          <span className="text-sm">Subtask</span>
                        </button>
                      )}
                      <button
                        onClick={() => openRemarksModal(task)}
                        className="text-cyan-600 hover:text-cyan-700 p-2 hover:bg-cyan-50 rounded-lg transition-all"
                        title="View/Add Remarks"
                      >
                        <MessageSquare size={20} />
                      </button>
                      <button
                        onClick={() => openEditTask(task)}
                        className="text-blue-600 hover:text-blue-700 p-2 hover:bg-blue-50 rounded-lg transition-all"
                        title="Edit Task"
                      >
                        <Edit2 size={20} />
                      </button>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="text-red-500 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-all"
                        title="Delete Task"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Subtasks */}
                {hasSubtasks && (
                  <div className="ml-8 mt-2 space-y-2">
                    {task.subtasks!.map(subtask => {
                      const subCategoryInfo = getCategoryInfo(subtask.category);
                      const subPriorityInfo = getPriorityInfo(subtask.priority);

                      return (
                        <div
                          key={subtask.id}
                          draggable={sortBy === 'custom'}
                          onDragStart={(e) => handleSubtaskDragStart(e, subtask)}
                          onDragOver={handleSubtaskDragOver}
                          onDrop={(e) => handleSubtaskDrop(e, subtask, task)}
                          onDragEnd={handleSubtaskDragEnd}
                          className={`bg-gray-400 rounded-lg p-4 border-l-4 border-cyan-400 shadow-sm ${draggedSubtask?.id === subtask.id ? 'opacity-50' : ''}`}
                        >
                          <div className="flex items-start gap-4">
                            {/* Drag Handle for Subtasks */}
                            {sortBy === 'custom' && (
                              <div className="cursor-move text-gray-400 hover:text-gray-300 transition-colors no-print pt-1">
                                <GripVertical size={16} />
                              </div>
                            )}

                            <div className="flex-1">
                              {/* Subtask Title at the top */}
                              <h4 className="text-white font-semibold mb-2">{subtask.title}</h4>

                              {/* Badges */}
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <span className="badge bg-cyan-600 text-white px-2 py-1 rounded text-xs font-semibold">
                                  📎 SUBTASK
                                </span>
                                <span className={`badge ${subCategoryInfo?.color} text-white px-2 py-1 rounded text-xs font-semibold`}>
                                  {subCategoryInfo?.label}
                                </span>
                                <span className={`badge ${subPriorityInfo?.color} text-white px-2 py-1 rounded text-xs font-semibold`}>
                                  {subPriorityInfo?.label}
                                </span>
                                {subtask.assignee && (
                                  <span className="badge bg-indigo-600 text-white px-2 py-1 rounded text-xs font-semibold">
                                    👤 {subtask.assignee}
                                  </span>
                                )}
                              </div>

                              {/* Notes */}
                              {subtask.notes && (
                                <p className="text-gray-400 text-sm mb-2">{subtask.notes}</p>
                              )}

                              {/* Subtask Status Buttons */}
                              <div className="flex items-center gap-2 flex-wrap no-print">
                                {statuses.map(status => (
                                  <button
                                    key={status.id}
                                    onClick={() => updateTaskStatus(subtask.id, status.id)}
                                    className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                                      subtask.status === status.id
                                        ? 'bg-cyan-500 text-white shadow'
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-500 border border-gray-600'
                                    }`}
                                  >
                                    {status.label}
                                  </button>
                                ))}
                              </div>

                              {/* Print-only status for subtasks */}
                              <div className="print-only">
                                <p className="text-sm mt-2"><strong>Status:</strong> {getStatusLabel(subtask.status)}</p>
                              </div>
                            </div>

                            {/* Subtask Action Buttons */}
                            <div className="flex gap-2 no-print">
                              <button
                                onClick={() => openRemarksModal(subtask)}
                                className="text-cyan-600 hover:text-cyan-700 p-2 hover:bg-cyan-50 rounded-lg transition-all"
                                title="View/Add Remarks"
                              >
                                <MessageSquare size={16} />
                              </button>
                              <button
                                onClick={() => openEditTask(subtask)}
                                className="text-blue-600 hover:text-blue-700 p-2 hover:bg-blue-50 rounded-lg transition-all"
                                title="Edit Subtask"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() => deleteTask(subtask.id)}
                                className="text-red-500 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-all"
                                title="Delete Subtask"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              );
            })
          )}
        </div>
        </>
        )}

        {/* Equipment List View */}
        {activeTab === 'equipment' && !selectedEquipment && (
          <div className="space-y-4">
            {/* Filter Tabs */}
            <div className="bg-gray-700 rounded-xl p-4 border border-gray-600 shadow">
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setEquipmentViewFilter('all')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    equipmentViewFilter === 'all'
                      ? 'bg-cyan-500 text-white shadow'
                      : 'bg-gray-400 text-gray-300 hover:bg-gray-500'
                  }`}
                >
                  All ({equipmentList.length})
                </button>
                <button
                  onClick={() => setEquipmentViewFilter('equipment')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                    equipmentViewFilter === 'equipment'
                      ? 'bg-cyan-500 text-white shadow'
                      : 'bg-gray-400 text-gray-300 hover:bg-gray-500'
                  }`}
                >
                  <Truck size={16} />
                  Equipment ({equipmentList.filter(e => !isFacilityType(e.equipment_type)).length})
                </button>
                <button
                  onClick={() => setEquipmentViewFilter('facilities')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                    equipmentViewFilter === 'facilities'
                      ? 'bg-cyan-500 text-white shadow'
                      : 'bg-gray-400 text-gray-300 hover:bg-gray-500'
                  }`}
                >
                  <Building2 size={16} />
                  Facilities ({equipmentList.filter(e => isFacilityType(e.equipment_type)).length})
                </button>
              </div>
            </div>

            {/* Equipment/Facilities Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {equipmentList
                .filter(equip => {
                  if (equipmentViewFilter === 'all') return true;
                  if (equipmentViewFilter === 'equipment') return !isFacilityType(equip.equipment_type);
                  if (equipmentViewFilter === 'facilities') return isFacilityType(equip.equipment_type);
                  return true;
                })
                .map(equip => {
                const upcomingServices = getUpcomingServices(equip.name);
                const currentFaults = getCurrentFaults(equip.name);
                const hasAlerts = isDateExpiringSoon(equip.registration_renewal_date) ||
                                 isDateExpiringSoon(equip.insurance_expiration) ||
                                 isDateExpired(equip.registration_renewal_date) ||
                                 isDateExpired(equip.insurance_expiration);
                const isFacility = isFacilityType(equip.equipment_type);

                return (
                  <div
                    key={equip.id}
                    onClick={() => setSelectedEquipment(equip)}
                    className={`bg-gray-700 rounded-xl p-5 border shadow-sm ${isFacility ? 'border-teal-200 hover:border-teal-400' : 'border-gray-600 hover:border-cyan-400'} cursor-pointer transition-all hover:shadow-md`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={isFacility ? 'text-teal-500' : 'text-cyan-500'}>
                          {getEquipmentIcon(equip.equipment_type)}
                        </div>
                        <div>
                          <h3 className="text-white font-semibold">{equip.name}</h3>
                          <p className="text-gray-400 text-sm">{getEquipmentTypeLabel(equip.equipment_type)}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold text-white ${getEquipmentStatusColor(equip.status)}`}>
                        {getEquipmentStatusLabel(equip.status)}
                      </span>
                    </div>

                    {/* Ownership for facilities */}
                    {isFacility && equip.ownership && (
                      <div className="mb-2 text-sm">
                        <span className="text-gray-400">Owner: </span>
                        <span className="text-gray-700">{getOwnershipLabel(equip.ownership)}</span>
                      </div>
                    )}

                    {/* Quick Stats */}
                    <div className="flex gap-4 text-sm">
                      {upcomingServices.length > 0 && (
                        <span className="text-cyan-600 flex items-center gap-1">
                          <Clock size={14} />
                          {upcomingServices.length} service{upcomingServices.length !== 1 ? 's' : ''}
                        </span>
                      )}
                      {currentFaults.length > 0 && (
                        <span className="text-red-500 flex items-center gap-1">
                          <AlertTriangle size={14} />
                          {currentFaults.length} fault{currentFaults.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>

                    {/* Alert Badge */}
                    {hasAlerts && (
                      <div className="mt-3 flex items-center gap-2 text-amber-600 text-sm">
                        <AlertTriangle size={14} />
                        <span>Expiration alert</span>
                      </div>
                    )}
                  </div>
                );
              })}

              {equipmentList.filter(equip => {
                if (equipmentViewFilter === 'all') return true;
                if (equipmentViewFilter === 'equipment') return !isFacilityType(equip.equipment_type);
                if (equipmentViewFilter === 'facilities') return isFacilityType(equip.equipment_type);
                return true;
              }).length === 0 && (
                <div className="col-span-full bg-gray-700 rounded-xl p-12 text-center border border-gray-600 shadow">
                  {equipmentViewFilter === 'facilities' ? (
                    <>
                      <Building2 size={48} className="mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-300 text-lg mb-2">No facilities added yet</p>
                      <p className="text-gray-400 text-sm mb-4">Add facilities like hangar doors, fuel farms, or HVAC systems</p>
                    </>
                  ) : equipmentViewFilter === 'equipment' ? (
                    <>
                      <Truck size={48} className="mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-300 text-lg mb-2">No equipment added yet</p>
                      <p className="text-gray-400 text-sm mb-4">Add vehicles, trucks, or other equipment</p>
                    </>
                  ) : (
                    <>
                      <Truck size={48} className="mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-300 text-lg mb-2">No equipment or facilities added yet</p>
                      <p className="text-gray-400 text-sm mb-4">Add equipment via Settings to start tracking</p>
                    </>
                  )}
                  <button
                    onClick={() => setShowSettingsModal(true)}
                    className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white px-4 py-2 rounded-lg hover:from-cyan-400 hover:to-cyan-500 transition-colors shadow"
                  >
                    Open Settings
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Equipment Status Sheet View */}
        {activeTab === 'equipment' && selectedEquipment && (
          <div className="space-y-6">
            {/* Back Button and Header */}
            <div className={`bg-gray-700 rounded-xl p-6 border shadow ${isFacilityType(selectedEquipment.equipment_type) ? 'border-teal-200' : 'border-gray-600'}`}>
              <button
                onClick={() => setSelectedEquipment(null)}
                className="flex items-center gap-2 text-gray-400 hover:text-gray-700 mb-4 transition-colors"
              >
                <ChevronLeft size={20} />
                Back to {isFacilityType(selectedEquipment.equipment_type) ? 'Facilities' : 'Equipment'} List
              </button>

              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className={isFacilityType(selectedEquipment.equipment_type) ? 'text-teal-500' : 'text-cyan-500'}>
                    {getEquipmentIcon(selectedEquipment.equipment_type)}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">{selectedEquipment.name}</h2>
                    <p className="text-gray-400">{getEquipmentTypeLabel(selectedEquipment.equipment_type)}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold text-white ${getEquipmentStatusColor(selectedEquipment.status)}`}>
                    {getEquipmentStatusLabel(selectedEquipment.status)}
                  </span>
                </div>
                <button
                  onClick={() => openEditEquipment(selectedEquipment)}
                  className="flex items-center gap-2 bg-gray-400 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-500 transition-colors border border-gray-600"
                >
                  <Edit2 size={18} />
                  Edit
                </button>
              </div>

              {/* Alert Badges */}
              {(isDateExpiringSoon(selectedEquipment.registration_renewal_date) ||
                isDateExpired(selectedEquipment.registration_renewal_date) ||
                isDateExpiringSoon(selectedEquipment.insurance_expiration) ||
                isDateExpired(selectedEquipment.insurance_expiration)) && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {isDateExpired(selectedEquipment.registration_renewal_date) && (
                    <span className="bg-red-500 text-white px-3 py-1 rounded-lg text-sm font-semibold flex items-center gap-1">
                      <AlertTriangle size={14} />
                      Registration Expired
                    </span>
                  )}
                  {!isDateExpired(selectedEquipment.registration_renewal_date) && isDateExpiringSoon(selectedEquipment.registration_renewal_date) && (
                    <span className="bg-amber-500 text-white px-3 py-1 rounded-lg text-sm font-semibold flex items-center gap-1">
                      <AlertTriangle size={14} />
                      Registration Expiring Soon
                    </span>
                  )}
                  {isDateExpired(selectedEquipment.insurance_expiration) && (
                    <span className="bg-red-500 text-white px-3 py-1 rounded-lg text-sm font-semibold flex items-center gap-1">
                      <AlertTriangle size={14} />
                      Insurance Expired
                    </span>
                  )}
                  {!isDateExpired(selectedEquipment.insurance_expiration) && isDateExpiringSoon(selectedEquipment.insurance_expiration) && (
                    <span className="bg-amber-500 text-white px-3 py-1 rounded-lg text-sm font-semibold flex items-center gap-1">
                      <AlertTriangle size={14} />
                      Insurance Expiring Soon
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Admin Data Section */}
            <div className={`bg-gray-700 rounded-xl p-6 border shadow ${isFacilityType(selectedEquipment.equipment_type) ? 'border-teal-200' : 'border-gray-600'}`}>
              <h3 className="text-lg font-semibold text-white mb-4">
                {isFacilityType(selectedEquipment.equipment_type) ? 'Facility Details' : 'Equipment Details'}
              </h3>

              {/* Facility-specific fields */}
              {isFacilityType(selectedEquipment.equipment_type) && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-gray-400 text-sm">Type</p>
                      <p className="text-white">{getEquipmentTypeLabel(selectedEquipment.equipment_type)}</p>
                    </div>
                    {selectedEquipment.ownership && (
                      <div>
                        <p className="text-gray-400 text-sm">Ownership</p>
                        <p className="text-white">{getOwnershipLabel(selectedEquipment.ownership)}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-gray-400 text-sm">Condition</p>
                      <p className="text-white">{getEquipmentStatusLabel(selectedEquipment.status)}</p>
                    </div>
                    {selectedEquipment.acquisition_date && (
                      <div>
                        <p className="text-gray-400 text-sm">Acquisition Date</p>
                        <p className="text-white">{new Date(selectedEquipment.acquisition_date).toLocaleDateString()}</p>
                      </div>
                    )}
                  </div>
                  {selectedEquipment.description && (
                    <div>
                      <p className="text-gray-400 text-sm">Description</p>
                      <p className="text-white">{selectedEquipment.description}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Equipment-specific fields */}
              {!isFacilityType(selectedEquipment.equipment_type) && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {selectedEquipment.year && (
                    <div>
                      <p className="text-gray-400 text-sm">Year</p>
                      <p className="text-white">{selectedEquipment.year}</p>
                    </div>
                  )}
                  {selectedEquipment.make && (
                    <div>
                      <p className="text-gray-400 text-sm">Make</p>
                      <p className="text-white">{selectedEquipment.make}</p>
                    </div>
                  )}
                  {selectedEquipment.model && (
                    <div>
                      <p className="text-gray-400 text-sm">Model</p>
                      <p className="text-white">{selectedEquipment.model}</p>
                    </div>
                  )}
                  {selectedEquipment.vin && (
                    <div>
                      <p className="text-gray-400 text-sm">VIN</p>
                      <p className="text-white font-mono text-sm">{selectedEquipment.vin}</p>
                    </div>
                  )}
                  {selectedEquipment.license_plate && (
                    <div>
                      <p className="text-gray-400 text-sm">License Plate</p>
                      <p className="text-white">{selectedEquipment.license_plate}</p>
                    </div>
                  )}
                  {selectedEquipment.mileage_hours && (
                    <div>
                      <p className="text-gray-400 text-sm">Mileage/Hours</p>
                      <p className="text-white">{selectedEquipment.mileage_hours.toLocaleString()}</p>
                    </div>
                  )}
                  {selectedEquipment.acquisition_date && (
                    <div>
                      <p className="text-gray-400 text-sm">Acquisition Date</p>
                      <p className="text-white">{new Date(selectedEquipment.acquisition_date).toLocaleDateString()}</p>
                    </div>
                  )}
                  {selectedEquipment.registration_date && (
                    <div>
                      <p className="text-gray-400 text-sm">Registration Date</p>
                      <p className="text-white">{new Date(selectedEquipment.registration_date).toLocaleDateString()}</p>
                    </div>
                  )}
                  {selectedEquipment.registration_renewal_date && (
                    <div>
                      <p className="text-gray-400 text-sm">Registration Renewal</p>
                      <p className={`${isDateExpired(selectedEquipment.registration_renewal_date) ? 'text-red-400' : isDateExpiringSoon(selectedEquipment.registration_renewal_date) ? 'text-amber-400' : 'text-white'}`}>
                        {new Date(selectedEquipment.registration_renewal_date).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  {selectedEquipment.insurance_expiration && (
                    <div>
                      <p className="text-gray-400 text-sm">Insurance Expiration</p>
                      <p className={`${isDateExpired(selectedEquipment.insurance_expiration) ? 'text-red-400' : isDateExpiringSoon(selectedEquipment.insurance_expiration) ? 'text-amber-400' : 'text-white'}`}>
                        {new Date(selectedEquipment.insurance_expiration).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {selectedEquipment.notes && (
                <div className="mt-4">
                  <p className="text-gray-400 text-sm">Notes</p>
                  <p className="text-white">{selectedEquipment.notes}</p>
                </div>
              )}

              {/* Replacement Parts Button */}
              <div className="mt-6 pt-4 border-t border-gray-600 flex justify-center">
                <button
                  onClick={() => {
                    loadEquipmentParts(selectedEquipment.id);
                    setShowPartsModal(true);
                  }}
                  className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-amber-500/30 hover:scale-105 hover:shadow-xl"
                >
                  <Package size={20} />
                  Replacement Part Numbers
                </button>
              </div>
            </div>

            {/* Upcoming Services */}
            <div className="bg-gray-700 rounded-xl p-6 border border-gray-600">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Clock size={20} className="text-blue-400" />
                Upcoming Services and Inspections ({getUpcomingServices(selectedEquipment.name).length})
              </h3>
              {getUpcomingServices(selectedEquipment.name).length > 0 ? (
                <div className="space-y-3">
                  {getUpcomingServices(selectedEquipment.name).map(task => (
                    <div key={task.id} className="bg-gray-400 rounded-lg p-4 flex justify-between items-center">
                      <div>
                        <p className="text-white font-medium">{task.title}</p>
                        <div className="flex gap-2 mt-1">
                          {task.due_date && (
                            <span className="text-gray-400 text-sm flex items-center gap-1">
                              <Calendar size={12} />
                              {new Date(task.due_date).toLocaleDateString()}
                            </span>
                          )}
                          <span className="text-gray-400 text-sm">{getStatusLabel(task.status)}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => openEditTask(task)}
                        className="text-blue-400 hover:text-blue-300 p-2 hover:bg-gray-500 rounded-lg transition-all"
                      >
                        <Edit2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400">No upcoming services scheduled</p>
              )}
            </div>

            {/* Current Faults */}
            <div className="bg-gray-700 rounded-xl p-6 border border-gray-600">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <AlertTriangle size={20} className="text-red-400" />
                Current Faults ({getCurrentFaults(selectedEquipment.name).length})
              </h3>
              {getCurrentFaults(selectedEquipment.name).length > 0 ? (
                <div className="space-y-3">
                  {getCurrentFaults(selectedEquipment.name).map(task => (
                    <div key={task.id} className="bg-gray-400 rounded-lg p-4 flex justify-between items-center border-l-4 border-red-500">
                      <div>
                        <p className="text-white font-medium">{task.title}</p>
                        <div className="flex gap-2 mt-1">
                          {task.due_date && (
                            <span className="text-gray-400 text-sm flex items-center gap-1">
                              <Calendar size={12} />
                              {new Date(task.due_date).toLocaleDateString()}
                            </span>
                          )}
                          <span className="text-gray-400 text-sm">{getStatusLabel(task.status)}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => openEditTask(task)}
                        className="text-blue-400 hover:text-blue-300 p-2 hover:bg-gray-500 rounded-lg transition-all"
                      >
                        <Edit2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400">No current faults reported</p>
              )}
            </div>

            {/* Service History */}
            <div className="bg-gray-700 rounded-xl p-6 border border-gray-600">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <History size={20} className="text-green-400" />
                Service and Inspection History ({getServiceHistory(selectedEquipment.name).length})
              </h3>
              {getServiceHistory(selectedEquipment.name).length > 0 ? (
                <div className="space-y-3">
                  {getServiceHistory(selectedEquipment.name).slice(0, 10).map(task => (
                    <div key={task.id} className="bg-gray-400 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-white font-medium">{task.title}</p>
                          <p className="text-gray-400 text-sm mt-1">
                            Completed: {task.completed_at ? new Date(task.completed_at).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                        <span className="bg-green-600 text-white px-2 py-1 rounded text-xs">Completed</span>
                      </div>
                    </div>
                  ))}
                  {getServiceHistory(selectedEquipment.name).length > 10 && (
                    <p className="text-gray-400 text-sm text-center">
                      + {getServiceHistory(selectedEquipment.name).length - 10} more entries
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-gray-400">No service history</p>
              )}
            </div>

            {/* Fault History */}
            <div className="bg-gray-700 rounded-xl p-6 border border-gray-600">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <History size={20} className="text-amber-400" />
                Fault History ({getFaultHistory(selectedEquipment.name).length})
              </h3>
              {getFaultHistory(selectedEquipment.name).length > 0 ? (
                <div className="space-y-3">
                  {getFaultHistory(selectedEquipment.name).slice(0, 10).map(task => (
                    <div key={task.id} className="bg-gray-400 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-white font-medium">{task.title}</p>
                          <p className="text-gray-400 text-sm mt-1">
                            Resolved: {task.completed_at ? new Date(task.completed_at).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                        <span className="bg-green-600 text-white px-2 py-1 rounded text-xs">Resolved</span>
                      </div>
                    </div>
                  ))}
                  {getFaultHistory(selectedEquipment.name).length > 10 && (
                    <p className="text-gray-400 text-sm text-center">
                      + {getFaultHistory(selectedEquipment.name).length - 10} more entries
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-gray-400">No fault history</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Equipment Edit Modal */}
      {showEquipmentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`bg-gray-700 rounded-xl shadow-2xl max-w-2xl w-full border ${isFacilityType(equipmentForm.equipment_type) ? 'border-teal-200' : 'border-gray-600'} flex flex-col`} style={{maxHeight: 'calc(100vh - 4rem)'}}>
            <div className={`bg-gray-700 border-b ${isFacilityType(equipmentForm.equipment_type) ? 'border-teal-200' : 'border-gray-600'} p-6 flex justify-between items-center flex-shrink-0`}>
              <h2 className="text-2xl font-bold text-white">
                {editingEquipment
                  ? (isFacilityType(equipmentForm.equipment_type) ? 'Edit Facility' : 'Edit Equipment')
                  : (isFacilityType(equipmentForm.equipment_type) ? 'Add Facility' : 'Add Equipment')
                }
              </h2>
              <button
                onClick={() => setShowEquipmentModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4 flex-1" style={{overflowY: 'auto'}}>
              <div>
                <label className="block text-white font-medium mb-2">
                  {isFacilityType(equipmentForm.equipment_type) ? 'Facility Name *' : 'Equipment Name *'}
                </label>
                <input
                  type="text"
                  value={equipmentForm.name}
                  onChange={(e) => setEquipmentForm({...equipmentForm, name: e.target.value})}
                  placeholder={isFacilityType(equipmentForm.equipment_type) ? 'Enter facility name...' : 'Enter equipment name...'}
                  className="w-full bg-gray-400 border border-gray-500 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white font-medium mb-2">Type</label>
                  <select
                    value={equipmentForm.equipment_type}
                    onChange={(e) => setEquipmentForm({...equipmentForm, equipment_type: e.target.value})}
                    className="w-full bg-gray-400 border border-gray-500 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <optgroup label="Equipment">
                      {vehicleEquipmentTypes.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                    </optgroup>
                    <optgroup label="Facilities">
                      {facilityTypes.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">
                    {isFacilityType(equipmentForm.equipment_type) ? 'Condition' : 'Status'}
                  </label>
                  <select
                    value={equipmentForm.status}
                    onChange={(e) => setEquipmentForm({...equipmentForm, status: e.target.value})}
                    className="w-full bg-gray-400 border border-gray-500 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    {equipmentStatuses.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Facility-specific fields */}
              {isFacilityType(equipmentForm.equipment_type) && (
                <>
                  <div>
                    <label className="block text-white font-medium mb-2">Ownership</label>
                    <select
                      value={equipmentForm.ownership}
                      onChange={(e) => setEquipmentForm({...equipmentForm, ownership: e.target.value})}
                      className="w-full bg-gray-400 border border-gray-500 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                      {ownershipOptions.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-white font-medium mb-2">Description</label>
                    <textarea
                      value={equipmentForm.description}
                      onChange={(e) => setEquipmentForm({...equipmentForm, description: e.target.value})}
                      placeholder="Describe the facility, its purpose, and key details..."
                      rows={3}
                      className="w-full bg-gray-400 border border-gray-500 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-white font-medium mb-2">Acquisition Date</label>
                    <input
                      type="date"
                      value={equipmentForm.acquisition_date}
                      onChange={(e) => setEquipmentForm({...equipmentForm, acquisition_date: e.target.value})}
                      className="w-full bg-gray-400 border border-gray-500 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                </>
              )}

              {/* Equipment-specific fields */}
              {!isFacilityType(equipmentForm.equipment_type) && (
                <>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-white font-medium mb-2">Year</label>
                      <input
                        type="number"
                        value={equipmentForm.year}
                        onChange={(e) => setEquipmentForm({...equipmentForm, year: e.target.value})}
                        placeholder="e.g., 2020"
                        className="w-full bg-gray-400 border border-gray-500 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="block text-white font-medium mb-2">Make</label>
                      <input
                        type="text"
                        value={equipmentForm.make}
                        onChange={(e) => setEquipmentForm({...equipmentForm, make: e.target.value})}
                        placeholder="e.g., Ford"
                        className="w-full bg-gray-400 border border-gray-500 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="block text-white font-medium mb-2">Model</label>
                      <input
                        type="text"
                        value={equipmentForm.model}
                        onChange={(e) => setEquipmentForm({...equipmentForm, model: e.target.value})}
                        placeholder="e.g., F-550"
                        className="w-full bg-gray-400 border border-gray-500 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white font-medium mb-2">VIN</label>
                      <input
                        type="text"
                        value={equipmentForm.vin}
                        onChange={(e) => setEquipmentForm({...equipmentForm, vin: e.target.value})}
                        placeholder="Vehicle Identification Number"
                        className="w-full bg-gray-400 border border-gray-500 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="block text-white font-medium mb-2">License Plate</label>
                      <input
                        type="text"
                        value={equipmentForm.license_plate}
                        onChange={(e) => setEquipmentForm({...equipmentForm, license_plate: e.target.value})}
                        placeholder="e.g., ABC-1234"
                        className="w-full bg-gray-400 border border-gray-500 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white font-medium mb-2">Acquisition Date</label>
                      <input
                        type="date"
                        value={equipmentForm.acquisition_date}
                        onChange={(e) => setEquipmentForm({...equipmentForm, acquisition_date: e.target.value})}
                        className="w-full bg-gray-400 border border-gray-500 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="block text-white font-medium mb-2">Mileage/Hours</label>
                      <input
                        type="number"
                        value={equipmentForm.mileage_hours}
                        onChange={(e) => setEquipmentForm({...equipmentForm, mileage_hours: e.target.value})}
                        placeholder="Current mileage or hours"
                        className="w-full bg-gray-400 border border-gray-500 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-white font-medium mb-2">Registration Date</label>
                      <input
                        type="date"
                        value={equipmentForm.registration_date}
                        onChange={(e) => setEquipmentForm({...equipmentForm, registration_date: e.target.value})}
                        className="w-full bg-gray-400 border border-gray-500 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="block text-white font-medium mb-2">Registration Renewal</label>
                      <input
                        type="date"
                        value={equipmentForm.registration_renewal_date}
                        onChange={(e) => setEquipmentForm({...equipmentForm, registration_renewal_date: e.target.value})}
                        className="w-full bg-gray-400 border border-gray-500 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="block text-white font-medium mb-2">Insurance Expiration</label>
                      <input
                        type="date"
                        value={equipmentForm.insurance_expiration}
                        onChange={(e) => setEquipmentForm({...equipmentForm, insurance_expiration: e.target.value})}
                        className="w-full bg-gray-400 border border-gray-500 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-white font-medium mb-2">Notes</label>
                <textarea
                  value={equipmentForm.notes}
                  onChange={(e) => setEquipmentForm({...equipmentForm, notes: e.target.value})}
                  placeholder="Additional notes..."
                  rows={3}
                  className="w-full bg-gray-400 border border-gray-500 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>

            <div className={`sticky bottom-0 bg-gray-700 border-t ${isFacilityType(equipmentForm.equipment_type) ? 'border-teal-200' : 'border-gray-600'} p-4 flex justify-end gap-3 flex-shrink-0`}>
              <button
                onClick={() => setShowEquipmentModal(false)}
                className="bg-gray-400 text-white px-6 py-2 rounded-lg hover:bg-gray-500 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveEquipment}
                className={`text-white px-6 py-2 rounded-lg transition-colors ${
                  isFacilityType(equipmentForm.equipment_type)
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500'
                    : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500'
                }`}
              >
                {editingEquipment ? 'Save Changes' : (isFacilityType(equipmentForm.equipment_type) ? 'Add Facility' : 'Add Equipment')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-700 rounded-xl shadow-2xl max-w-2xl w-full border border-gray-600 flex flex-col" style={{maxHeight: 'calc(100vh - 4rem)'}}>
            <div className="bg-gray-700 border-b border-gray-600 p-6 flex justify-between items-center flex-shrink-0">
              <h2 className="text-2xl font-bold text-white">
                {editingTask ? 'Edit Task' : 'Add New Task'}
              </h2>
              <button
                onClick={() => setShowTaskModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
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
                  className="w-full bg-gray-400 border border-gray-500 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white font-medium mb-2">Category</label>
                  <select
                    value={taskForm.category}
                    onChange={(e) => setTaskForm({...taskForm, category: e.target.value})}
                    className="w-full bg-gray-400 border border-gray-500 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    {categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">Priority</label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({...taskForm, priority: e.target.value})}
                    className="w-full bg-gray-400 border border-gray-500 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
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
                    className="w-full bg-gray-400 border border-gray-500 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
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
                    className="w-full bg-gray-400 border border-gray-500 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
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
                  className="w-full bg-gray-400 border border-gray-500 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="">None</option>
                  {equipmentList.map(e => <option key={e.id} value={e.name}>{e.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-white font-medium mb-2">Due Date</label>
                <input
                  type="date"
                  value={taskForm.dueDate}
                  onChange={(e) => setTaskForm({...taskForm, dueDate: e.target.value})}
                  className="w-full bg-gray-400 border border-gray-500 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
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
                  <div className="space-y-3">
                    <select
                      value={taskForm.recurringInterval}
                      onChange={(e) => setTaskForm({...taskForm, recurringInterval: e.target.value})}
                      className="w-full bg-gray-400 border border-gray-500 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="annually">Annually</option>
                    </select>

                    {/* Day of week selector for weekly */}
                    {taskForm.recurringInterval === 'weekly' && (
                      <div>
                        <label className="block text-gray-300 text-sm mb-1">Repeat on</label>
                        <select
                          value={taskForm.recurringDayOfWeek ?? 1}
                          onChange={(e) => setTaskForm({...taskForm, recurringDayOfWeek: parseInt(e.target.value)})}
                          className="w-full bg-gray-400 border border-gray-500 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        >
                          {daysOfWeek.map(day => (
                            <option key={day.id} value={day.id}>{day.label}</option>
                          ))}
                        </select>
                        <p className="text-gray-400 text-xs mt-1">
                          Weekly on {getDayOfWeekLabel(taskForm.recurringDayOfWeek)}s
                        </p>
                      </div>
                    )}

                    {/* Day of month selector for monthly */}
                    {taskForm.recurringInterval === 'monthly' && (
                      <div>
                        <label className="block text-gray-300 text-sm mb-1">Repeat on day</label>
                        <select
                          value={taskForm.recurringDayOfMonth ?? 1}
                          onChange={(e) => setTaskForm({...taskForm, recurringDayOfMonth: parseInt(e.target.value)})}
                          className="w-full bg-gray-400 border border-gray-500 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        >
                          {daysOfMonth.map(day => (
                            <option key={day.id} value={day.id}>{day.label}</option>
                          ))}
                        </select>
                        <p className="text-gray-400 text-xs mt-1">
                          Monthly on the {taskForm.recurringDayOfMonth}{getOrdinalSuffix(taskForm.recurringDayOfMonth ?? 1)}
                        </p>
                      </div>
                    )}

                    {/* Quarterly: month of quarter + day */}
                    {taskForm.recurringInterval === 'quarterly' && (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-gray-300 text-sm mb-1">Month of quarter</label>
                          <select
                            value={taskForm.recurringMonth ?? 1}
                            onChange={(e) => setTaskForm({...taskForm, recurringMonth: parseInt(e.target.value)})}
                            className="w-full bg-gray-400 border border-gray-500 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                          >
                            {quarterMonths.map(qm => (
                              <option key={qm.id} value={qm.id}>{qm.label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-gray-300 text-sm mb-1">Day of month</label>
                          <select
                            value={taskForm.recurringDayOfMonth ?? 1}
                            onChange={(e) => setTaskForm({...taskForm, recurringDayOfMonth: parseInt(e.target.value)})}
                            className="w-full bg-gray-400 border border-gray-500 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                          >
                            {daysOfMonth.map(day => (
                              <option key={day.id} value={day.id}>{day.label}</option>
                            ))}
                          </select>
                        </div>
                        <p className="text-gray-400 text-xs">
                          Quarterly on the {taskForm.recurringDayOfMonth}{getOrdinalSuffix(taskForm.recurringDayOfMonth ?? 1)} of the {quarterMonths.find(q => q.id === taskForm.recurringMonth)?.label.split(' ')[0].toLowerCase()} month
                        </p>
                      </div>
                    )}

                    {/* Annually: month + day */}
                    {taskForm.recurringInterval === 'annually' && (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-gray-300 text-sm mb-1">Month</label>
                          <select
                            value={taskForm.recurringMonth ?? 1}
                            onChange={(e) => setTaskForm({...taskForm, recurringMonth: parseInt(e.target.value)})}
                            className="w-full bg-gray-400 border border-gray-500 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                          >
                            {monthsOfYear.map(month => (
                              <option key={month.id} value={month.id}>{month.label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-gray-300 text-sm mb-1">Day</label>
                          <select
                            value={taskForm.recurringDayOfMonth ?? 1}
                            onChange={(e) => setTaskForm({...taskForm, recurringDayOfMonth: parseInt(e.target.value)})}
                            className="w-full bg-gray-400 border border-gray-500 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                          >
                            {daysOfMonth.map(day => (
                              <option key={day.id} value={day.id}>{day.label}</option>
                            ))}
                          </select>
                        </div>
                        <p className="text-gray-400 text-xs">
                          Annually on {monthsOfYear.find(m => m.id === taskForm.recurringMonth)?.label} {taskForm.recurringDayOfMonth}{getOrdinalSuffix(taskForm.recurringDayOfMonth ?? 1)}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {!taskForm.parentTaskId && (
                <div>
                  <label className="flex items-center gap-2 text-white font-medium mb-2">
                    <input
                      type="checkbox"
                      checked={taskForm.isMajorTask}
                      onChange={(e) => setTaskForm({...taskForm, isMajorTask: e.target.checked})}
                      className="w-4 h-4 rounded"
                    />
                    Major Task (can have subtasks)
                  </label>
                  {taskForm.isMajorTask && (
                    <p className="text-sm text-gray-400 mt-1">
                      This task will be highlighted and can have multiple subtasks. It can only be completed when all subtasks are done.
                    </p>
                  )}
                </div>
              )}

              {taskForm.parentTaskId && (
                <div className="bg-cyan-900 border border-cyan-700 rounded-lg p-3">
                  <p className="text-cyan-200 text-sm font-medium">
                    This is a subtask of a major task
                  </p>
                </div>
              )}

              <div>
                <label className="block text-white font-medium mb-2">Notes</label>
                <textarea
                  value={taskForm.notes}
                  onChange={(e) => setTaskForm({...taskForm, notes: e.target.value})}
                  placeholder="Add additional details..."
                  rows={3}
                  className="w-full bg-gray-400 border border-gray-500 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-700 border-t border-gray-600 p-4 flex justify-end gap-3 flex-shrink-0">
              <button
                onClick={() => setShowTaskModal(false)}
                className="bg-gray-400 text-white px-6 py-2 rounded-lg hover:bg-gray-500 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveTask}
                className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-2 rounded-lg hover:from-green-500 hover:to-emerald-500 transition-colors"
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
          <div className="bg-gray-700 rounded-xl shadow-2xl max-w-2xl w-full border border-gray-600 flex flex-col" style={{maxHeight: 'calc(100vh - 4rem)'}}>
            <div className="bg-gray-700 border-b border-gray-600 p-6 flex justify-between items-center flex-shrink-0">
              <h2 className="text-2xl font-bold text-white">Task Remarks</h2>
              <button
                onClick={() => setShowRemarksModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
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
                    <div key={remark.id} className="bg-gray-400 rounded-lg p-4 border border-gray-500">
                      <p className="text-white mb-2">{remark.text}</p>
                      <p className="text-gray-400 text-xs">
                        {new Date(remark.timestamp).toLocaleString()}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 text-center py-4">No remarks yet</p>
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
                  className="w-full bg-gray-400 border border-gray-500 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 mb-3"
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
          <div className="bg-gray-700 rounded-xl shadow-2xl max-w-4xl w-full border border-gray-600 flex flex-col relative z-50" style={{maxHeight: 'calc(100vh - 4rem)'}}>
            <div className="bg-gray-700 border-b border-gray-600 p-6 flex justify-between items-center flex-shrink-0">
              <h2 className="text-2xl font-bold text-white">Settings</h2>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
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
                    className="flex-1 bg-gray-400 border border-gray-500 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 placeholder-slate-400"
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
                  {teamMembers.map((member) => (
                    <div key={member} className="bg-gray-400 border border-gray-500 rounded-lg p-3 flex justify-between items-center gap-2">
                      <span className="text-white font-medium">👤 {member}</span>
                      <button
                        onClick={() => removeTeamMember(member)}
                        className="text-red-400 hover:text-red-300 transition-colors p-2 hover:bg-gray-500 rounded cursor-pointer flex-shrink-0"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
                {teamMembers.length === 0 && (
                  <p className="text-gray-400 text-center py-4">No team members added yet</p>
                )}
              </div>

              {/* Equipment/Facilities Section */}
              <div>
                <h3 className="text-xl font-semibold text-white mb-4">Equipment & Facilities</h3>
                <div className="mb-4">
                  <button
                    onClick={() => openAddEquipment()}
                    className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-cyan-500 hover:to-blue-500 transition-colors flex items-center gap-2"
                  >
                    <Plus size={18} />
                    Add Equipment
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {equipmentList.map((equip) => (
                    <div key={equip.id} className="bg-gray-400 border border-gray-500 rounded-lg p-3 flex justify-between items-center gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full ${getEquipmentStatusColor(equip.status)}`}></span>
                        <span className="text-white font-medium">{equip.name}</span>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => openEditEquipment(equip)}
                          className="text-blue-400 hover:text-blue-300 transition-colors p-2 hover:bg-gray-500 rounded cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => removeEquipment(equip.name)}
                          className="text-red-400 hover:text-red-300 transition-colors p-2 hover:bg-gray-500 rounded cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                {equipmentList.length === 0 && (
                  <p className="text-gray-400 text-center py-4">No equipment or facilities added yet</p>
                )}
              </div>
            </div>

            <div className="bg-gray-700 border-t border-gray-600 p-4 flex justify-end flex-shrink-0">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-2 rounded-lg hover:from-green-500 hover:to-emerald-500 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Replacement Parts Modal */}
      {showPartsModal && selectedEquipment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-700 rounded-xl shadow-2xl max-w-3xl w-full border border-gray-600 flex flex-col" style={{maxHeight: 'calc(100vh - 4rem)'}}>
            <div className="bg-gray-700 border-b border-gray-600 p-6 flex justify-between items-center flex-shrink-0">
              <div>
                <h2 className="text-2xl font-bold text-white">Replacement Part Numbers</h2>
                <p className="text-gray-400">{selectedEquipment.name}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={printParts}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                  title="Print"
                >
                  <Printer size={20} />
                </button>
                <button
                  onClick={() => {
                    setShowPartsModal(false);
                    setPartForm({ part_component: '', part_number: '', last_sourced_from: '' });
                  }}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-grow">
              {/* Add Part Form */}
              <div className="bg-gray-400 rounded-lg p-4 mb-6">
                <h3 className="text-white font-medium mb-4">Add New Part</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">Part / Component *</label>
                    <input
                      type="text"
                      value={partForm.part_component}
                      onChange={(e) => setPartForm({...partForm, part_component: e.target.value})}
                      placeholder="e.g., Fuel Filter"
                      className="w-full bg-slate-600 border border-slate-500 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">Part Number *</label>
                    <input
                      type="text"
                      value={partForm.part_number}
                      onChange={(e) => setPartForm({...partForm, part_number: e.target.value})}
                      placeholder="e.g., FF-12345"
                      className="w-full bg-slate-600 border border-slate-500 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">Last Sourced From</label>
                    <input
                      type="text"
                      value={partForm.last_sourced_from}
                      onChange={(e) => setPartForm({...partForm, last_sourced_from: e.target.value})}
                      placeholder="e.g., AutoZone, Amazon"
                      className="w-full bg-slate-600 border border-slate-500 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                </div>
                <button
                  onClick={addPart}
                  disabled={!partForm.part_component.trim() || !partForm.part_number.trim()}
                  className="mt-4 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-600 disabled:text-gray-400 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Plus size={18} />
                  Add Part
                </button>
              </div>

              {/* Parts List */}
              <div>
                <h3 className="text-white font-medium mb-4">Parts List ({equipmentParts.length})</h3>
                {equipmentParts.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-500">
                          <th className="text-left text-gray-400 font-medium py-3 px-4">Part / Component</th>
                          <th className="text-left text-gray-400 font-medium py-3 px-4">Part Number</th>
                          <th className="text-left text-gray-400 font-medium py-3 px-4">Last Sourced From</th>
                          <th className="text-right text-gray-400 font-medium py-3 px-4">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {equipmentParts.map(part => (
                          <tr key={part.id} className="border-b border-gray-600 hover:bg-gray-500/50">
                            <td className="py-3 px-4 text-white">{part.part_component}</td>
                            <td className="py-3 px-4 text-white font-mono">{part.part_number}</td>
                            <td className="py-3 px-4 text-gray-300">{part.last_sourced_from || '-'}</td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => deletePart(part.id)}
                                className="text-red-400 hover:text-red-300 p-1"
                                title="Delete part"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <Package size={48} className="mx-auto mb-3 opacity-50" />
                    <p>No replacement parts recorded yet</p>
                    <p className="text-sm">Add parts using the form above</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-700 border-t border-gray-600 p-4 flex justify-end flex-shrink-0">
              <button
                onClick={() => {
                  setShowPartsModal(false);
                  setPartForm({ part_component: '', part_number: '', last_sourced_from: '' });
                }}
                className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-2 rounded-lg hover:from-green-500 hover:to-emerald-500 transition-colors"
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
