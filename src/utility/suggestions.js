import { Activity, CheckCircle2, FilePlus, History, List, Sparkles } from 'lucide-react';

// mode: 'send' → fires immediately
// mode: 'pick' → shows a list of real items (projects/tasks) to choose from, then sends
// write: true  → changes data; hidden when ChatBox is readOnly
export const SUGGESTIONS = [
    {
        id: 'help',
        label: 'What can you do?',
        icon: Sparkles,
        mode: 'send',
        prompt: 'What can you help me with? Give a short list of example questions I can ask.',
    },
    {
        id: 'list-projects',
        label: 'List all projects',
        icon: List,
        mode: 'send',
        prompt: 'List all projects with their status and description.',
    },
    {
        id: 'pick-status',
        label: 'Project status',
        icon: Activity,
        mode: 'pick',
        pick: 'projects',
        build: (p) => `Give me a status report for ${p.name}`,
    },
    {
        id: 'pick-similar',
        label: 'Find related work',
        icon: History,
        mode: 'pick',
        pick: 'projects',
        build: (p) => `Find tasks related to the work done in ${p.name}`,
    },
    {
        id: 'pick-complete',
        label: 'Complete a task',
        icon: CheckCircle2,
        mode: 'pick',
        pick: 'tasks',
        write: true,
        build: (t) => `Update task ID ${t.id} ("${t.title}"): set status to Completed`,
    },
    {
        id: 'pick-add-task',
        label: 'Add a task',
        icon: FilePlus,
        mode: 'pick',
        pick: 'projects',
        write: true,
        build: (p) => `Add a Medium priority task "New task" to ${p.name}`,
    },
];

export const followUpSuggestions = (projectName) =>
    projectName
        ? [
            {
                id: 'fu-status',
                label: `More on ${projectName}`,
                icon: Activity,
                mode: 'send',
                prompt: `Give me a status report for ${projectName}`,
            },
        ]
        : [];