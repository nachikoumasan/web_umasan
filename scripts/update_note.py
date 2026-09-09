"""noteのマガジンから記事を取得し data/articles-auto.json を書き出す。

- ジャンルはマガジンそのもの。タイトルからの推測は行わない。
- 書き込むのは data/articles-auto.json だけ。index.html は触らない。
- 旧リポジトリ tabisuru_umasan には一切アクセスしない。
"""
import json
import re
import sys
from datetime import datetime, timezone, timedelta
from pathlib import Path

import requests

OUT = Path(__file__).resolve().parent.parent / "data" / "articles-auto.json"
PER_MAGAZINE = 10
UA = {"User-Agent": "Mozilla/5.0 (compatible; tabisuru-umasan-site/1.0)"}

# 体験レポートのマガジンと、サイトに出すジャンル名。
# ジャンルはマガジンで決まる。タイトルからの推測は行わない。
EXPERIENCE_MAGAZINES = {
    "mc5792ff2f39c": "没入型アート・イベント",
    "m0e94126b8fea": "ARG",
    "mcfec0a76f4a4": "謎解き",
}
# 自作作品のマガジン。体験レポートとは分けて出力する。
WORK_MAGAZINES = {"mc70338cbfbf2": "作品"}

def get_json(url):
    r = requests.get(url, headers=UA, timeout=20)
    r.raise_for_status()
    return r.json()


def pick(obj, *keys):
    for key in keys:
        value = obj.get(key)
        if value:
            return value
    return None


ENDPOINTS = [
    "https://note.com/api/v1/layout/magazine/{key}/section?page={page}",
    "https://note.com/api/v2/magazines/{key}/notes?page={page}",
    "https://note.com/api/v1/magazines/{key}?page={page}",
    "https://note.com/api/v1/magazines/{key}/notes?page={page}",
    "https://note.com/api/v3/magazines/{key}/contents?kind=note&page={page}",
]



def looks_like_note(obj):
    if not isinstance(obj, dict):
        return False
    if obj.get("noteUrl") or obj.get("note_url"):
        return True
    return bool(obj.get("key") and (obj.get("name") or obj.get("title")))


def find_notes(obj, depth=0):
    """レスポンスのどこにあっても記事リストを探し出す。"""
    if depth > 8:
        return None
    if isinstance(obj, list):
        if obj and sum(1 for x in obj[:5] if looks_like_note(x)) >= min(2, len(obj)):
            return obj
        for item in obj:
            found = find_notes(item, depth + 1)
            if found:
                return found
        return None
    if isinstance(obj, dict):
        for key in ("notes", "contents", "items", "data", "section", "sections", "magazine"):
            if key in obj:
                found = find_notes(obj[key], depth + 1)
                if found:
                    return found
        for value in obj.values():
            found = find_notes(value, depth + 1)
            if found:
                return found
    return None


def find_name(obj, depth=0):
    if depth > 4 or not isinstance(obj, dict):
        return None
    for key in ("name", "title"):
        value = obj.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()
    for key in ("data", "magazine"):
        if isinstance(obj.get(key), dict):
            found = find_name(obj[key], depth + 1)
            if found:
                return found
    return None


def outline(obj, depth=0, prefix=""):
    """構造だけを短く書き出す（診断用）。"""
    pad = "  " * depth
    if depth > 3:
        return [f"{pad}{prefix}..."]
    if isinstance(obj, dict):
        rows = [f"{pad}{prefix}dict({len(obj)}) keys: {', '.join(list(obj)[:12])}"]
        for key in list(obj)[:6]:
            rows += outline(obj[key], depth + 1, f"{key}: ")
        return rows
    if isinstance(obj, list):
        rows = [f"{pad}{prefix}list({len(obj)})"]
        if obj:
            rows += outline(obj[0], depth + 1, "[0]: ")
        return rows
    text = str(obj)
    return [f"{pad}{prefix}{type(obj).__name__} {text[:60]}"]


