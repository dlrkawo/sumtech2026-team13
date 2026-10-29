#!/usr/bin/env python3
"""docs/problem.yaml, docs/scenarios.yaml이 루프톤 키트 형식을 지키는지 검사한다.

대시보드와 주최 측 실행은 이 두 파일을 키트의 키 이름 그대로 읽는다.
키 이름이 다르거나 키트에 없는 구조로 바뀌면 대시보드 캔버스·흐름이 비어 보이므로 CI에서 미리 막는다.
기준: 키트 problem.example.yaml, scenarios.example.yaml, steps/02-problem.md

실행: python3 scripts/check_docs.py   (오류가 있으면 종료 코드 1)
"""
import re
import sys
from pathlib import Path

import yaml

errors: list[str] = []
warnings: list[str] = []


def err(msg: str) -> None:
    errors.append(msg)


def warn(msg: str) -> None:
    warnings.append(msg)


def load(path: str):
    p = Path(path)
    if not p.exists():
        err(f"{path}: 파일이 없습니다")
        return None
    try:
        return yaml.safe_load(p.read_text(encoding="utf-8"))
    except yaml.YAMLError as e:
        err(f"{path}: YAML 문법 오류 — {e}")
        return None


def check_items(path: str, name: str, value, allowed: set[str], required: set[str]) -> None:
    """목록 항목마다 허용된 키만 쓰는지 확인한다."""
    if value is None:
        return
    if not isinstance(value, list):
        err(f"{path}: {name}은(는) 목록([])이어야 합니다")
        return
    for i, item in enumerate(value):
        where = f"{path}: {name}[{i}]"
        if not isinstance(item, dict):
            err(f"{where}: 항목은 키-값 형태여야 합니다")
            continue
        for k in item:
            if k not in allowed:
                err(f"{where}: 키트에 없는 키 '{k}' (쓸 수 있는 키: {', '.join(sorted(allowed))})")
        for k in required:
            if k not in item:
                err(f"{where}: '{k}' 키가 없습니다")


def check_problem(path: str = "docs/problem.yaml") -> None:
    d = load(path)
    if d is None:
        return
    if not isinstance(d, dict):
        err(f"{path}: 최상위는 키-값 형태여야 합니다")
        return

    top = {"statement", "canvas", "personas", "experiences", "sources", "five_whys", "solution_paths", "insight", "features"}
    for k in d:
        if k not in top:
            err(f"{path}: 키트에 없는 최상위 키 '{k}' — 대시보드가 읽지 않습니다. 해당 내용은 키트 키로 옮기거나 주석(#)으로 두세요")
    for k in ("statement", "canvas", "five_whys", "solution_paths", "insight", "features"):
        if k not in d:
            err(f"{path}: 최상위 키 '{k}'가 없습니다 (모르면 null 또는 []로 남깁니다)")

    canvas = d.get("canvas")
    if isinstance(canvas, dict):
        for k in canvas:
            if k not in {"context", "customer", "root_problem", "impact", "alternatives"}:
                err(f"{path}: canvas에 키트에 없는 키 '{k}'")
        for k in ("context", "customer", "root_problem", "impact", "alternatives"):
            if k not in canvas:
                err(f"{path}: canvas.{k}가 없습니다")
        impact = canvas.get("impact")
        if impact is not None and not (isinstance(impact, dict) and set(impact) <= {"feeling", "measurable"}):
            err(f"{path}: canvas.impact는 feeling, measurable 두 키만 씁니다")
        check_items(path, "canvas.alternatives", canvas.get("alternatives"),
                    {"how_used", "shortcoming", "why_ours"}, {"how_used", "shortcoming"})
    elif "canvas" in d:
        err(f"{path}: canvas는 키-값 형태여야 합니다")

    check_items(path, "personas", d.get("personas"), {"id", "description", "source"}, {"id"})
    check_items(path, "experiences", d.get("experiences"),
                {"id", "when", "what_happened", "workaround", "feeling", "quote", "source"}, {"id"})
    check_items(path, "sources", d.get("sources"), {"id", "url", "title", "claim"}, {"id", "url"})
    for i, s in enumerate(d.get("sources") or []):
        if isinstance(s, dict) and s.get("url") and not str(s["url"]).startswith("https://"):
            err(f"{path}: sources[{i}].url은 https://로 시작해야 합니다")

    fw = d.get("five_whys")
    if fw is not None:
        if not (isinstance(fw, dict) and set(fw) <= {"symptom", "whys"}):
            err(f"{path}: five_whys는 symptom, whys 두 키만 씁니다")
        elif fw.get("whys") is not None and not isinstance(fw["whys"], list):
            err(f"{path}: five_whys.whys는 문자열 목록이어야 합니다")

    check_items(path, "solution_paths", d.get("solution_paths"), {"path", "status", "reason"}, {"path", "status"})
    for i, sp in enumerate(d.get("solution_paths") or []):
        if isinstance(sp, dict) and sp.get("status") not in ("chosen", "rejected", "deferred"):
            err(f"{path}: solution_paths[{i}].status는 chosen, rejected, deferred 중 하나여야 합니다")

    ins = d.get("insight")
    if ins is not None and not (isinstance(ins, dict) and set(ins) <= {"claim", "evidence", "design_decision"}):
        err(f"{path}: insight는 claim, evidence, design_decision 세 키만 씁니다")

    check_items(path, "features", d.get("features"), {"id", "name", "input", "output", "done"}, {"id", "name"})
    ids = [f.get("id") for f in (d.get("features") or []) if isinstance(f, dict)]
    if len(ids) != len(set(ids)):
        err(f"{path}: features의 id가 겹칩니다")


