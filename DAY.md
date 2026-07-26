# PRODUCTION LOG / 2026-07-26 / 재의 사건부

## 콘셉트 잠금

- 질문: 공개된 위험을 읽고 지금의 안전과 장기 덱 성장을 어떻게 교환할 것인가?
- 핵심 입력: 카드 탭 선택 뒤 상대 또는 변호인 인장 탭.
- 시스템 반응과 긴장 변화: 집중력·손패·적 의도·신뢰를 완전 공개하고, 상대별
  제약과 대법관 채택 규칙으로 같은 덱의 사용 순서를 바꾼다.
- 재료: 탄 종이, 붉은 인장, 산화 구리, 잿가루.
- 시각 매체: PixiJS 도형·문자로 만든 2D 종이극장 법정과 DOM 셸.
- 대표 색: 주홍 `#e56b4f`, 산화 구리 `#5fa49b`, 잿종이 `#e7d8b1`.
- 세계: 망자의 기억이 재가 되기 전 마지막으로 열리는 야간 법정.
- 마지막 장면: 대법관의 검은 인장이 갈라지고 판결문에 붉은 인장이 찍힌다.
- 한 판 길이: 첫 승리 20–30분, 패소 8–20분.
- 제외: 실시간 드래그, 자동 전투, 무한 런, 광고·결제.

덱빌딩의 손패·에너지·상대 의도·전투 후 덱 편집을 중심 골격으로 삼았다. 최근
구조 지문의 연속 드래그, 고정 노드/물리 장면, 물질 작업자 역할, 시간·실수 횟수
실패와 달리 이산적인 카드/대상 탭, 턴제 법정 테이블, 변호인 역할, 신뢰 자원
패소, 분기 사건과 덱 성장으로 구성했다.

## 초기 빌드 범위

- [x] 카드 12종 + 방해 카드, 강화형
- [x] 상대 7종 + 대법관 3국면
- [x] 여덟 분기 심리, 보상, 두 번의 휴정, 최종 판결
- [x] 한국어·영어 동일 정보
- [x] 합성 SFX, 첫 입력 전 무음, 음소거
- [x] 일시정지·복귀·재시작

## 초기 구현

- `src/game/ashDocketLogic.ts`: 손패·집중력·드로우/버림, 카드 12종과 의심,
  상대 7종, 대법관 채택 순환, 회복·방어·보호막·관통, 보상과 강화를 UI에서
  분리했다.
- `src/game/SampleGame.ts`: PixiJS 종이극장 런타임에 사건표 → 심리 → 보상 →
  휴정 → 최종 심리 → 판결을 연결했다. 카드 탭 뒤 상대/변호인 영역 탭을 실제
  포인터 입력으로 받으며, 숫자키·Enter 대체 입력도 제공한다.
- 시작 덱 10장, 카드 보상 8회, 3·6번째 심리 뒤 휴정, 대법관 생명 60으로
  초기 밸런스를 정했다.
- `public/art/title-key.svg`: 외부 이미지 없이 기본 도형으로 키 이미지를 만들고
  타이틀 DOM과 아케이드 필수 자산에 연결했다.
- 첫 사용자의 포인터 입력에서만 Web Audio를 해제한다. 런타임 음소거와 호스트
  `pause/resume/mute/setLocale/restart` 계약을 연결했다.

## 빌드 전용 플레이 관찰과 재제작

- 초기 빌드 sourceHash:
  `2d64569556dd9ed7827dc4864c8bdb6582d0090d15c3bad40cb954acd82788a4`
- 새 맥락의 플레이어는 390×844 빌드만 약 5분 플레이했다. 카드 → 상대/변호인
  대상, 집중력 지출, 턴 종료, 첫 심리 승리, 보상 카드 선택, 다음 심리 진입을
  독립적으로 이해했다.
- 도달: 첫 심리를 2턴/신뢰 48로 이기고 판례를 골랐다. 두 번째 봉인 서기에서
  5턴, 심리 2/8, 서기 논지 12/31, 보호막 6, 신뢰 48, 증거 3까지 도달했다.
