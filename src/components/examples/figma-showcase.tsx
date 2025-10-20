"use client";

import * as React from "react";
import { CourseCard } from "@/components/ui/course-card";
import { CommentBubble } from "@/components/ui/comment-bubble";
import { FigmaButton } from "@/components/ui/figma-button";
import { StatusBar } from "@/components/ui/status-bar";
import { BottomSheet } from "@/components/ui/bottom-sheet";

export function FigmaShowcase() {
  return (
    <div className="min-h-screen bg-figma-primary">
      {/* 상태바 */}
      <StatusBar />

      {/* 메인 콘텐츠 */}
      <div className="p-6 space-y-6">
        {/* 헤더 */}
        <div className="text-center space-y-2">
          <h1 className="text-header text-figma-primary">GSRC81 MAPS</h1>
          <p className="text-slogan text-figma-primary">
            RUN OUR ROUTE, MAKE YOUR STORY.
          </p>
        </div>

        {/* 코스 카드들 */}
        <div className="space-y-0">
          <CourseCard
            category="track"
            title="구파발천 정기런"
            distance={5}
            difficulty="쉬움"
            type="로드 러닝 코스"
            isLast={false}
          />
          <CourseCard
            category="road"
            title="구파발천 정기런"
            distance={7}
            difficulty="쉬움"
            type="로드 러닝 코스"
            isLast={false}
          />
          <CourseCard
            category="trail"
            title="구파발천 정기런"
            distance={24}
            difficulty="쉬움"
            type="로드 러닝 코스"
            isLast={false}
          />
          <CourseCard
            category="jingwan"
            title="구파발천 정기런"
            distance={12}
            difficulty="쉬움"
            type="로드 러닝 코스"
            isLast={true}
          />
        </div>

        {/* 댓글 섹션 */}
        <div className="space-y-4">
          <h3 className="text-title text-figma-primary">댓글</h3>

          <div className="space-y-3">
            <CommentBubble
              variant="sent"
              user="김영식"
              timestamp="0km 3일 전"
              message="모닝런도 비슷한 경로로 뛰어요! 아침에 만나요!"
              avatar="/avatars/kim.jpg"
            />

            <CommentBubble
              variant="received"
              user="이재형"
              timestamp="0km 3일 전"
              message="비가 많이와서 바닥이 꺼져있어요. 공사하는 중인데 오래걸릴 듯!"
              avatar="/avatars/lee.jpg"
            />

            <CommentBubble
              variant="sent"
              user="박창균"
              timestamp="0.9km 1일 전"
              message="러닝 전 다양한 준비운동을 배우고, 나에게 맞는 조를 선택해서 뛰어봐요! 모두 정기런에서 만나요!"
              avatar="/avatars/park.jpg"
            />
          </div>
        </div>

        {/* 버튼들 */}
        <div className="space-y-4">
          <FigmaButton variant="default">
            카카오톡 계정으로 계속하기
          </FigmaButton>

          <div className="flex space-x-2">
            <FigmaButton variant="track" size="sm">
              트랙 러닝
            </FigmaButton>
            <FigmaButton variant="road" size="sm">
              로드 러닝
            </FigmaButton>
            <FigmaButton variant="trail" size="sm">
              트레일 러닝
            </FigmaButton>
            <FigmaButton variant="jingwan" size="sm">
              진관동 러닝
            </FigmaButton>
          </div>
        </div>
      </div>

      {/* 바텀시트 */}
      <BottomSheet isOpen={true}>
        <div className="text-center">
          <h3 className="text-category text-figma-primary mb-4">진관동 러닝</h3>
          <div className="space-y-2">
            <p className="text-body text-figma-secondary">
              진관천을 한 바퀴 왕복해 도는 코스입니다.
            </p>
            <p className="text-body text-figma-secondary">
              정기런 때 뛰는 코스이기도 해요!
            </p>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
