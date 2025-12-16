/**
 * NeoDB API Client
 * Wrapper functions for calling NeoDB API endpoints
 * 
 * REFACTORED: Now re-exports from better-auth-neodb package to avoid duplication.
 */

export {
  fetchNeoDBShelf,
  fetchNeoDBMarks,
  fetchNeoDBItem,
  fetchNeoDBStats,
  NeoDBApiClient,
  type NeoDBMarkFilters,
  type NeoDBShelfCategory
} from "better-auth-neodb";