- 관찰된 마찰과 제작자 변경:
  - 작은 다이아몬드로 남은 집중력을 즉시 읽지 못하고 2비용 카드를 눌렀다.
    집중력을 큰 `현재 / 3` 숫자로 바꾸고 지불 불가능한 카드를 흐리며 카드 안에
    `집중 부족 / NEED FOCUS`를 표시했다.
  - 이의 제기 뒤에도 공격 6이 그대로 보여 적용 시점을 읽지 못했다.
    규칙과 UI가 공유하는 `previewIntent`를 만들고 예고를 즉시 `공격 6 → 3`으로
    갱신하며 짧은 감산 안내를 표시했다.
  - 서기의 보호막이 왜 6으로 돌아왔는지 읽지 못했다. 현재 보호막과 별도로
    다음 행동을 `보호막 +6 / Ward +6`으로 표시하고 상대 규칙에 공격/보호막
    교대를 명시했다.
- 전체 관찰과 대응은 `production-playtest.json` schemaVersion 1에 기록했다.

## 검증

- [x] 게임별 규칙 테스트
  - 명령: `npm test -- --reporter=verbose`
  - 최종 결과: 4 test files, 27 tests 통과.
  - 대상 규칙: 5장/집중력 3 시작 루프, 보호막 관통 전 피해, 서기의 증거 비용,
    검사의 회복 절반, 증인의 같은 계열 반복 반격, 대법관 채택 순환과 비채택
    효과 감산, 서로 다른 보상 3장, 카드 계열/대상, 강화 보존, 한국어·영어 키
    동등성, 기록과 seeded RNG.
  - 재제작 규칙: 이의 제기 직후 예고 피해 6→3, 그 3을 방어 3이 흡수해 신뢰
    피해 0, 보호막 +6 의도에는 약화가 적용되지 않는 것을 추가 확인했다.
  - 닫힌 승리 경로: 고정 seed `release-balance-27`에서 계획된 회복·증거 빌드가
    8개 심리와 대법관까지 승리하는 것을 순수 규칙으로 확인했다. 이 검사에서
    초기 생명 75가 논지 15를 남기고 패소해 대법관 생명을 60으로 조정했다.
- [x] 실제 포인터 흐름
  - Playwright/Chrome, 390×844, `seed=27`.
  - 사건 카드 탭 → 첫 심리 진입 → 공격 카드 탭/상대 탭으로 생명 24→18,
    집중 3→2 → 턴 종료 → 다음 손패 5장과 신뢰 피해를 확인했다.
  - 콘솔 오류와 page error 0건. 이 확인은 전체 인간 플레이가 아니라 입력 배선
    확인이며 별도 결과 파일로 저장하지 않았다.
  - 재제작 뒤 Playwright/Chrome 390×844, 영어, seed 1에서 이의 제기를 실제로
    탭해 `Attack 5 → 2`, `Objection · damage -3`, `Focus 2 / 3`이 동시에
    렌더되는 것을 확인했다. console/page error 0건.
- [x] 프로덕션 웹 빌드
  - 명령: `npm run build`
  - 최종 결과: TypeScript와 Vite 빌드 통과. 메인 JS gzip 165.84KB.
  - 경고: 500KB를 넘는 비압축 Pixi/셸 청크와 Capacitor 동적/정적 import 경고가
    있으나 빌드 실패나 릴리스 예산 초과는 아니다.
- [x] 프로덕션 아케이드 빌드와 release 검증
  - 명령: `npm run build:arcade`
  - 최종 결과: 15개 불변 파일, 2,395,435 bytes, JS gzip 289,041 bytes.
    `scripts/verify-release.mjs` 통과.
- [x] 배포 부팅 스모크와 현재 sourceHash
  - 명령: `npm run smoke`
  - 결과: `mounted: true`, console/page error 0건.
  - `smoke-result.json` sourceHash:
    `ad7849964a78e29159871353d408d27e63633f3f65486b8f96e7b4fdd0044f2c`
