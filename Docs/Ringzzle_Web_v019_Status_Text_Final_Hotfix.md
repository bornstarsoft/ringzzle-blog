# Ringzzle Web v019 Status Text Final Hotfix

Status: implemented as a tiny layout-only hotfix.

## Owner Feedback

v018 moved the lower gameplay status text upward into the score-to-board area. That was not correct: the status could compete with, or visually overlap, the score panel area.

## v019 Fix

v019 moves the gameplay status text back below the tray area.

The status text now:

- sits below the tray band
- clears the largest possible tray ring
- remains visible on reduced-height iPhone Safari-like viewports
- avoids the board, score panels, tray rings, and practical bottom viewport edge

## Preserved Behavior

No gameplay, scoring, sound, color progression, line clear, Color Burst, tray generation, drag cleanup, or backend behavior changed in this hotfix.

The change is limited to v019 asset versioning and status text layout math.
