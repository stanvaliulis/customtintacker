import type { ProductShape, ProductCategory } from './product';

// ─── Active tool in the design editor ──────────────────────────────
export type ActiveTool = 'select' | 'text' | 'shape' | 'pan';

// ─── Export formats supported by the editor ────────────────────────
export type DesignExportFormat = 'png' | 'pdf' | 'svg';

// ─── Design status for saved designs ───────────────────────────────
export type DesignStatus = 'draft' | 'submitted' | 'approved' | 'rejected';

// ─── A reusable template for the design editor ─────────────────────
export interface DesignTemplate {
  id: string;
  name: string;
  slug: string;
  shape: ProductShape;
  width: number;   // inches
  height: number;  // inches
  thumbnail: string;
  canvasJson: string;
  category: ProductCategory;
  tags: string[];
}

// ─── A customer's saved design ─────────────────────────────────────
export interface SavedDesign {
  id: string;
  sessionId: string;
  email: string | null;
  name: string;
  productId: string;
  shape: ProductShape;
  width: number;   // inches
  height: number;  // inches
  canvasJson: string;
  thumbnailUrl: string | null;
  status: DesignStatus;
}

// ─── An uploaded asset (image, etc.) within a design session ───────
export interface DesignAsset {
  id: string;
  sessionId: string;
  filename: string;
  url: string;
  fileType: string;
  fileSize: number; // bytes
}

// ─── Editor UI state ───────────────────────────────────────────────
export interface EditorState {
  activeTool: ActiveTool;
  selectedObjectId: string | null;
  zoom: number;
  panX: number;
  panY: number;
  showBleed: boolean;
  showSafeArea: boolean;
}
