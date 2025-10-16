import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const commentBubbleVariants = cva(
  "comment-bubble p-2 max-w-[221px] transition-all duration-200",
  {
    variants: {
      variant: {
        sent: "comment-bubble-sent bg-white text-figma-primary",
        received: "comment-bubble-received bg-white text-figma-primary",
      },
      size: {
        default: "p-2",
        small: "p-1.5",
      }
    },
    defaultVariants: {
      variant: "sent",
      size: "default",
    },
  }
)

export interface CommentBubbleProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof commentBubbleVariants> {
  user: string
  timestamp: string
  message: string
  avatar?: string
}

const CommentBubble = React.forwardRef<HTMLDivElement, CommentBubbleProps>(
  ({ className, variant, size, user, timestamp, message, avatar, ...props }, ref) => {
    return (
      <div
        className={cn(
          commentBubbleVariants({ variant, size, className })
        )}
        ref={ref}
        {...props}
      >
        {/* 사용자 정보 */}
        <div className="flex items-center space-x-1 mb-1">
          {avatar && (
            <img 
              src={avatar} 
              alt={user}
              className="w-6 h-6 rounded-full object-cover"
            />
          )}
          <span className="text-comment font-medium">{user}</span>
          <span className="text-comment text-figma-secondary text-xs">
            {timestamp}
          </span>
        </div>
        
        {/* 메시지 */}
        <p className="text-comment leading-relaxed">{message}</p>
      </div>
    )
  }
)
CommentBubble.displayName = "CommentBubble"

export { CommentBubble, commentBubbleVariants }
