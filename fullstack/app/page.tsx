'use client'

import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase";
import { signOut, User } from "firebase/auth";
import { Todo } from "@prisma/client";
import { useRouter } from "next/navigation";

export default function TodoPage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [title, setTitle] = useState("");
  const [editId, setEditId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setUser(user);
      setLoading(false);
      
      if (user) {
        fetchTodos(user);
      } else {
        router.push("/signin");
      }
    });
    
    return () => unsubscribe();
  }, [router]);

  const fetchTodos = async (currentUser: User) => {
    const token = await currentUser.getIdToken();
    const res = await fetch("/api/todos", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setTodos(data);
  };

  const addTodo = async () => {
    if (!title || !user) return;
    const token = await user.getIdToken();
    await fetch("/api/todos", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    setTitle("");
    fetchTodos(user);
  };

  const handleDelete = async (id: number) => {
    if (!user) return;
    const token = await user.getIdToken();
    await fetch("/api/todos", {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchTodos(user);
  };

  const handleToggleComplete = async (todo: Todo) => {
    if (!user) return;
    const token = await user.getIdToken();
    await fetch("/api/todos", {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ id: todo.id, completed: !todo.completed, title: todo.title }),
    });
    fetchTodos(user);
  };

  const startEdit = (todo: Todo) => {
    setEditId(todo.id);
    setEditTitle(todo.title);
  };

  const handleConfirmEdit = async () => {
    if (!user || editId === null) return;
    const token = await user.getIdToken();
    await fetch("/api/todos", {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editId,
        title: editTitle,
        completed: todos.find((t) => t.id === editId)?.completed,
      }),
    });
    setEditId(null);
    setEditTitle("");
    fetchTodos(user);
  };

  const handleSignOut = async () => {
    await signOut(auth);
    window.location.href = "/signin";
  };

  if (loading) return <p className="text-center mt-4">Loading...</p>;
  if (!user) return null;

  return (
    <div className="max-w-md mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">My Todos</h1>
        <button onClick={handleSignOut} className="bg-red-500 text-white px-3 py-1 rounded">
          Sign Out
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="New Todo"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border px-2 py-1 rounded flex-1"
        />
        <button onClick={addTodo} className="bg-blue-500 text-white px-3 py-1 rounded">
          Add
        </button>
      </div>

      <ul>
        {todos.map((todo) => (
          <li key={todo.id} className="flex justify-between items-center py-1">
            <div>
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => handleToggleComplete(todo)}
                className="mr-2"
              />
              {editId === todo.id ? (
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="border px-1 py-0.5 rounded"
                />
              ) : (
                <span className={todo.completed ? "line-through" : ""}>{todo.title}</span>
              )}
            </div>
            <div className="flex gap-2">
              {editId === todo.id ? (
                <button onClick={handleConfirmEdit} className="bg-green-500 text-white px-2 py-0.5 rounded">
                  Save
                </button>
              ) : (
                <button onClick={() => startEdit(todo)} className="bg-yellow-500 text-white px-2 py-0.5 rounded">
                  Edit
                </button>
              )}
              <button
                onClick={() => handleDelete(todo.id)}
                className="bg-red-500 text-white px-2 py-0.5 rounded"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
