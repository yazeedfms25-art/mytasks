import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
}

export const TodoList = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState("");

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
        },
      ]);
      setNewTodo("");
    }
  };

  const toggleTodo = (id: string) => {
    setTodos(todos.map((todo) => (todo.id === id ? { ...todo, completed: !todo.completed } : todo)));
  };

  const deleteTodo = (id: string) => {
    setTodos(todos.filter((todo) => todo.id !== id));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      addTodo();
    }
  };

  const activeTodos = todos.filter((t) => !t.completed);
  const completedTodos = todos.filter((t) => t.completed);

  return (
    <div className="w-full max-w-2xl mx-auto p-4 md:p-6">
      <div className="mb-8 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          My Tasks
        </h1>
        <p className="text-muted-foreground">Stay organized and productive</p>
      </div>

      <div className="mb-6 flex gap-2">
        <Input
          type="text"
          placeholder="What needs to be done?"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          onKeyPress={handleKeyPress}
          className="flex-1 h-12 px-4 text-base bg-card border-border focus-visible:ring-primary shadow-sm"
        />
        <Button onClick={addTodo} size="lg" className="h-12 px-6 shadow-sm">
          <Plus className="w-5 h-5 mr-2" />
          Add
        </Button>
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
  return (
    <div
      className={cn(
        "group flex items-center gap-3 p-4 bg-card rounded-lg border border-border transition-all duration-300",
        "hover:shadow-md hover:border-primary/20",
        todo.completed && "opacity-60"
      )}
      style={{ boxShadow: "var(--shadow-soft)" }}
    >
      <Checkbox
        checked={todo.completed}
        onCheckedChange={() => onToggle(todo.id)}
        className="w-5 h-5 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
      />
      <span
        className={cn(
          "flex-1 text-base transition-all duration-300",
          todo.completed && "line-through text-muted-foreground"
        )}
      >
        {todo.text}
      </span>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDelete(todo.id)}
        className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-muted-foreground hover:text-destructive"
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
};
