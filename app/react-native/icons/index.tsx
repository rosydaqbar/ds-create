/**
 * Icon registry: the one place that maps the system's icon names (`Icon/{category}/{name}`
 * on 1.7 Iconography) to an icon library. Components only ever use <Icon name="general/check" />.
 *
 * The default library is Lucide (ISC) through lucide-react-native, drawn with react-native-svg.
 * The names match the web registry one to one. To use the library chosen for a brand, change
 * the imports below and keep the names: no component needs to change.
 */
import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
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
} from 'lucide-react-native';
import { dimensions } from '../tokens/tokens';
import { anatomy, useTheme } from '../theme';

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

const iconSize: Record<IconSize, number> = {
  xs: dimensions.size.iconXs,
  sm: dimensions.size.iconSm,
  md: dimensions.size.iconMd,
  lg: dimensions.size.iconLg,
  xl: dimensions.size.iconXl,
};

/** Stroke weight of the icon library at every size (the 1.7 Iconography default). */
const STROKE_WIDTH = 2;

export interface IconProps {
  name: IconName;
  /** `size/icon/{size}`; default `md`. Icons keep their size when the text size changes. */
  size?: IconSize;
  /** A color token value, e.g. `theme.color.iconSecondary` (the default). */
  color?: string;
  /**
   * The name screen readers announce. Without it the icon is decorative and hidden from
   * VoiceOver and TalkBack, which is right for icons next to a visible label.
   */
  label?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  /** Documentation only: the part name for the web docs Anatomy markers (see `anatomy()`). */
  anatomyPart?: string;
}

export function Icon({ name, size = 'md', color, label, style, testID, anatomyPart }: IconProps) {
  const theme = useTheme();
  const Glyph = icons[name];
  const px = iconSize[size];
  const decorative = !label;
  return (
    <View
      testID={testID}
      {...(anatomyPart ? anatomy(anatomyPart) : {})}
      style={[{ width: px, height: px }, style]}
      accessible={!decorative}
      accessibilityRole={decorative ? undefined : 'image'}
      accessibilityLabel={label}
      accessibilityElementsHidden={decorative}
      importantForAccessibility={decorative ? 'no-hide-descendants' : 'yes'}
    >
      <Glyph size={px} color={color ?? theme.color.iconSecondary} strokeWidth={STROKE_WIDTH} />
    </View>
  );
}
