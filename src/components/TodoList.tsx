import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EditTodoDialog } from "@/components/EditTodoDialog";
import { 
  X, Plus, Calendar as CalendarIcon, Flag, Moon, Sun, Search, 
  Filter, Edit2, TrendingUp, CheckCircle2, Clock, AlertCircle 
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

type Priority = "low" | "medium" | "high";
type Category = "work" | "personal" | "shopping" | "health" | "other";
type FilterStatus = "all" | "active" | "completed";

const CATEGORIES: { value: Category; label: string; color: string }[] = [
  { value: "work", label: "Work", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  { value: "personal", label: "Personal", color: "bg-purple-500/10 text-purple-600 dark:text-purple-400" },
  { value: "shopping", label: "Shopping", color: "bg-green-500/10 text-green-600 dark:text-green-400" },
  { value: "health", label: "Health", color: "bg-red-500/10 text-red-600 dark:text-red-400" },
  { value: "other", label: "Other", color: "bg-gray-500/10 text-gray-600 dark:text-gray-400" },
];

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
  completedAt?: number;
  deadline?: number;
  priority: Priority;
  category: Category;
  notes?: string;
}

export const TodoList = () => {
  const { theme, setTheme } = useTheme();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState("");
  const [deadline, setDeadline] = useState<Date | undefined>();
  const [priority, setPriority] = useState<Priority>("medium");
  const [category, setCategory] = useState<Category>("personal");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [filterPriority, setFilterPriority] = useState<Priority | "all">("all");
  const [filterCategory, setFilterCategory] = useState<Category | "all">("all");
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("todos");
    if (saved) {
      setTodos(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("todos", JSON.stringify(todos));
  }, [todos]);

  const addTodo = () => {
    if (newTodo.trim()) {
      setTodos([
        ...todos,
        {
          id: crypto.randomUUID(),
          text: newTodo.trim(),
          completed: false,
          createdAt: Date.now(),
          deadline: deadline?.getTime(),
          priority,
          category,
        },
      ]);
      setNewTodo("");
      setDeadline(undefined);
      setPriority("medium");
      setCategory("personal");
    }
  };

  const updateTodo = (updatedTodo: Todo) => {
    setTodos(todos.map((todo) => (todo.id === updatedTodo.id ? updatedTodo : todo)));
    setEditingTodo(null);
  };

  const toggleTodo = (id: string) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id
          ? {
              ...todo,
              completed: !todo.completed,
              completedAt: !todo.completed ? Date.now() : undefined,
            }
          : todo
      )
    );
  };

  const deleteTodo = (id: string) => {
    setTodos(todos.filter((todo) => todo.id !== id));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      addTodo();
    }
  };

  const activeTodos = todos
    .filter((t) => !t.completed)
    .filter((t) => {
      if (searchQuery && !t.text.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (filterPriority !== "all" && t.priority !== filterPriority) return false;
      if (filterCategory !== "all" && t.category !== filterCategory) return false;
      return true;
    })
    .sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      if (a.deadline && b.deadline) return a.deadline - b.deadline;
      if (a.deadline) return -1;
      if (b.deadline) return 1;
      return b.createdAt - a.createdAt;
    });

  const completedTodos = todos
    .filter((t) => t.completed)
    .filter((t) => {
      if (searchQuery && !t.text.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (filterPriority !== "all" && t.priority !== filterPriority) return false;
      if (filterCategory !== "all" && t.category !== filterCategory) return false;
      return true;
    });

  const displayedTodos =
    filterStatus === "all"
      ? [...activeTodos, ...completedTodos]
      : filterStatus === "active"
      ? activeTodos
      : completedTodos;

  // Statistics
  const totalTasks = todos.length;
  const completedCount = todos.filter((t) => t.completed).length;
  const completionRate = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;
  const overdueCount = todos.filter(
    (t) => !t.completed && t.deadline && t.deadline < Date.now()
  ).length;
  const avgCompletionTime = (() => {
    const completed = todos.filter((t) => t.completed && t.completedAt);
    if (completed.length === 0) return 0;
    const total = completed.reduce((sum, t) => sum + (t.completedAt! - t.createdAt), 0);
    return Math.round(total / completed.length / (1000 * 60 * 60)); // in hours
  })();

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case "high":
        return "text-destructive";
      case "medium":
        return "text-accent";
      case "low":
        return "text-muted-foreground";
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4 md:p-6">
      <div className="mb-8 text-center relative">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="absolute right-0 top-0"
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
        <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          My Tasks
        </h1>
        <p className="text-muted-foreground">Stay organized and productive</p>
      </div>

      <div className="mb-6 space-y-4">
        <Input
          type="text"
          placeholder="What needs to be done?"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          onKeyPress={handleKeyPress}
          className="h-12 px-4 text-base bg-card border-border focus-visible:ring-primary shadow-sm"
        />
        
        <div className="flex gap-2 flex-wrap">
          <Select value={category} onValueChange={(value: Category) => setCategory(value)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left font-normal",
                  !deadline && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {deadline ? format(deadline, "MMM d") : "Deadline"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={deadline}
                onSelect={setDeadline}
                initialFocus
                className="p-3 pointer-events-auto"
                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
              />
            </PopoverContent>
          </Popover>

          <Select value={priority} onValueChange={(value: Priority) => setPriority(value)}>
            <SelectTrigger className="w-[120px]">
              <Flag className={cn("mr-2 h-4 w-4", getPriorityColor(priority))} />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={addTodo} className="ml-auto shadow-sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Task
          </Button>
        </div>
      </div>

      {/* Statistics Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Completion</span>
            </div>
            <div className="text-2xl font-bold">{completionRate}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="h-4 w-4 text-accent" />
              <span className="text-xs text-muted-foreground">Completed</span>
            </div>
            <div className="text-2xl font-bold">{completedCount}/{totalTasks}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <span className="text-xs text-muted-foreground">Overdue</span>
            </div>
            <div className="text-2xl font-bold">{overdueCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Avg Time</span>
            </div>
            <div className="text-2xl font-bold">{avgCompletionTime}h</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2 flex-wrap items-center">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={filterStatus} onValueChange={(value: FilterStatus) => setFilterStatus(value)}>
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tasks</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterPriority} onValueChange={(value: Priority | "all") => setFilterPriority(value)}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterCategory} onValueChange={(value: Category | "all") => setFilterCategory(value)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(searchQuery || filterStatus !== "all" || filterPriority !== "all" || filterCategory !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setFilterStatus("all");
                setFilterPriority("all");
                setFilterCategory("all");
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {displayedTodos.length > 0 ? (
          <div className="space-y-2">
            {displayedTodos.map((todo) => (
              <TodoItem
                key={todo.id}
                todo={todo}
                onToggle={toggleTodo}
                onDelete={deleteTodo}
                onEdit={setEditingTodo}
                categories={CATEGORIES}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              {searchQuery || filterStatus !== "all" || filterPriority !== "all" || filterCategory !== "all"
                ? "No tasks match your filters"
                : "No tasks yet. Add one to get started!"}
            </p>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      {editingTodo && (
        <EditTodoDialog
          todo={editingTodo}
          onSave={updateTodo}
          onClose={() => setEditingTodo(null)}
          categories={CATEGORIES}
        />
      )}
    </div>
  );
};

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (todo: Todo) => void;
  categories: typeof CATEGORIES;
}

const TodoItem = ({ todo, onToggle, onDelete, onEdit, categories }: TodoItemProps) => {
  const isOverdue = todo.deadline && todo.deadline < Date.now() && !todo.completed;
  
  const getTimeTaken = () => {
    if (!todo.completedAt) return null;
    const duration = todo.completedAt - todo.createdAt;
    const days = Math.floor(duration / (1000 * 60 * 60 * 24));
    const hours = Math.floor((duration % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };
  
  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case "high":
        return "text-destructive";
      case "medium":
        return "text-accent";
      case "low":
        return "text-muted-foreground";
    }
  };

  const getPriorityBorder = (priority: Priority) => {
    switch (priority) {
      case "high":
        return "border-l-4 border-l-destructive";
      case "medium":
        return "border-l-4 border-l-accent";
      case "low":
        return "border-l-4 border-l-muted";
    }
  };

  return (
    <div
      className={cn(
        "group flex items-start gap-3 p-4 bg-card rounded-lg border border-border transition-all duration-300",
        "hover:shadow-md hover:border-primary/20",
        getPriorityBorder(todo.priority),
        todo.completed && "opacity-60",
        isOverdue && "bg-destructive/5"
      )}
      style={{ boxShadow: "var(--shadow-soft)" }}
    >
      <Checkbox
        checked={todo.completed}
        onCheckedChange={() => onToggle(todo.id)}
        className="mt-1 w-5 h-5 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 mb-2">
          <span
            className={cn(
              "flex-1 text-base transition-all duration-300",
              todo.completed && "line-through text-muted-foreground"
            )}
          >
            {todo.text}
          </span>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Badge className={cn("text-xs", categories.find((c) => c.value === todo.category)?.color)}>
              {categories.find((c) => c.value === todo.category)?.label}
            </Badge>
            <Flag className={cn("h-4 w-4", getPriorityColor(todo.priority))} />
          </div>
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            Created: {format(new Date(todo.createdAt), "MMM d, yyyy")}
          </span>
          {todo.completedAt && (
            <>
              <span className="flex items-center gap-1 text-primary">
                Finished: {format(new Date(todo.completedAt), "MMM d, yyyy 'at' h:mm a")}
              </span>
              <span className="flex items-center gap-1 text-accent font-medium">
                Time taken: {getTimeTaken()}
              </span>
            </>
          )}
          {todo.deadline && !todo.completed && (
            <span className={cn("flex items-center gap-1", isOverdue && "text-destructive font-medium")}>
              <CalendarIcon className="h-3 w-3" />
              Due: {format(new Date(todo.deadline), "MMM d, yyyy")}
              {isOverdue && " (Overdue)"}
            </span>
          )}
        </div>
      </div>
      <div className="flex gap-1 flex-shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEdit(todo)}
          className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-muted-foreground hover:text-primary"
        >
          <Edit2 className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(todo.id)}
          className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-muted-foreground hover:text-destructive"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
