import axios from 'axios';

const API_HOST = import.meta.env.VITE_API_BASE_URL || '';
const api = axios.create({
  baseURL: `${API_HOST}/api`,
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface DashboardStats {
  total_population: number;
  avg_population_density: number;
  avg_emotion_index: number;
  total_alerts: number;
  total_guides: number;
  risk_level_distribution: Record<string, number>;
  disaster_type_distribution: Record<string, number>;
  estimated_total_loss: number;
  active_disasters: number;
  online_servers: number;
  total_servers: number;
}

export interface ServerStatus {
  id: number;
  name: string;
  location: string;
  latitude: number;
  longitude: number;
  status: string;
  cpu_usage: number;
  memory_usage: number;
  sensor_count: number;
  region_risk_level: string;
  last_heartbeat: string;
}

export interface RiskZone {
  id: number;
  name: string;
  risk_level: string;
  latitude: number;
  longitude: number;
  radius_km: number;
  population_density: number;
  emotion_index: number;
  alert_count: number;
  guide_count: number;
}

export interface SafeZone {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  capacity: number;
  current_occupancy: number;
  facility_type: string;
}

export interface DisasterEvent {
  id: number;
  name: string;
  disaster_type: string;
  severity: string;
  latitude: number;
  longitude: number;
  radius_km: number;
  status: string;
  affected_population: number;
  created_at: string;
}

export interface RiskAssessment {
  id: number;
  zone_name: string;
  risk_level: string;
  risk_score: number;
  population_total: number;
  estimated_loss: number;
  disaster_type: string;
}

export interface AlertRecord {
  id: number;
  title: string;
  alert_type: string;
  severity: string;
  content: string;
  is_active: boolean;
  created_at: string;
  latitude?: number;
  longitude?: number;
}

export interface DecisionResult {
  risk_level: string;
  risk_score: number;
  recommended_action: string;
  safe_zone: string;
  safe_zone_distance_km: number;
  evacuation_route: [number, number][];
  estimated_time_minutes: number;
  disaster: { name: string; type: string; severity: string; distance_km: number };
}

export interface TrendDataPoint {
  date: string;
  avg_risk_score: number;
  alert_count: number;
}

export interface PopulationStat {
  disaster_type: string;
  affected_population: number;
}

export interface ReverseGeocodeResult {
  found: boolean;
  zone_name?: string;
  risk_level?: string;
  latitude?: number;
  longitude?: number;
  radius_km?: number;
  population_density?: number;
  distance_km?: number;
  message?: string;
}

export const authAPI = {
  login: (username: string, password: string) =>
    api.post('/auth/login', { username, password }).then(r => r.data),
  register: (username: string, email: string, password: string) =>
    api.post('/auth/register', { username, email, password }).then(r => r.data),
};

export const riskAPI = {
  getDashboard: () => api.get<DashboardStats>('/dashboard').then(r => r.data),
  getRiskZones: () => api.get<RiskZone[]>('/risk-zones').then(r => r.data),
  getSafeZones: () => api.get<SafeZone[]>('/safe-zones').then(r => r.data),
  getDisasters: () => api.get<DisasterEvent[]>('/disasters').then(r => r.data),
  getAssessments: () => api.get<RiskAssessment[]>('/assessments').then(r => r.data),
  getAlerts: (activeOnly = false) =>
    api.get<AlertRecord[]>('/alerts', { params: { active_only: activeOnly } }).then(r => r.data),
  getServers: () => api.get<ServerStatus[]>('/servers').then(r => r.data),
  getDecision: (lat: number, lng: number, disasterId?: number) =>
    api.post<DecisionResult>('/decision', null, { params: { lat, lng, disaster_id: disasterId } }).then(r => r.data),
  getTrends: (period = 'week') =>
    api.get<TrendDataPoint[]>('/stats/trends', { params: { period } }).then(r => r.data),
  getPopulationStats: (period = 'week') =>
    api.get<PopulationStat[]>('/stats/population', { params: { period } }).then(r => r.data),
  reverseGeocode: (lat: number, lng: number) =>
    api.get<ReverseGeocodeResult>('/stats/reverse-geocode', { params: { lat, lng } }).then(r => r.data),
};

export default api;