- [x] 360×800 / 390×844 / 430×932
  - 명령: `npm run viewport`
  - 결과: 세 세로 화면과 900×760 wide, standalone/68px portal 형상 모두 통과.
    430×932 확대 시 DPR 부족을 발견해 backing resolution 여유를 1.2배로
    조정한 뒤 재검증했다.
  - 한국어·영어, standalone/portal의 360×800 결과 화면 네 조합 모두
    game over 도달, UI 경계 내부, 오류 0건.
  - 증거: `verification/viewport-result.json`과 생성 캡처.
  - 최종 `viewport-result.json` sourceHash:
    `ad7849964a78e29159871353d408d27e63633f3f65486b8f96e7b4fdd0044f2c`
- [x] 포털 CSP
  - 명령: `npm run csp`
  - 결과: stylesheet 적용, 390×844 Canvas, CSP 위반·오류·누락 자산 0건.
- [x] 필수 자산 응답
  - 최종 빌드에서 `npm run preview -- --host 127.0.0.1 --port 4195` 뒤 Node
    `fetch`로 재확인.
  - `/fonts/Galmuri11.woff2` 200 / 505,116 bytes
  - `/fonts/Galmuri11-Bold.woff2` 200 / 167,372 bytes
  - `/fonts/Galmuri14.woff2` 200 / 565,420 bytes
  - `/art/title-key.svg` 200 / 2,020 bytes
- [x] 자산 출처·후가공
  - `ART.md`에 직접 제작 SVG/절차 도형, Galmuri 라이선스, Web Audio 합성을 기록.

## 결과

- 상태: 블라인드 관찰을 반영하고 검증한 release candidate
- 게임 잠금: 하지 않음 — 체르파 검토 전
- `production-playtest.json`: schemaVersion 1, 초기/최종 해시와 한 세션 기록
- 최종 sourceHash:
  `ad7849964a78e29159871353d408d27e63633f3f65486b8f96e7b4fdd0044f2c`
- 릴리스 후보 판단: 빌드만 받은 플레이어가 핵심 덱빌딩 루프와 다음 심리까지
  독립적으로 진행했고, 발견된 마찰은 규칙 추가가 아니라 행동 전 정보의 가독성
  문제였다. 재제작 뒤 집중력 지불 가능성, 약화된 실효 피해, 보호막 증가 원인이
  행동 전에 수치로 드러나며 테스트와 실제 렌더가 같은 결과를 보였다. 닫힌 승리
  경로, 프로덕션/아케이드 빌드, 스모크, 전 뷰포트와 CSP가 최종 해시에서 통과했다.
- 알려진 문제와 미검증:
  - 빌드 전용 플레이어는 약 5분 동안 심리 2/8까지 도달했다. 실제 사람의
    20–30분 전체 승리와 후반 상대·휴정·대법관의 체감 난이도는 확인하지 않았다.
    닫힌 승리 가능성은 게임 규칙 시뮬레이션으로 확인했다.
  - Sonatype 의존성 조회는 인증 토큰 부재로 결과를 받지 못했다. 잠금 파일의
    버전을 바꾸지 않고 `npm ci`했으며, `npm audit --json`은 전체 48건
    (low 15 / moderate 5 / high 24 / critical 4), `--omit=dev`는 47건
    (low 15 / moderate 5 / high 23 / critical 4)을 보고했다. 대부분 큰 Toss/
    Capacitor 도구 체인의 전이 의존성이며 이번 초기 빌드에서 자동 수정하거나
    버전을 바꾸지 않았다.
  - 아케이드 `releaseSha`는 아직 커밋 전이므로 `9f8b2bcd77ed-dirty`다.
  - `game.manifest.json`의 `source.launchpadCommit`은 격리 제작 단계에서 상위
    저장소를 읽지 않아 `template-2026-07-26`으로 남겼다. 실제 런치패드 SHA가
    게시 계약에 필요하면 관제 단계에서 채워야 한다.