def fetch_magazine(key):
    """(マガジン名, 記事リスト) を返す。"""
    problems = []
    for template in ENDPOINTS:
        url = template.format(key=key, page=1)
        try:
            data = get_json(url)
        except Exception as exc:
            problems.append(f"  {url}\n    通信/JSONで失敗: {exc}")
            continue
        notes = find_notes(data)
        if notes:
            print(f"  使用エンドポイント: {url}")
            return find_name(data) or key, notes
        problems.append(f"  {url}\n    記事リストが見つかりません。返ってきた構造:\n"
                        + "\n".join("      " + line for line in outline(data)))
    raise RuntimeError(f"マガジン {key} を取得できません。\n" + "\n".join(problems))


def clean_title(raw):
    """noteのタイトルから【…】だけを外す。｜や本文はそのまま。"""
    title = (raw or "").strip()
    title = re.sub(r"^(?:【[^】]*】\s*)+", "", title)
    title = re.sub(r"(?:\s*【[^】]*】)+$", "", title)
    return title.strip()


def make_summary(text):
    """本文の冒頭から、カード用の1行を作る。"""
    if not text:
        return None
    body = re.sub(r"<[^>]+>", "", text)
    body = body.replace("\r", "")
    for line in body.split("\n"):
        line = line.strip().strip("#＃*・ 　")
        if len(line) < 6:
            continue
        # 1文目で切る（句点まで）
        match = re.match(r"^(.{6,60}?[。！？])", line)
        summary = match.group(1) if match else line
        if len(summary) > 70:
            summary = summary[:69].rstrip("、 ") + "…"
        return summary
    return None


def to_date(value):
    if not value:
        return None
    try:
        dt = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
        return dt.astimezone(timezone(timedelta(hours=9))).strftime("%Y-%m-%d")
    except Exception:
        return str(value)[:10]


def normalize(note, genre):
    url = pick(note, "noteUrl", "note_url", "url")
    if not url:
        key = pick(note, "key", "id")
        url = f"https://note.com/nachiko0215/n/{key}" if key else None
    raw = pick(note, "name", "title") or ""
    image = pick(note, "eyecatch", "eyecatchUrl", "eyecatch_url", "thumbnail", "thumbnailExternalUrl")
    excerpt = pick(note, "description", "body", "bodyPreview", "summary", "excerpt")
    summary = make_summary(excerpt if isinstance(excerpt, str) else None)
    if isinstance(image, str) and "assets.st-note.com" in image and "?" not in image:
        image = image + "?width=800"
    return {
        "genre": genre,
        "title": clean_title(raw),
        "rawTitle": raw,
        "url": url,
        "image": image if isinstance(image, str) else None,
        "publishedAt": to_date(pick(note, "publishAt", "publish_at", "publishedAt", "createdAt")),
        "summary": summary,
    }


def collect(magazines, label):
    items = []
    for key, genre in magazines.items():
        name, notes = fetch_magazine(key)
        print(f"[{label}] {key} 「{name}」 → ジャンル「{genre}」 {len(notes)}件取得")
        if notes:
            print("  レスポンスのキー:", ", ".join(sorted(notes[0].keys())))
        for note in notes[:PER_MAGAZINE]:
            row = normalize(note, genre)
            if row["url"] and row["title"]:
                items.append(row)
    return items


def main():
    experiences = collect(EXPERIENCE_MAGAZINES, "体験")
    works = collect(WORK_MAGAZINES, "作品")

    seen = set()
    unique = []
    for row in sorted(experiences, key=lambda x: x["publishedAt"] or "", reverse=True):
        if row["url"] in seen:
            continue
        seen.add(row["url"])
        unique.append(row)

    payload = {
        "updatedAt": datetime.now(timezone(timedelta(hours=9))).strftime("%Y-%m-%d"),
        "genres": sorted({row["genre"] for row in unique}),
        "experiences": unique,
        "works": works,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"書き出し: {OUT.name} 体験{len(unique)}件 / 作品{len(works)}件")
    print("ジャンル:", " / ".join(payload["genres"]))
    missing = [row["url"] for row in unique if not row["summary"]]
    if missing:
        print(f"注意: 紹介文を作れなかった記事が{len(missing)}件あります。data/article-notes.js で補ってください。")
        for url in missing:
            print("  ", url)


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print("失敗:", exc, file=sys.stderr)
        sys.exit(1)
