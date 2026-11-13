import { google } from "googleapis";
import fs from "fs";
import path from "path";
import { Readable } from "stream";
import { AudioTrack, TerrassesDatabase } from "@/types";

const LOCAL_DB_PATH = path.join(process.cwd(), "src", "data", "local-db.json");
const DB_FILE_NAME = "terrasses-db.json";

/**
 * Check whether Google Drive credentials and folder ID are configured.
 */
export function isDriveConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_EMAIL &&
    process.env.GOOGLE_PRIVATE_KEY &&
    process.env.GOOGLE_DRIVE_FOLDER_ID
  );
}

/**
 * Initialize Google Drive API client using Service Account credentials.
 */
function getDriveClient() {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!clientEmail || !privateKey) {
    throw new Error("Google Drive Service Account credentials missing in .env.local");
  }

  // Handle line breaks in private key string
  privateKey = privateKey.replace(/\\n/g, "\n");

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: [
      "https://www.googleapis.com/auth/drive",
      "https://www.googleapis.com/auth/drive.file",
    ],
  });

  return google.drive({ version: "v3", auth });
}

/**
 * Read the local database JSON fallback file.
 */
export function getLocalDatabase(): TerrassesDatabase {
  try {
    if (fs.existsSync(LOCAL_DB_PATH)) {
      const data = fs.readFileSync(LOCAL_DB_PATH, "utf-8");
      return JSON.parse(data) as TerrassesDatabase;
    }
  } catch (err) {
    console.error("Error reading local database fallback:", err);
  }

  // Default empty state if file not present
  return {
    version: "1.0.0",
    lastUpdated: new Date().toISOString(),
    tracks: [],
  };
}

/**
 * Write to the local database JSON fallback file.
 */
export function saveLocalDatabase(db: TerrassesDatabase): void {
  try {
    db.lastUpdated = new Date().toISOString();
    fs.mkdirSync(path.dirname(LOCAL_DB_PATH), { recursive: true });
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(db, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving local database:", err);
    throw err;
  }
}

/**
 * Locate terrasses-db.json on Google Drive within the specified folder.
 */
async function findDriveDbFileId(drive: ReturnType<typeof google.drive>, folderId: string): Promise<string | null> {
  const res = await drive.files.list({
    q: `'${folderId}' in parents and name = '${DB_FILE_NAME}' and trashed = false`,
    fields: "files(id, name)",
    spaces: "drive",
  });

  if (res.data.files && res.data.files.length > 0) {
    return res.data.files[0].id || null;
  }
  return null;
}

/**
 * Retrieve the database:
 * - From Google Drive if configured,
 * - Automatically falling back to src/data/local-db.json otherwise.
 */
export async function getDatabase(): Promise<{ db: TerrassesDatabase; source: "drive" | "local" }> {
  if (!isDriveConfigured()) {
    return { db: getLocalDatabase(), source: "local" };
  }

  try {
    const drive = getDriveClient();
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID!;
    const fileId = await findDriveDbFileId(drive, folderId);

    if (!fileId) {
      // If not yet on Drive, push local DB to Drive as initial state
      const initialDb = getLocalDatabase();
      await saveDatabaseToDrive(drive, folderId, null, initialDb);
      return { db: initialDb, source: "drive" };
    }

    // Read content from Drive
    const response = await drive.files.get(
      { fileId, alt: "media" },
      { responseType: "json" }
    );

    const db = response.data as TerrassesDatabase;
    // Keep local file in sync as backup
    saveLocalDatabase(db);
    return { db, source: "drive" };
  } catch (error) {
    console.error("Drive getDatabase failed, falling back to local-db:", error);
    return { db: getLocalDatabase(), source: "local" };
  }
}

/**
 * Save database to Google Drive (and local mirror).
 */
async function saveDatabaseToDrive(
  drive: ReturnType<typeof google.drive>,
  folderId: string,
  existingFileId: string | null,
  db: TerrassesDatabase
): Promise<string> {
  db.lastUpdated = new Date().toISOString();
  const fileContent = JSON.stringify(db, null, 2);
  const media = {
    mimeType: "application/json",
    body: Readable.from([fileContent]),
  };

  if (existingFileId) {
    const updated = await drive.files.update({
      fileId: existingFileId,
      media,
      fields: "id",
    });
    return updated.data.id!;
  } else {
    const created = await drive.files.create({
      requestBody: {
        name: DB_FILE_NAME,
        parents: [folderId],
        mimeType: "application/json",
      },
      media,
      fields: "id",
    });
    return created.data.id!;
  }
}

/**
 * Save database across Drive and local store.
 */
export async function saveDatabase(db: TerrassesDatabase): Promise<{ success: boolean; source: "drive" | "local" }> {
  saveLocalDatabase(db);

  if (!isDriveConfigured()) {
    return { success: true, source: "local" };
  }

  try {
    const drive = getDriveClient();
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID!;
    const fileId = await findDriveDbFileId(drive, folderId);
    await saveDatabaseToDrive(drive, folderId, fileId, db);
    return { success: true, source: "drive" };
  } catch (error) {
    console.error("Failed to save DB to Drive, kept in local fallback:", error);
    return { success: true, source: "local" };
  }
}

/**
 * Initiate a Resumable Upload URL with Google Drive API v3.
 * Allows client browser to directly upload 50MB-200MB .wav files to Google Drive,
 * completely bypassing serverless 4.5MB request payload constraints.
 */
export async function createResumableUploadUrl(fileName: string, mimeType: string): Promise<string> {
  if (!isDriveConfigured()) {
    throw new Error("Google Drive is not configured in .env.local");
  }

  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL!;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY!;
  privateKey = privateKey.replace(/\\n/g, "\n");
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID!;

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/drive"],
  });

  const tokenResponse = await auth.getAccessToken();
  const accessToken = tokenResponse.token;

  if (!accessToken) {
    throw new Error("Unable to obtain Google Drive OAuth access token");
  }

  const metadata = {
    name: fileName,
    parents: [folderId],
    mimeType: mimeType || "audio/wav",
  };

  const response = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json; charset=UTF-8",
        "X-Upload-Content-Type": mimeType || "audio/wav",
      },
      body: JSON.stringify(metadata),
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Google Drive Resumable Init failed (${response.status}): ${errText}`);
  }

  const sessionUri = response.headers.get("location");
  if (!sessionUri) {
    throw new Error("Google Drive did not return a resumable session URI");
  }

  return sessionUri;
}

/**
 * Delete a file on Google Drive if present.
 */
export async function deleteDriveFile(fileId: string): Promise<boolean> {
  if (!isDriveConfigured()) return false;
  try {
    const drive = getDriveClient();
    await drive.files.delete({ fileId });
    return true;
  } catch (error) {
    console.error("Error deleting file on Drive:", error);
    return false;
  }
}
