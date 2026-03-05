import { invoke } from "@tauri-apps/api/core";
import type {
  ReferenceCollectionData,
  ReferenceCollectionSummary,
} from "@/types/referenceCollection";

export const referenceCollectionApi = {
  create: (name: string) =>
    invoke<ReferenceCollectionData>("create_reference_collection", { name }),
  save: (collection: ReferenceCollectionData) =>
    invoke<void>("save_reference_collection", { collection }),
  load: (id: string) =>
    invoke<ReferenceCollectionData>("load_reference_collection", { id }),
  list: () =>
    invoke<ReferenceCollectionSummary[]>("list_reference_collections"),
  delete: (id: string) =>
    invoke<void>("delete_reference_collection", { id }),
  fetchImageFromUrl: (url: string) =>
    invoke<string>("fetch_image_from_url", { url }),
};
