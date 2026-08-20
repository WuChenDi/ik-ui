'use client'

import {
  Download,
  Loader2,
  Maximize2,
  Pause,
  Play,
  Upload,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import * as React from 'react'
import { ThumbnailStrip } from '@/components/thumbnail-strip'
import type { TimelineElementResize } from '@/components/timeline-element'
import { TimelineElement } from '@/components/timeline-element'
import { TimelinePlayhead } from '@/components/timeline-playhead'
import { TimelineRuler } from '@/components/timeline-ruler'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Slider } from '@/components/ui/slider'
import { VideoThumbnailCache } from '@/lib/video-thumbnail-cache'

const SAMPLE_VIDEO_URL =
  'https://hj-video.zeroaigen.cn/prod/AI/VIDEO/f4e7fdc9807348eedc1e64a963c7433e.mp4'

/** Audio container written by the export. WAV needs no encoder, the others do. */
type Format = 'wav' | 'm4a' | 'ogg'

const FORMAT_LABEL: Record<Format, string> = {
  wav: 'WAV',
  m4a: 'M4A',
  ogg: 'OGG',
}
const FORMAT_MIME: Record<Format, string> = {
  wav: 'audio/wav',
  m4a: 'audio/mp4',
  ogg: 'audio/ogg',
}

/** The loaded source: one fetch feeds the preview, the strip and the export. */
interface Source {
  blob: Blob
  url: string
  cache: VideoThumbnailCache
  duration: number
  hasAudio: boolean
}

const ZOOM_MAX = 10
// Floor for the slider so you can always zoom out past fit-to-screen and give
// the trim handles breathing room. Lowered to `fitZoom` when a clip is so long
// it only fits below this — so "Fit" stays reachable.
const ZOOM_MIN = 0.5
const RULER_HEIGHT = 24
// Matches TimelinePlayhead's knob diameter — the track is padded by half this
// on each side so the knob stays fully visible at either end.
const PLAYHEAD_KNOB = 12

export interface VideoAudioExtractorProps {
  /** Video to load, visualize and pull audio out of. Falls back to a sample. */
  videoUrl?: string
  /** Container written by the export. Default: `'wav'`. */
  format?: Format
  /** Base pixels per second at zoom = 1. Default: `50`. */
  pixelsPerSecond?: number
  /** Thumbnail track height in CSS px. Default: `64`. */
  height?: number
  /** Fired with the selected range while dragging the handles. */
  onChange?: (selection: TimelineElementResize) => void
  /** Fired with the exported audio blob. */
  onExport?: (blob: Blob) => void
}

