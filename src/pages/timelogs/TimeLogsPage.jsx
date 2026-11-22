import { useEffect, useState } from "react";
import CustomTable from "../../components/UI/CustomTable";
import FormModal from "../../components/UI/FormModal";
import { AlertCircle, Clock, Edit, Plus, Search, X } from "lucide-react";
import { callApiWithToken } from "../../api/callApi";
import { createOptions } from "../../helper/utility";
import { useAuth } from "../../context/AuthContext";
import RowActions from "../../components/UI/ActionButtons";
import TimeDisplay from "../../components/UI/TimeDisplay";

const TimeLogsPage = () => {
    const { user, isAdmin } = useAuth();
    console.log('User....', user)
    const [logs, setLogs] = useState([]);
    const [users, setUsers] = useState([]);
    const [projects, setProjects] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedLog, setSelectedLog] = useState(null);
    const [search, setSearch] = useState('');
    const [error, setError] = useState(null);
    const { hasPermission } = useAuth();

    const fetchUsers = async () => {
        try {
            const res = await callApiWithToken({ url: "/users" });
            if (res.status) setUsers(createOptions(res.data, 'name', 'id'));
        } catch (error) {
            console.error(error);
            setError(error.message || "Could not load timelogs.");
        }
    };
    const fetchTasks = async (projectId) => {
        try {
            const res = await callApiWithToken({ url: `/tasks?projectId=${projectId}` });
            if (res.status) setTasks(createOptions(res.data, 'title', 'id'));
        } catch (error) {
            console.error(error);
        }
    };

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

    useEffect(() => {
        if (!modalOpen) return
        fetchProjects();
        fetchUsers();
    }, [modalOpen])

    const fetchLogs = async () => {
        try {
            const res = await callApiWithToken({ url: "/timelogs" });
            if (res.status) setLogs(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const handleAddLog = () => {
        setSelectedLog(null);
        setIsEditing(false);
        setModalOpen(true);
    };

    const handleEditLog = async (log) => {
        try {
            const res = await callApiWithToken({ url: `/timelogs/${log.id}` });
            if (res.status) {
                setSelectedLog(res.data);
                await fetchTasks(res.data?.project_id)
                setIsEditing(true);
                setModalOpen(true);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleDeleteLog = async (id) => {
        try {
            const res = await callApiWithToken({ url: `/timelogs/${id}`, method: 'DELETE' });
            if (res.status) {
                setSelectedLog(res.data);
                setLogs(logs?.filter(l => l.id != id))
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleSubmit = async (type, values) => {
        try {
            if (type === "add") {
                const res = await callApiWithToken({
                    url: "/timelogs",
                    method: "POST",
                    payload: values,
                });
                if (res.status) {
                    setModalOpen(false);
                    fetchLogs();
                }
            }
            if (type === "edit") {
                const { id, ...rest } = values;
                const res = await callApiWithToken({
                    url: `/timelogs/${selectedLog?.id}`,
                    method: "PUT",
                    payload: rest,
                });
                if (res.status) {
                    setSelectedLog(null);
                    setModalOpen(false);
                    fetchLogs();
                }
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleCancel = () => {
        setModalOpen(false);
        setSelectedLog(null);
    };

    const columns = [
        { field: "id", header: "ID", width: 60 },
        { field: "task_title", header: "Task" },
        { field: "user_name", header: "User" },
        { field: "log_date", width: 220, header: "Log Date", render: (row) => <TimeDisplay isoTring={row.log_date} /> },
        { field: "hours", header: "Hours" },
        { field: "description", header: "Description" },
        { field: "created_at", header: "Created At", render: (row) => <TimeDisplay isoTring={row.created_at} /> },
        {
            field: "actions",
            header: "Actions",
            render: (row) => <RowActions onEdit={() => handleEditLog(row)} onDelete={() => handleDeleteLog(row.id)} />
        },
    ];

    const logFormFields = [
        { fieldName: "project_id", fieldLabel: "Project", inputType: "dropdown", isRequired: true, options: projects, onChange: (val) => fetchTasks(val) },
        { fieldName: "task_id", fieldLabel: "Task", inputType: "dropdown", isRequired: true, options: tasks },
        { fieldName: "user_id", fieldLabel: "User", inputType: "dropdown", options: users, isRequired: true, disabled: !isAdmin, defaultValue: user?.id },
        { fieldName: "log_date", fieldLabel: "Log Date", inputType: "date", isRequired: true },
        { fieldName: "hours", fieldLabel: "Hours", inputType: "number", isRequired: true },
        { fieldName: "description", fieldLabel: "Description", inputType: "textarea" },
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
            {hasPermission("timelogs", "create") && (
                <button
                    onClick={handleAddLog}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#0F5257] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#0C4247] focus:outline-none focus:ring-2 focus:ring-[#0F5257]/30 focus:ring-offset-1 active:scale-[0.98]"
                >
                    <Plus size={16} />
                    Add Timelog
                </button>
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-[#FAFAF9] p-6 sm:p-6 lg:p-8">
            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0F5257]/10 text-[#0F5257]">
                        <Clock size={20} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight text-[#1A1D1F]">Timelogs</h1>
                        <p className="mt-0.5 text-sm text-[#6B7280]">User registered logs.</p>
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
            )}
            <CustomTable data={logs} columns={columns} pageSize={5} toolbar={toolbar} />
            <FormModal
                open={modalOpen}
                modalTitle={isEditing ? "Edit TimeLog" : "Create TimeLog"}
                isForm={true}
                formFields={logFormFields}
                isEditing={isEditing}
                record={selectedLog}
                handleSubmit={handleSubmit}
                handleCancel={handleCancel}
            />
        </div>
    );
};

export default TimeLogsPage;
