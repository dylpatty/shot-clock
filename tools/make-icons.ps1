# Cuts Full Court's icons out of the logo (icons/logo-source.jpg: a rounded blue tile on a checkerboard that's part of
# the picture, not real transparency). Each cut is painted through its rounded shape, so none of the checkerboard
# comes along. Writes, into icons/:
#   apple-touch-icon.png, icon-192.png, icon-512.png  the FC ball and its swoosh and glow alone, centred on the tile's
#                                                     blues, square (the iPhone and Android round the corners); the
#                                                     owner wanted no "NBA TRACKER" on the Home Screen
#   favicon-32.png, mark.png                          the ball and FC alone as a small rounded tile, for browser tabs
#                                                     and the site's header (the words can't be read that small)
# Run from anywhere: powershell -ExecutionPolicy Bypass -File tools/make-icons.ps1
param([string]$Root = (Split-Path $PSScriptRoot -Parent))
Add-Type -AssemblyName System.Drawing
$ErrorActionPreference = 'Stop'
$icons = Join-Path $Root 'icons'
$src = [System.Drawing.Bitmap]::FromFile((Join-Path $icons 'logo-source.jpg'))
# Where the tile sits in that picture (measured): 399 x 416 from (505, 191), corners of radius 89
$tx = 505; $ty = 191; $tw = 399; $th = 416; $tr = 89

function New-Canvas([int]$w, [int]$h) {
  $b = New-Object System.Drawing.Bitmap $w, $h, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($b)
  $g.SmoothingMode = 'AntiAlias'; $g.InterpolationMode = 'HighQualityBicubic'; $g.PixelOffsetMode = 'HighQuality'; $g.CompositingQuality = 'HighQuality'
  return $b, $g
}
function Get-RoundRect([float]$x, [float]$y, [float]$w, [float]$h, [float]$r) {
  $p = New-Object System.Drawing.Drawing2D.GraphicsPath
  $p.AddArc($x, $y, 2 * $r, 2 * $r, 180, 90); $p.AddArc($x + $w - 2 * $r, $y, 2 * $r, 2 * $r, 270, 90)
  $p.AddArc($x + $w - 2 * $r, $y + $h - 2 * $r, 2 * $r, 2 * $r, 0, 90); $p.AddArc($x, $y + $h - 2 * $r, 2 * $r, 2 * $r, 90, 90)
  $p.CloseFigure(); return $p
}
# Paints the picture through a path, with the picture's point (ox, oy) at the canvas's top left
function Paint-Through($g, $path, [float]$ox, [float]$oy) {
  $brush = New-Object System.Drawing.TextureBrush $src
  $brush.TranslateTransform(-$ox, -$oy)
  $g.FillPath($brush, $path)
}
function Save-Size($img, [int]$size, [string]$name) {
  $b, $g = New-Canvas $size $size
  $g.DrawImage($img, 0, 0, $size, $size)
  $g.Dispose()
  $b.Save((Join-Path $icons $name), [System.Drawing.Imaging.ImageFormat]::Png)
  $b.Dispose()
  "$name $size x $size"
}

# Blends a picture onto another through a soft round edge: fully the picture within r1 of (cx, cy), fading to the
# background by r2. Done in compiled code, since it touches every pixel
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'
using System; using System.Drawing; using System.Drawing.Imaging; using System.Runtime.InteropServices;
public static class SoftEdge {
  public static void Blend(Bitmap back, Bitmap front, float cx, float cy, float r1, float r2) {
    var rect = new Rectangle(0, 0, back.Width, back.Height);
    var bd = back.LockBits(rect, ImageLockMode.ReadWrite, PixelFormat.Format32bppArgb);
    var fd = front.LockBits(rect, ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
    int n = bd.Stride * back.Height; var b = new byte[n]; var f = new byte[n];
    Marshal.Copy(bd.Scan0, b, 0, n); Marshal.Copy(fd.Scan0, f, 0, n);
    for (int y = 0; y < back.Height; y++) for (int x = 0; x < back.Width; x++) {
      int i = y * bd.Stride + x * 4;
      double d = Math.Sqrt((x - cx) * (x - cx) + (y - cy) * (y - cy));
      double t = d <= r1 ? 1 : d >= r2 ? 0 : 1 - (d - r1) / (r2 - r1);
      double a = t * t * (3 - 2 * t) * f[i + 3] / 255.0;
      for (int c = 0; c < 3; c++) b[i + c] = (byte)Math.Round(b[i + c] * (1 - a) + f[i + c] * a);
    }
    Marshal.Copy(b, 0, bd.Scan0, n);
    back.UnlockBits(bd); front.UnlockBits(fd);
  }
}
'@

# Home Screen: the ball, FC, swoosh and glow (a 270 square of the tile around them, ending just above "NBA"), centred
# on a square of the tile's own blues (lighter at the top, like the tile) and blended in through a soft round edge
$S = 1024; $bx = 568; $by = 208; $bs = 270
$scale = $S * 0.8 / $bs  # leaves room around the swoosh, and inside the phone's rounded corners
$app, $g = New-Canvas $S $S
$fill = New-Object System.Drawing.Drawing2D.LinearGradientBrush ((New-Object System.Drawing.Point 0, 0), (New-Object System.Drawing.Point 0, $S), ([System.Drawing.Color]::FromArgb(34, 102, 162)), ([System.Drawing.Color]::FromArgb(7, 34, 84)))
$g.FillRectangle($fill, 0, 0, $S, $S)
$g.Dispose()
$ball, $g = New-Canvas $S $S
$off = ($S - $bs * $scale) / 2; $size = $bs * $scale
$to = New-Object System.Drawing.RectangleF $off, $off, $size, $size
$from = New-Object System.Drawing.RectangleF $bx, $by, $bs, $bs
$g.DrawImage($src, $to, $from, [System.Drawing.GraphicsUnit]::Pixel)
$g.Dispose()
[SoftEdge]::Blend($app, $ball, $S / 2, $S / 2, 112 * $scale, 135 * $scale)
$ball.Dispose()
Save-Size $app 180 'apple-touch-icon.png'
Save-Size $app 192 'icon-192.png'
Save-Size $app 512 'icon-512.png'

# The ball and FC: a 270 square around them (ending just above "NBA"), rounded like an app icon, clear outside
$es = 270; $ex = 568; $ey = 208
$mark, $g = New-Canvas $es $es
Paint-Through $g (Get-RoundRect 0 0 $es $es ($es * 0.22)) $ex $ey
$g.Dispose()
Save-Size $mark 32 'favicon-32.png'
Save-Size $mark 128 'mark.png'
$app.Dispose(); $mark.Dispose(); $src.Dispose()
