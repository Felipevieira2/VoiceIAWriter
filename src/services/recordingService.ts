import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system/legacy';
import * as Crypto from 'expo-crypto';
import { Recording } from '../types';

const DB_NAME = 'recordings.db';
const RECORDINGS_DIR = (FileSystem.documentDirectory || FileSystem.cacheDirectory) + 'recordings/';

export class RecordingService {
  private db: SQLite.SQLiteDatabase | null = null;

  async init(): Promise<void> {
    if (this.db) return;

    // Ensure recordings directory exists
    try {
      const dirInfo = await FileSystem.getInfoAsync(RECORDINGS_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(RECORDINGS_DIR, { intermediates: true });
      }
    } catch (error) {
      // Directory likely exists or cannot be created
    }

    this.db = await SQLite.openDatabaseAsync(DB_NAME);
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS recordings (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        duration INTEGER NOT NULL,
        createdAt TEXT NOT NULL,
        status TEXT NOT NULL,
        fileUri TEXT NOT NULL,
        meteringLevels TEXT
      );
    `);
  }

  async saveRecording(tempUri: string, duration: number, meteringLevels: number[] = []): Promise<Recording> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    const id = Crypto.randomUUID();
    const fileName = `${id}.m4a`;
    const newPath = RECORDINGS_DIR + fileName;

    // Move file from cache to permanent storage
    await FileSystem.moveAsync({
      from: tempUri,
      to: newPath
    });

    const recording: Recording = {
      id,
      title: `Voice Note ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      duration,
      createdAt: new Date().toISOString(),
      status: 'draft',
      fileUri: newPath,
      meteringLevels
    };

    await this.db.runAsync(
      'INSERT INTO recordings (id, title, duration, createdAt, status, fileUri, meteringLevels) VALUES (?, ?, ?, ?, ?, ?, ?)',
      recording.id,
      recording.title,
      recording.duration,
      recording.createdAt,
      recording.status,
      recording.fileUri,
      JSON.stringify(meteringLevels)
    );

    return recording;
  }

  async getAllRecordings(): Promise<Recording[]> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getAllAsync<any>('SELECT * FROM recordings ORDER BY createdAt DESC');

    return result.map(row => ({
      ...row,
      meteringLevels: row.meteringLevels ? JSON.parse(row.meteringLevels) : []
    }));
  }

  async deleteRecording(id: string): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    const recording = await this.db.getFirstAsync<any>('SELECT fileUri FROM recordings WHERE id = ?', id);
    if (recording) {
      try {
        await FileSystem.deleteAsync(recording.fileUri, { idempotent: true });
      } catch (e) {
        console.warn("Could not delete file", e);
      }
    }

    await this.db.runAsync('DELETE FROM recordings WHERE id = ?', id);
  }
}

export const recordingService = new RecordingService();
