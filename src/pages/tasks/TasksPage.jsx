import { useEffect, useState } from "react";
import CustomTable from "../../components/UI/CustomTable";
import FormModal from "../../components/UI/FormModal";
import { AlertCircle, Edit, Plus, Search, Wrench, X } from "lucide-react";
import { callApiWithToken } from "../../api/callApi";
import { createOptions } from "../../helper/utility";
import { useAuth } from "../../context/AuthContext";
import TimeDisplay from "../../components/UI/TimeDisplay";
import RowActions from "../../components/UI/ActionButtons";
import { getErrorMessage } from "../../utility/helper";

const TasksPage = () => {
    const { user } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [projects, setProjects] = useState([]);
    const [users, setUsers] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [error, setError] = useState(null);
    const { hasPermission } = useAuth();
    const [search, setSearch] = useState('')

    const fetchTasks = async () => {
        try {
            const res = await callApiWithToken({ url: "/tasks" });
            if (res.status) setTasks(res.data);
        } catch (error) {
            console.error(error);
            setError(error.message || 'Error fetching tasks')
        }
    };

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchProjects = async () => {
        try {
            const res = await callApiWithToken({ url: "/projects" });
            if (res.status) {
                setProjects(createOptions(res.data, 'name', 'id'));
            }
        } catch (error) {
            console.error(error);
        }
    };

    const fetchUsers = async () => {
        try {
            const res = await callApiWithToken({
                url: "/users",
            });

            if (res.status) {
                setUsers(createOptions(res.data, 'name', 'id'))
            }
        } catch (error) {

        }
    }

    useEffect(() => {
        if (!modalOpen) return
        fetchProjects();
        fetchUsers();
    }, [modalOpen])

    const handleAddTask = () => {
        setSelectedTask(null);
        setIsEditing(false);
        setModalOpen(true);
    };

    const handleEditTask = async (task) => {
        try {
            const res = await callApiWithToken({ url: `/tasks/${task.id}` });
            if (res.status) {
                setSelectedTask(res.data);
                setIsEditing(true);
                setModalOpen(true);
            }
        } catch (error) {
            console.error(error);
            setError(getErrorMessage(error));
        }
    };

    const handleDeleteTask = async (task) => {
        try {
            const res = await callApiWithToken({ url: `/tasks/${task.id}`, method: 'DELETE' });
        } catch (error) {
            console.error(error);
            setError(getErrorMessage(error));
        }
    };

    const handleSubmit = async (type, values) => {
        try {
            if (type === "add") {
                const res = await callApiWithToken({
                    url: "/tasks",
                    method: "POST",
                    payload: {
                        ...values,
                        status: 'in_progress',
                        created_by: user?.id
                    },
                });
                if (res.status) {
                    setModalOpen(false);
                    fetchTasks();
                }
            }
            if (type === "edit") {
                const { id, ...rest } = values;
                const res = await callApiWithToken({
                    url: `/tasks/${selectedTask?.id}`,
                    method: "PUT",
                    payload: rest,
                });
                if (res.status) {
                    setSelectedTask(null);
                    setModalOpen(false);
                    fetchTasks();
                }
            }
        } catch (error) {
            console.log('Erorrrr......', error.response);
            setError(getErrorMessage(error));
            setModalOpen(false)
        }
    };

    const handleCancel = () => {
        setModalOpen(false);
        setSelectedTask(null);
    };

    const columns = [
        { field: "id", header: "ID", width: 60 },
        { field: "title", header: "Title" },
        { field: "description", header: "Description" },
        { field: "project_name", header: "Project" },
        { field: "assigned_user", header: "Assigned To" },
        { field: "status", header: "Status" },
        { field: "priority", header: "Priority" },
        { field: "due_date", header: "Due Date", render: (row) => <TimeDisplay isoTring={row.due_date} /> },
        {
            field: "actions",
            header: "Actions",
            render: (row) => <RowActions onEdit={() => handleEditTask(row)} onDelete={() => handleDeleteTask(row)} />
        },
    ];

    const taskFormFields = [
        { fieldName: "title", fieldLabel: "Title", inputType: "text", isRequired: true },
        { fieldName: "description", fieldLabel: "Description", inputType: "textarea" },
        { fieldName: "project_id", fieldLabel: "Project", inputType: "dropdown", isRequired: true, options: projects },
        { fieldName: "assigned_to", fieldLabel: "Assigned To", inputType: "dropdown", isRequired: true, options: users },
        {
            fieldName: "status", fieldLabel: "Status", inputType: "dropdown", options: [
                { label: "Open", value: "open" },
                { label: "In Progress", value: "in_progress" },
                { label: "Completed", value: "completed" },
            ]
        },
        {
            fieldName: "priority", fieldLabel: "Priority", inputType: "dropdown", options: [
                { label: "Low", value: "low" },
                { label: "Medium", value: "medium" },
                { label: "High", value: "high" },
            ]
        },
        { fieldName: "due_date", fieldLabel: "Due Date", inputType: "date" },
    ];

    const toolbar = (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Search */}
            <div className="relative w-full sm:max-w-xs">
                <Search
                    size={16}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]"
                />
                <input
                    type="text"
                    value={search}
                    placeholder="Search projects..."
                    className="w-full rounded-lg border border-[#E4E2DD] bg-white py-2 pl-9 pr-8 text-sm text-[#1A1D1F] placeholder:text-[#9CA3AF] transition focus:border-[#0F5257] focus:outline-none focus:ring-2 focus:ring-[#0F5257]/15"
                    onChange={(e) => {
                        setSearch(e.target.value);
                        console.log("Searching for:", e.target.value);
                    }}
                />
                {search && (
                    <button
                        type="button"
                        onClick={() => setSearch("")}
                        aria-label="Clear search"
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-[#9CA3AF] hover:bg-[#F0EFEB] hover:text-[#4B5058]"
                    >
                        <X size={14} />
                    </button>
                )}
            </div>

            {/* Add project */}
            {hasPermission("tasks", "create") && (
                <button
                    onClick={handleAddTask}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#0F5257] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#0C4247] focus:outline-none focus:ring-2 focus:ring-[#0F5257]/30 focus:ring-offset-1 active:scale-[0.98]"
                >
                    <Plus size={16} />
                    Add Tasks
                </button>
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-[#FAFAF9] p-6 sm:p-6 lg:p-8">
            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0F5257]/10 text-[#0F5257]">
                        <Wrench size={20} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight text-[#1A1D1F]">Task Table</h1>
                        <p className="mt-0.5 text-sm text-[#6B7280]">People with access to system and what they can do here.</p>
                    </div>
                </div>
            </div>

            {error && (
                <div role="alert" className="mb-4 flex items-start justify-between gap-3 rounded-lg border border-[#B3432B]/30 bg-[#B3432B]/5 px-4 py-2.5 text-sm text-[#B3432B]">
                    <div className="flex items-center gap-2">
                        <AlertCircle size={16} className="shrink-0" />
                        {error}
                    </div>
                    <button type="button" onClick={() => setError(null)} aria-label="Dismiss" className="text-[#B3432B]/70 hover:text-[#B3432B]">
                        <X size={14} />
                    </button>
                </div>
            )}            <CustomTable data={tasks} columns={columns} pageSize={5} toolbar={toolbar} />
            <FormModal
                open={modalOpen}
                modalTitle={isEditing ? "Edit Task" : "Create Task"}
                isForm={true}
                formFields={taskFormFields}
                isEditing={isEditing}
                record={selectedTask}
                handleSubmit={handleSubmit}
                handleCancel={handleCancel}
            />
        </div>
    );
};

export default TasksPage;
