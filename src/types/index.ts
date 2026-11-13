export type ValidationStatus = "validated" | "needs_work" | "discussing";

export type TrackCategory = "original" | "remix" | "sound_design" | "ambience";

export type RightsStatus = "100% Libre" | "CC-BY / CC0" | "SACEM" | "Original Score";

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
  cueId?: string;
  actId?: string;
  sceneId?: string;
  pdfPage?: number;
  cueQuote?: string;
  bpm?: string | number;
  keyMode?: string;
  rightsStatus: RightsStatus;
  notes?: string;
  version: string;
  peaks?: number[];
  validationStatus: ValidationStatus;
  comments: TrackComment[];
  createdAt: string;
  updatedAt: string;
}

export interface MusicalAxis {
  title: string;
  context: string;
  keyMode: string;
  tempo: string;
  chords: string;
  vstTools: string;
  color: string;
}

export interface Scene {
  id: string;
  number: number;
  title: string;
  location: string;
  characters: string[];
  summary: string;
  pageStart: number;
  pageEnd: number;
}

export interface Act {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  pageRange: string;
  musical: MusicalAxis;
  scenes: Scene[];
}

export interface ScriptCue {
  id: string;
  actId: string;
  sceneId: string;
  page: number;
  speaker: string;
  stageDirection?: string;
  cueText: string;
  fullText: string;
  suggestedTrack?: string;
  modeBpm?: string;
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
    extractedAt: string;
    version: string;
  };
  musicalAxes: Record<string, MusicalAxis>;
  characters: Character[];
  acts: Act[];
  cues: ScriptCue[];
}

export interface TerrassesDatabase {
  version: string;
  lastUpdated: string;
  tracks: AudioTrack[];
}
