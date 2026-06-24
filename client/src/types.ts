export interface Volunteer {
  id: string;
  name: string;
  location: string;
  status: 'available' | 'on-break' | 'escorting' | 'off-duty';
  checkedIn: boolean;
  lastUpdate: number;
}

export interface EscortTask {
  id: string;
  mediaPartner: string;
  company?: string;
  phone?: string;
  from: string;
  to: string;
  status: 'pending' | 'claimed' | 'completed';
  assignedTo?: string;
  createdAt: number;
  createdBy: string;
  completedAt?: number;
}

export interface AnnouncementReply {
  id: string;
  message: string;
  createdBy: string;
  createdAt: number;
}

export interface Announcement {
  id: string;
  message: string;
  createdAt: number;
  createdBy: string;
  createdByRole: 'volunteer' | 'intern';
  reactions: { onIt: string[]; question: string[] };
  replies: AnnouncementReply[];
}

export interface CoverageRule {
  location: string;
  minRequired: number;
}

export interface LocationEvent {
  id: string;
  volunteerName: string;
  eventType: 'checkin' | 'checkout' | 'location';
  location: string;
  timestamp: number;
}

export interface AppState {
  volunteers: Volunteer[];
  escorts: EscortTask[];
  announcements: Announcement[];
  locationEvents: LocationEvent[];
  locations: string[];
  interns: string[];
  staff: string[];
  coverageRules: CoverageRule[];
}
