
import { useEffect, useRef, useState } from 'react'
import axios from 'axios'

type ImageItem = {
  id: string
  src: string
  name: string
  type?: string
  size?: number
  uploadedAt?: string
}

const API_URL = '/bucket'

function normalizeImages(payload: unknown): ImageItem[] {
  const data = Array.isArray(payload)
    ? payload
    : payload && typeof payload === 'object' && 'images' in payload
      ? (payload as { images: unknown }).images
      : []

  if (!Array.isArray(data)) return []

  return data.flatMap((item, index) => {
    if (typeof item === 'string') {
      return [{ id: `${index}-${item}`, src: item, name: `Image ${index + 1}` }]
    }

    if (item && typeof item === 'object') {
      const image = item as Record<string, unknown>
      const src = image.url ?? image.src ?? image.path ?? image.location
      if (typeof src === 'string') {
        return [{
          id: String(image.id ?? `${index}-${src}`),
          src,
          name: String(image.name ?? image.filename ?? `Image ${index + 1}`),
          type: typeof image.type === 'string' ? image.type : undefined,
          size: typeof image.size === 'number' ? image.size : undefined,
          uploadedAt: typeof image.uploadedAt === 'string' ? image.uploadedAt : undefined,
        }]
      }
    }

    return []
  })
}

function formatBytes(bytes?: number) {
  if (bytes === undefined) return 'Unknown size'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(date?: string) {
  if (!date) return 'Just now'
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(date))
}

