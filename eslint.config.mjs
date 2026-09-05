import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

/*
  린트가 한동안 **아예 돌지 않고 있었다** (ADR-0049).

  `eslint-config-next` 는 플러그인 예닐곱 개를 자기 의존성으로 끌어오는데,
  eslint 는 그것들을 **설정 파일이 있는 자리**에서 찾는다.
  pnpm 은 남의 의존성을 보지 못하게 막으므로(그래서 유령 의존성이 안 생긴다)
  둘이 부딪혀 `Cannot find module 'eslint-plugin-react-hooks'` 로 통째로 죽었다.

  `next build` 는 이 실패를 경고로만 찍고 넘어간다. 그래서 빌드는 늘 통과했고,
  린트가 꺼져 있다는 사실을 몇 주 동안 아무도 몰랐다.

  플러그인을 우리 devDependencies 에 직접 적어 고쳤다.
  `.npmrc` 의 hoist 설정으로도 되지만, 그건 "왜 여기 있는지" 가 보이지 않는 해결이고
  pnpm 의 격리를 통째로 푸는 쪽이라 필요한 것만 명시하는 편을 골랐다.

  검사할 파일 목록은 여기서 정한다 — `next lint` 는 Next 16 에서 없어진다.
*/
const eslintConfig = [
  {
    ignores: [".next/**", "node_modules/**", "next-env.d.ts"],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];

export default eslintConfig;
