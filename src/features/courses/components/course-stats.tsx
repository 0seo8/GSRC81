import { getDifficultyLabel } from "@/core/config/course";

interface CourseStatsProps {
  distance: number;
  time: number;
  elevation: number;
  difficulty: string;
}

interface StatItemProps {
  label: string;
  value: string;
}

function StatItem({ label, value }: StatItemProps) {
  return (
    <div>
      <div className="mb-2 font-semibold">{label}</div>
      <div>{value}</div>
    </div>
  );
}

export function CourseStats({
  distance,
  time,
  elevation,
  difficulty,
}: CourseStatsProps) {
  return (
    <div className="grid grid-cols-4 gap-4 px-2 pt-4 pb-5 border-t border-b border-black text-xs text-black text-center">
      <StatItem label="거리" value={`${distance}km`} />
      <StatItem label="시간" value={`약 ${time}분`} />
      <StatItem label="고도" value={`${elevation}m`} />
      <StatItem label="난이도" value={getDifficultyLabel(difficulty)} />
    </div>
  );
}
