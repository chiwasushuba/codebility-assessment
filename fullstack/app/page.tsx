"use client"

import { useState, useEffect } from "react"
import { auth } from "@/lib/firebase"
import { signOut, type User } from "firebase/auth"
import type { Todo } from "@prisma/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { LogOut, Plus, Trash2, Pencil, Check, X } from "lucide-react"

export default function TodoPage() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [title, setTitle] = useState("")
  const [editId, setEditId] = useState<number | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setUser(user)
      setLoading(false)

      if (user) {
        fetchTodos(user)
      } else {
        router.push("/signin")
      }
    })

    return () => unsubscribe()
  }, [router])

  const fetchTodos = async (currentUser: User) => {
    const token = await currentUser.getIdToken()
    const res = await fetch("/api/todos", {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await res.json()
    setTodos(data)
  }

  const addTodo = async () => {
    if (!title || !user) return
    const token = await user.getIdToken()
    await fetch("/api/todos", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    })
    setTitle("")
    fetchTodos(user)
  }

  const handleDelete = async (id: number) => {
    if (!user) return
    const token = await user.getIdToken()
    await fetch("/api/todos", {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
    fetchTodos(user)
  }

  const handleToggleComplete = async (todo: Todo) => {
    if (!user) return
    const token = await user.getIdToken()
    await fetch("/api/todos", {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ id: todo.id, completed: !todo.completed, title: todo.title }),
    })
    fetchTodos(user)
  }

  const startEdit = (todo: Todo) => {
    setEditId(todo.id)
    setEditTitle(todo.title)
  }

  const handleConfirmEdit = async () => {
    if (!user || editId === null) return
    const token = await user.getIdToken()
    await fetch("/api/todos", {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editId,
        title: editTitle,
        completed: todos.find((t) => t.id === editId)?.completed,
      }),
    })
    setEditId(null)
    setEditTitle("")
    fetchTodos(user)
  }

  const handleSignOut = async () => {
    await signOut(auth)
    window.location.href = "/signin"
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!user) return null

  const completedCount = todos.filter((t) => t.completed).length
  const totalCount = todos.length

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">My Tasks</h1>
            <p className="text-muted-foreground">
              {completedCount} of {totalCount} completed
            </p>
          </div>
          <Button onClick={handleSignOut} variant="outline" size="sm" className="gap-2 bg-transparent">
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>

        <Card className="p-6 mb-6 bg-card border border-border">
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Add a new task..."
              value={title}
              onChange={(e: any) => setTitle(e.target.value)}
              onKeyPress={(e: any) => e.key === "Enter" && addTodo()}
              className="flex-1"
            />
            <Button onClick={addTodo} className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
              <Plus className="w-4 h-4" />
              Add
            </Button>
          </div>
        </Card>

        {totalCount === 0 ? (
          <Card className="p-12 text-center bg-card border border-border">
            <p className="text-muted-foreground text-lg">No tasks yet. Create one to get started!</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {todos.map((todo) => (
              <Card
                key={todo.id}
                className="p-4 bg-card border border-border hover:border-primary/50 transition-colors flex items-start justify-center group"
              >
                <div className="flex items-center gap-3 flex-1">
                  <Checkbox
                    checked={todo.completed}
                    onCheckedChange={() => handleToggleComplete(todo)}
                    className="rounded"
                  />
                  {editId === todo.id ? (
                    <Input
                      value={editTitle}
                      onChange={(e:any) => setEditTitle(e.target.value)}
                      className="flex-1 h-8"
                      autoFocus
                    />
                  ) : (
                    <span
                      className={`flex-1 text-foreground transition-all ${
                        todo.completed ? "line-through text-muted-foreground" : ""
                      }`}
                    >
                      {todo.title}
                    </span>
                  )}
                </div>

                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {editId === todo.id ? (
                    <>
                      <Button
                        onClick={handleConfirmEdit}
                        size="sm"
                        variant="ghost"
                        className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950"
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => setEditId(null)}
                        size="sm"
                        variant="ghost"
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        onClick={() => startEdit(todo)}
                        size="sm"
                        variant="ghost"
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => handleDelete(todo.id)}
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
