import * as React from "react";
import { cn } from "@/lib/utils";
import { Battery, Wifi, Signal } from "lucide-react";

export interface StatusBarProps extends React.HTMLAttributes<HTMLDivElement> {
  time?: string;
  batteryLevel?: number;
  isWifiConnected?: boolean;
  signalStrength?: number;
}

const StatusBar = React.forwardRef<HTMLDivElement, StatusBarProps>(
  (
    {
      className,
      time = "9:41",
      batteryLevel = 100,
      isWifiConnected = true,
      signalStrength = 4,
      ...props
    },
    ref,
  ) => {
    return (
      <div
        className={cn(
          "flex items-center justify-between w-full h-11 px-5 bg-status-bar",
          className,
        )}
        ref={ref}
        {...props}
      >
        {/* 왼쪽: 시간 */}
        <div className="flex items-center">
          <span className="text-figma-primary font-medium text-sm">{time}</span>
        </div>

        {/* 오른쪽: 상태 아이콘들 */}
        <div className="flex items-center space-x-1">
          {/* 신호 강도 */}
          <div className="flex items-center space-x-0.5">
            {Array.from({ length: 4 }, (_, i) => (
              <div
                key={i}
                className={cn(
                  "w-1 h-3 rounded-sm",
                  i < signalStrength ? "bg-figma-primary" : "bg-status-icon",
                )}
                style={{ height: `${(i + 1) * 2.5 + 2}px` }}
              />
            ))}
          </div>

          {/* WiFi */}
          <Wifi
            className={cn(
              "w-4 h-4",
              isWifiConnected ? "text-figma-primary" : "text-status-icon",
            )}
          />

          {/* 배터리 */}
          <div className="flex items-center space-x-1">
            <Battery className="w-5 h-3 text-figma-primary" />
            <span className="text-xs text-figma-primary">{batteryLevel}%</span>
          </div>
        </div>
      </div>
    );
  },
);
StatusBar.displayName = "StatusBar";

export { StatusBar };
