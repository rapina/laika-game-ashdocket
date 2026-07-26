# Game Art & Audio Provenance

- 날짜: 2026-07-26
- 게임: `ashdocket`

## 게임 아트

- 시각 매체: 2D 종이극장식 법정 UI, 벡터 키 이미지, 절차적 재 입자.
- 원본: 외부 이미지·모델·게임 아트를 사용하지 않는다. 저장소에 포함된 Galmuri
  글꼴은 `OFL-GALMURI.md`의 SIL Open Font License 1.1을 따른다.
- 생성·제작 방식: 제작자가 TypeScript/PixiJS의 원·사각형·다각형과 SVG 기본
  도형을 직접 조합해 법정 아치, 인장, 카드, 초상 실루엣과 키 이미지를 만들었다.
- 후가공: 런타임 알파 합성, 색조 단계, 느린 입자 이동, 피격 흔들림과 인장 맥박.
- 사용 위치: 타이틀 화면, 사건표, 카드 전투, 보상·휴정·판결 화면.

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
