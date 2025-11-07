interface NumberMarkerProps {
  number: number;
  size?: number;
}

export function NumberMarker({ number, size = 25 }: NumberMarkerProps) {
  const height = (size * 31) / 25; // 원본 비율 유지 (25:31)
  
  return (
    <div className="relative inline-block">
      <svg 
        width={size} 
        height={height} 
        viewBox="0 0 25 31" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <path 
          d="M3.66117 3.66116C8.54272 -1.22039 16.4573 -1.22039 21.3388 3.66116V3.66116C26.2204 8.54271 26.2204 16.4573 21.3388 21.3388L12.5 30.1777L3.66117 21.3388C-1.22039 16.4573 -1.22039 8.54271 3.66117 3.66116V3.66116Z" 
          fill="black"
        />
      </svg>
      
      {/* 숫자 텍스트 오버레이 */}
      <div 
        className="absolute inset-0 flex items-center justify-center text-white font-bold font-poppins"
        style={{
          fontSize: `${size * 0.4}px`, // 마커 크기에 비례한 폰트 사이즈
          paddingBottom: `${size * 0.16}px`, // 핀 끝부분 때문에 약간 위로 조정
        }}
      >
        {number}
      </div>
    </div>
  );
}