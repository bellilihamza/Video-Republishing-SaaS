'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Link as LinkIcon, Send, Tag, Hash } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Badge from '@/components/ui/Badge';
import { createJob } from '@/lib/api';
import { detectPlatform, getPlatformLabel } from '@/lib/utils';
import type { CreateJobFormData } from '@/types';

// ── Category → Hashtags mapping ──
const categoryData: Record<string, { emoji: string; label: string; tags: string[] }> = {
  funny: {
    emoji: '😂',
    label: 'Funny',
    tags: ['funny', 'funnyshorts', 'comedy', 'lol', 'memes', 'humor', 'viral', 'trending', 'shorts', 'funnyvideo', 'laugh', 'comedyshorts'],
  },
  religious: {
    emoji: '🕌',
    label: 'Religious',
    tags: ['religion', 'islam', 'allah', 'quran', 'hadith', 'faith', 'dua', 'islamicreminder', 'shorts', 'deen', 'muslim', 'reminder'],
  },
  sport: {
    emoji: '⚽',
    label: 'Sport',
    tags: ['sports', 'football', 'soccer', 'fitness', 'workout', 'training', 'motivation', 'gym', 'shorts', 'athlete', 'goals', 'sportshorts'],
  },
  gaming: {
    emoji: '🎮',
    label: 'Gaming',
    tags: ['gaming', 'gamer', 'videogames', 'gameplay', 'gamingcommunity', 'shorts', 'streamer', 'esports', 'ps5', 'pcgaming', 'mobilegaming'],
  },
  music: {
    emoji: '🎵',
    label: 'Music',
    tags: ['music', 'song', 'musician', 'beats', 'remix', 'cover', 'viral', 'shorts', 'musicvideo', 'trendingmusic', 'audio', 'dj'],
  },
  education: {
    emoji: '📚',
    label: 'Education',
    tags: ['education', 'learning', 'study', 'knowledge', 'tips', 'facts', 'didyouknow', 'shorts', 'learn', 'school', 'tutorial', 'explained'],
  },
  news: {
    emoji: '📰',
    label: 'News',
    tags: ['news', 'breakingnews', 'worldnews', 'update', 'currentevents', 'shorts', 'trending', 'headline', 'live', 'report'],
  },
  cooking: {
    emoji: '🍳',
    label: 'Cooking',
    tags: ['cooking', 'food', 'recipe', 'foodie', 'kitchen', 'chef', 'delicious', 'shorts', 'yummy', 'homemade', 'cookingtips'],
  },
  animals: {
    emoji: '🐾',
    label: 'Animals',
    tags: ['animals', 'cuteanimals', 'pets', 'dog', 'cat', 'wildlife', 'animalshorts', 'shorts', 'cute', 'funnyanimals', 'nature'],
  },
  motivation: {
    emoji: '💪',
    label: 'Motivation',
    tags: ['motivation', 'motivational', 'success', 'inspiration', 'mindset', 'goals', 'shorts', 'nevergiveup', 'selfimprovement', 'discipline'],
  },
  beauty: {
    emoji: '💄',
    label: 'Beauty',
    tags: ['beauty', 'makeup', 'skincare', 'fashion', 'style', 'beautytips', 'shorts', 'glowup', 'cosmetics', 'hair', 'selfcare'],
  },
  travel: {
    emoji: '✈️',
    label: 'Travel',
    tags: ['travel', 'travelvlog', 'adventure', 'explore', 'vacation', 'wanderlust', 'shorts', 'trip', 'nature', 'travelgram'],
  },
};

// Always-included base tags
const baseTags = ['shorts', 'viral', 'trending'];

function mergeTagsFromCategories(selectedCategories: string[]): string {
  const tagSet = new Set<string>(baseTags);
  for (const cat of selectedCategories) {
    const data = categoryData[cat];
    if (data) {
      for (const tag of data.tags) {
        tagSet.add(tag);
      }
    }
  }
  return Array.from(tagSet).map(t => `#${t}`).join(' ');
}

const defaultFormData: CreateJobFormData = {
  videoUrl: '',
  title: '',
  description: '',
  tags: '',
  privacyStatus: 'public',
  trimDuration: 60,
  targetPlatform: 'youtube',
};

