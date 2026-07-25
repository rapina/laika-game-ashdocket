# Laika Game Launchpad

## 한국어

한 손 세로 웹 게임을 제작하고 검증하기 위한 공용 런타임 템플릿이다. React,
PixiJS, Vite, Capacitor와 Apps in Toss 빌드 경로를 포함하며, 게임 규칙은
`GameRuntime` 계약 뒤에 격리한다.

### 빠른 시작

```bash
git clone https://github.com/rapina/laika-game-lunchpad.git my-game
cd my-game
npm ci
npm run new-game -- --id com.example.mygame --name "MY GAME" --slug mygame --display "내 게임"
npm test
npm run smoke
npm run dev
```

### 주요 검증

```bash
npm test
npm run build
npm run smoke
npm run build:arcade
```

결정론적 게임 규칙, 한국어·영어 기능 일치, 모바일 뷰포트, 입력 뒤 오디오
시작, 일시정지·복귀와 아케이드 sandbox 계약을 검증한다.

새 게임 공개 저장소의 이름은 `laika-game-<slug>`를 사용한다.

## English

This is the shared runtime template for building and verifying one-handed
portrait web games. It includes React, PixiJS, Vite, Capacitor, and an Apps in
Toss build path. Game rules stay isolated behind the `GameRuntime` contract.

### Quick start

```bash
git clone https://github.com/rapina/laika-game-lunchpad.git my-game
cd my-game
npm ci
npm run new-game -- --id com.example.mygame --name "MY GAME" --slug mygame --display "My Game"
npm test
npm run smoke
npm run dev
```

### Main checks

```bash
npm test
npm run build
npm run smoke
npm run build:arcade
```

The verification layer covers deterministic rules, Korean and English feature
parity, mobile viewports, user-gesture audio, pause and resume behavior, and
the Arcade sandbox contract.

New public game repositories use the `laika-game-<slug>` naming scheme.

## 라이선스 / License

- 코드 / Code: [MIT](LICENSE)
- 문서 / Documentation: [CC BY 4.0](CONTENT-LICENSE.md)
- 프로젝트 아트 / Project artwork: [CC0 1.0](CONTENT-LICENSE.md)
- Galmuri fonts: SIL Open Font License 1.1
