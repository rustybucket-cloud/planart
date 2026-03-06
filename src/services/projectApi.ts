import { invoke } from "@tauri-apps/api/core";
import type { ProjectData, ProjectSummary } from "@/types/project";

export const projectApi = {
  create: (name: string) => invoke<ProjectData>("create_project", { name }),
  save: (project: ProjectData) => invoke<void>("save_project", { project }),
  load: (id: string) => invoke<ProjectData>("load_project", { id }),
  list: () => invoke<ProjectSummary[]>("list_projects"),
  delete: (id: string) => invoke<void>("delete_project", { id }),
};
