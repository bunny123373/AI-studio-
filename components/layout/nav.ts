import {
  AudioLines,
  BookOpenText,
  Bot,
  Clapperboard,
  FileSearch,
  History,
  Image as ImageIcon,
  Languages,
  LayoutDashboard,
  Library,
  ListVideo,
  Mic,
  PlaySquare,
  Settings,
  Sparkles,
  SquarePen,
  StickyNote,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Studio",
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard },
      { href: "/image", label: "AI Image", icon: ImageIcon },
      { href: "/thumbnail", label: "Thumbnail", icon: Clapperboard },
      { href: "/lyrics", label: "Lyrics", icon: Mic },
      { href: "/captions", label: "Captions", icon: StickyNote },
      { href: "/youtube", label: "YouTube", icon: PlaySquare },
      { href: "/scripts", label: "Scripts", icon: SquarePen },
      { href: "/seo", label: "SEO", icon: FileSearch },
    ],
  },
  {
    label: "Create",
    items: [
      { href: "/chat", label: "Agent Chat", icon: Bot },
      { href: "/prompts", label: "Video Prompts", icon: ListVideo },
      { href: "/bible", label: "Bible", icon: BookOpenText },
      { href: "/translate", label: "Translator", icon: Languages },
      { href: "/audio-to-srt", label: "Audio → SRT", icon: AudioLines },
    ],
  },
  {
    label: "Manage",
    items: [
      { href: "/library", label: "Prompt Library", icon: Library },
      { href: "/history", label: "History", icon: History },
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

export const ALL_NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);

/** Quick-access items for the mobile bottom bar. */
export const MOBILE_NAV: NavItem[] = [
  { href: "/", label: "Home", icon: LayoutDashboard },
  { href: "/image", label: "Image", icon: ImageIcon },
  { href: "/thumbnail", label: "Thumbnail", icon: Clapperboard },
  { href: "/audio-to-srt", label: "Audio", icon: AudioLines },
  { href: "/history", label: "History", icon: History },
];

/** Dashboard + main tool cards. */
export const TOOL_CARDS: {
  href: string;
  icon: LucideIcon;
  title: string;
  desc: string;
}[] = [
  { href: "/image", icon: ImageIcon, title: "AI Image Generator", desc: "Free text-to-image art in every style." },
  { href: "/thumbnail", icon: Clapperboard, title: "Thumbnail Generator", desc: "Concepts, prompts and 16:9 thumbnails." },
  { href: "/lyrics", icon: Mic, title: "Lyrics Generator", desc: "Telugu, English, Hindi & more. Worship to pop." },
  { href: "/captions", icon: StickyNote, title: "Caption Generator", desc: "Captions + hashtags + CTAs for every platform." },
  { href: "/youtube", icon: PlaySquare, title: "YouTube Title Generator", desc: "Titles, description, tags, hooks, pinned comment." },
  { href: "/scripts", icon: SquarePen, title: "Script Generator", desc: "Full video scripts with voice-over notes." },
  { href: "/seo", icon: FileSearch, title: "SEO Generator", desc: "SEO titles, descriptions, keywords and tags." },
  { href: "/prompts", icon: ListVideo, title: "AI Video Prompt Generator", desc: "Scene-by-scene AI video prompts." },
  { href: "/bible", icon: BookOpenText, title: "Bible Content Generator", desc: "Stories, prayers, sermons, Christian songs." },
  { href: "/chat", icon: Bot, title: "Agent Chat", desc: "Real multi-turn AI chat — or the honest offline assistant." },
  { href: "/translate", icon: Languages, title: "Translator", desc: "Translate across 6 Indian languages." },
  { href: "/audio-to-srt", icon: AudioLines, title: "Audio → SRT Subtitles", desc: "Real transcription to subtitle files." },
  { href: "/library", icon: Library, title: "Prompt Library", desc: "Favourite, copy and reuse 60+ prompts." },
];

export const SITE = {
  name: "Balu AI Studio",
  short: "BALU",
  tagline: "Create More. For Free.",
  footer: "© 2026 Balu AI Studio",
  logoIcon: Bot,
  sparkIcon: Sparkles,
};