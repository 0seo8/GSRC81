# ⚙️ **Next.js 관리자 GPX 등록 폼 리팩토링 프롬프트**

> 📍 목적: 현재 관리자 페이지(`/admin/courses/new`)에
> `detail_description`, `category_id`, `cover_image_url`, `tags` 입력 기능을 추가하고
> GPX 업로드 + 미리보기 기능을 개선한다.

---

## 🧩 1️⃣ 리팩토링 목표

| 구분                 | 목표                                                                 |
| -------------------- | -------------------------------------------------------------------- |
| ✅ **기능 확장**     | PDF 19p의 “코스 상세 설명 / 대표 이미지 / 태그 / 카테고리” 기능 추가 |
| ✅ **데이터 일관성** | `courses` 테이블의 모든 주요 필드 입력 가능하도록 완성               |
| ✅ **UX 개선**       | GPX 미리보기(지도) + 이미지 미리보기 UI 추가                         |
| ✅ **API 연동**      | Supabase insert/update 시 모든 필드 반영                             |

---

## 🗂️ 2️⃣ 수정 파일 목록

| 파일 경로                              | 설명                                    |
| -------------------------------------- | --------------------------------------- |
| `/app/(admin)/courses/new/page.tsx`    | 새 코스 등록 페이지                     |
| `/components/admin/CourseForm.tsx`     | 코스 등록 폼 컴포넌트                   |
| `/lib/db/courses.ts`                   | Supabase DB 저장 로직                   |
| `/types/domain.ts`                     | Course 타입 업데이트                    |
| `/components/common/ImageUploader.tsx` | 대표 이미지 업로더 컴포넌트 (신규 추가) |

---

## 🧱 3️⃣ DB 필드 매핑

| 폼 항목          | DB 필드              | 타입      | 설명                             |
| ---------------- | -------------------- | --------- | -------------------------------- |
| 코스명           | `title`              | `varchar` | 코스 제목                        |
| 코스 설명 (요약) | `description`        | `text`    | 카드용 요약 설명                 |
| 코스 상세 설명   | `detail_description` | `text`    | 상세 페이지 본문용 설명          |
| 거리 (자동 계산) | `distance_km`        | `numeric` | GPX로 계산                       |
| 평균 시간        | `avg_time_min`       | `integer` | GPX로 계산                       |
| 고도 상승        | `elevation_gain`     | `integer` | GPX로 계산                       |
| 난이도           | `difficulty`         | `varchar` | easy / medium / hard             |
| 카테고리         | `category_id`        | `uuid`    | `course_categories` 참조         |
| 태그             | `tags`               | `jsonb`   | 문자열 배열 JSON 저장            |
| 대표 이미지      | `cover_image_url`    | `text`    | Supabase Storage 업로드 결과 URL |
| GPX 데이터       | `gpx_data`           | `jsonb`   | GPX 분석 결과 전체 저장          |

---

## 🧩 4️⃣ `CourseForm.tsx` 수정 프롬프트

