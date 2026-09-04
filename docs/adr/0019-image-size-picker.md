# ADR-0019: 업로드 시 이미지 크기를 직접 고른다

- 상태: 대체됨(ADR-0023)
- 날짜: 2026-06-21

## 맥락 (Context)

마크다운은 이미지 너비를 저장하지 못한다([ADR-0017](0017-image-upload-storage.md)). 그래서 에디터에서 리사이즈해도 저장되지 않고, 모든 이미지가 본문폭으로만 떴다. 글에 따라 이미지를 작게/크게 **직접 조절**하고 싶었다.

## 결정 (Decision)

- 이미지를 올릴 때(드래그드랍·붙여넣기·`/이미지`) **업로드 전 크기 선택 모달**을 띄운다 — 미리보기 + 프리셋(작게/보통/크게/원본) + 슬라이더.
- 고른 **너비로 파일 자체를 줄여** 올린다. 공개 화면 `.prose img`가 자연크기·`max-width`라, **파일 크기 = 표시 크기**가 된다.
- 기본값은 **원본**(=기존 자동 동작) — 그냥 올리면 지금과 같고, 줄이고 싶을 때만 조절. **취소하면 업로드하지 않는다.**
- 공개 화면 `.prose img`에 가로(`max-width:100%`)뿐 아니라 **세로도 `max-height:80vh`** 로 제한 — 세로 긴 이미지가 화면을 다 잡아먹지 않게.

## 이유 (Rationale)

- 너비를 어디에도 저장하지 않고(마크다운엔 표준 `![](url)`만), **파일 픽셀 크기로 표시 크기를 제어** → 마크다운 이식성·단순함을 깨지 않는다.
- Crepe `onUpload`(명령형 함수)과 React 모달은 작은 컨트롤러로 잇는다 — `onUpload`이 "모달을 열고 선택을 기다리는 Promise"를 받는다.

## 트레이드오프 (Trade-off)

- 크기가 **파일에 구워진다** — 나중에 키우려면 재업로드. (블로그엔 충분히 수용 가능)
- 작은 크기는 1배 해상도라 레티나에서 약간 덜 또렷할 수 있다(작은 이미지는 보통 티 안 남).
- **gif·svg는 크기 조절 불가**(캔버스로 처리하면 망가짐) → 모달 없이 원본 그대로 올린다.
- **취소**는 빈 이미지 블록을 남긴다(지우면 됨). 에디터(Milkdown plugin-upload)가 드롭 즉시 "업로드 중" placeholder를 깔고 reject 시 치우지 않아, throw 대신 빈 src를 돌려 업로드만 막는 방식이라서다. 완전 무흔적 취소는 drop 가로채기가 필요해 보류.

## 결과 (Consequences)

- `features/posts/imageSizeController.ts`: onUpload↔모달 브리지(register/request).
- `features/posts/components/ImageSizeDialog.tsx`: 미리보기·프리셋·슬라이더 모달(PostForm에 상시 마운트).
- `features/posts/upload.ts`: `resizeToWidth(file, width)` + `requestImageSize`로 선택 연결.
- `app/globals.css`: `.prose img` 세로 제한(`max-height:80vh`).
