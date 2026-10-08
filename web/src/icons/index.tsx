/**
 * Icon registry — the one place that maps the system's icon names (`Icon/{category}/{name}`
 * on 1.7 Iconography) to an icon library. Components only ever use <Icon name="general/check" />.
 *
 * The library is Lucide (ISC). This registry is also the icon set of the Figma file:
 * tools/icons-lucide.mjs builds Icon/{category}/{name} on 1.7 from it, so add new icons here.
 * Only an existing file with its own icon library changes the imports; keep the names.
 */
import type { LucideIcon } from 'lucide-react';
import {
  Activity, Archive, ArrowDown, ArrowLeft, ArrowRight, ArrowUp, ArrowUpRight, AtSign, BadgeCheck, Banknote, Bell, Bold,
  BookOpen, Bookmark, Calendar, Camera, Captions, Cast, ChartColumn, ChartLine, ChartPie, Check, ChevronDown, ChevronLeft,
  ChevronRight, ChevronUp, ChevronsUpDown, Circle, CircleAlert, CircleCheck, CircleDashed, CircleHelp, CircleUser, CircleX,
  Clock, Cloud, CloudSun, CloudUpload, Code, Columns2, Compass, Copy, CornerDownLeft, CreditCard, Database, Download,
  Ellipsis, EllipsisVertical, Expand, ExternalLink, Eye, EyeOff, FastForward, File, FilePlus, FileText, Fingerprint, Folder,
  FolderOpen, Funnel, GitBranch, Globe, GraduationCap, GripVertical, HardDrive, Heart, Hexagon, History, Hourglass, House,
  Image, ImagePlus, Inbox, Info, Italic, Key, Laptop, Layers, LayoutDashboard, LayoutGrid, Lightbulb, Link, List, Lock,
  LockOpen, LogOut, Mail, MapPin, Maximize2, Menu, MessageSquare, Mic, Minimize2, Minus, Monitor, Moon, MoveDiagonal2,
  Navigation, Palette, PanelLeft, Paperclip, Pause, Pencil, Phone, Play, Plug, Plus, Receipt, RefreshCcw, RefreshCw, Rewind,
  Search, Send, Server, Settings, Share2, ShieldCheck, ShoppingBag, Shrink, SkipBack, SkipForward, SlidersHorizontal,
  Smartphone, Sparkles, Square, Star, Sun, Table, Terminal, TextAlignCenter, TextAlignEnd, TextAlignJustify, TextAlignStart,
  Timer, Trash2, TrendingUp, Triangle, TriangleAlert, Type, Underline, Upload, User, UserCheck, UserPlus, Users, Video,
  Volume, Volume1, Volume2, VolumeX, Wallet, X, Zap, ZoomIn, ZoomOut,
} from 'lucide-react';
import type { CSSProperties, SVGProps } from 'react';
import { cn } from '@/lib/cn';