## 런치패드 피드백

- 재사용 후보: 초기 빌드에서는 없음
- 게임에 남길 코드: 카드 전투와 사건 진행은 게임 전용
- 다음 게임에서 재검증할 항목: 430px 폭에서 설계 Canvas 확대 시 backing store
  DPR이 떨어지는지 확인할 것.

## 잠금 뒤 기술 메타데이터 교정

- 발견: `game.manifest.json`의 `source.launchpadCommit`이 격리 제작 중 사용한
  `template-2026-07-26` 자리표시자여서 공개 계약에 필요한 실제 상속 커밋을
  표현하지 못했다.
- 교정: 관제가 제공한 전체 SHA
  `9f8b2bcd77eddd4a761205e83146b18316037974`로 해당 필드만 교체했다.
- 게임 규칙, 런타임, GDD, 아트, 사운드, 제목, 세계와 팔레트는 변경하지 않았다.
- sourceHash 영향: manifest는 게임 sourceHash 산정 범위 밖이므로 최종 해시는
  `ad7849964a78e29159871353d408d27e63633f3f65486b8f96e7b4fdd0044f2c`로
  유지됐다. 따라서 `smoke-result.json`, `verification/viewport-result.json`,
  `production-playtest.json.finalBuildHash`도 같은 해시를 유지한다.
- 재검증:
  - `npm test -- --reporter=verbose`: 4 files, 27 tests 통과.
  - `npm run build`: TypeScript/Vite 프로덕션 웹 빌드 통과, 메인 JS gzip
    165.84KB.
  - `npm run build:arcade`: 15 files, 2,395,435 bytes, JS gzip 289,041 bytes;
    release 검증 통과.
  - 새 `dist-arcade/release.json.launchpadSha`가
    `9f8b2bcd77eddd4a761205e83146b18316037974`와 정확히 일치함을 JSON으로 확인.
  - `npm run smoke`: mounted true, console/page error 0, 유지된 sourceHash 일치.
  - `npm run viewport`: 360×800 / 390×844 / 430×932 / 900×760,
    standalone/portal과 한국어·영어 결과 화면 모두 통과.
  - `npm run csp`: CSP 위반·오류·누락 자산 0, 통과.
  - 최종 preview의 Galmuri 글꼴 3개와 `art/title-key.svg`: HTTP 200,
    각각 505,116 / 167,372 / 565,420 / 2,020 bytes.
- 잠금, 커밋, 푸시와 편집 준비는 수행하지 않았다.

## 비SVG 플레이 매체 재제작

- 이전 후보 source hash:
  `ad7849964a78e29159871353d408d27e63633f3f65486b8f96e7b4fdd0044f2c`.
- 중립 제작 계약의 주 시각 매체 기준에 맞춰 8명의 상대를 그린 래스터
  과슈·목탄 4×2 아틀라스를 만들었다. 사건표의 상대 선택 카드와 매 심리의 활성
  상대 패널에 같은 회화 셀을 사용하고, 벡터·절차 도형은 HUD와 종이극장 프레임을
  보조한다.
- 생성 원본과 배포본, 프롬프트, 해시, 축소 과정, 셀 대응과 실제 사용 위치는
  `art/gameplay/` 및 `ART.md`에 기록했다.
- `src/game/gameplayArt.test.ts`가 배포 PNG의 시그니처·바이트·SHA-256,
  manifest 패키징, 사건표와 심리 양쪽의 런타임 사용을 검사한다.
- 최종 source hash와 전체 검증 결과는 아래 후속 기록에 확정한다.

## 비SVG 플레이 매체 검증

- 최종 source hash:
  `e6d04e3d9b84d637ffe957c8cd74bef971ddc0211c4f5cadbb50cade96ba9edb`.
  `production-playtest.json`, smoke, viewport가 같은 값을 기록한다. 이전 빌드 전용
  플레이어 관찰은 그대로 보존했다.
