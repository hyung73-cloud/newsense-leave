# Cursor 작업 프롬프트 — 뉴센스의원 연차 관리 앱

> 아래 전체를 복사해서 Cursor 채팅(Agent 모드)에 붙여넣으세요.
> 프로젝트 폴더에 `clinic_leave_balance_v2.jsx` 파일을 먼저 넣어두고 시작하면 됩니다.

---

## 너의 임무

`clinic_leave_balance_v2.jsx`(단일 파일 React 컴포넌트)를 **Vite + React + TypeScript** 정식 프로젝트로 이식하고, localStorage로 데이터를 영속화한 뒤, **GitHub에 푸시**하고 **카페24 웹호스팅에 배포**까지 완료한다. 각 단계가 끝나면 실제로 동작하는지 확인하고 다음으로 넘어간다.

### 이 앱이 하는 일 (배경)
- 의원 직원이 다음 달 연차/반차/시간차를 미리 신청하고, 관리자가 잔여와 승인을 관리하는 도구다.
- 핵심 환산 규칙: **연차 1 = 반차 2 = 시간차 8** → 내부 단위(unit)로 `연차=8, 반차=4, 시간차=1`. 부여 연차에서 신청분을 unit으로 차감하고, 남은 unit을 다시 연차/반차/시간차로 분해해 보여준다.
- 직원 입력은 "달력에서 날짜 탭 → 종류 탭 → 즉시 신청"이 전부다. 기존 `.jsx`에 이 로직이 이미 들어있으니 **기능을 새로 설계하지 말고 그대로 이식**해라.

---

## 1단계 — 프로젝트 셋업

1. 현재 폴더에 Vite 프로젝트 생성: `npm create vite@latest . -- --template react-ts`
2. Tailwind CSS 설치/설정 (기존 코드가 Tailwind 유틸리티 클래스를 사용한다):
   - `npm install -D tailwindcss postcss autoprefixer && npx tailwindcss init -p`
   - `tailwind.config.js`의 `content`에 `./index.html`, `./src/**/*.{ts,tsx}` 추가
   - `src/index.css`에 `@tailwind base; @tailwind components; @tailwind utilities;` 추가하고 `main.tsx`에서 import
3. `npm install` 후 `npm run dev`로 빈 앱이 뜨는지 확인.

---

## 2단계 — 코드 이식 (.jsx → TypeScript, 모듈 분리)

`clinic_leave_balance_v2.jsx` 한 덩어리를 아래 구조로 쪼개서 옮긴다. **로직/계산은 그대로 두고** 타입만 입힌다.

```
src/
  types.ts            // Employee, LeaveRequest, WorkType, RequestStatus 타입
  data/holidays.ts    // KR_HOLIDAYS_2026
  lib/date.ts         // ymd, daysInMonth, weekdayOf, monthsFrom 등
  lib/leave.ts        // TYPES 상수, usedUnits, decompose, countType (환산/잔여)
  lib/store.ts        // localStorage 기반 load/save (★ 교체 지점)
  components/
    MiniCalendars.tsx
    StaffView.tsx
    AdminBalance.tsx
    AdminCalendar.tsx
    ApprovePanel.tsx
  App.tsx
  main.tsx
```

타입 정의 기준(기존 데이터 구조 그대로):

```ts
export type WorkType = 'annual' | 'half_am' | 'half_pm' | 'hourly';
export type RequestStatus = 'requested' | 'approved' | 'rejected' | 'revise';

export interface Employee {
  id: string;
  name: string;
  role: string;
  isJapaneseAvailable: boolean;
  isActive: boolean;
  annualDays: number;        // 부여 연차(일)
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  date: string;              // 'YYYY-MM-DD'
  type: WorkType;
  startTime: string;         // 시간차일 때만
  endTime: string;
  reason: string;
  status: RequestStatus;
  managerMemo: string;
  createdAt: string;
  updatedAt: string;
}
```

---

## 3단계 — localStorage 영속화 (★ 중요)

기존 `store`는 데모라 메모리에만 있다. `lib/store.ts`를 실제 localStorage로 만든다. seed 데이터는 최초 1회만 넣는다.

```ts
const KEYS = { emp: 'nsc_emp', req: 'nsc_req' };

export const store = {
  load() {
    const e = localStorage.getItem(KEYS.emp);
    const r = localStorage.getItem(KEYS.req);
    if (e && r) return { employees: JSON.parse(e), requests: JSON.parse(r) };
    const init = seed();          // 기존 seed() 그대로 사용
    this.save(init);
    return init;
  },
  save(state: { employees: Employee[]; requests: LeaveRequest[] }) {
    localStorage.setItem(KEYS.emp, JSON.stringify(state.employees));
    localStorage.setItem(KEYS.req, JSON.stringify(state.requests));
  },
};
```