```tsx
// ✅ CourseForm.tsx — 관리자 코스 등록 폼 리팩토링

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import ImageUploader from "@/components/common/ImageUploader";

export default function CourseForm({ onSubmit }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    detail_description: "",
    difficulty: "medium",
    category_id: "",
    tags: [],
    cover_image_url: "",
  });

  const handleChange = (field: string, value: any) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="flex flex-col gap-4">
      {/* 코스명 */}
      <label>코스명 *</label>
      <input
        type="text"
        className="input"
        value={form.title}
        onChange={(e) => handleChange("title", e.target.value)}
        required
      />

      {/* 코스 설명 (요약) */}
      <label>코스 설명 *</label>
      <textarea
        className="textarea"
        placeholder="코스에 대한 간단한 설명을 입력하세요"
        value={form.description}
        onChange={(e) => handleChange("description", e.target.value)}
      />

      {/* 코스 상세 설명 */}
      <label>코스 상세 설명 (본문)</label>
      <textarea
        className="textarea h-32"
        placeholder="상세 페이지 본문 내용을 입력하세요"
        value={form.detail_description}
        onChange={(e) => handleChange("detail_description", e.target.value)}
      />

      {/* 카테고리 선택 */}
      <label>카테고리</label>
      <select
        value={form.category_id}
        onChange={(e) => handleChange("category_id", e.target.value)}
      >
        <option value="">선택하세요</option>
        <option value="트레일러닝">트레일러닝</option>
        <option value="트랙러닝">트랙러닝</option>
        <option value="로드러닝">로드러닝</option>
      </select>

      {/* 태그 입력 */}
      <label>태그</label>
      <input
        type="text"
        placeholder="#태그1 #태그2"
        value={form.tags.join(" ")}
        onChange={(e) =>
          handleChange(
            "tags",
            e.target.value.split(" ").filter((t) => t.trim() !== ""),
          )
        }
      />

      {/* 커버 이미지 */}
      <label>대표 이미지</label>
      <ImageUploader onUpload={(url) => handleChange("cover_image_url", url)} />
      {form.cover_image_url && (
        <img
          src={form.cover_image_url}
          alt="preview"
          className="w-full h-40 object-cover rounded-xl mt-2"
        />
      )}

      {/* 등록 버튼 */}
      <button onClick={() => onSubmit(form)} className="btn-primary mt-4">
        코스 등록
      </button>
    </div>
  );
}
```

---

## 🧩 5️⃣ `/lib/db/courses.ts` 수정

```ts
// ✅ /lib/db/courses.ts

import { supabase } from "@/lib/supabaseClient";

export async function insertCourse(data) {
  const { data: result, error } = await supabase.from("courses").insert([
    {
      title: data.title,
      description: data.description,
      detail_description: data.detail_description,
      difficulty: data.difficulty,
      category_id: data.category_id || null,
      tags: data.tags || [],
      cover_image_url: data.cover_image_url || null,
      gpx_data: data.gpx_data,
      distance_km: data.distance_km,
      avg_time_min: data.avg_time_min,
      elevation_gain: data.elevation_gain,
      start_latitude: data.start_latitude,
      start_longitude: data.start_longitude,
    },
  ]);
  if (error) throw error;
  return result;
}
```

---

## 🧩 6️⃣ `ImageUploader.tsx` (신규 추가)

```tsx
// ✅ /components/common/ImageUploader.tsx
"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function ImageUploader({ onUpload }) {
  const [uploading, setUploading] = useState(false);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const fileName = `${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage
      .from("course-photos")
      .upload(fileName, file, { upsert: false });

    setUploading(false);
    if (error) {
      alert("업로드 실패");
      return;
    }

    const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/course-photos/${fileName}`;
    onUpload(publicUrl);
  }

  return (
    <div>
      <input type="file" onChange={handleFile} disabled={uploading} />
      {uploading && <p>업로드 중...</p>}
    </div>
  );
}
```

---

## 🧱 7️⃣ 타입 정의 `/types/domain.ts`

```ts
export interface Course {
  id: string;
  title: string;
  description: string;
  detail_description?: string;
  difficulty: "easy" | "medium" | "hard";
  distance_km: number;
  avg_time_min: number;
  elevation_gain: number;
  cover_image_url?: string;
  tags?: string[];
  category_id?: string;
  gpx_data: any;
}
```

---

## ✅ 결과 요약

| 항목             | 상태      | 설명                                           |
| ---------------- | --------- | ---------------------------------------------- |
| **SQL 변경**     | ❌ 불필요 | 모든 필드 이미 존재                            |
| **UI 개선**      | ✅ 완료   | 상세 설명 / 이미지 / 태그 / 카테고리 입력 가능 |
| **DB 연동**      | ✅ 정상   | `insertCourse()` 확장                          |
| **Storage 연동** | ✅ 추가   | 이미지 업로드 / 미리보기                       |
