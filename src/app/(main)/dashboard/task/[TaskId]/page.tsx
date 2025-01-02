"use client";

import { getTaskById } from "@/actions/task";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TaskMain, Task } from "@/types";
import { use, useEffect, useMemo, useState } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useRouter } from "next/navigation";

// Define a unique constant for drag-and-drop item type
const ITEM_TYPE = "TASK";

type TaskStatus = "TODO" | "IN_PROGRESS" | "COMPLETED" | "BACKLOG";

const DraggableTask = ({ task }: { task: Task }) => {
  const router = useRouter();
  const [{ isDragging }, dragRef] = useDrag({
    type: ITEM_TYPE,
    item: task,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const cardStyles: Record<TaskStatus, string> = {
    TODO: "bg-blue-200 dark:bg-blue-900",
    IN_PROGRESS: "bg-yellow-200 dark:bg-yellow-800",
    COMPLETED: "bg-green-200 dark:bg-green-800",
    BACKLOG: "bg-red-200 dark:bg-red-800",
  };

  const titleStyles = {
    TODO: "text-blue-800 dark:text-blue-100",
    IN_PROGRESS: "text-yellow-800 dark:text-yellow-100",
    COMPLETED: "text-green-800 dark:text-green-100",
    BACKLOG: "text-red-800 dark:text-red-100",
  };

  return (
    <Card
      ref={dragRef}
      className={`p-6 ${cardStyles[task.status as TaskStatus]} cursor-move rounded-xl shadow-md transition-all duration-200 ease-in-out hover:shadow-lg ${isDragging ? "opacity-50" : "opacity-100"}`}
      onClick={() => router.push(`/dashboard/task/${task.id}`)}
    >
      {/* Header Section - Title + Deadline */}
      <div className="mb-4 flex flex-col">
        {/* Task Title */}
        <h3
          className={`text-2xl font-semibold ${titleStyles[task.status as TaskStatus]} truncate`}
        >
          {task.title}
        </h3>
        {/* Deadline */}
        <div className="mt-2 flex items-center text-sm text-gray-600 dark:text-gray-400">
          <Badge
            variant="primary"
            className="rounded-full bg-background py-1 text-sm"
          >
            {"Deadline:  " + " "}
            {new Date(task.deadline).toLocaleString("en-IN", {
              weekday: "short", // Day of the week (e.g., Wed)
              day: "numeric", // Day of the month (1-31)
              hour: "2-digit", // Hour (00-23)
              minute: "2-digit", // Minute (00-59)
              hour12: true, // Use 24-hour clock format
            })}
          </Badge>
        </div>
      </div>

      {/* Task Description */}
      <p className="mb-4 truncate text-base text-gray-700 dark:text-gray-300">
        {task.description}
      </p>

      {/* Assignees */}
      {task.assignees.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-3">
          {task.assignees.map((assignee) => (
            <Badge
              key={assignee.id}
              variant="primary"
              className="rounded-full bg-background px-3 py-1 text-sm"
            >
              {assignee.name}
            </Badge>
          ))}
        </div>
      )}

      {/* Subtasks */}
      {task.subTasks && task.subTasks.length > 0 && (
        <div className="mt-4">
          <h4 className="text-lg font-semibold">Subtasks</h4>
          <ul className="mt-2 space-y-2">
            {task.subTasks.map((subTask, index) => (
              <li key={index} className="flex items-center space-x-2">
                <Badge variant="outline" className="px-3 py-1 text-sm">
                  {subTask.title}
                </Badge>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
};

const TaskColumn = ({
  title,
  tasks,
  status,
  onMoveTask,
}: {
  title: string;
  tasks: Task[];
  status: string;
  onMoveTask: (task: Task, newStatus: string) => void;
}) => {
  const [{ isOver }, dropRef] = useDrop({
    accept: ITEM_TYPE,
    drop: (item: Task) => onMoveTask(item, status),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  return (
    <Card
      ref={dropRef}
      className={`p-6 ${isOver ? "ring-2 ring-primary" : ""}`}
    >
      <h2 className="mb-6 text-center text-2xl font-semibold">{title}</h2>
      <div className="space-y-6">
        {tasks.map((task) => (
          <DraggableTask key={task.id} task={task} />
        ))}
      </div>
    </Card>
  );
};

const DashboardContent = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const moveTask = (task: Task, newStatus: string) => {
    setTasks((prevTasks) =>
      prevTasks.map((t) =>
        t.id === task.id ? { ...t, status: newStatus } : t,
      ),
    );
  };

  const tasksByStatus = useMemo(
    () => ({
      todo: tasks.filter((task) => task.status === "TODO"),
      inProgress: tasks.filter((task) => task.status === "IN_PROGRESS"),
      completed: tasks.filter((task) => task.status === "COMPLETED"),
      backlog: tasks.filter((task) => task.status === "BACKLOG"),
    }),
    [tasks],
  );

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const data = await getTaskById("cm59m7yt30000iujtnlr77mne"); // Replace with dynamic TaskId if needed

        setTasks(data.subTasks as any); // Assuming `data.tasks` is an array of tasks
      } catch (error) {
        setError("An error occurred while fetching tasks.");
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  if (loading)
    return <div className="text-center text-lg text-red-500">Loading...</div>;
  if (error)
    return <div className="text-center text-lg text-red-500">{error}</div>;

  return (
    <Card>
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <div className="mx-auto w-full max-w-7xl space-y-10 p-6">
          <h1 className="text-gradient mb-8 bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-center text-4xl font-extrabold text-transparent">
            Task Dashboard
          </h1>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <TaskColumn
              title="TODO"
              tasks={tasksByStatus.todo}
              status="TODO"
              onMoveTask={moveTask}
            />
            <TaskColumn
              title="IN PROGRESS"
              tasks={tasksByStatus.inProgress}
              status="IN_PROGRESS"
              onMoveTask={moveTask}
            />
            <TaskColumn
              title="COMPLETED"
              tasks={tasksByStatus.completed}
              status="COMPLETED"
              onMoveTask={moveTask}
            />
          </div>

          <TaskColumn
            title="BACKLOG"
            tasks={tasksByStatus.backlog}
            status="BACKLOG"
            onMoveTask={moveTask}
          />
        </div>
      </div>
    </Card>
  );
};

export default function Page({
  params,
}: {
  params: Promise<{ TaskId: string }>;
}) {
  const { TaskId } = use(params);
  const [task, setTask] = useState<TaskMain | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTaskDetails = async () => {
      try {
        const data = await getTaskById(TaskId);
        setTask(data);
      } catch (error) {
        setError("Failed to fetch task details.");
      }
    };

    fetchTaskDetails();
  }, [TaskId]);

  if (error)
    return <div className="text-center text-lg text-red-500">{error}</div>;

  return (
    <DndProvider backend={HTML5Backend}>
      <Card>
        <CardHeader>
          <CardTitle>{task?.title}</CardTitle>
          <CardDescription>{task?.description}</CardDescription>
        </CardHeader>
        <Card>
          <Badge>{task?.status}</Badge>
        </Card>
        <DashboardContent />
      </Card>
    </DndProvider>
  );
}
