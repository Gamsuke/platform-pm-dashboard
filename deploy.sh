#!/bin/bash
# ============================================================
#  deploy.sh — อัปเดต GitHub Pages ครั้งเดียวจบ
#  วิธีใช้:  ./deploy.sh
#            ./deploy.sh "ข้อความ commit" (ไม่บังคับ)
# ============================================================

set -e  # หยุดทันทีถ้า error

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo ""
echo -e "${CYAN}🚀 Project Dashboard — Deploy Script${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── 1. เช็ค git init ──────────────────────────────────────
if [ ! -d ".git" ]; then
  echo -e "${YELLOW}⚙️  ยังไม่มี git — กำลัง init...${NC}"
  git init
  git branch -M main
  echo -e "${GREEN}✅ git init เรียบร้อย${NC}"
fi

# ── 2. เช็ค remote ────────────────────────────────────────
if ! git remote get-url origin &>/dev/null; then
  echo ""
  echo -e "${YELLOW}⚠️  ยังไม่ได้ตั้งค่า GitHub remote${NC}"
  echo -e "   ไปสร้าง repo ใหม่ที่ ${CYAN}https://github.com/new${NC}"
  echo -e "   แล้วรันคำสั่งนี้ครั้งเดียว:"
  echo ""
  echo -e "   ${CYAN}git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git${NC}"
  echo ""
  exit 1
fi

REMOTE=$(git remote get-url origin)
echo -e "📡 Remote: ${CYAN}${REMOTE}${NC}"

# ── 3. Copy ไฟล์หลัก → index.html ────────────────────────
echo ""
echo -e "${CYAN}📋 กำลัง copy Project_Dashboard_v2.html → index.html...${NC}"
cp "Project_Dashboard_v2.html" "index.html"
echo -e "${GREEN}✅ Copy เรียบร้อย${NC}"

# ── 4. Commit message ─────────────────────────────────────
TIMESTAMP=$(date '+%Y-%m-%d %H:%M')
if [ -n "$1" ]; then
  MSG="$1 (${TIMESTAMP})"
else
  MSG="deploy: update dashboard ${TIMESTAMP}"
fi

# ── 5. Git add + commit + push ────────────────────────────
echo ""
echo -e "${CYAN}📦 กำลัง commit...${NC}"
git add index.html .gitignore
git diff --cached --quiet && echo -e "${YELLOW}⚠️  ไม่มีการเปลี่ยนแปลง — ไม่มีอะไรต้อง push${NC}" && exit 0

git commit -m "$MSG"
echo -e "${GREEN}✅ Commit: \"${MSG}\"${NC}"

echo ""
echo -e "${CYAN}☁️  กำลัง push ขึ้น GitHub...${NC}"
git push -u origin main
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Deploy สำเร็จ!${NC}"
echo ""

# ── 6. แสดง GitHub Pages URL ─────────────────────────────
REPO_URL=$(git remote get-url origin | sed 's/https:\/\/github.com\///' | sed 's/\.git//')
PAGES_URL="https://$(echo $REPO_URL | cut -d'/' -f1).github.io/$(echo $REPO_URL | cut -d'/' -f2)/"
echo -e "🌐 GitHub Pages: ${CYAN}${PAGES_URL}${NC}"
echo -e "   (อาจใช้เวลา 1-2 นาที ถึงจะ update)"
echo ""