def check_scenarios(path: str = "docs/scenarios.yaml") -> None:
    d = load(path)
    if d is None:
        return
    if not isinstance(d, dict):
        err(f"{path}: 최상위는 키-값 형태여야 합니다")
        return
    for k in d:
        if k not in {"platform", "platformReason", "scenarios"}:
            hint = " (platformReason으로 써야 합니다)" if k == "platform_reason" else ""
            err(f"{path}: 키트에 없는 최상위 키 '{k}'{hint}")
    if d.get("platform") not in ("desktop", "mobile", "both"):
        err(f"{path}: platform은 desktop, mobile, both 중 하나여야 합니다")
    if not d.get("platformReason"):
        err(f"{path}: platformReason이 없습니다")

    sc = d.get("scenarios")
    if not isinstance(sc, list) or not sc:
        err(f"{path}: scenarios 목록이 없습니다")
        return
    if len(sc) > 8:
        err(f"{path}: 흐름은 최대 8개입니다 (지금 {len(sc)}개)")
    elif len(sc) < 3:
        warn(f"{path}: 흐름은 3~8개를 권장합니다 (지금 {len(sc)}개)")

    seen = set()
    for i, s in enumerate(sc):
        where = f"{path}: scenarios[{i}]"
        if not isinstance(s, dict):
            err(f"{where}: 항목은 키-값 형태여야 합니다")
            continue
        for k in s:
            if k not in {"id", "title", "account", "steps", "expected"}:
                err(f"{where}: 키트에 없는 키 '{k}'")
        sid = s.get("id")
        if not (isinstance(sid, str) and re.fullmatch(r"S[1-9]\d*", sid)):
            err(f"{where}: id는 S1, S2 … 형식이어야 합니다")
        elif sid in seen:
            err(f"{where}: id '{sid}'가 겹칩니다")
        else:
            seen.add(sid)
            if not Path(f"e2e/scenarios/{sid}.spec.ts").exists():
                warn(f"{path}: {sid}의 E2E spec(e2e/scenarios/{sid}.spec.ts)이 아직 없습니다")
        title = s.get("title")
        if not (isinstance(title, str) and 1 <= len(title) <= 120):
            err(f"{where}: title은 1~120자 문자열이어야 합니다")
        steps = s.get("steps")
        if not (isinstance(steps, list) and 1 <= len(steps) <= 12 and all(isinstance(x, str) and x for x in steps)):
            err(f"{where}: steps는 1~12개의 문자열 목록이어야 합니다")
        else:
            for x in steps:
                if "로그인" in x and "로그인 화면" not in x and "account" not in s:
                    warn(f"{where}: 로그인은 단계로 쓰지 않고 account: <역할 이름>으로 적습니다 — '{x}'")
        exp = s.get("expected")
        if not (isinstance(exp, str) and 1 <= len(exp) <= 500):
            err(f"{where}: expected는 1~500자 문자열이어야 합니다")
        if "account" in s and not (isinstance(s["account"], str) and s["account"].strip()):
            err(f"{where}: account는 역할 이름 문자열이어야 합니다")


def main() -> int:
    check_problem()
    check_scenarios()
    for w in warnings:
        print(f"::warning::{w}")
    for e in errors:
        print(f"::error::{e}")
    if errors:
        print(f"\n키트 형식 오류 {len(errors)}개. 키트 problem.example.yaml, scenarios.example.yaml 형식을 확인하세요.")
        return 1
    print(f"docs/problem.yaml, docs/scenarios.yaml 키트 형식 확인 완료 (경고 {len(warnings)}개)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
