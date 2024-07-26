import { useMemo, useState } from "react"
import PlusIcon from "../icons/PlusIcon"
import { Column, Id, Task } from "../types";
import ColumnContainer from "./ColumnContainer";
import { DndContext, DragEndEvent, DragOverEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext } from "@dnd-kit/sortable";
import { createPortal } from "react-dom";
import TaskCard from "./TaskCard";

const KanbanBoard = () => {

    const [columns, setColumns] = useState<Column[]>([]);
    const columnsId = useMemo(() => columns.map(col => col.id), [columns])

    const [activeColumn, setActiveColumn] = useState<Column | null>(null);
    const [activeTask, setActiveTask] = useState<Task | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);

    const createNewColumn = () => {
        const columnToAdd: Column = {
            id: generateId(),
            title: `Column ${columns.length + 1}`,
        }

        setColumns([...columns, columnToAdd]);
    }

    const deleteColumn = (id: Id) => {
        const filteredColumns = columns.filter(col => col.id !== id);
        setColumns(filteredColumns);

        const newTasks = tasks.filter(t => t.columnId !== id);
        setTasks(newTasks);
    }

    const updateColumn = (id: Id, title: string) => {
        const newColumns = columns.map(col => {
            if(col.id !== id) return col;
            return {...col, title};
        });

        setColumns(newColumns);
    }

    const createTask = (columnId: Id) => {
        const newTask: Task = {
            id: generateId(),
            columnId,
            content: `Task ${tasks.length + 1}`,
        };

        setTasks([...tasks, newTask]);
    }

    const deleteTask = (id: Id) => {
        const newTasks = tasks.filter(task => task.id !== id);
        setTasks(newTasks);
    }

    const updateTask = (id: Id, content: string) => {
        const newTasks = tasks.map(task => {
            if(task.id !== id) return task;
            return {...task, content};
        })

        setTasks(newTasks);
    }

    const onDragStart = (event: DragStartEvent) => {
        console.log("DRAG START", event);
        if(event.active.data.current?.type === "Column") {
            setActiveColumn(event.active.data.current.column);
            return;
        }

        if(event.active.data.current?.type === "Task") {
            setActiveTask(event.active.data.current.task);
            return;
        }
    }

    const onDragEnd = (event: DragEndEvent) => {
        setActiveColumn(null);
        setActiveTask(null);

        const {active, over} = event;
        if (!over) return;

        const activeColumnId = active.id;
        const overColumnId = over.id;

        if(activeColumnId === overColumnId) return;

        setColumns(columns => {
            const activeColumnIndex = columns.findIndex(col => col.id === activeColumnId);
            const overColumnIndex = columns.findIndex(col => col.id === overColumnId);

            return arrayMove(columns, activeColumnIndex, overColumnIndex);
        })
    }

    const onDragOver = (event: DragOverEvent) => {
        const {active, over} = event;
        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        if(activeId === overId) return;

        const isActiveATask = active.data.current?.type === "Task";
        const isOverATask = active.data.current?.type === "Task";

        if(!isActiveATask) return;

        if(isActiveATask && isOverATask) {
            setTasks(tasks => {
                const activeIndex = tasks.findIndex(t => t.id === activeId);
                const overIndex = tasks.findIndex(t => t.id === overId);

                if (activeIndex === -1 || overIndex === -1) return tasks;

                const updatedTasks = [...tasks];
                updatedTasks[activeIndex].columnId = updatedTasks[overIndex].columnId;

                return arrayMove(updatedTasks, activeIndex, overIndex);
            })
        }

        const isOverAColumn = over.data.current?.type === "Column";

        if(isActiveATask && isOverAColumn) {
            setTasks(tasks => {
                const activeIndex = tasks.findIndex(t => t.id === activeId);

                tasks[activeIndex].columnId = overId;

                return arrayMove(tasks, activeIndex, activeIndex);
            })
        }
    }

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 3,
            }
        })
    )

    const generateId = () => {
        return Math.floor(Math.random() * 10001)
    }

  return (
    <div className="m-auto flex min-h-screen w-full items-center overflow-x-auto overflow-y-hidden px-[40px]">
        <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragOver={onDragOver}>
            <div className="m-auto flex gap-4">
            <div className="flex gap-4">
                <SortableContext items={columnsId}>
                    {columns.map((col) => (
                    <ColumnContainer key={col.id} column={col} deleteColumn={deleteColumn} updateColumn={updateColumn}
                    createTask={createTask} tasks={tasks.filter(task => task.columnId === col.id)} 
                    deleteTask={deleteTask} updateTask={updateTask} />
                ))}
                </SortableContext>
                
            </div>
            <button className="h-[60px] w-[350px] min-w-[350px] cursor-pointer rounded-lg flex gap-2
            bg-mainBackgroundColor border-2 border-columnBackgroundColor p-4 ring-rose-500 hover:ring-2"
            onClick={() => createNewColumn()}>
                <PlusIcon />
                Add Column
            </button>
            </div>
            
            {createPortal(
                <DragOverlay>
                    {activeColumn && (
                        <ColumnContainer column={activeColumn} deleteColumn={deleteColumn} updateColumn={updateColumn}
                        createTask={createTask} tasks={tasks.filter(task => task.columnId === activeColumn.id)}
                        deleteTask={deleteTask} updateTask={updateTask} />
                    )}
                    {activeTask && <TaskCard task={activeTask} deleteTask={deleteTask} updateTask={updateTask} />}
                </DragOverlay>,
                document.body
            )}
        </DndContext>
    </div>
  )
}

export default KanbanBoard