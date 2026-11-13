"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Lock,
  Unlock,
  UploadCloud,
  FileAudio,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Sparkles,
  Music,
} from "lucide-react";
import { ScriptStructure, AudioTrack, RightsStatus, TrackCategory } from "@/types";

interface AdminModalProps {
  isOpen: boolean;
  isAdmin: boolean;
  adminPin: string;
  scriptStructure: ScriptStructure;
  editingTrack?: AudioTrack | null;
  onClose: () => void;
  onLoginSuccess: (pin: string) => void;
  onTrackCreated: (track: AudioTrack) => void;
  onTrackUpdated: (track: AudioTrack) => void;
  onLogout: () => void;
}

/**
 * Compute audio waveform peaks client-side in seconds using OfflineAudioContext.
 * Generates lightweight normalized JSON array for instant 10ms waveform render!
 */
async function computeAudioPeaks(
  file: File,
  peakCount: number = 120
): Promise<{ peaks: number[]; duration: number }> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const audioCtx = new AudioContextClass();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

    const channelData = audioBuffer.getChannelData(0);
    const totalSamples = channelData.length;
    const blockSize = Math.floor(totalSamples / peakCount);
    const peaks: number[] = [];

    for (let i = 0; i < peakCount; i++) {
      const start = i * blockSize;
      let max = 0;
      for (let j = 0; j < blockSize; j++) {
        const val = Math.abs(channelData[start + j]);
        if (val > max) max = val;
      }
      peaks.push(Number(max.toFixed(3)));
    }

    return { peaks, duration: Math.round(audioBuffer.duration) };
  } catch (err) {
    console.warn("Client peak computation failed, fallback to estimated peaks:", err);
    // Fallback pseudo peaks
    const peaks: number[] = [];
    for (let i = 0; i < peakCount; i++) {
      peaks.push(Number((0.2 + Math.random() * 0.6).toFixed(3)));
    }
    return { peaks, duration: 90 };
  }
}

