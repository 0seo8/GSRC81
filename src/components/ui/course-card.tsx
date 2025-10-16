import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const courseCardVariants = cva(
  "course-card flex flex-col justify-between p-6 transition-all duration-200 hover:transform hover:-translate-y-1 hover:shadow-lg",
  {
    variants: {
      category: {
        track: "bg-track-primary text-white",
        road: "bg-road-primary text-figma-primary", 
        trail: "bg-trail-primary text-white",
        jingwan: "bg-jingwan-primary text-white",
      },
      size: {
        default: "w-[375px] h-[180px]",
        small: "w-[375px] h-[130px]",
      },
      rounded: {
        default: "rounded-t-[45px]",
        last: "rounded-[45px]",
      }
    },
    defaultVariants: {
      category: "track",
      size: "default",
      rounded: "default",
    },
  }
)

export interface CourseCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof courseCardVariants> {
  title: string
  distance: number
  difficulty: string
  type: string
  isLast?: boolean
}

const CourseCard = React.forwardRef<HTMLDivElement, CourseCardProps>(
  ({ className, category, size, rounded, title, distance, difficulty, type, isLast, ...props }, ref) => {
    return (
      <div
        className={cn(
          courseCardVariants({ 
            category, 
            size, 
            rounded: isLast ? "last" : "default",
            className 
          })
        )}
        ref={ref}
        {...props}
      >
        {/* 카테고리 헤더 */}
        <div className="flex justify-between items-start">
          <div className="flex flex-col space-y-1">
            <h3 className="text-category">{category?.toUpperCase()} 러닝</h3>
          </div>
        </div>
        
        {/* 메인 콘텐츠 */}
        <div className="flex justify-between items-end">
          {/* 코스 정보 */}
          <div className="flex flex-col space-y-1">
            <h4 className="text-course">{title}</h4>
            <p className="text-body">{type}</p>
            <p className="text-body">{difficulty}</p>
          </div>
          
          {/* 거리 표시 */}
          <div className="flex flex-col items-end space-y-1">
            <span className="text-distance">{distance}</span>
            <span className="text-body">km</span>
          </div>
        </div>
      </div>
    )
  }
)
CourseCard.displayName = "CourseCard"

export { CourseCard, courseCardVariants }