export default function VideoUrlForm() {
  const router = useRouter();
  const [formData, setFormData] = useState<CreateJobFormData>(defaultFormData);
  const [detectedPlatform, setDetectedPlatform] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof CreateJobFormData, string>>>({});

  const handleUrlChange = (url: string) => {
    setFormData((prev) => ({ ...prev, videoUrl: url }));
    const platform = detectPlatform(url);
    setDetectedPlatform(platform);
    if (errors.videoUrl) {
      setErrors((prev) => ({ ...prev, videoUrl: undefined }));
    }
  };

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) => {
      const next = prev.includes(cat)
        ? prev.filter((c) => c !== cat)
        : [...prev, cat];
      // Auto-update tags
      const merged = mergeTagsFromCategories(next);
      setFormData((f) => ({ ...f, tags: merged }));
      return next;
    });
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof CreateJobFormData, string>> = {};

    if (!formData.videoUrl.trim()) {
      newErrors.videoUrl = 'Video URL is required';
    } else if (!detectedPlatform) {
      newErrors.videoUrl = 'URL must be from TikTok, Instagram, or Facebook';
    }

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length > 100) {
      newErrors.title = 'Title must be 100 characters or less';
    }

    if (formData.trimDuration < 1 || formData.trimDuration > 180) {
      newErrors.trimDuration = 'Duration must be between 1 and 180 seconds';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      await createJob(formData);
      toast.success('Video job created! Processing will start shortly.');
      setFormData(defaultFormData);
      setDetectedPlatform(null);
      setSelectedCategories([]);
      router.push('/dashboard/jobs');
    } catch (error) {
      const err = error as Error & { status?: number };
      if (err.message.includes('No YouTube account')) {
        toast.error('Please connect your YouTube account first.');
        router.push('/dashboard/accounts');
      } else {
        toast.error(err.message || 'Failed to create job');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* URL Input */}
      <Card>
        <CardContent className="p-4 sm:p-6 space-y-4">
          <Input
            label="Video URL"
            placeholder="https://www.tiktok.com/@user/video/123456789"
            value={formData.videoUrl}
            onChange={(e) => handleUrlChange(e.target.value)}
            error={errors.videoUrl}
            icon={<LinkIcon className="w-4 h-4" />}
            hint="Paste a video URL from TikTok, Instagram, or Facebook"
          />

          {detectedPlatform && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Detected:</span>
              <Badge variant="purple" size="sm">
                {getPlatformLabel(detectedPlatform)}
              </Badge>
              <span className="text-xs text-slate-600">→</span>
              <Badge variant="error" size="sm">
                YouTube
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Video Details */}
      <Card>
        <CardContent className="p-4 sm:p-6 space-y-4">
          <h3 className="text-sm font-semibold text-slate-300 mb-2">
            YouTube Video Details
          </h3>

          <Input
            label="Title"
            placeholder="My awesome video"
            value={formData.title}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, title: e.target.value }))
            }
            error={errors.title}
            hint={`${formData.title.length}/100 characters`}
            maxLength={100}
          />

          <div className="w-full">
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Description
            </label>
            <textarea
              placeholder="Video description (optional)"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              rows={3}
              maxLength={5000}
              className="input-field resize-none"
            />
            <p className="mt-1 text-xs text-slate-500">
              {formData.description.length}/5000 characters
            </p>
          </div>

          {/* ── Multi-Category Selector ── */}
          <div className="w-full">
            <label className="flex items-center gap-1.5 text-sm font-medium text-slate-300 mb-3">
              <Hash className="w-3.5 h-3.5" />
              Categories
              <span className="text-xs text-slate-500 font-normal ml-1">
                (select multiple)
              </span>
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {Object.entries(categoryData).map(([key, cat]) => {
                const isSelected = selectedCategories.includes(key);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleCategory(key)}
                    className={`
                      flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 border
                      ${isSelected
                        ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30 shadow-[0_0_12px_rgba(99,102,241,0.1)]'
                        : 'bg-white/[0.02] text-slate-400 border-white/5 hover:bg-white/5 hover:border-white/10'
                      }
                    `}
                  >
                    <span className="text-sm">{cat.emoji}</span>
                    <span className="truncate">{cat.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Pro Tip */}
            <div className="mt-3 flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-500/5 border border-amber-500/10">
              <span className="text-xs">🔥</span>
              <p className="text-[11px] text-amber-400/80 leading-relaxed">
                <span className="font-medium">Pro Tip:</span> Use 5–10 hashtags max. Mix big + small hashtags. <code className="text-amber-300/90">#shorts #viral #trending</code> are always included.
              </p>
            </div>
          </div>

          {/* Tags (auto-filled, editable) */}
          <div className="w-full">
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Tags
            </label>
            <textarea
              placeholder="#shorts #viral #trending"
              value={formData.tags}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, tags: e.target.value }))
              }
              rows={2}
              className="input-field resize-none text-xs font-mono"
            />
            <p className="mt-1 text-xs text-slate-500">
              Auto-filled from categories — you can edit or add more
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Privacy"
              value={formData.privacyStatus}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  privacyStatus: e.target.value as 'public' | 'unlisted' | 'private',
                }))
              }
              options={[
                { value: 'public', label: 'Public' },
                { value: 'unlisted', label: 'Unlisted' },
                { value: 'private', label: 'Private' },
              ]}
            />

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Trim Duration
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="1"
                  max="180"
                  value={formData.trimDuration}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      trimDuration: parseInt(e.target.value, 10),
                    }))
                  }
                  className="flex-1 h-2 rounded-lg appearance-none cursor-pointer bg-white/5 accent-indigo-500"
                />
                <span className="text-sm font-mono text-slate-300 w-12 text-right">
                  {formData.trimDuration}s
                </span>
              </div>
              {errors.trimDuration && (
                <p className="mt-1 text-xs text-red-400">{errors.trimDuration}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-full"
        isLoading={isSubmitting}
        leftIcon={!isSubmitting ? <Send className="w-4 h-4" /> : undefined}
      >
        {isSubmitting ? 'Creating Job...' : 'Publish to YouTube'}
      </Button>
    </form>
  );
}