> 나중에 Supabase로 옮길 때는 이 `store` 객체의 `load/save`만 비동기 호출로 교체하면 되도록, 다른 컴포넌트는 `store` 인터페이스에만 의존하게 유지해라.

---

## 4단계 — 빌드 설정

- `vite.config.ts`의 `base`를 배포 위치에 맞춘다:
  - 도메인 루트(`https://example.com/`)에 올리면 `base: '/'`
  - 하위 폴더(`https://example.com/leave/`)면 `base: '/leave/'`
- 이 앱은 라우터가 없는 단일 페이지라 SPA rewrite 설정이 필요 없다.
- `npm run build` → `dist/` 생성 확인. `npm run preview`로 빌드 결과 확인.

---

## 5단계 — GitHub에 올리기 (반드시 성공시킬 것)

1. `.gitignore` 확인/추가: `node_modules`, `dist`, `.env`, `.DS_Store`.
2. `git init && git add -A && git commit -m "init: 뉴센스 연차 관리 MVP"`
3. 기본 브랜치를 `main`으로: `git branch -M main`
4. **GitHub CLI가 설치·로그인되어 있으면** 한 번에:
   ```bash
   gh auth status            # 로그인 확인
   gh repo create newsense-leave --private --source=. --remote=origin --push
   ```
5. **gh가 없으면**: 나(사용자)에게 GitHub 사용자명과 새 repo 이름을 물어본 뒤, GitHub에서 빈 repo를 만들었다고 가정하고:
   ```bash
   git remote add origin https://github.com/<USER>/<REPO>.git
   git push -u origin main
   ```
   - 인증 실패 시 토큰(PAT) 또는 SSH 설정이 필요하다고 알려주고 멈춰라.
6. push 후 GitHub repo에 코드가 올라간 것을 확인하고 보고해라.

---

## 6단계 — 카페24 배포 (둘 중 택1, 둘 다 안내)

카페24 **웹호스팅(정적 파일 서빙)** 으로 충분하다. 백엔드/DB 불필요(현재 localStorage).

### 방법 A — 수동 FTP (가장 단순)
1. `npm run build`
2. `dist/` **안의 내용물**(폴더가 아니라 파일들)을 FileZilla로 카페24 웹 루트에 업로드.
   - 웹 루트는 보통 `/www/` (또는 도메인별 폴더). 카페24 호스팅 관리에서 경로 확인.
3. 도메인으로 접속해 앱이 열리는지 확인.
> 이후 코드 수정 때마다 build → 업로드 반복.

### 방법 B — GitHub Actions 자동 FTP 배포 (push하면 자동 반영)
`.github/workflows/deploy.yml` 생성:

```yaml
name: Deploy to Cafe24
on:
  push:
    branches: [main]
jobs:
  build-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run build
      - name: FTP Deploy
        uses: SamKirkland/FTP-Deploy-Action@v4.3.5
        with:
          server:   ${{ secrets.FTP_HOST }}     # 카페24 FTP 호스트(예: domain 또는 IP)
          username: ${{ secrets.FTP_USER }}
          password: ${{ secrets.FTP_PASS }}
          local-dir: ./dist/
          server-dir: ./www/                    # ← 카페24 웹 루트에 맞게 수정
```

- GitHub repo → Settings → Secrets and variables → Actions 에 `FTP_HOST`, `FTP_USER`, `FTP_PASS` 등록.
- **FTP 정보·비밀번호는 절대 코드/커밋에 넣지 마라. 반드시 Secrets로.**
- `server-dir`은 카페24 웹 루트 경로에 맞춰라(루트면 `./` 또는 `/www/`).

---

## 지켜야 할 것
- 기능을 임의로 추가/변경하지 말고 기존 `.jsx`의 동작을 1:1로 보존한다.
- 비밀정보는 repo에 절대 커밋하지 않는다(.env, FTP 비번 등 → Secrets).
- `index.html`의 `lang="ko"`, `<title>`을 "뉴센스의원 연차 관리"로 설정.
- localStorage는 **기기마다 데이터가 분리**된다. 여러 직원이 각자 기기에서 쓰면 데이터가 공유되지 않는다는 점을 사용자에게 한 번 알려라(공유가 필요하면 다음 단계로 Supabase 전환).

## 완료 기준(체크리스트)
- [ ] `npm run dev` 정상 동작
- [ ] `npm run build` 성공, `dist/` 생성
- [ ] 직원 신청 → 관리자 승인 → **새로고침 후에도 데이터 유지**(localStorage 확인)
- [ ] GitHub repo에 push 완료(URL 보고)
- [ ] 카페24 도메인에서 앱 정상 표시
