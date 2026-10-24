#!/usr/bin/env bash
# Convert videos (.mov / .mp4, iPhone HEVC, CapCut exports) into small web MP4s
# that play in every browser. Output is saved next to each input as <name>-web.mp4.
#
# Needs ffmpeg:  macOS: brew install ffmpeg   ·   Ubuntu: sudo apt install ffmpeg
# Usage:         ./convert-video.sh clip1.mov clip2.mov ...
#                (or drag the files into the Terminal window after typing the script name)
#
# Quality: CRF 26 (lower = sharper and bigger). If a result is still too big, run with
#          CRF=30 ./convert-video.sh clip.mov

set -euo pipefail

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "ffmpeg not found. Install it first (macOS: brew install ffmpeg)." >&2
  exit 1
fi
if [ "$#" -eq 0 ]; then
  echo "Usage: $0 video1.mov [video2.mov ...]" >&2
  exit 1
fi

CRF="${CRF:-26}"

for in in "$@"; do
  if [ ! -f "$in" ]; then
    echo "Skip: $in (not a file)" >&2
    continue
  fi
  out="${in%.*}-web.mp4"
  echo "Converting: $in"
  ffmpeg -hide_banner -loglevel error -stats -y -i "$in" \
    -vf "scale='min(720,iw)':-2,fps=30" \
    -c:v libx264 -preset slow -crf "$CRF" -profile:v high -pix_fmt yuv420p \
    -c:a aac -b:a 96k -ac 2 \
    -movflags +faststart \
    "$out"
  size=$(du -k "$out" | cut -f1)
  echo "Done: $out ($((size / 1024)) MB)"
  if [ "$size" -gt 28000 ]; then
    echo "  Still over 28 MB. Try again with: CRF=30 $0 \"$in\""
  fi
done