- `npm test -- --reporter=verbose`: 5 files, 29 tests 통과. 새 아트 검사는 배포
  PNG의 2,191,914 bytes와 SHA-256, manifest 패키징, 사건표·심리 양쪽 사용을
  확인했다.
- `npm run build`: 통과. Vite의 500KB 초과 청크와 Capacitor 동적/정적 import
  경고는 기존과 같으며 새 PNG 로딩 오류는 없었다.
- `npm run build:arcade`: 19 immutable files, 5,414,862 bytes,
  311,485 JS gzip bytes. 릴리스 검증 통과.
- `npm run smoke`: deployment-only mount, console/page error 0, 통과.
- `npm run viewport`: 360×800, 390×844, 430×932, 900×760의 standalone·portal,
  한·영 종료 화면이 모두 통과했다.
- `npm run csp`: 최초 하네스가 공개 자산 기준 URL을 `/`로 넘겨 새 PNG를 404로
  찾았다. `assetBaseUrl`을 하네스의 실제 릴리스 경로 `/__game-assets/`로
  바로잡은 뒤 stylesheet, canvas, missing assets, CSP 위반 검사가 모두 통과했다.
- 프로덕션 preview HTTP: Galmuri 글꼴 3개, `art/title-key.svg`,
  `art/opponent-atlas.png`가 모두 200을 반환했다. HTTP로 받은 아틀라스 해시는
  `34c5a39c5dc4f1c338384bae763a1d488bb2c05d3d741db2e7bb2ceb83a584f8`.
- 390×844 실화면을 `verification/raster-docket-390x844.png`와
  `verification/raster-hearing-390x844.png`로 확인했다. 사건표 카드와 심리
  상대 패널 모두에서 초상, 목탄 윤곽, 과슈 질감이 정상 플레이 중 식별된다.

## 제작 잠금 뒤 공개 준비

- 재잠금 기준 커밋: `5f2d485dd2bb19daa786e17bf8694df514880a01`.
- 체르파 설계 일치 검사: schemaVersion 3 `design-review.json`, verdict `pass`.
  10개 설계 약속이 모두 `implemented`였고, 27개 제작자 테스트와 웹·아케이드
  빌드, 릴리스 검증, 스모크, 뷰포트와 CSP가 통과했다.
- 체르파 검토 커밋: `8f5851a5dc44597901f75fed6ed9602af0b6baf4`.
- 라이카 공개 작품 노트: `WHY.md`. 잠긴 제목, 규칙, 세계, 팔레트, 게임 아트와
  사운드는 바꾸지 않았다.
- 제작자 일러스트: `laika-base-v1`을 직접 참조한
  `art/source/laika-ashdocket.png`와 640px/1280px JPEG 두 장. 프롬프트,
  SHA-256과 얼굴·하네스·발·문자·크롭 검수는 `ART.md`와
  `art/provenance/laika-ashdocket.json`에 기록했다.
- 잠금 보존 확인:
  `node scripts/prepare-editorial.mjs --game games/2026/2026-07-26-ashdocket --verify`
  결과 `status: verified`, 잠긴 파일 173개 일치.

## ADR 0012 반영과 재출고

- 첫 공개 뒤 채택된 ADR 0012가 게임 본체의 SVG·기본 도형 전용 구성을
  출고 불가로 정의해, 진행 중이던 첫 Earth 평가를 중단하고 그 관찰을
  공개 기록에 사용하지 않았다.
- 브랜드 맥락을 받지 않은 제작자가 8종 상대의 래스터 과슈·목탄 4×2 초상
  아틀라스를 만들고 모든 사건표 카드와 활성 심리 상대 패널에 통합했다.
  원본·배포본·프롬프트·해시·후가공·셀 대응은 `ART.md`와
  `art/gameplay/`에 기록했다.