export const icons = {
  'general/placeholder': CircleDashed, 'general/check': Check, 'general/minus': Minus, 'general/plus': Plus, 'general/x': X,
  'general/search': Search, 'general/more-horizontal': Ellipsis, 'general/more-vertical': EllipsisVertical, 'general/copy': Copy,
  'general/edit': Pencil, 'general/trash': Trash2, 'general/settings': Settings, 'general/home': House, 'general/menu': Menu,
  'general/share': Share2, 'general/heart': Heart, 'general/download': Download, 'general/upload': Upload, 'general/link': Link,
  'general/filter': Funnel, 'general/refresh': RefreshCw, 'general/sync': RefreshCcw, 'general/archive': Archive, 'general/eye': Eye,
  'general/eye-off': EyeOff, 'general/zap': Zap, 'general/layers': Layers, 'general/bell': Bell, 'general/bookmark': Bookmark,
  'general/sliders': SlidersHorizontal, 'general/grip': GripVertical, 'general/log-out': LogOut, 'general/cloud': Cloud,
  'general/plug': Plug, 'general/resize': MoveDiagonal2,
  'arrows/chevron-down': ChevronDown, 'arrows/chevron-up': ChevronUp, 'arrows/chevron-left': ChevronLeft, 'arrows/chevron-right': ChevronRight,
  'arrows/chevron-selector-vertical': ChevronsUpDown, 'arrows/arrow-right': ArrowRight, 'arrows/arrow-left': ArrowLeft,
  'arrows/arrow-up': ArrowUp, 'arrows/arrow-down': ArrowDown, 'arrows/arrow-up-right': ArrowUpRight, 'arrows/external-link': ExternalLink,
  'arrows/corner-down-left': CornerDownLeft,
  'users/user': User, 'users/users': Users, 'users/user-plus': UserPlus, 'users/user-check': UserCheck, 'users/user-circle': CircleUser,
  'alerts/info-circle': Info, 'alerts/alert-circle': CircleAlert, 'alerts/alert-triangle': TriangleAlert, 'alerts/check-circle': CircleCheck,
  'alerts/help-circle': CircleHelp, 'alerts/x-circle': CircleX, 'alerts/verified': BadgeCheck,
  'shapes/star': Star, 'shapes/circle': Circle, 'shapes/square': Square, 'shapes/triangle': Triangle, 'shapes/hexagon': Hexagon,
  'files/file': File, 'files/file-text': FileText, 'files/file-plus': FilePlus, 'files/folder': Folder, 'files/folder-open': FolderOpen,
  'files/cloud-upload': CloudUpload, 'files/hard-drive': HardDrive,
  'layout/layout-grid': LayoutGrid, 'layout/panel-left': PanelLeft, 'layout/columns': Columns2, 'layout/layout-dashboard': LayoutDashboard,
  'layout/table': Table,
  'development/code': Code, 'development/terminal': Terminal, 'development/git-branch': GitBranch, 'development/database': Database,
  'development/server': Server,
  'commerce/credit-card': CreditCard, 'commerce/wallet': Wallet, 'commerce/shopping-bag': ShoppingBag, 'commerce/receipt': Receipt,
  'commerce/banknote': Banknote,
  'maps/globe': Globe, 'maps/map-pin': MapPin, 'maps/compass': Compass, 'maps/navigation': Navigation,
  'charts/chart-column': ChartColumn, 'charts/chart-pie': ChartPie, 'charts/chart-line': ChartLine, 'charts/trending-up': TrendingUp,
  'charts/activity': Activity,
  'communication/mail': Mail, 'communication/message-square': MessageSquare, 'communication/send': Send, 'communication/inbox': Inbox,
  'communication/phone': Phone, 'communication/at-sign': AtSign,
  'media/play': Play, 'media/pause': Pause, 'media/rewind': Rewind, 'media/fast-forward': FastForward, 'media/skip-back': SkipBack,
  'media/skip-forward': SkipForward, 'media/volume-none': VolumeX, 'media/volume-min': Volume1, 'media/volume-max': Volume2,
  'media/volume': Volume, 'media/zoom-in': ZoomIn, 'media/zoom-out': ZoomOut, 'media/cast': Cast, 'media/minimize': Minimize2,
  'media/maximize': Maximize2, 'media/fullscreen': Expand, 'media/exit-fullscreen': Shrink, 'media/captions': Captions,
  'media/monitor': Monitor, 'media/smartphone': Smartphone, 'media/laptop': Laptop, 'media/mic': Mic,
  'security/lock': Lock, 'security/unlock': LockOpen, 'security/shield-check': ShieldCheck, 'security/key': Key,
  'security/fingerprint': Fingerprint,
  'editor/bold': Bold, 'editor/italic': Italic, 'editor/underline': Underline, 'editor/bullet-list': List,
  'editor/align-left': TextAlignStart, 'editor/align-center': TextAlignCenter, 'editor/align-right': TextAlignEnd,
  'editor/justify': TextAlignJustify, 'editor/attachment': Paperclip, 'editor/generate': Sparkles, 'editor/palette': Palette,
  'editor/type': Type, 'editor/video': Video,
  'education/book-open': BookOpen, 'education/graduation-cap': GraduationCap, 'education/lightbulb': Lightbulb,
  'images/image': Image, 'images/camera': Camera, 'images/image-plus': ImagePlus,
  'time/calendar': Calendar, 'time/clock': Clock, 'time/history': History, 'time/hourglass': Hourglass, 'time/timer': Timer,
  'weather/sun': Sun, 'weather/moon': Moon, 'weather/cloud-sun': CloudSun,
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof icons;
export const iconNames = Object.keys(icons) as IconName[];

/** Icon sizes follow `size/icon/*`. */
export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'ref'> {
  name: IconName;
  /** `size/icon/{size}`; default `md`. */
  size?: IconSize;
  /** Accessible name. Without it the icon is decorative (aria-hidden). */
  label?: string;
}

export function Icon({ name, size = 'md', label, className, style, ...rest }: IconProps) {
  const C = icons[name];
  const s: CSSProperties = { width: `var(--size-icon-${size})`, height: `var(--size-icon-${size})`, ...style };
  return (
    <C
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? 'img' : undefined}
      strokeWidth={2}
      absoluteStrokeWidth={false}
      className={cn('shrink-0', className)}
      style={s}
      {...rest}
    />
  );
}
