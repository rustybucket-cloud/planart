export interface ProjectItem {
  id: string;
  type: "canvas" | "collection";
}

export interface ProjectData {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  items: ProjectItem[];
}

export interface ProjectSummary {
  id: string;
  name: string;
  updatedAt: string;
  itemCount: number;
}