- 재제작 sourceHash:
  `e6d04e3d9b84d637ffe957c8cd74bef971ddc0211c4f5cadbb50cade96ba9edb`.
  29개 제작자 테스트, 웹·아케이드 빌드, smoke, 전체 뷰포트와 한·영 결과,
  CSP와 필수 자산 검사가 같은 해시에서 통과했다.
- 새 체르파는 390×844 실제 포인터로 사건표와 심리의 래스터 초상을 확인하고
  덱빌딩 완성 약속과 비SVG 주 매체 조건을 모두 `implemented`로 판정했다.
  verdict `pass`, 검토 커밋
  `4765155ac6f60396fe51e79240b0c7cc56fb051f`, 차단·수정 요구 없음.
- 최종 불변 릴리스: 19 files, 5,414,862 bytes, JS gzip 311,485 bytes,
  manifest SHA-256
  `02a1b507b03279842e9c2490a63372fb66917086d928be37eaf2a2f82d31764b`.
  기존 공개본은 `--replace-published`로 이 검토 커밋에 교체했다.
- preview `https://laika-rjw2v78dm-rapinas-projects.vercel.app`,
  production deployment
  `https://laika-3t64fnlbc-rapinas-projects.vercel.app`, 운영 별칭
  `https://laika365.vercel.app`. 세 출처의 deployment-only 스모크가 모두
  mounted true, console/page/request error 0으로 통과했다.
- `.ait`는 게시 게이트에서 로컬 빌드만 통과했다. Toss 제출·출시는 하지 않았다.

## 공개 뒤 지구 평가

- 독립 평가자가 2026-07-26 22:26:28.902–22:31:45.435 KST에 운영 URL의
  390×844 화면에서 저장소나 설계 문서를 보지 않고 실제 포인터 탭 78회를
  수행했다. 키보드·스크립트 입력은 사용하지 않았다.
- 속삭이는 배심, 봉인 서기, 메아리 합창을 차례로 이기고 세 번째 보상 선택까지
  도달했다. 신뢰는 48→43→45→33으로 변했고, 전체 여덟 심리 결말에는
  도달하지 않았다.
- 첫 턴에는 카드 탭이 선택이고 대상을 다시 눌러야 실행된다는 점을 놓쳐 손패를
  효과 없이 넘겼다. 이후 공개된 공격 의도를 보고 방어와 이의를 조합해 무방비
  때보다 신뢰 손실을 줄이는 차이를 직접 확인했다.
- 카드 사용 뒤 손패가 중앙으로 재배치돼 같은 좌표를 다시 누르려다 방어 카드를
  한 번 놓쳤다. 반면 공격 의도와 HP·집중·방어·신뢰의 즉시 갱신은 선택의
  결과를 또렷하게 전달했다.
- 한국어에서 영어로 전환했고 포털과 게임 문구가 함께 바뀌었다. 게임·포털
  출처의 콘솔·페이지·요청 오류는 없었다. MetaMask 확장 프로그램 출처 경고는
  게임 오류에서 제외했다.
- `murr-base-v1`을 직접 참조한 평가 그림 원본과 640/1280 JPEG를 만들고,
  생성 프롬프트·해시·시각 검수 결과를 `brand/art/murr-ashdocket.json`에
  기록했다. 잠긴 게임 아트와 규칙은 변경하지 않았다.
- Earth 원문과 그림, ADR 0012 공개 공정 기록, 여섯 단계 제작 기록을 아케이드
  커밋 `341250a`로 배포했다. 최종 production deployment는
  `https://laika-kypc74m2b-rapinas-projects.vercel.app`, 운영 별칭은
  `https://laika365.vercel.app`이다.
- 운영 별칭의 게임, 제작 기록, 공정 기록, Murr 640/1280, Laika 제작자 그림,
  게임플레이 래스터 아틀라스와 제작 기록 캡처가 모두 HTTP 200이었다.
  제작 기록을 390×844로 끝까지 스크롤한 검사에서도 네 이미지가 모두
  로드됐고 console/page/request error는 0건이었다. 최종 게임 스모크도
  mounted true, console/page/request error 0으로 통과했다.
