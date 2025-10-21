import * as React from "react";
import { cn } from "@/lib/utils";

export interface BottomSheetProps extends React.HTMLAttributes<HTMLDivElement> {
  isOpen?: boolean;
  onClose?: () => void;
  children: React.ReactNode;
}

const BottomSheet = React.forwardRef<HTMLDivElement, BottomSheetProps>(
  ({ className, isOpen = true, onClose, children, ...props }, ref) => {
    return (
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 bg-figma-primary rounded-t-6 p-6 transition-transform duration-300 ease-out",
          isOpen ? "translate-y-0" : "translate-y-full",
          className,
        )}
        ref={ref}
        {...props}
      >
        {/* 핸들 */}
        <div
          className="flex justify-center mb-4 cursor-pointer"
          onClick={onClose}
        >
          <div className="w-12 h-1 bg-figma-secondary rounded-full" />
        </div>

        {/* 콘텐츠 */}
        <div className="space-y-4">{children}</div>
      </div>
    );
  },
);
BottomSheet.displayName = "BottomSheet";

export { BottomSheet };
