#!/usr/bin/env sh
# Re-encode the home hero video from its source (assets-src/media/hero-home.mp4).
# 1280px wide H.264, no audio, faststart so it streams before the whole file arrives.
# CRF 28 measured visually identical to the 1600px source at ~1.5 MB (source 2.0 MB).
# AV1/WebM was tried and only saved ~15% at visibly lower quality, so one H.264 file ships.
set -e
cd "$(dirname "$0")/.."
ffmpeg -y -v error -i assets-src/media/hero-home.mp4 -an \
  -vf "scale=1280:-2:flags=lanczos" -c:v libx264 -preset slower -tune film -crf 28 \
  -profile:v high -pix_fmt yuv420p -movflags +faststart public/media/hero-home.mp4
