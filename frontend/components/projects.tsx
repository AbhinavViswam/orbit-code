import React, { useEffect, useState } from "react";
import {
  useCreateProject,
  useDeleteProject,
  useLogout,
  useProfile,
  useShowProject,
} from "@/backend/query";
import { useRouter } from "next/navigation";
import {
  Plus,
  FolderOpen,
  Users,
  Crown,
  X,
  Loader2,
  User,
  Mail,
  LogOut,
  Trash2,
  PanelLeftClose,
  PanelLeftOpen,
  LayoutDashboard,
  CreditCard,
  Rocket
} from "lucide-react";
import { logout, createCheckoutSession, createPortalSession } from "@/backend/api";
import { ThemeToggle } from "./theme-toggle";

export default function Project({}: {}) {
  const { mutate, isPending } = useCreateProject();
  const { data, isLoading } = useShowProject();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { mutate: deleteMutation, isPending: deletePending } = useDeleteProject();

  const projects: any[] = data?.data?.o || [];
  const [open, setOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [error, setError] = useState<null | string>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    function onKey(e: any) {
      if (e.key === "Escape") {
        setOpen(false);
        setDeleteConfirm(null);
      }
    }
    if (open || deleteConfirm) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, deleteConfirm]);

  function openModal() {
    setProjectName("");
    setError(null);
    setOpen(true);
  }

  function closeModal() {
    if (isPending) return;
    setOpen(false);
  }

  function handleSubmit(e: any) {
    e.preventDefault();
    setError(null);
    const name = projectName.trim();
    if (!name) {
      setError("Project name is required");
      return;
    }

    mutate(
      { projectName: name },
      {
        onSuccess: () => {
          setOpen(false);
        },
        onError: (err) => {
          const msg = err?.message || "Failed to create project";
          setError(msg);
        },
      }
    );
  }

  const handleKeyDown = (e: any) => {
    if (e.key === "Enter") {
      handleSubmit(e);
    }
  };

  const { data: userData, isLoading: userloading } = useProfile();

  function handleLogout() {
    setIsLoggingOut(true);
    logout();
    localStorage.removeItem("token");
    setIsLoggingOut(false);
    router.replace("/");
  }

  function handleDeleteProject(projectId: string) {
    deleteMutation(
      //@ts-ignore
      { projectId },
      {
        onSuccess: () => {
          setDeleteConfirm(null);
        },
        onError: (err) => {
          console.error("Failed to delete project:", err);
          setDeleteConfirm(null);
        },
      }
    );
  }

  const handleBilling = async () => {
    try {
      const tier = userData?.data?.o?.subscriptionTier;
      if (tier === "pro") {
        const { url } = await createPortalSession();
        window.location.href = url;
      } else {
        const { url } = await createCheckoutSession();
        window.location.href = url;
      }
    } catch (err) {
      console.error("Billing error:", err);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-cyan-500/30">
      
      {/* Sidebar */}
      <aside className={`flex flex-col transition-all duration-300 ease-in-out border-r border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-900 ${isSidebarOpen ? 'w-72' : 'w-20'} shrink-0 z-20`}>
        {/* Logo & Toggle */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800/60">
          <div className={`flex items-center gap-3 overflow-hidden ${!isSidebarOpen && 'w-0 opacity-0'}`}>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shrink-0 shadow-lg shadow-cyan-500/20">
              <span className="text-white font-extrabold text-xs">&lt;/&gt;</span>
            </div>
            <span className="font-extrabold text-lg whitespace-nowrap tracking-tight bg-gradient-to-r from-indigo-600 to-cyan-500 dark:from-indigo-400 dark:to-cyan-400 bg-clip-text text-transparent">Orbit</span>
          </div>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500 dark:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50">
            {isSidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <button className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold transition-colors ${!isSidebarOpen && 'justify-center'}`} title="Projects">
            <LayoutDashboard className="w-5 h-5 shrink-0" />
            {isSidebarOpen && <span className="whitespace-nowrap">Projects</span>}
          </button>
          <button onClick={handleBilling} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold transition-colors ${!isSidebarOpen && 'justify-center'}`} title={userData?.data?.o?.subscriptionTier === "pro" ? "Manage Pro" : "Upgrade"}>
            <CreditCard className="w-5 h-5 shrink-0" />
            {isSidebarOpen && <span className="whitespace-nowrap">Billing</span>}
            {isSidebarOpen && userData?.data?.o?.subscriptionTier === "pro" && <Crown className="w-4 h-4 ml-auto text-amber-500" />}
          </button>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800/60 space-y-4 bg-white dark:bg-slate-900">
          <div className={`flex items-center gap-3 ${!isSidebarOpen && 'justify-center'}`}>
            <ThemeToggle />
            {isSidebarOpen && <span className="text-sm font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap">Theme</span>}
          </div>
          
          <div className={`flex items-center gap-3 ${!isSidebarOpen && 'justify-center'} bg-slate-50 dark:bg-slate-950 p-2 rounded-xl border border-slate-200 dark:border-slate-800/60 shadow-sm`}>
            <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-300 dark:border-slate-700">
              <User className="w-5 h-5 text-slate-500 dark:text-slate-400" />
            </div>
            {isSidebarOpen && (
              <div className="flex-1 min-w-0 overflow-hidden">
                <p className="text-sm font-bold truncate text-slate-800 dark:text-slate-200">{userData?.data?.o?.name || "Loading..."}</p>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">{userData?.data?.o?.email || ""}</p>
              </div>
            )}
          </div>

          <button onClick={handleLogout} disabled={isLoggingOut} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 font-bold transition-colors ${!isSidebarOpen && 'justify-center'}`} title="Logout">
            <LogOut className="w-5 h-5 shrink-0" />
            {isSidebarOpen && <span className="whitespace-nowrap">Log Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto bg-slate-50/50 dark:bg-slate-950 relative">
        {/* Background glow in dark mode */}
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-cyan-900/10 dark:bg-cyan-600/10 rounded-full blur-[120px] pointer-events-none -z-10" />

        <div className="p-6 md:p-10 max-w-7xl mx-auto w-full flex-1">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-10">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">Workspaces</h1>
              <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm md:text-base font-medium">Manage your projects, collaborate, and build faster.</p>
            </div>
            <button onClick={openModal} className="group flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-400 hover:to-cyan-400 text-white rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all duration-300 font-bold transform hover:-translate-y-0.5 shrink-0">
              <Plus size={20} strokeWidth={3} className="group-hover:rotate-90 transition-transform duration-300" />
              <span>New Project</span>
            </button>
          </div>

          {/* Projects Grid */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-32">
              <Loader2 className="w-10 h-10 text-cyan-500 animate-spin mb-4" />
              <p className="text-slate-600 dark:text-slate-300 font-bold text-lg">Loading workspaces...</p>
            </div>
          ) : projects.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-12 sm:p-20 text-center flex flex-col items-center justify-center">
              <div className="w-24 h-24 bg-indigo-50 dark:bg-indigo-500/10 rounded-full flex items-center justify-center mb-6">
                <Rocket className="w-12 h-12 text-indigo-500 dark:text-indigo-400" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Ready to launch?</h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-8 font-medium">Create your first workspace to start writing code with your autonomous AI engineer.</p>
              <button onClick={openModal} className="flex items-center gap-2 px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold hover:opacity-90 transition-opacity">
                <Plus size={20} />
                Create Workspace
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {projects.map((project) => (
                <div key={project._id} className="group relative bg-white dark:bg-slate-900 rounded-2xl shadow-sm hover:shadow-xl border border-slate-200 dark:border-slate-800 transition-all duration-300 hover:-translate-y-1 flex flex-col overflow-hidden cursor-pointer" onClick={() => router.push(`/project/${project._id}`)}>
                  {/* Top Edge Gradient */}
                  <div className="h-1 w-full bg-gradient-to-r from-indigo-500 to-cyan-500 opacity-70 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex items-start gap-4 mb-6">
                      <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                        <FolderOpen className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div className="flex-1 min-w-0 pt-1">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">{project.name}</h3>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-500 mt-1 uppercase tracking-wider">Workspace</p>
                      </div>
                    </div>

                    <div className="mt-auto space-y-3">
                      <div className="flex items-center gap-3">
                        <Users className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                        <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">{project.users?.length ?? 0} members</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Crown className="w-4 h-4 text-amber-500" />
                        <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 truncate">{project.owner?.[0]?.ownerName || "No owner"}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Actions Bar */}
                  <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm(project._id); }} className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors" title="Delete Project">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Create Project Modal */}
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="fixed inset-0" onClick={closeModal} aria-hidden />

          <div className="relative w-full max-w-lg transform transition-all animate-in zoom-in-95 duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800" onClick={(e) => e.stopPropagation()}>
              
              <div className="bg-gradient-to-r from-indigo-500 to-cyan-500 px-8 py-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10" />
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md shadow-inner">
                      <Plus className="w-6 h-6 text-white" strokeWidth={3} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-extrabold text-white tracking-tight">New Workspace</h2>
                      <p className="text-sm font-medium text-indigo-100 mt-1">Start building your next idea</p>
                    </div>
                  </div>
                  <button onClick={closeModal} disabled={isPending} className="p-2 hover:bg-white/20 rounded-xl transition-colors disabled:opacity-50 text-white">
                    <X size={24} />
                  </button>
                </div>
              </div>

              <div className="p-8">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Project Name <span className="text-cyan-500">*</span></label>
                <input autoFocus value={projectName} onChange={(e) => setProjectName(e.target.value)} onKeyDown={handleKeyDown} className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400 font-medium" placeholder="e.g. Marketing Website, API Server..." name="projectName" />
                {error && (
                  <div className="mt-4 flex items-start gap-3 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl animate-in slide-in-from-top-2">
                    <div className="w-2 h-2 mt-1.5 bg-red-500 rounded-full shrink-0" />
                    <p className="text-sm text-red-600 dark:text-red-400 font-bold">{error}</p>
                  </div>
                )}
              </div>

              <div className="px-8 py-5 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
                <button onClick={closeModal} disabled={isPending} className="px-6 py-3 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors disabled:opacity-50">Cancel</button>
                <button onClick={handleSubmit} disabled={isPending} className={`flex items-center gap-2 px-8 py-3 rounded-xl text-white text-sm font-bold shadow-lg transition-all ${isPending ? "bg-slate-400 dark:bg-slate-700 cursor-not-allowed" : "bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-400 hover:to-cyan-400 hover:shadow-cyan-500/25 transform hover:-translate-y-0.5"}`}>
                  {isPending && <Loader2 size={18} className="animate-spin" />}
                  {isPending ? "Creating..." : "Create Project"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="fixed inset-0" onClick={() => !deletePending && setDeleteConfirm(null)} aria-hidden />

          <div className="relative w-full max-w-md transform transition-all animate-in zoom-in-95 duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800" onClick={(e) => e.stopPropagation()}>
              
              <div className="bg-gradient-to-r from-red-500 to-rose-600 px-8 py-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10" />
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md shadow-inner">
                      <Trash2 className="w-6 h-6 text-white" strokeWidth={3} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-extrabold text-white tracking-tight">Delete Project</h2>
                      <p className="text-sm font-medium text-red-100 mt-1">This action is permanent</p>
                    </div>
                  </div>
                  <button onClick={() => setDeleteConfirm(null)} disabled={deletePending} className="p-2 hover:bg-white/20 rounded-xl transition-colors disabled:opacity-50 text-white">
                    <X size={24} />
                  </button>
                </div>
              </div>

              <div className="p-8">
                <p className="text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                  Are you absolutely sure you want to delete this workspace? All code, chat history, and resources associated with it will be permanently erased.
                </p>
              </div>

              <div className="px-8 py-5 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
                <button onClick={() => setDeleteConfirm(null)} disabled={deletePending} className="px-6 py-3 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors disabled:opacity-50">Cancel</button>
                <button onClick={() => handleDeleteProject(deleteConfirm)} disabled={deletePending} className={`flex items-center gap-2 px-8 py-3 rounded-xl text-white text-sm font-bold shadow-lg transition-all ${deletePending ? "bg-slate-400 dark:bg-slate-700 cursor-not-allowed" : "bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 hover:shadow-red-500/25 transform hover:-translate-y-0.5"}`}>
                  {deletePending && <Loader2 size={18} className="animate-spin" />}
                  {deletePending ? "Deleting..." : "Delete Permanently"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}