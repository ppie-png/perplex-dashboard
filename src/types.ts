export type ServerStatus = 'offline' | 'starting' | 'online' | 'stopping';

export interface ServerStats {
  cpu: number;
  ramUsed: number;
  ramMax: number;
  diskUsed: number;
  diskMax: number;
  networkIn: number;
  networkOut: number;
  playersOnline: number;
  playersMax: number;
}

export interface ConsoleMessage {
  id: string;
  timestamp: string;
  line: string;
  type: 'info' | 'warn' | 'error' | 'command' | 'success';
}

export interface FileItem {
  name: string;
  type: 'file' | 'directory';
  size?: string;
  lastModified?: string;
  content?: string;
}

export interface PluginItem {
  id: string;
  name: string;
  description: string;
  version: string;
  category: string;
  installed: boolean;
  author: string;
  downloads: string;
}

export interface DatabaseItem {
  id: string;
  name: string;
  username: string;
  host: string;
  size: string;
  status: 'active' | 'creating';
}

export interface BackupItem {
  id: string;
  name: string;
  date: string;
  size: string;
  status: 'completed' | 'creating';
}

export interface ServerProperty {
  key: string;
  value: string;
  defaultValue: string;
  description: string;
  type: 'boolean' | 'string' | 'number';
}
