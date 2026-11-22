import { useEffect, useMemo, useState } from "react";
import CustomTable from "../../components/UI/CustomTable";
import FormModal from "../../components/UI/FormModal";
import { Pencil, Trash2, AlertCircle, Plus, Search, RefreshCw, X, Users as UsersIcon, ShieldCheck } from "lucide-react";
import { callApiWithToken } from "../../api/callApi";
import { useAuth } from "../../context/AuthContext";

const ROLE_OPTIONS = [
    { label: "Admin", value: "1" },
    { label: "Manager", value: "2" },
    { label: "Employee", value: "3" },
];

const userFormFields = [
    { fieldName: "name", fieldLabel: "Name", inputType: "text", isRequired: true, isRequiredMessage: "Name is required", defaultValue: "" },
    { fieldName: "email", fieldLabel: "Email", inputType: "text", isRequired: true, isRequiredMessage: "Email is required", canInvalid: true, defaultValue: "" },
    { fieldName: "role_id", fieldLabel: "Role", inputType: "dropdown", isRequired: true, isRequiredMessage: "Role is required", defaultValue: "", options: ROLE_OPTIONS },
    { fieldName: "city", fieldLabel: "City", inputType: "text", isRequired: true, isRequiredMessage: "City is required", defaultValue: "" },
    { fieldName: "country", fieldLabel: "Country", inputType: "text", isRequired: true, isRequiredMessage: "Country is required", defaultValue: "India" },
];

// A few accent colors cycled across role bars so "By role" isn't a flat list of numbers.
const ROLE_COLORS = ["bg-[#0F5257]", "bg-[#D98E3F]", "bg-[#5B7FBF]", "bg-[#8B6BAE]", "bg-[#B3432B]"];