export default function App() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [images, setImages] = useState<ImageItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [lastUploaded, setLastUploaded] = useState<ImageItem | null>(null)
  const [selectedImage, setSelectedImage] = useState<ImageItem | null>(null)

  const loadImages = async () => {
    setIsLoading(true)
    setMessage('')
    try {
      const response = await axios.get(API_URL)
      setImages(normalizeImages(response.data))
    } catch {
      setMessage('Could not load your images. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadImages()
  }, [])

  useEffect(() => {
    if (!selectedFile) {
      setPreview('')
      return
    }

    const objectUrl = URL.createObjectURL(selectedFile)
    setPreview(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [selectedFile])

  const chooseFile = (file?: File) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setMessage('Please choose an image file.')
      return
    }
    setMessage('')
    setSelectedFile(file)
  }

  const uploadImage = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    setMessage('')
    const formData = new FormData()
    formData.append('image', selectedFile)

    try {
      const response = await axios.post(API_URL, formData)
      const uploadedImage = normalizeImages(response.data)[0] ?? {
        id: selectedFile.name,
        src: '',
        name: selectedFile.name,
        type: selectedFile.type,
        size: selectedFile.size,
        uploadedAt: new Date().toISOString(),
      }
      setLastUploaded({ ...uploadedImage, type: uploadedImage.type ?? selectedFile.type, size: uploadedImage.size ?? selectedFile.size, uploadedAt: uploadedImage.uploadedAt ?? new Date().toISOString() })
      setSelectedFile(null)
      await loadImages()
    } catch {
      setMessage('Upload failed. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <main className="min-h-screen px-5 py-10 text-slate-900 sm:px-8 sm:py-14">
      <div className="mx-auto max-w-5xl">
        <header className="mb-10 flex items-end justify-between gap-6">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">Image bucket</p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Your images, in one place.</h1>
          </div>
          <button
            type="button"
            onClick={() => void loadImages()}
            disabled={isLoading}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-teal-300 hover:text-teal-700 disabled:cursor-wait disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : 'Refresh list'}
          </button>
        </header>

        <section className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start">
          <div>
            <div
              role="button"
              tabIndex={0}
              onClick={() => inputRef.current?.click()}
              onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') inputRef.current?.click() }}
              onDragOver={(event) => { event.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(event) => { event.preventDefault(); setIsDragging(false); chooseFile(event.dataTransfer.files[0]) }}
              className={`relative flex min-h-72 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed p-8 text-center transition ${isDragging ? 'border-teal-500 bg-teal-50' : 'border-slate-300 bg-white/70 hover:border-teal-400 hover:bg-white'}`}
            >
              {preview ? (
                <img src={preview} alt="Selected preview" className="absolute inset-0 h-full w-full object-contain p-4" />
              ) : (
                <>
                  <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-teal-50 text-2xl text-teal-700">+</span>
                  <p className="font-medium">Drop an image here</p>
                  <p className="mt-2 text-sm text-slate-500">or click to browse your files</p>
                </>
              )}
              <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(event) => chooseFile(event.target.files?.[0])} />
            </div>
            <div className="mt-4 flex items-center justify-between gap-4">
              <p className="min-w-0 truncate text-sm text-slate-500">{selectedFile?.name ?? 'PNG, JPG or GIF up to 5MB'}</p>
              <button
                type="button"
                onClick={() => void uploadImage()}
                disabled={!selectedFile || isUploading}
                className="shrink-0 rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {isUploading ? 'Uploading...' : 'Upload image'}
              </button>
            </div>
            {message && <p className="mt-3 text-sm text-rose-600" role="alert">{message}</p>}
            {lastUploaded && (
              <div className="mt-6 border-t border-slate-200 pt-5">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Last uploaded</p>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                  <div><dt className="text-slate-400">Name</dt><dd className="truncate font-medium" title={lastUploaded.name}>{lastUploaded.name}</dd></div>
                  <div><dt className="text-slate-400">Type</dt><dd className="font-medium">{lastUploaded.type ?? 'Unknown type'}</dd></div>
                  <div><dt className="text-slate-400">Size</dt><dd className="font-medium">{formatBytes(lastUploaded.size)}</dd></div>
                  <div><dt className="text-slate-400">Uploaded</dt><dd className="font-medium">{formatDate(lastUploaded.uploadedAt)}</dd></div>
                </dl>
              </div>
            )}
          </div>

          <section aria-labelledby="gallery-title">
            <div className="mb-4 flex items-baseline justify-between border-b border-slate-200 pb-3">
              <h2 id="gallery-title" className="text-lg font-semibold">Image library</h2>
              <span className="text-sm text-slate-500">{images.length} {images.length === 1 ? 'image' : 'images'}</span>
            </div>
            {isLoading ? (
              <p className="py-16 text-center text-sm text-slate-500">Fetching images...</p>
            ) : images.length === 0 ? (
              <p className="rounded-xl border border-slate-200 bg-white/50 px-6 py-16 text-center text-sm text-slate-500">Your uploaded images will appear here.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {images.map((image) => (
                  <button
                    key={image.id}
                    type="button"
                    onClick={() => setSelectedImage(image)}
                    aria-pressed={selectedImage?.id === image.id}
                    className={`group overflow-hidden rounded-xl border bg-white text-left transition ${selectedImage?.id === image.id ? 'border-teal-600 ring-2 ring-teal-100' : 'border-slate-200 hover:border-teal-300'}`}
                  >
                    <img src={image.src} alt={image.name} className="aspect-square w-full object-cover transition duration-300 group-hover:scale-105" />
                    <figcaption className="truncate px-3 py-2 text-xs text-slate-500">{image.name}</figcaption>
                  </button>
                ))}
              </div>
            )}
            {selectedImage && (
              <div className="mt-6 border-t border-slate-200 pt-5">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Selected image</p>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-4">
                  <div className="col-span-2 min-w-0 sm:col-span-1"><dt className="text-slate-400">Name</dt><dd className="truncate font-medium" title={selectedImage.name}>{selectedImage.name}</dd></div>
                  <div><dt className="text-slate-400">Type</dt><dd className="truncate font-medium">{selectedImage.type ?? 'Unknown type'}</dd></div>
                  <div><dt className="text-slate-400">Size</dt><dd className="font-medium">{formatBytes(selectedImage.size)}</dd></div>
                  <div><dt className="text-slate-400">Uploaded</dt><dd className="font-medium">{formatDate(selectedImage.uploadedAt)}</dd></div>
                </dl>
              </div>
            )}
          </section>
        </section>
      </div>
    </main>
  )
}
