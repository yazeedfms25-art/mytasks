import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Plus, Calendar as CalendarIcon, Flag, Moon, Sun } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

type Priority = "low" | "medium" | "high";

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
  completedAt?: number;
  deadline?: number;
  priority: Priority;
}

export const TodoList = () => {
  const { theme, setTheme } = useTheme();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState("");
  const [deadline, setDeadline] = useState<Date | undefined>();
  const [priority, setPriority] = useState<Priority>("medium");

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
        },
      ]);
      setNewTodo("");
      setDeadline(undefined);
      setPriority("medium");
    }
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

  const activeTodos = todos.filter((t) => !t.completed).sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    if (a.deadline && b.deadline) return a.deadline - b.deadline;
    if (a.deadline) return -1;
    if (b.deadline) return 1;
    return b.createdAt - a.createdAt;
  });
  const completedTodos = todos.filter((t) => t.completed);

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

      <div className="mb-6 space-y-3">
        <Input
          type="text"
          placeholder="What needs to be done?"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          onKeyPress={handleKeyPress}
          className="h-12 px-4 text-base bg-card border-border focus-visible:ring-primary shadow-sm"
        />
        
        <div className="flex gap-2 flex-wrap">
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
                {deadline ? format(deadline, "PPP") : "Set deadline"}
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
            <SelectTrigger className="w-[140px]">
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

      <div className="space-y-6">
        {activeTodos.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
              Active ({activeTodos.length})
            </h2>
            <div className="space-y-2">
              {activeTodos.map((todo) => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  onToggle={toggleTodo}
                  onDelete={deleteTodo}
                />
              ))}
            </div>
          </div>
        )}

        {completedTodos.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
              Completed ({completedTodos.length})
            </h2>
            <div className="space-y-2">
              {completedTodos.map((todo) => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  onToggle={toggleTodo}
                  onDelete={deleteTodo}
                />
              ))}
            </div>
          </div>
        )}

        {todos.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">No tasks yet. Add one to get started!</p>
          </div>
        )}
      </div>
    </div>
  );
};

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

const TodoItem = ({ todo, onToggle, onDelete }: TodoItemProps) => {
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
        <div className="flex items-start gap-2 mb-1">
          <span
            className={cn(
              "flex-1 text-base transition-all duration-300",
              todo.completed && "line-through text-muted-foreground"
            )}
          >
            {todo.text}
          </span>
          <Flag className={cn("h-4 w-4 flex-shrink-0 mt-0.5", getPriorityColor(todo.priority))} />
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
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDelete(todo.id)}
        className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-muted-foreground hover:text-destructive flex-shrink-0"
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
};
