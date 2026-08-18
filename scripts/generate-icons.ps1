Add-Type -AssemblyName System.Drawing

$sourcePath = "C:\Users\User\.gemini\antigravity-ide\brain\f039790e-0e66-4698-acc6-cc92b2cd262d\rajinqu_icon_fullbleed_1787006424048.jpg"
$destDir = "d:\WEB\PONDOK\RajinQU\public"

$img = [System.Drawing.Image]::FromFile($sourcePath)

function Resize-Image($image, $targetWidth, $targetHeight, $outputPath) {
    $bmp = New-Object System.Drawing.Bitmap($targetWidth, $targetHeight)
    $graph = [System.Drawing.Graphics]::FromImage($bmp)
    $graph.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graph.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graph.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graph.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    
    $graph.DrawImage($image, 0, 0, $targetWidth, $targetHeight)
    $bmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    
    $graph.Dispose()
    $bmp.Dispose()
    Write-Host "Generated: $outputPath"
}

Resize-Image $img 512 512 "$destDir\icon-512.png"
Resize-Image $img 192 192 "$destDir\icon-192.png"
Resize-Image $img 180 180 "$destDir\apple-touch-icon.png"
Resize-Image $img 96 96 "$destDir\icon-96.png"
Resize-Image $img 48 48 "$destDir\icon-48.png"
Resize-Image $img 512 512 "$destDir\icon-maskable.png"
Resize-Image $img 512 512 "$destDir\logo-pwa.png"

$img.Dispose()
Write-Host "All icons generated successfully!"
