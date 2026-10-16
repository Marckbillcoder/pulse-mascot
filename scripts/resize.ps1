Add-Type -AssemblyName System.Drawing

function Resize-ImageFile {
    param(
        [string]$Src,
        [string]$Dst,
        [int]$W,
        [int]$H
    )
    $srcImg = [System.Drawing.Image]::FromFile((Resolve-Path $Src).Path)
    $destBmp = New-Object System.Drawing.Bitmap $W, $H
    $gfx = [System.Drawing.Graphics]::FromImage($destBmp)
    $gfx.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $gfx.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $gfx.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $gfx.DrawImage($srcImg, 0, 0, $W, $H)
    $gfx.Dispose()
    $srcImg.Dispose()

    $tempPath = $Dst + ".tmp.jpg"
    $codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
    $encoderParams = New-Object System.Drawing.Imaging.EncoderParameters 1
    $encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality), ([long]92)
    $destBmp.Save($tempPath, $codec, $encoderParams)
    $destBmp.Dispose()
    Move-Item -Path $tempPath -Destination $Dst -Force
}

Resize-ImageFile -Src "public/screenshot-1.jpg" -Dst "public/screenshot-1.jpg" -W 1600 -H 900
Resize-ImageFile -Src "public/screenshot-2.jpg" -Dst "public/screenshot-2.jpg" -W 1600 -H 900
Write-Host "Successfully resized screenshots to exactly 1600x900!"
