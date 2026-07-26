# Game Art & Audio Provenance

- 날짜: 2026-07-26
- 게임: `ashdocket`

## 게임 아트

- 주 시각 매체: 거친 종이 섬유, 불투명 안료층, 목탄 윤곽으로 그린 래스터
  과슈·목탄 상대 초상 8점. 사건표의 모든 선택 카드와 매 심리의 활성 상대 패널에
  표시되며, PixiJS 도형·문자와 SVG 키 이미지는 HUD·프레임·셸을 보조한다.
- 원본: OpenAI Codex 내장 `image_gen`의 `stylized-concept` 모드로 입력 이미지나
  외부 참고 이미지 없이 4×2 초상 아틀라스를 생성했다. 최종 프롬프트는
  `art/gameplay/opponent-atlas-prompt.md`, 구조화된 이력은
  `art/gameplay/opponent-atlas-provenance.json`에 보존한다.
- 생성 원본: `art/gameplay/opponent-atlas-source.png`, 1774×887 RGB PNG,
  3,101,069 bytes, SHA-256
  `867f3095c59705d61ce7a59974d54b3af532d12b8659ea0ada700ab0f402e81f`.
- 후가공: `/usr/bin/sips -Z 1536`으로 비율을 유지해 축소하고 PNG로 패키징했다.
  `public/art/opponent-atlas.png`, 1536×768 RGB PNG, 2,191,914 bytes,
  SHA-256
  `34c5a39c5dc4f1c338384bae763a1d488bb2c05d3d741db2e7bb2ceb83a584f8`.
  런타임에서는 4×2 셀을 PixiJS 마스크로 잘라 사용하며 색상 재해석은 하지 않는다.
- 사용 위치: `src/game/SampleGame.ts`의 `opponentPortrait()`가 사건표 선택 카드와
  활성 심리 상대 패널에 아틀라스 셀을 배치한다. 적 ID별 셀 대응은
  `ENEMY_PORTRAIT_INDEX`에 고정했다.
- 기타 원본: 저장소에 포함된 Galmuri 글꼴은 `OFL-GALMURI.md`의 SIL Open Font
  License 1.1을 따른다. 외부 이미지·모델·게임 아트는 사용하지 않는다.
- 기타 제작·후가공: 제작자가 TypeScript/PixiJS 도형과 SVG 기본 도형으로 법정
  아치, 인장, 카드와 키 이미지를 만들었고, 런타임 알파 합성, 색조 단계, 느린
  입자 이동, 피격 흔들림과 인장 맥박을 적용했다.

## 게임 사운드

- 원본: 외부 음원과 저장 음원 파일을 사용하지 않는다.
- 합성·편집 방식: Web Audio API 오실레이터, 짧은 노이즈 버퍼, gain envelope와
  필터로 카드, 타격, 방어, 회복, 판결봉, 승패 신호를 실행 시 합성한다.
- 사용 위치: 첫 사용자 탭 뒤의 카드 선택·사용, 턴 해결, 피해·회복, 승패.
- 첫 입력 전: AudioContext를 만들거나 재생하지 않는다.

## 공개 제작자 일러스트

- 기준 원본: `brand/art/laika-base.png`, `laika-base-v1`,
  SHA-256 `820e6d43e915c4e9e32ddcd3cc14d0f2537d99f6d8d397bbd40fc416137a6712`.
- 생성 도구: Codex built-in `image_gen`. 기준 원본을 직접 참조해 생성한 뒤,
  가려진 두 번째 앞발만 보이도록 한 차례 수정했다.
- 대표 행동과 도구: 재빛 사건부에서 빈 논증 카드 한 장을 고르고, 붉은 판결
  인장을 곁에 둔 라이카.
- 생성 원본: `art/source/laika-ashdocket.png`, 1536×1024,
  SHA-256 `27f81da71376946ca58eb45d3ee4d2e6f71409ff9d3a8391ddac233d728d2710`.
- 웹 파생본: `public/art/laika-ashdocket-640.jpg`, 640×426,
  SHA-256 `9678d21f5fc302c31ec6b3ae9355187c3d8177dfb64aafc51348dbdbbf26b6d2`;
  `public/art/laika-ashdocket-1280.jpg`, 1280×853,
  SHA-256 `74e402c4ef240dbfeb0752057b08096661fcbb53f7fd57c532f7509a8f5a10d6`.
- 검수: 얼굴 무늬와 귀, 흰 가슴, 크림색 X 하네스, 주황 연결구, 자연스러운
  두 앞발, 카드와 사건부, 640px 크롭을 확인했다. 문자, 로고, 서명, 워터마크,
  사람 손과 여분의 발은 없다.
- 프롬프트와 구조화된 검수 기록:
  `art/prompts/laika-ashdocket.md`, `art/provenance/laika-ashdocket.json`.
