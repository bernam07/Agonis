import { Star } from 'lucide-react'

interface StarDisplayProps {
  rating: number
  size?: number
}

export default function StarDisplay({ rating, size = 16 }: StarDisplayProps) {
  return (
    <div className="flex gap-0.5 items-center">
      {[1, 2, 3, 4, 5].map((star) => {
        const fillWidth = rating >= star ? '100%' : rating >= star - 0.5 ? '50%' : '0%'

        return (
          <div
            key={star}
            className="relative"
            style={{ width: `${size}px`, height: `${size}px` }}
          >
            <Star
              className="absolute top-0 left-0 text-zinc-300 dark:text-zinc-700"
              style={{ width: `${size}px`, height: `${size}px` }}
            />
            <div
              className="absolute top-0 left-0 h-full overflow-hidden text-amber-400"
              style={{ width: fillWidth }}
            >
              <Star
                fill="currentColor"
                className="max-w-none"
                style={{ width: `${size}px`, height: `${size}px` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}