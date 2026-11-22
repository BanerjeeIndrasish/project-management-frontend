import { useEffect, useState } from "react";
import CustomTable from "../../components/UI/CustomTable";
import FormModal from "../../components/UI/FormModal";
import { Edit, FolderKanban, Plus, Search, Trash } from "lucide-react";
import { callApiWithToken } from "../../api/callApi";
import { useAuth } from "../../context/AuthContext";
import TimeDisplay from "../../components/UI/TimeDisplay";
import RowActions from "../../components/UI/ActionButtons";

const ProjectsPage = () => {
    const { user, hasPermission, permissions } = useAuth()
    console.log('Permissions.......', permissions)
    const [projects, setProjects] = useState([]);
    const [search, setSearch] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null);
    const [userOptions, setUserOptions] = useState([]);

    const fetchProjects = async () => {
        try {
            const res = await callApiWithToken({ url: "/projects" });
            if (res.status) {
                setProjects(res.data);
            }
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await callApiWithToken({ url: "/users" });
            if (res.status) {
                setUserOptions(res.data?.map(dt => ({ label: dt.name, value: dt.id })));
            }
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleAddProject = () => {
        setSelectedProject(null);
        setIsEditing(false);
        setModalOpen(true);
    };

    const handleEditProject = async (project) => {
        try {
            const res = await callApiWithToken({ url: `/projects/${project.id}` });
            if (res.status) {
                setSelectedProject(res.data);
                setIsEditing(true);
                setModalOpen(true);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleDeleteProject = async (project) => {
        try {
            const res = await callApiWithToken({ url: `/projects/${project.id}`, method: 'DELETE' });

        } catch (error) {
            console.error(error);
        }
    };

    const handleSubmit = async (type, values) => {
        try {
            if (type === "add") {
                const payload = {
                    name: values?.name,
                    description: values?.description,
                    status: 'active',
                    created_by: user?.id
                }
                const res = await callApiWithToken({
                    url: "/projects",
                    method: "POST",
                    payload: payload,
                });
                if (res.status) {
                    setModalOpen(false);
                    fetchProjects();
                }
            }

            if (type === "edit") {
                const { id, ...rest } = values;
                const res = await callApiWithToken({
                    url: `/projects/${selectedProject?.id}`,
                    method: "PUT",
                    payload: rest,
                });
                if (res.status) {
                    setSelectedProject(null);
                    setModalOpen(false);
                    fetchProjects();
                }
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleCancel = () => {
        setModalOpen(false);
        setSelectedProject(null);
    };

    const columns = [
        { field: "id", header: "ID", width: 60, sortingKey: "id" },
        { field: "name", header: "Name", sortingKey: "name" },
        { field: "description", header: "Description", sortingKey: "description" },
        { field: "status", header: "Status", sortingKey: "status" },
        {
            field: "created_by", header: "Created By", sortingKey: "created_by",
            render: (row) => {
                return <p>{row?.created_by?.name}</p>
            }
        },
        { field: "created_at", header: "Created At", sortingKey: "created_at", render: (row) => <TimeDisplay isoTring={row.created_at} /> },
        { field: "updated_at", header: "Updated At", sortingKey: "updated_at", render: (row) => <TimeDisplay isoTring={row.updated_at} /> },
        {
            field: "actions",
            header: "Actions",
            render: (row) => <RowActions onEdit={() => handleEditProject(row)} onDelete={() => handleDeleteProject(row)} />
        },
    ];

    const projectFormFields = [
        {
            fieldName: "name",
            fieldLabel: "Project Name",
            inputType: "text",
            isRequired: true,
            isRequiredMessage: "Name is required",
            defaultValue: "",
        },
        {
            fieldName: "description",
            fieldLabel: "Description",
            inputType: "textarea",
            isRequired: true,
            isRequiredMessage: "Description is required",
            defaultValue: "",
        },
        {
            fieldName: "status",
            fieldLabel: "Status",
            inputType: "dropdown",
            isRequired: true,
            isRequiredMessage: "Status is required",
            defaultValue: "active",
            options: [
                { label: "Active", value: "active" },
                { label: "On Hold", value: "on_hold" },
                { label: "Completed", value: "completed" },
            ],
        },
        {
            fieldName: "created_by",
            fieldLabel: "Created By",
            inputType: "dropdown",
            isRequired: isEditing,
            options: userOptions,
            visible: isEditing,
            isRequiredMessage: "Creator ID is required",
            defaultValue: "",
        },
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
            {hasPermission("projects", "create") && (
                <button
                    onClick={handleAddProject}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#0F5257] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#0C4247] focus:outline-none focus:ring-2 focus:ring-[#0F5257]/30 focus:ring-offset-1 active:scale-[0.98]"
                >
                    <Plus size={16} />
                    Add Project
                </button>
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-[#FAFAF9] p-6 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl">
                {/* Page header */}
                <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#0F5257]/10 text-[#0F5257]">
                        <FolderKanban size={20} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-[#1A1D1F]">Projects</h1>
                        <p className="text-sm text-[#6B7280]">Manage and track every project in one place</p>
                    </div>
                </div>

                {/* Toolbar sits above the table's own card, not nested inside it */}
                <div className="mb-4">{toolbar}</div>
                <CustomTable
                    data={projects}
                    columns={columns}
                    pageSize={5}
                    className="shadow-sm"
                />
            </div>

            <FormModal
                open={modalOpen}
                modalTitle={isEditing ? "Edit Project" : "Create Project"}
                isForm={true}
                formFields={projectFormFields}
                isEditing={isEditing}
                record={selectedProject}
                handleSubmit={handleSubmit}
                handleCancel={handleCancel}
            />
        </div>
    );
};

export default ProjectsPage;