export type ValidationStatus = "validated" | "needs_work" | "discussing";

export type TrackCategory = "original" | "sound_design" | "ambience";

export type RightsStatus = "100% Libre" | "SACEM" | "Original Score";

export interface TrackComment {
  id: string;
  author: string;
  content: string;
  createdAt: string;
  timestampSeconds?: number | null;
}

export interface AudioTrack {
  id: string;
  title: string;
  category: TrackCategory;
  fileName: string;
  fileSize: number;
  duration: number; // in seconds
  mimeType: string;
  driveFileId?: string;
  localPath?: string;
  sectionId?: string;
  cueId?: string;
  pdfPage?: number;
  cueQuote?: string;
  tempo?: string; // ex: "~72 BPM", "Rubato", "~124 BPM"
  intention?: string; // Intention théâtrale simple (ex: "Attente amoureuse", "Sidération")
  rightsStatus?: RightsStatus;
  version: string;
  peaks?: number[];
  validationStatus: ValidationStatus;
  comments: TrackComment[];
  createdAt: string;
  updatedAt: string;
}

export interface ScriptSection {
  id: string;
  title: string;
  subtitle: string;
  pageRange: string;
  pageStart: number;
  pageEnd: number;
  intention: string;
}

export interface ScriptCue {
  id: string;
  sectionId: string;
  page: number;
  speaker: string;
  cueText: string;
  fullText: string;
  mood?: string;
}

export interface Character {
  name: string;
  role: string;
}

export interface ScriptStructure {
  metadata: {
    title: string;
    author: string;
    sourcePdf: string;
    totalPages: number;
    version: string;
  };
  characters: Character[];
  sections: ScriptSection[];
  cues: ScriptCue[];
}

export interface TerrassesDatabase {
  version: string;
  lastUpdated: string;
  tracks: AudioTrack[];
}
