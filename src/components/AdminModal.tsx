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
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const [isVerifyingPin, setIsVerifyingPin] = useState(false);

  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "computing_peaks" | "uploading" | "saving" | "done" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const [title, setTitle] = useState(editingTrack?.title || "");
  const [version, setVersion] = useState(editingTrack?.version || "V1");
  const [sectionId, setSectionId] = useState(editingTrack?.sectionId || "seq-1");
  const [cueId, setCueId] = useState(editingTrack?.cueId || "");
  const [pdfPage, setPdfPage] = useState(editingTrack?.pdfPage || 1);
  const [cueQuote, setCueQuote] = useState(editingTrack?.cueQuote || "");
  const [tempo, setTempo] = useState(editingTrack?.tempo || "~72 BPM");
  const [intention, setIntention] = useState(editingTrack?.intention || "");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    if (editingTrack) {
      setTitle(editingTrack.title);
      setVersion(editingTrack.version);
      setSectionId(editingTrack.sectionId || "seq-1");
      setCueId(editingTrack.cueId || "");
      setPdfPage(editingTrack.pdfPage || 1);
      setCueQuote(editingTrack.cueQuote || "");
      setTempo(editingTrack.tempo || "~72 BPM");
      setIntention(editingTrack.intention || "");
    }
  }, [editingTrack]);

  const handleCueSelect = (id: string) => {
    setCueId(id);
    const found = scriptStructure.cues.find((c) => c.id === id);
    if (found) {
      setSectionId(found.sectionId);
      setPdfPage(found.page);
      setCueQuote(found.cueText);
    }
  };

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
        setPinError(data.error || "Code PIN incorrect (0000)");
      }
    } catch (err) {
      setPinError("Erreur de connexion");
    } finally {
      setIsVerifyingPin(false);
    }
  };

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

  const handleSaveTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) {
      setErrorMessage("Le titre est requis.");
      return;
    }

    setErrorMessage("");

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
              version,
              sectionId,
              cueId,
              pdfPage: Number(pdfPage),
              cueQuote,
              tempo,
              intention,
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
          }, 800);
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

    if (!fileToUpload) {
      setErrorMessage("Veuillez sélectionner un fichier audio (.wav ou .mp3).");
      return;
    }

    try {
      setUploadStatus("computing_peaks");
      const { peaks, duration } = await computeAudioPeaks(fileToUpload);

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
        const driveUploadRes = await fetch(initData.uploadUrl, {
          method: "PUT",
          headers: {
            "Content-Type": fileToUpload.type || "audio/wav",
          },
          body: fileToUpload,
        });

        if (!driveUploadRes.ok) {
          throw new Error("L'envoi vers Google Drive a échoué.");
        }

        const driveData = await driveUploadRes.json();
        driveFileId = driveData.id;
      } else {
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

      setUploadStatus("saving");
      const newTrackPayload: Partial<AudioTrack> = {
        title,
        category: "original",
        fileName: fileToUpload.name,
        fileSize: fileToUpload.size,
        duration: duration || 60,
        mimeType: fileToUpload.type || "audio/wav",
        driveFileId,
        localPath,
        sectionId,
        cueId,
        pdfPage: Number(pdfPage),
        cueQuote,
        tempo,
        intention,
        version,
        peaks,
        validationStatus: "discussing",
        comments: [],
      };

      if (editingTrack) {
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
      }, 800);
    } catch (err: any) {
      setErrorMessage(err.message || "Erreur lors de l'enregistrement");
      setUploadStatus("error");
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/50 dark:bg-black/75 backdrop-blur-md"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ type: "spring", damping: 25, stiffness: 350 }}
          className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-3xl border border-white/80 dark:border-white/15 shadow-2xl z-10 my-8"
        >
          <div className="flex items-center justify-between p-5 pb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-black/5 dark:bg-white/10 flex items-center justify-center text-zinc-800 dark:text-zinc-200">
                {isAdmin ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                  {isAdmin ? (editingTrack ? "Modifier le morceau" : "Ajouter un morceau") : "Accès Compositeur"}
                </h3>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {!isAdmin ? (
            <div className="p-6">
              <form onSubmit={handlePinSubmit} className="space-y-4 max-w-xs mx-auto text-center">
                <input
                  type="password"
                  maxLength={6}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="PIN (0000)"
                  autoFocus
                  className="w-full text-center tracking-[0.6em] text-xl font-mono py-2.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />

                {pinError && (
                  <p className="text-xs text-rose-500 font-medium">{pinError}</p>
                )}

                <button
                  type="submit"
                  disabled={isVerifyingPin || !pinInput}
                  className="w-full py-2 rounded-xl text-xs font-semibold bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:opacity-90 disabled:opacity-40 transition-opacity"
                >
                  {isVerifyingPin ? <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" /> : "Déverrouiller"}
                </button>
              </form>
            </div>
          ) : (
            <form onSubmit={handleSaveTrack} className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Drag & Drop File */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-4 rounded-2xl border border-dashed transition-all cursor-pointer text-center space-y-1 ${
                  isDragging
                    ? "border-blue-500 bg-blue-500/10"
                    : fileToUpload
                    ? "border-emerald-500/50 bg-emerald-500/5"
                    : "border-black/10 dark:border-white/10 hover:border-black/20"
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
                  {fileToUpload ? (
                    <FileAudio className="w-6 h-6 text-emerald-500" />
                  ) : (
                    <UploadCloud className="w-6 h-6 text-zinc-400" />
                  )}
                </div>

                <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  {fileToUpload ? fileToUpload.name : "Glisser un fichier .wav ou .mp3"}
                </p>
              </div>

              {/* Title & Version */}
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2 space-y-1">
                  <label className="text-[11px] font-medium text-zinc-500">Titre</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Titre du morceau"
                    className="w-full px-3 py-1.5 rounded-xl text-xs bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 text-zinc-900 dark:text-zinc-100"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-zinc-500">Version</label>
                  <input
                    type="text"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    placeholder="V1, V2..."
                    className="w-full px-3 py-1.5 rounded-xl text-xs bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 text-zinc-900 dark:text-zinc-100"
                  />
                </div>
              </div>

              {/* Script Cue */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-zinc-500">
                  Repère dans le script
                </label>
                <select
                  value={cueId}
                  onChange={(e) => handleCueSelect(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl text-xs bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 text-zinc-900 dark:text-zinc-100"
                >
                  <option value="">Sélectionner une réplique / moment...</option>
                  {scriptStructure.cues.map((c) => (
                    <option key={c.id} value={c.id}>
                      Page {c.page} : [{c.speaker}] {c.cueText.slice(0, 60)}...
                    </option>
                  ))}
                </select>
              </div>

              {/* Séquence & Tempo */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-zinc-500">Moment du texte</label>
                  <select
                    value={sectionId}
                    onChange={(e) => setSectionId(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl text-xs bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 text-zinc-900 dark:text-zinc-100"
                  >
                    {scriptStructure.sections?.map((sec) => (
                      <option key={sec.id} value={sec.id}>
                        {sec.title} ({sec.pageRange})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-zinc-500">Tempo indicatif</label>
                  <input
                    type="text"
                    value={tempo}
                    onChange={(e) => setTempo(e.target.value)}
                    placeholder="~72 BPM, Rubato..."
                    className="w-full px-3 py-1.5 rounded-xl text-xs bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 text-zinc-900 dark:text-zinc-100"
                  />
                </div>
              </div>

              {/* Status */}
              {uploadStatus !== "idle" && (
                <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-700 dark:text-blue-300 text-xs flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Enregistrement en cours...</span>
                </div>
              )}

              {errorMessage && (
                <p className="text-xs text-rose-500 font-medium">{errorMessage}</p>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-black/[0.06] dark:border-white/[0.08]">
                <button
                  type="button"
                  onClick={onLogout}
                  className="text-[11px] text-zinc-400 hover:text-zinc-600"
                >
                  Déconnexion
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3 py-1.5 rounded-xl text-xs text-zinc-500 hover:bg-black/5"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={uploadStatus !== "idle" && uploadStatus !== "error"}
                    className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:opacity-90 disabled:opacity-40"
                  >
                    Enregistrer
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