/** `mm:ss.s` timestamp, e.g. `00:15.5`. */
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${s.toFixed(1).padStart(4, '0')}`
}

/** Linear slider position (0–1) → exponential zoom, so low values step gently. */
function sliderToZoom(position: number, min: number, max: number): number {
  if (max <= min) return min
  const p = Math.max(0, Math.min(1, position))
  return min * (max / min) ** p
}

/** Inverse of `sliderToZoom`. */
function zoomToSlider(zoom: number, min: number, max: number): number {
  if (max <= min) return 0
  const z = Math.max(min, Math.min(max, zoom))
  return Math.log(z / min) / Math.log(max / min)
}

/** A small labelled, monospaced readout — used in the footer status bar. */
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <span className="flex flex-col leading-tight">
      <span className="text-muted-foreground/70 text-[10px] font-medium uppercase tracking-wide">
        {label}
      </span>
      <span className="text-foreground text-sm font-medium tabular-nums">
        {value}
      </span>
    </span>
  )
}

/**
 * Video audio extractor — the video trimmer's timeline, pointed at the sound.
 * The thumbnail strip visualizes the frames, drag the clip's handles to set
 * in / out points, preview the video, then **export just that window as an
 * audio file** — mediabunny's `Conversion({ trim, video: { discard: true } })`
 * drops the picture and writes WAV, M4A or OGG. Zoom + scroll the timeline;
 * load your own video with the picker.
 */
export function VideoAudioExtractor({
  videoUrl = SAMPLE_VIDEO_URL,
  format: initialFormat = 'wav',
  pixelsPerSecond = 50,
  height = 64,
  onChange,
  onExport,
}: VideoAudioExtractorProps) {
  // The source: an uploaded file (preferred) or the `videoUrl` prop.
  const [file, setFile] = React.useState<File | null>(null)
  const [source, setSource] = React.useState<Source | null>(null)
  const [format, setFormat] = React.useState<Format>(initialFormat)
  const [clip, setClip] = React.useState<TimelineElementResize | null>(null)
  const [time, setTime] = React.useState(0)
  const [playing, setPlaying] = React.useState(false)
  const [exporting, setExporting] = React.useState(false)
  const [progress, setProgress] = React.useState(0)
  const [error, setError] = React.useState<string | null>(null)
  const [zoom, setZoom] = React.useState(1)
  const [containerWidth, setContainerWidth] = React.useState(0)

  const videoRef = React.useRef<HTMLVideoElement | null>(null)
  const onChangeRef = React.useRef(onChange)
  onChangeRef.current = onChange
  // Auto-fit the zoom once per source, after the width is known.
  const didFitRef = React.useRef(false)
  const resizeObserverRef = React.useRef<ResizeObserver | null>(null)

  // Measure the available width (callback ref re-attaches when the node mounts).
  const measureRef = React.useCallback((el: HTMLDivElement | null) => {
    resizeObserverRef.current?.disconnect()
    if (!el) return
    setContainerWidth(el.clientWidth)
    const ro = new ResizeObserver(() => setContainerWidth(el.clientWidth))
    ro.observe(el)
    resizeObserverRef.current = ro
  }, [])

  // Resolve the source to a Blob (uploaded File or fetched URL) once, then
  // decode it into a thumbnail cache, read its duration and check whether it
  // even carries audio. The same blob is what the export re-reads, so nothing
  // is fetched twice. Selecting the full clip arms the trim handles.
  React.useEffect(() => {
    let cancelled = false
    let objectUrl: string | null = null
    let cache: VideoThumbnailCache | null = null
    setSource(null)
    setClip(null)
    setTime(0)
    setPlaying(false)
    setError(null)
    didFitRef.current = false
    void (async () => {
      try {
        const blob = file ?? (await (await fetch(videoUrl)).blob())
        if (cancelled) return
        cache = new VideoThumbnailCache({ source: blob })
        const { duration } = await cache.initialize()
        if (cancelled) {
          cache.dispose()
          return
        }
        if (duration <= 0) throw new Error('no duration')

        const { Input, BlobSource, ALL_FORMATS } = await import('mediabunny')
        const input = new Input({
          source: new BlobSource(blob),
          formats: ALL_FORMATS,
        })
        const hasAudio = (await input.getPrimaryAudioTrack()) !== null
        if (cancelled) {
          cache.dispose()
          return
        }

        objectUrl = URL.createObjectURL(blob)
        setSource({ blob, url: objectUrl, cache, duration, hasAudio })
        setClip({ startTime: 0, duration })
      } catch {
        cache?.dispose()
        if (!cancelled) setError('Could not load the video.')
      }
    })()
    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
      cache?.dispose()
    }
  }, [file, videoUrl])

  const handleTimeUpdate = () => {
    const video = videoRef.current
    if (video) setTime(video.currentTime)
  }

  const total = source?.duration ?? 0

  // Zoom that fits the whole clip in the available width. Subtract the track
  // padding (half a knob each side) so the filled timeline lands exactly on the
  // viewport edge instead of leaving a sliver of scrollable overflow.
  const fitZoom =
    total > 0 && containerWidth > 0
      ? Math.min(
          ZOOM_MAX,
          (containerWidth - PLAYHEAD_KNOB) / (total * pixelsPerSecond),
        )
      : 1
  const minZoom = Math.min(ZOOM_MIN, fitZoom)
  const maxZoom = Math.max(ZOOM_MAX, fitZoom)

  // Fit once, when the width and duration first become known for a source.
  React.useEffect(() => {
    if (!total || containerWidth <= 0 || didFitRef.current) return
    setZoom(fitZoom)
    didFitRef.current = true
  }, [total, containerWidth, fitZoom])

  const updateClip = (next: TimelineElementResize) => {
    setClip(next)
    onChangeRef.current?.(next)
  }

  // Convert the selected window to an audio-only blob with mediabunny, then
  // download it. Discarding the video tracks is what turns the trim into an
  // extraction — the audio is re-encoded into the picked container.
  const exportAudio = async () => {
    if (!source || !clip) return
    setExporting(true)
    setProgress(0)
    setError(null)
    try {
      const {
        Input,
        Output,
        Conversion,
        BlobSource,
        BufferTarget,
        WavOutputFormat,
        Mp4OutputFormat,
        OggOutputFormat,
        ALL_FORMATS,
      } = await import('mediabunny')

      const input = new Input({
        source: new BlobSource(source.blob),
        formats: ALL_FORMATS,
      })
      const outputFormat =
        format === 'wav'
          ? new WavOutputFormat()
          : format === 'm4a'
            ? new Mp4OutputFormat()
            : new OggOutputFormat()
      const output = new Output({
        format: outputFormat,
        target: new BufferTarget(),
      })
      const conversion = await Conversion.init({
        input,
        output,
        // Dropping the picture is intentional, so the console warning it would
        // print is noise — the audio track is checked via `isValid` below.
        video: { discard: true },
        showWarnings: false,
        trim: { start: clip.startTime, end: clip.startTime + clip.duration },
      })
      // No usable audio track survived — usually because this browser cannot
      // encode the picked container.
      if (!conversion.isValid) {
        setError(`This browser cannot encode ${FORMAT_LABEL[format]} audio.`)
        return
      }
      conversion.onProgress = setProgress
      await conversion.execute()

      const audio = new Blob([output.target.buffer as ArrayBuffer], {
        type: FORMAT_MIME[format],
      })
      onExport?.(audio)

      const name = (file?.name ?? 'video').replace(/\.[^.]+$/, '')
      const url = URL.createObjectURL(audio)
      const a = document.createElement('a')
      a.href = url
      a.download = `${name}-audio.${format}`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      setError('Export failed — this codec may be unsupported here.')
    } finally {
      setExporting(false)
    }
  }

  if (!source || !clip) {
    return (
      <Card className="w-full">
        <CardContent className="flex flex-col gap-4 pt-(--card-spacing)">
          {/* Preview — the video frame. */}
          <Skeleton className="mx-auto aspect-video w-full max-w-md" />

          {/* Toolbar — play + time on the left, zoom on the right. */}
          <div className="flex items-center gap-3">
            <Skeleton className="size-9 rounded-full" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="ml-auto h-7 w-44" />
          </div>

          {/* Timeline — ruler over the thumbnail strip. */}
          <div className="bg-muted/30 flex flex-col gap-2 rounded-lg p-3">
            <Skeleton className="bg-muted-foreground/15 h-3 w-full" />
            <Skeleton
              className="bg-muted-foreground/15 w-full"
              style={{ height }}
            />
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}
        </CardContent>

        {/* Footer — selection stats on the left, actions on the right. */}
        <CardFooter className="gap-6">
          <Skeleton className="h-8 w-12" />
          <Skeleton className="h-8 w-12" />
          <Skeleton className="h-8 w-12" />
          <div className="ml-auto flex items-center gap-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-24" />
          </div>
        </CardFooter>
      </Card>
    )
  }

  const out = clip.startTime + clip.duration
  const pps = pixelsPerSecond * zoom
  const width = total * pps
  const sliderPos = zoomToSlider(zoom, minZoom, maxZoom)

  const applySlider = (next: number) => {
    didFitRef.current = true
    setZoom(sliderToZoom(next, minZoom, maxZoom))
  }
  const stepZoom = (delta: number) => applySlider(sliderPos + delta)
  const fit = () => {
    didFitRef.current = true
    setZoom(fitZoom)
  }

  const seek = (next: number) => {
    const video = videoRef.current
    if (video) video.currentTime = next
    setTime(next)
  }

  // Click / drag anywhere on the timeline to move the playhead and scrub.
  // Pointer-downs on the playhead and trim handles stop propagation, so those
  // gestures still win over seeking.
  const scrubFrom = (event: React.PointerEvent<HTMLDivElement>) => {
    const el = event.currentTarget
    const toTime = (clientX: number) => {
      const rect = el.getBoundingClientRect()
      return Math.min(total, Math.max(0, (clientX - rect.left) / pps))
    }
    seek(toTime(event.clientX))
    const onMove = (e: PointerEvent) => seek(toTime(e.clientX))
    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return
    if (playing) {
      video.pause()
      setPlaying(false)
      return
    }
    // Restart from the top when parked at the end.
    if (time >= total) {
      video.currentTime = 0
      setTime(0)
    }
    void video.play()
    setPlaying(true)
  }

  return (
    <Card className="w-full">
      <CardContent className="flex flex-col gap-4 pt-(--card-spacing)">
        {/* Preview — the picture stays, only the export drops it. */}
        <div className="bg-muted/30 mx-auto flex aspect-video w-full max-w-md items-center justify-center overflow-hidden rounded-lg">
          <video
            ref={videoRef}
            src={source.url}
            playsInline
            onTimeUpdate={handleTimeUpdate}
            onEnded={() => setPlaying(false)}
            className="h-full w-full object-contain"
          />
        </div>

        {/* Toolbar — transport on the left, zoom + fit on the right. */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
          <Button
            type="button"
            size="icon-lg"
            onClick={togglePlay}
            aria-label={playing ? 'Pause' : 'Play selection'}
            className="rounded-full"
          >
            {playing ? <Pause /> : <Play className="translate-x-px" />}
          </Button>

          <span className="text-muted-foreground text-xs tabular-nums">
            <span className="text-foreground font-medium">
              {formatTime(time)}
            </span>{' '}
            / {formatTime(total)}
          </span>

          <div className="ml-auto flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              title="Zoom out"
              onClick={() => stepZoom(-0.1)}
            >
              <ZoomOut />
            </Button>
            <div className="w-28">
              <Slider
                min={0}
                max={100}
                value={[sliderPos * 100]}
                onValueChange={(value) =>
                  applySlider((Array.isArray(value) ? value[0] : value) / 100)
                }
              />
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              title="Zoom in"
              onClick={() => stepZoom(0.1)}
            >
              <ZoomIn />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              title="Fit to width"
              onClick={fit}
            >
              <Maximize2 />
            </Button>
            <span className="text-muted-foreground w-9 text-right text-xs tabular-nums">
              {Math.max(1, Math.round(sliderPos * 100))}%
            </span>
          </div>
        </div>

        {/* Timeline — the hero; scrolls horizontally when zoomed past the view. */}
        <div className="bg-muted/30 rounded-lg p-3">
          <div ref={measureRef}>
            <ScrollArea
              style={{ height: RULER_HEIGHT + 8 + height + PLAYHEAD_KNOB + 8 }}
            >
              {/* Pad the scroll content by half a knob on every side so the
                  playhead circle stays fully visible at the start, end and top.
                  The inner track is the positioning origin shared by the ruler,
                  strip and playhead, so they all stay aligned. */}
              <div
                style={{
                  width: width + PLAYHEAD_KNOB,
                  minWidth: '100%',
                  padding: PLAYHEAD_KNOB / 2,
                  boxSizing: 'border-box',
                }}
              >
                <div
                  style={{
                    position: 'relative',
                    width,
                    minWidth: '100%',
                    cursor: 'pointer',
                  }}
                  onPointerDown={scrubFrom}
                >
                  <TimelineRuler
                    duration={total}
                    pixelsPerSecond={pixelsPerSecond}
                    zoom={zoom}
                    height={RULER_HEIGHT}
                  />
                  <div
                    className="mt-2"
                    style={{
                      position: 'relative',
                      width,
                      height,
                      overflow: 'hidden',
                    }}
                  >
                    {/* Full thumbnail strip — always visible, so you can see
                      which part of the video the audio comes from. */}
                    <ThumbnailStrip
                      cache={source.cache}
                      duration={total}
                      totalWidth={Math.ceil(width)}
                      tileWidth={Math.round((height * 16) / 9)}
                      tileHeight={height}
                    />

                    {/* Spotlight — dim everything outside the selection instead of
                      hiding it. The large spread shadow follows the rounded
                      corners, so the dim hugs the selection frame exactly (no
                      square-vs-rounded notch at the corners). Clipped to the
                      strip band by the parent's overflow. */}
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        bottom: 0,
                        left: clip.startTime * pps,
                        width: clip.duration * pps,
                        borderRadius: 8,
                        boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.45)',
                        pointerEvents: 'none',
                      }}
                    />

                    {/* Selection window — a transparent frame (border + draggable
                      trim handles only) so the thumbnails inside stay visible. */}
                    <TimelineElement
                      startTime={clip.startTime}
                      duration={clip.duration}
                      pixelsPerSecond={pixelsPerSecond}
                      zoom={zoom}
                      height={height}
                      minDuration={0.5}
                      maxEnd={total}
                      selected
                      movable
                      color="transparent"
                      onResize={updateClip}
                    />
                  </div>
                  <TimelinePlayhead
                    currentTime={time}
                    duration={total}
                    pixelsPerSecond={pixelsPerSecond}
                    zoom={zoom}
                    onSeek={seek}
                  />
                </div>
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
        </div>

        {!source.hasAudio && (
          <p className="text-muted-foreground text-sm">
            This video has no audio track.
          </p>
        )}
        {error && <p className="text-destructive text-sm">{error}</p>}
      </CardContent>

      {/* Footer — selection summary + format on the left, source / export on
        the right. */}
      <CardFooter className="gap-4">
        <Stat label="In" value={formatTime(clip.startTime)} />
        <Stat label="Out" value={formatTime(out)} />
        <Stat label="Length" value={formatTime(clip.duration)} />

        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Format</span>
          <Select
            value={format}
            disabled={exporting}
            onValueChange={(value) => setFormat(value as Format)}
          >
            <SelectTrigger>
              <SelectValue>
                {(value: Format) => FORMAT_LABEL[value]}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(FORMAT_LABEL) as Format[]).map((f) => (
                <SelectItem key={f} value={f}>
                  {FORMAT_LABEL[f]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button render={<label />} nativeButton={false} variant="outline">
            <Upload />
            Load video
            <input
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(event) => {
                const next = event.target.files?.[0]
                if (next) setFile(next)
              }}
            />
          </Button>
          <Button
            type="button"
            onClick={() => void exportAudio()}
            disabled={exporting || !source.hasAudio}
          >
            {exporting ? (
              <>
                <Loader2 className="animate-spin" />
                {Math.round(progress * 100)}%
              </>
            ) : (
              <>
                <Download />
                Export audio
              </>
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}

export default VideoAudioExtractor
