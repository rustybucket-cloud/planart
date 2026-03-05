export interface ReferenceImage {
  id: string;
  content: string;
  note?: string;
  tags: string[];
  addedAt: string;
}

export interface ReferenceCollectionData {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  images: ReferenceImage[];
}

export interface ReferenceCollectionSummary {
  id: string;
  name: string;
  updatedAt: string;
  imageCount: number;
  thumbnailContent?: string;
}
