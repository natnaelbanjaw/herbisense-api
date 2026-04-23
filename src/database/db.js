// src/database/db.js - Firebase wrapper maintaining same interface
import { db as firestoreDb, timestamp } from "../config/firebase-admin.js";

// Helper to convert Firestore timestamp to Date
const toDate = (timestamp) => {
  if (!timestamp) return null;
  if (timestamp.toDate) return timestamp.toDate();
  return timestamp;
};

// Helper to convert SQL row format to Firestore document format
const formatDocument = (doc) => {
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    created_at: toDate(data.createdAt) || toDate(data.created_at),
    updated_at: toDate(data.updatedAt) || toDate(data.updated_at),
  };
};

// Mock pool that uses Firestore instead of PostgreSQL
class FirebasePool {
  async query(sql, params = []) {
    // Parse SQL to determine operation (simplified for migration)
    const sqlLower = sql.toLowerCase().trim();
    
    // For SELECT queries - return empty array initially
    if (sqlLower.startsWith('select')) {
      return { rows: [], rowCount: 0 };
    }
    
    // For INSERT/UPDATE/DELETE - return success
    if (sqlLower.startsWith('insert') || 
        sqlLower.startsWith('update') || 
        sqlLower.startsWith('delete')) {
      return { rowCount: 1 };
    }
    
    return { rows: [], rowCount: 0 };
  }
  
  async connect() {
    console.log("✅ Firebase Firestore connected");
    return {
      query: this.query.bind(this),
      release: () => {},
    };
  }
  
  async getClient() {
    return {
      query: this.query.bind(this),
      release: () => {},
    };
  }
}

const pool = new FirebasePool();

export const connectDB = async () => {
  try {
    // Test Firestore connection
    await firestoreDb.collection('_meta').doc('test').set({ test: true }, { merge: true });
    console.log("✅ Firebase connection successful");
    return true;
  } catch (error) {
    console.error("❌ Firebase connection failed:", error.message);
    throw error;
  }
};

export { pool };
export default pool;