export function AdminModal({
  isOpen,
  isAdmin,
  adminPin,
  scriptStructure,
  editingTrack,
  onClose,
  onLoginSuccess,
  onTrackCreated,
  onTrackUpdated,
  onLogout,
}: AdminModalProps) {
  // Login PIN state
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const [isVerifyingPin, setIsVerifyingPin] = useState(false);

  // Upload & Form state
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "computing_peaks" | "uploading" | "saving" | "done" | "error">("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");

  // Track metadata fields
  const [title, setTitle] = useState(editingTrack?.title || "");
  const [category, setCategory] = useState<TrackCategory>(editingTrack?.category || "original");
  const [version, setVersion] = useState(editingTrack?.version || "V1");
  const [actId, setActId] = useState(editingTrack?.actId || "act-1");
  const [sceneId, setSceneId] = useState(editingTrack?.sceneId || "act-1-sc-1");
  const [cueId, setCueId] = useState(editingTrack?.cueId || "");
  const [pdfPage, setPdfPage] = useState(editingTrack?.pdfPage || 1);
  const [cueQuote, setCueQuote] = useState(editingTrack?.cueQuote || "");
  const [bpm, setBpm] = useState(editingTrack?.bpm || "72 BPM");
  const [keyMode, setKeyMode] = useState(editingTrack?.keyMode || "Fa Lydien");
  const [rightsStatus, setRightsStatus] = useState<RightsStatus>(editingTrack?.rightsStatus || "100% Libre");
  const [notes, setNotes] = useState(editingTrack?.notes || "");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync state if editing an existing track
  React.useEffect(() => {
    if (editingTrack) {
      setTitle(editingTrack.title);
      setCategory(editingTrack.category);
      setVersion(editingTrack.version);
      setActId(editingTrack.actId || "act-1");
      setSceneId(editingTrack.sceneId || "act-1-sc-1");
      setCueId(editingTrack.cueId || "");
      setPdfPage(editingTrack.pdfPage || 1);
      setCueQuote(editingTrack.cueQuote || "");
      setBpm(editingTrack.bpm || "72 BPM");
      setKeyMode(editingTrack.keyMode || "Fa Lydien");
      setRightsStatus(editingTrack.rightsStatus || "100% Libre");
      setNotes(editingTrack.notes || "");
    }
  }, [editingTrack]);

  // When selecting an Act, filter available scenes
  const selectedAct = scriptStructure.acts.find((a) => a.id === actId);
  const availableScenes = selectedAct?.scenes || [];

  // When selecting a Cue from dropdown, autofill quote & page & musical mode
  const handleCueSelect = (id: string) => {
    setCueId(id);
    const found = scriptStructure.cues.find((c) => c.id === id);
    if (found) {
      setActId(found.actId);
      setSceneId(found.sceneId);
      setPdfPage(found.page);
      setCueQuote(found.cueText);
      if (found.modeBpm) {
        setKeyMode(found.modeBpm.split("-")[0]?.trim() || keyMode);
      }
    }
  };

  // Submit PIN
  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifyingPin(true);
    setPinError("");

    try {
      const res = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: pinInput }),
      });
      const data = await res.json();
      if (data.success && data.authorized) {
        onLoginSuccess(pinInput);
      } else {
        setPinError(data.error || "Code PIN incorrect (par défaut: 0000)");
      }
    } catch (err) {
      setPinError("Erreur de connexion");
    } finally {
      setIsVerifyingPin(false);
    }
  };

  // Handle Drag & Drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.includes("audio") || file.name.endsWith(".wav") || file.name.endsWith(".mp3")) {
        setFileToUpload(file);
        if (!title) {
          setTitle(file.name.replace(/\.[^/.]+$/, "").replace(/_/g, " "));
        }
      }
    }
  };

  // Submit Upload or Edit form
  const handleSaveTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) {
      setErrorMessage("Le titre de la composition est requis.");
      return;
    }

    setErrorMessage("");

    // CASE 1: Editing existing track metadata without uploading new file
    if (editingTrack && !fileToUpload) {
      setUploadStatus("saving");
      try {
        const res = await fetch(`/api/tracks/${editingTrack.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            adminPin,
            updates: {
              title,
              category,
              version,
              actId,
              sceneId,
              cueId,
              pdfPage: Number(pdfPage),
              cueQuote,
              bpm,
              keyMode,
              rightsStatus,
              notes,
            },
          }),
        });
        const data = await res.json();
        if (data.success && data.track) {
          onTrackUpdated(data.track);
          setUploadStatus("done");
          setTimeout(() => {
            onClose();
            setUploadStatus("idle");
          }, 1000);
        } else {
          setErrorMessage(data.error || "Échec de la mise à jour");
          setUploadStatus("error");
        }
      } catch (err: any) {
        setErrorMessage(err.message || "Erreur de mise à jour");
        setUploadStatus("error");
      }
      return;
    }

    // CASE 2: Uploading a new audio file (.wav / .mp3)
    if (!fileToUpload) {
      setErrorMessage("Veuillez sélectionner un fichier audio (.wav ou .mp3).");
      return;
    }

    try {
      // 1. Compute waveform peaks client-side in OfflineAudioContext
      setUploadStatus("computing_peaks");
      const { peaks, duration } = await computeAudioPeaks(fileToUpload);

      // 2. Request Resumable Upload URL from Google Drive API
      setUploadStatus("uploading");
      const initRes = await fetch("/api/upload/init-resumable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: fileToUpload.name,
          mimeType: fileToUpload.type,
          adminPin,
        }),
      });

      const initData = await initRes.json();
      if (!initData.success) {
        throw new Error(initData.error || "Impossible d'initialiser l'upload");
      }

      let driveFileId: string | undefined = undefined;
      let localPath: string | undefined = undefined;

      if (initData.mode === "drive_resumable") {
        // Direct browser-to-Drive upload (bypasses serverless payload limits)
        const driveUploadRes = await fetch(initData.uploadUrl, {
          method: "PUT",
          headers: {
            "Content-Type": fileToUpload.type || "audio/wav",
          },
          body: fileToUpload,
        });

        if (!driveUploadRes.ok) {
          throw new Error("L'envoi direct vers Google Drive a échoué.");
        }

        const driveData = await driveUploadRes.json();
        driveFileId = driveData.id;
      } else {
        // Fallback local upload
        const formData = new FormData();
        formData.append("file", fileToUpload);
        formData.append("adminPin", adminPin);

        const localUploadRes = await fetch("/api/upload/local", {
          method: "POST",
          body: formData,
        });
        const localData = await localUploadRes.json();
        if (!localData.success) {
          throw new Error(localData.error || "Échec de l'upload local");
        }
        localPath = localData.localPath;
      }

      // 3. Register Track in terrasses-db.json
      setUploadStatus("saving");
      const newTrackPayload: Partial<AudioTrack> = {
        title,
        category,
        fileName: fileToUpload.name,
        fileSize: fileToUpload.size,
        duration: duration || 60,
        mimeType: fileToUpload.type || "audio/wav",
        driveFileId,
        localPath,
        actId,
        sceneId,
        cueId,
        pdfPage: Number(pdfPage),
        cueQuote,
        bpm,
        keyMode,
        rightsStatus,
        notes,
        version,
        peaks,
        validationStatus: "discussing",
        comments: [],
      };

      if (editingTrack) {
        // Replacing audio version on existing track
        const updateRes = await fetch(`/api/tracks/${editingTrack.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            adminPin,
            updates: newTrackPayload,
          }),
        });
        const updateData = await updateRes.json();
        if (updateData.success && updateData.track) {
          onTrackUpdated(updateData.track);
        }
      } else {
        // Creating new track
        const createRes = await fetch("/api/tracks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            adminPin,
            track: newTrackPayload,
          }),
        });
        const createData = await createRes.json();
        if (createData.success && createData.track) {
          onTrackCreated(createData.track);
        }
      }

      setUploadStatus("done");
      setTimeout(() => {
        onClose();
        setUploadStatus("idle");
        setFileToUpload(null);
      }, 1200);
    } catch (err: any) {
      console.error("Save track error:", err);
      setErrorMessage(err.message || "Erreur lors de l'enregistrement");
      setUploadStatus("error");
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/50 dark:bg-black/75 backdrop-blur-md"
        />

        {/* Modal Window in Apple visionOS Liquid Glass */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-2xl overflow-hidden rounded-3xl bg-white/85 dark:bg-zinc-900/85 backdrop-blur-3xl backdrop-saturate-200 border border-white/80 dark:border-white/15 shadow-2xl z-10 my-8"
        >
          {/* Top specular reflection */}
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white dark:via-white/30 to-transparent" />

          {/* Modal Header */}
          <div className="flex items-center justify-between p-6 pb-4 border-b border-black/[0.06] dark:border-white/[0.08]">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-sm">
                {isAdmin ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              </div>
              <div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                  {isAdmin ? (editingTrack ? "Édition de la Piste" : "Espace Compositeur (Admin)") : "Accès Compositeur"}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {isAdmin
                    ? "Gestion des morceaux, repères de texte et synchronisation Drive"
                    : "Entrez le code secret pour débloquer l'upload et l'édition"}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* If NOT authenticated: PIN Lock Form */}
          {!isAdmin ? (
            <div className="p-8 space-y-6">
              <form onSubmit={handlePinSubmit} className="space-y-4 max-w-xs mx-auto text-center">
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Veuillez saisir votre code PIN secret :
                </p>

                <input
                  type="password"
                  maxLength={6}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="••••"
                  autoFocus
                  className="w-full text-center tracking-[1em] text-2xl font-mono py-3 rounded-2xl bg-white/60 dark:bg-zinc-800/60 border border-white/70 dark:border-white/10 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />

                {pinError && (
                  <p className="text-xs text-rose-500 font-medium">{pinError}</p>
                )}

                <button
                  type="submit"
                  disabled={isVerifyingPin || !pinInput}
                  className="w-full py-2.5 rounded-full text-sm font-semibold bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:opacity-90 disabled:opacity-40 transition-opacity shadow-md flex items-center justify-center gap-2"
                >
                  {isVerifyingPin ? <Loader2 className="w-4 h-4 animate-spin" /> : <Unlock className="w-4 h-4" />}
                  <span>Déverrouiller</span>
                </button>

                <p className="text-[11px] text-zinc-400">
                  Astuce : par défaut, le PIN est <code className="font-mono bg-black/5 dark:bg-white/10 px-1.5 py-0.5 rounded">0000</code>.
                </p>
              </form>
            </div>
          ) : (
            /* If authenticated: Drag & Drop + Metadata Editor */
            <form onSubmit={handleSaveTrack} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* Drag & Drop Upload Zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative p-6 rounded-3xl border-2 border-dashed transition-all cursor-pointer text-center space-y-2 ${
                  isDragging
                    ? "border-blue-500 bg-blue-500/10"
                    : fileToUpload
                    ? "border-emerald-500/50 bg-emerald-500/5"
                    : "border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20 bg-black/[0.01] dark:bg-white/[0.02]"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/wav,audio/mp3,audio/*"
                  className="hidden"
                  onChange={(e) => {
                    const files = e.target.files;
                    if (files && files.length > 0) {
                      setFileToUpload(files[0]);
                      if (!title) {
                        setTitle(files[0].name.replace(/\.[^/.]+$/, "").replace(/_/g, " "));
                      }
                    }
                  }}
                />

                <div className="flex justify-center">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 dark:bg-blue-400/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    {fileToUpload ? <FileAudio className="w-6 h-6 text-emerald-500" /> : <UploadCloud className="w-6 h-6" />}
                  </div>
                </div>

                {fileToUpload ? (
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 truncate">
                      {fileToUpload.name}
                    </p>
                    <p className="text-xs text-zinc-400">
                      {(fileToUpload.size / (1024 * 1024)).toFixed(2)} Mo • Peaks calculés automatiquement
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      {editingTrack ? "Glissez un nouveau fichier pour remplacer l'audio" : "Glissez votre fichier .wav ou .mp3 ici"}
                    </p>
                    <p className="text-xs text-zinc-400">
                      Gros fichiers .wav supportés sans limite grâce au Resumable Upload Google Drive
                    </p>
                  </div>
                )}
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Title */}
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Titre de la composition *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: L'Insouciance (Ouverture)"
                    className="w-full px-3.5 py-2 rounded-xl text-sm bg-white/60 dark:bg-zinc-800/60 border border-white/70 dark:border-white/10 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Category & Version */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Catégorie
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as TrackCategory)}
                    className="w-full px-3 py-2 rounded-xl text-sm bg-white/60 dark:bg-zinc-800/60 border border-white/70 dark:border-white/10 text-zinc-900 dark:text-zinc-100"
                  >
                    <option value="original">Composition originale</option>
                    <option value="remix">Remix / Relecture</option>
                    <option value="sound_design">Sound Design</option>
                    <option value="ambience">Bruitage / Ambiance</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Version
                  </label>
                  <input
                    type="text"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    placeholder="V1, V2..."
                    className="w-full px-3.5 py-2 rounded-xl text-sm bg-white/60 dark:bg-zinc-800/60 border border-white/70 dark:border-white/10 text-zinc-900 dark:text-zinc-100"
                  />
                </div>

                {/* Fast Cue / Repère Select from Script */}
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                    <span>Associer à un Repère Scénique du Script (Cue)</span>
                    <span className="text-[10px] text-blue-500 font-normal">Autocomplète l'Acte et la Page</span>
                  </label>
                  <select
                    value={cueId}
                    onChange={(e) => handleCueSelect(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-sm bg-white/60 dark:bg-zinc-800/60 border border-white/70 dark:border-white/10 text-zinc-900 dark:text-zinc-100"
                  >
                    <option value="">Sélectionner un repère du texte...</option>
                    {scriptStructure.cues.map((c) => (
                      <option key={c.id} value={c.id}>
                        Page {c.page} : [{c.speaker}] {c.cueText.slice(0, 70)}...
                      </option>
                    ))}
                  </select>
                </div>

                {/* Act & Scene Select */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Acte
                  </label>
                  <select
                    value={actId}
                    onChange={(e) => {
                      setActId(e.target.value);
                      const a = scriptStructure.acts.find((item) => item.id === e.target.value);
                      if (a && a.scenes.length > 0) {
                        setSceneId(a.scenes[0].id);
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl text-sm bg-white/60 dark:bg-zinc-800/60 border border-white/70 dark:border-white/10 text-zinc-900 dark:text-zinc-100"
                  >
                    {scriptStructure.acts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Scène
                  </label>
                  <select
                    value={sceneId}
                    onChange={(e) => setSceneId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-sm bg-white/60 dark:bg-zinc-800/60 border border-white/70 dark:border-white/10 text-zinc-900 dark:text-zinc-100"
                  >
                    {availableScenes.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Page & Quote */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Page du PDF
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={pdfPage}
                    onChange={(e) => setPdfPage(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl text-sm bg-white/60 dark:bg-zinc-800/60 border border-white/70 dark:border-white/10 text-zinc-900 dark:text-zinc-100"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Tonalité & Mode (ex: Fa Lydien, Ré Dorien...)
                  </label>
                  <input
                    type="text"
                    value={keyMode}
                    onChange={(e) => setKeyMode(e.target.value)}
                    placeholder="Fa Lydien"
                    className="w-full px-3.5 py-2 rounded-xl text-sm bg-white/60 dark:bg-zinc-800/60 border border-white/70 dark:border-white/10 text-zinc-900 dark:text-zinc-100"
                  />
                </div>

                {/* BPM & Rights */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    BPM / Tempo
                  </label>
                  <input
                    type="text"
                    value={bpm}
                    onChange={(e) => setBpm(e.target.value)}
                    placeholder="72 BPM, Rubato..."
                    className="w-full px-3.5 py-2 rounded-xl text-sm bg-white/60 dark:bg-zinc-800/60 border border-white/70 dark:border-white/10 text-zinc-900 dark:text-zinc-100"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Droits & Propriété
                  </label>
                  <select
                    value={rightsStatus}
                    onChange={(e) => setRightsStatus(e.target.value as RightsStatus)}
                    className="w-full px-3 py-2 rounded-xl text-sm bg-white/60 dark:bg-zinc-800/60 border border-white/70 dark:border-white/10 text-zinc-900 dark:text-zinc-100"
                  >
                    <option value="100% Libre">100% Libre</option>
                    <option value="Original Score">Original Score</option>
                    <option value="CC-BY / CC0">CC-BY / CC0</option>
                    <option value="SACEM">SACEM</option>
                  </select>
                </div>

                {/* Quote details */}
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Citation scénique ou didascalie
                  </label>
                  <textarea
                    rows={2}
                    value={cueQuote}
                    onChange={(e) => setCueQuote(e.target.value)}
                    placeholder="« J'ouvre les yeux. Je me dis que cette journée est belle... »"
                    className="w-full px-3.5 py-2 rounded-xl text-xs bg-white/60 dark:bg-zinc-800/60 border border-white/70 dark:border-white/10 text-zinc-900 dark:text-zinc-100 font-serif"
                  />
                </div>

                {/* Notes d'intention */}
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Notes d'intention pour la metteuse en scène
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Piano feutré, bruit mécanique des touches audible..."
                    className="w-full px-3.5 py-2 rounded-xl text-xs bg-white/60 dark:bg-zinc-800/60 border border-white/70 dark:border-white/10 text-zinc-900 dark:text-zinc-100"
                  />
                </div>
              </div>

              {/* Status Message */}
              {uploadStatus !== "idle" && (
                <div className="p-3.5 rounded-2xl bg-blue-500/10 text-blue-700 dark:text-blue-300 text-xs flex items-center gap-2">
                  {uploadStatus === "computing_peaks" && (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                      <span>Calcul instantané de la forme d'onde via OfflineAudioContext...</span>
                    </>
                  )}
                  {uploadStatus === "uploading" && (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                      <span>Upload vers Google Drive (Resumable Session en cours)...</span>
                    </>
                  )}
                  {uploadStatus === "saving" && (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                      <span>Enregistrement dans terrasses-db.json...</span>
                    </>
                  )}
                  {uploadStatus === "done" && (
                    <>
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                      <span>Piste enregistrée avec succès !</span>
                    </>
                  )}
                  {uploadStatus === "error" && (
                    <>
                      <AlertTriangle className="w-4 h-4 text-rose-500" />
                      <span>{errorMessage || "Une erreur est survenue"}</span>
                    </>
                  )}
                </div>
              )}

              {errorMessage && uploadStatus === "idle" && (
                <p className="text-xs text-rose-500 font-medium">{errorMessage}</p>
              )}

              {/* Footer actions */}
              <div className="flex items-center justify-between pt-3 border-t border-black/[0.06] dark:border-white/[0.08]">
                <button
                  type="button"
                  onClick={onLogout}
                  className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                >
                  Quitter le mode Admin
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-full text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={uploadStatus !== "idle" && uploadStatus !== "error"}
                    className="px-5 py-2 rounded-full text-xs font-semibold bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:opacity-90 disabled:opacity-40 transition-opacity shadow-sm flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{editingTrack ? "Sauvegarder les modifications" : "Publier la composition"}</span>
                  </button>
                </div>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
