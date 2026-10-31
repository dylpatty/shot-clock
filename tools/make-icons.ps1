# Cuts Full Court's icons out of the logo (icons/logo-source.jpg: a rounded blue tile on a checkerboard that's part of
# the picture, not real transparency). Each cut is painted through its rounded shape, so none of the checkerboard
# comes along. Writes, into icons/:
#   apple-touch-icon.png, icon-192.png, icon-512.png  the whole tile, square (the iPhone and Android round the corners)
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

# The whole tile, as a 399 square: 8 px off its top and bottom (it's a little taller than wide). The corners outside
# its rounding get the tile's own blues, which the phone's rounding then cuts off
$side = $tw; $oy = $ty + [math]::Floor(($th - $side) / 2)
$app, $g = New-Canvas $side $side
$fill = New-Object System.Drawing.Drawing2D.LinearGradientBrush ((New-Object System.Drawing.Point 0, 0), (New-Object System.Drawing.Point 0, $side), ([System.Drawing.Color]::FromArgb(24, 78, 140)), ([System.Drawing.Color]::FromArgb(3, 19, 64)))
$g.FillRectangle($fill, 0, 0, $side, $side)
Paint-Through $g (Get-RoundRect 2 ($ty - $oy + 2) ($tw - 4) ($th - 4) ($tr - 2)) $tx $oy
$g.Dispose()
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
