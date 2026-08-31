import {
  AlertCircle,
  Calendar,
  CheckSquare,
  FileText,
  Folder,
  Gavel,
  HelpCircle,
  Inbox,
  Info,
  Lightbulb,
  RefreshCw,
  Settings,
  Sun,
  Moon,
  Monitor,
  Users,
  User,
  type LucideIcon,
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  'check-square': CheckSquare,
  'help-circle': HelpCircle,
  info: Info,
  user: User,
  folder: Folder,
  calendar: Calendar,
  users: Users,
  gavel: Gavel,
  lightbulb: Lightbulb,
  'file-text': FileText,
  inbox: Inbox,
  'alert-circle': AlertCircle,
  refresh: RefreshCw,
  settings: Settings,
  sun: Sun,
  moon: Moon,
  monitor: Monitor,
};

export function getIcon(name: string): LucideIcon {
  return iconMap[name] ?? FileText;
}