const UsersPage = () => {
    const { hasPermission } = useAuth()
    console.log('Permissions', hasPermission('users', 'create'));

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [query, setQuery] = useState("");

    const [modalOpen, setModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState(null);

    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const fetchUsers = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await callApiWithToken({ url: "/users" });
            if (res.status) {
                setUsers(res.data);
            } else {
                setError(res.message || "Could not load users.");
            }
        } catch (err) {
            setError(err.message || "Could not load users.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const filteredUsers = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return users;
        return users.filter((u) => u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q));
    }, [users, query]);

    const roleBreakdown = useMemo(() => {
        const counts = {};
        users.forEach((u) => {
            const key = u.role_name || "Unassigned";
            counts[key] = (counts[key] || 0) + 1;
        });
        return Object.entries(counts).sort((a, b) => b[1] - a[1]);
    }, [users]);

    const maxRoleCount = Math.max(1, ...roleBreakdown.map(([, count]) => count));

    const handleAddUser = () => {
        setSelectedUser(null);
        setIsEditing(false);
        setFormError(null);
        setModalOpen(true);
    };

    const handleEditUser = async (user) => {
        try {
            const res = await callApiWithToken({ url: `/users/${user.id}` });
            if (res.status) {
                setSelectedUser(res.data);
                setIsEditing(true);
                setFormError(null);
                setModalOpen(true);
            }
        } catch (err) {
            setError(err.message || "Could not load this user.");
        }
    };

    const handleSubmit = async (type, values) => {
        setSubmitting(true);
        setFormError(null);
        try {
            const res = await callApiWithToken({
                url: type === "edit" ? `/users/${selectedUser?.id}` : "/users",
                method: type === "edit" ? "PUT" : "POST",
                payload: values,
            });
            if (!res.status) {
                setFormError(res.message || "Could not save this user.");
                return;
            }
            setModalOpen(false);
            setSelectedUser(null);
            fetchUsers();
        } catch (err) {
            setFormError(err.message || "Something went wrong. Try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancelForm = () => {
        setModalOpen(false);
        setSelectedUser(null);
        setFormError(null);
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            const res = await callApiWithToken({ url: `/users/${deleteTarget.id}`, method: "DELETE" });
            if (res.status) {
                setDeleteTarget(null);
                fetchUsers();
            } else {
                setError(res.message || "Could not delete this user.");
            }
        } catch (err) {
            setError(err.message || "Could not delete this user.");
        } finally {
            setDeleting(false);
        }
    };

    const columns = [
        { field: "id", header: "ID", width: 70, sortingKey: "id" },
        { field: "name", header: "Name", sortingKey: "name", render: (row) => <span className="font-medium">{row.name}</span> },
        { field: "email", header: "Email", sortingKey: "email" },
        { field: "role_name", header: "Role", sortingKey: "role_name" },
        { field: "city", header: "City", sortingKey: "city" },
        { field: "country", header: "Country", sortingKey: "country" },
        {
            field: "actions",
            header: "Actions",
            align: "right",
            render: (row) => (
                <div className="flex items-center justify-end gap-1">
                    <button type="button" onClick={() => handleEditUser(row)} aria-label={`Edit ${row.name}`} className="rounded-md p-1.5 text-[#6B7280] hover:bg-[#F0EFEB] hover:text-[#1A1D1F]">
                        <Pencil size={15} />
                    </button>
                    <button type="button" onClick={() => setDeleteTarget(row)} aria-label={`Delete ${row.name}`} className="rounded-md p-1.5 text-[#6B7280] hover:bg-[#B3432B]/10 hover:text-[#B3432B]">
                        <Trash2 size={15} />
                    </button>
                </div>
            ),
        },
    ];

    const toolbar = (
        <div className="flex items-center gap-2">
            <div className="relative w-full max-w-xs">
                <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9AA0A6]" />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by name or email"
                    className="w-full rounded-lg border border-[#E4E2DD] bg-white py-2 pl-9 pr-3 text-sm text-[#1A1D1F] placeholder:text-[#9AA0A6] transition focus:border-[#0F5257] focus:outline-none focus:ring-2 focus:ring-[#0F5257]/15"
                />
            </div>
            <button
                type="button"
                onClick={fetchUsers}
                aria-label="Refresh users"
                title="Refresh"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#E4E2DD] text-[#6B7280] transition hover:bg-[#F0EFEB] hover:text-[#1A1D1F]"
            >
                <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            </button>
            {hasPermission('users', 'create') && <button
                onClick={handleAddUser}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#0F5257] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#0C4247] focus:outline-none focus:ring-2 focus:ring-[#0F5257]/30 focus:ring-offset-1 active:scale-[0.98]"
            >
                <Plus size={16} />
                Add User
            </button>}
        </div>
    );

    return (
        <div className="min-h-screen bg-[#FAFAF9] p-4 sm:p-6 lg:p-8">
            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0F5257]/10 text-[#0F5257]">
                        <UsersIcon size={20} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight text-[#1A1D1F]">Users</h1>
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
            )}

            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="relative overflow-hidden rounded-2xl border border-[#E4E2DD] bg-white p-5">
                    <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-[#0F5257]/5" aria-hidden />
                    <div className="relative flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0F5257]/10 text-[#0F5257]">
                            <UsersIcon size={18} />
                        </div>
                        <div>
                            <p className="text-sm text-[#6B7280]">Total users</p>
                            <p className="text-3xl font-semibold text-[#1A1D1F]">{users.length}</p>
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-[#E4E2DD] bg-white p-5">
                    <div className="mb-3 flex items-center gap-2">
                        <ShieldCheck size={16} className="text-[#6B7280]" />
                        <p className="text-sm text-[#6B7280]">By role</p>
                    </div>
                    <div className="space-y-2.5">
                        {roleBreakdown.length === 0 && <p className="text-sm text-[#9AA0A6]">—</p>}
                        {roleBreakdown.map(([role, count], i) => (
                            <div key={role}>
                                <div className="mb-1 flex items-center justify-between text-sm">
                                    <span className="text-[#4B5058]">{role}</span>
                                    <span className="font-medium text-[#1A1D1F]">{count}</span>
                                </div>
                                <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#F0EFEB]">
                                    <div
                                        className={`h-full rounded-full transition-all ${ROLE_COLORS[i % ROLE_COLORS.length]}`}
                                        style={{ width: `${(count / maxRoleCount) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <CustomTable
                data={filteredUsers}
                columns={columns}
                pageSize={10}
                toolbar={toolbar}
                loading={loading}
                className="rounded-2xl"
                emptyMessage={query ? "No users match your search." : "No users yet."}
            />

            <FormModal
                open={modalOpen}
                modalTitle={isEditing ? "Edit User" : "Create User"}
                isForm={true}
                formFields={userFormFields}
                isEditing={isEditing}
                record={selectedUser}
                loading={submitting}
                formError={formError}
                handleSubmit={handleSubmit}
                handleCancel={handleCancelForm}
            />

            <FormModal
                open={Boolean(deleteTarget)}
                modalTitle="Delete user"
                isForm={false}
                loading={deleting}
                otherThanFormElement={
                    <p className="text-sm text-[#4B5058]">
                        Delete <span className="font-medium text-[#1A1D1F]">{deleteTarget?.name}</span>? This can't be undone.
                    </p>
                }
                onConfirm={confirmDelete}
                confirmLabel="Delete"
                confirmVariant="danger"
                handleCancel={() => setDeleteTarget(null)}
            />
        </div>
    );
};

export default UsersPage;