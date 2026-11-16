Add-Type -AssemblyName System.Drawing

$TEMP = Join-Path (Get-Location).Path "temp_video_scenes"
if (Test-Path $TEMP) { Remove-Item -Recurse -Force $TEMP }
New-Item -ItemType Directory -Path $TEMP | Out-Null

$W = 1920
$H = 1080

function New-StoreScene {
    param(
        [string]$Filename,
        [string]$ActTitle,
        [string]$ActSubtitle,
        [int]$CartItems,
        [double]$CartTotal,
        [int]$MeterPct,
        [string]$BubbleText,
        [string]$MascotState, # "idle", "watching", "happy", "crying"
        [int]$CursorX,
        [int]$CursorY,
        [bool]$ShowConfetti,
        [string]$KpiValue,
        [string]$KpiLabel,
        [int]$HighlightProd # 1: Hoodie, 2: Cable, 0: None
    )

    $bmp = New-Object System.Drawing.Bitmap $W, $H
    $gfx = [System.Drawing.Graphics]::FromImage($bmp)
    $gfx.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $gfx.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $gfx.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit

    # 1. Dark Apple Keynote Studio Background
    $bgBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(5, 7, 13))
    $gfx.FillRectangle($bgBrush, 0, 0, $W, $H)

    # 2. Keynote Header / Act Title
    $titleFont = New-Object System.Drawing.Font ("Segoe UI", 26, [System.Drawing.FontStyle]::Bold)
    $subFont = New-Object System.Drawing.Font ("Segoe UI", 16, [System.Drawing.FontStyle]::Regular)
    $goldBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(245, 166, 35))
    $textMuted = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(148, 163, 184))
    $whiteBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)

    $gfx.DrawString($ActTitle, $titleFont, $whiteBrush, 140, 30)
    $gfx.DrawString($ActSubtitle, $subFont, $textMuted, 140, 75)

    # 3. macOS Safari Window Frame
    $fx = 140
    $fy = 120
    $fw = 1640
    $fh = 880

    # Window Drop Shadow
    $shadowBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(40, 0, 0, 0))
    $gfx.FillRectangle($shadowBrush, $fx - 15, $fy - 15, $fw + 30, $fh + 30)

    # Window Base
    $winBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(13, 17, 26))
    $gfx.FillRectangle($winBrush, $fx, $fy, $fw, $fh)
    $borderPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(45, 55, 72)), 2
    $gfx.DrawRectangle($borderPen, $fx, $fy, $fw, $fh)

    # Safari Top Bar
    $topBarBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(22, 28, 40))
    $gfx.FillRectangle($topBarBrush, $fx, $fy, $fw, 52)
    $sepPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(36, 46, 66)), 1
    $gfx.DrawLine($sepPen, $fx, $fy + 52, $fx + $fw, $fy + 52)

    # Window Controls (Red, Yellow, Green)
    $redDot = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 95, 86))
    $yellowDot = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 189, 46))
    $greenDot = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(39, 201, 63))
    $gfx.FillEllipse($redDot, $fx + 24, $fy + 18, 14, 14)
    $gfx.FillEllipse($yellowDot, $fx + 46, $fy + 18, 14, 14)
    $gfx.FillEllipse($greenDot, $fx + 68, $fy + 18, 14, 14)

    # Address Bar
    $urlBg = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(13, 17, 26))
    $gfx.FillRectangle($urlBg, $fx + 420, $fy + 10, 800, 32)
    $urlPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(45, 55, 72)), 1
    $gfx.DrawRectangle($urlPen, $fx + 420, $fy + 10, 800, 32)
    $urlFont = New-Object System.Drawing.Font ("Segoe UI", 11, [System.Drawing.FontStyle]::Regular)
    $gfx.DrawString("🔒 https://velvet-streetwear.com/collections/apparel", $urlFont, $textMuted, $fx + 630, $fy + 16)

    # 4. Storefront Content
    $sy = $fy + 53
    $storeBg = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(9, 13, 22))
    $gfx.FillRectangle($storeBg, $fx + 1, $sy, $fw - 2, $fh - 54)

    # Store Navbar
    $logoFont = New-Object System.Drawing.Font ("Segoe UI", 18, [System.Drawing.FontStyle]::Bold)
    $brandBlue = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(99, 102, 241))
    $gfx.DrawString("VELVET", $logoFont, $whiteBrush, $fx + 40, $sy + 24)
    $gfx.DrawString("STREETWEAR", $logoFont, $brandBlue, $fx + 145, $sy + 24)

    # Cart Pill Top Right
    $cartBg = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(30, 41, 59))
    $gfx.FillRectangle($cartBg, $fx + $fw - 280, $sy + 20, 240, 44)
    $cartPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(51, 65, 85)), 1
    $gfx.DrawRectangle($cartPen, $fx + $fw - 280, $sy + 20, 240, 44)
    $cartFont = New-Object System.Drawing.Font ("Segoe UI", 12, [System.Drawing.FontStyle]::Bold)
    $cyanBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(56, 189, 248))
    $cartStr = "🛒 Cart: $CartItems items • " + ('$' + $CartTotal.ToString('F2'))
    $gfx.DrawString($cartStr, $cartFont, $cyanBrush, $fx + $fw - 265, $sy + 31)

    # 5. Product Grid (3 cards)
    $cards = @(
        @{ Title = "Komorebi Oversized Hoodie"; Price = "$48.00"; Tag = "Best Seller"; Icon = "🧥"; Id = 1 },
        @{ Title = "Akira Mechanical Cable";   Price = "$36.00"; Tag = "Popular";     Icon = "⌨️"; Id = 2 },
        @{ Title = "Matcha Desk Mat & Coaster"; Price = "$42.00"; Tag = "In Stock";    Icon = "🍵"; Id = 3 }
    )

    $cardW = 460
    $cardH = 480
    $cardY = $sy + 100
    for ($i = 0; $i -lt 3; $i++) {
        $c = $cards[$i]
        $cx = $fx + 40 + $i * 540

        $cardBgColor = [System.Drawing.Color]::FromArgb(19, 25, 38)
        $cardBorderColor = [System.Drawing.Color]::FromArgb(36, 48, 70)
        if ($HighlightProd -eq $c.Id) {
            $cardBorderColor = [System.Drawing.Color]::FromArgb(99, 102, 241)
        }

        $cardBrush = New-Object System.Drawing.SolidBrush ($cardBgColor)
        $gfx.FillRectangle($cardBrush, $cx, $cardY, $cardW, $cardH)
        $cPen = New-Object System.Drawing.Pen ($cardBorderColor), 2
        $gfx.DrawRectangle($cPen, $cx, $cardY, $cardW, $cardH)

        # Image placeholder
        $imgBg = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(30, 38, 56))
        $gfx.FillRectangle($imgBg, $cx + 20, $cardY + 20, $cardW - 40, 240)
        $iconFont = New-Object System.Drawing.Font ("Segoe UI Emoji", 48, [System.Drawing.FontStyle]::Regular)
        $gfx.DrawString($c.Icon, $iconFont, $whiteBrush, $cx + 190, $cardY + 90)

        # Product Title & Price
        $pTitleFont = New-Object System.Drawing.Font ("Segoe UI", 16, [System.Drawing.FontStyle]::Bold)
        $pPriceFont = New-Object System.Drawing.Font ("Segoe UI", 18, [System.Drawing.FontStyle]::Bold)
        $gfx.DrawString($c.Title, $pTitleFont, $whiteBrush, $cx + 20, $cardY + 280)
        $gfx.DrawString($c.Price, $pPriceFont, $cyanBrush, $cx + 20, $cardY + 325)

        # Add to Cart Button
        $btnBgColor = if ($HighlightProd -eq $c.Id) { [System.Drawing.Color]::FromArgb(16, 185, 129) } else { [System.Drawing.Color]::FromArgb(99, 102, 241) }
        $btnBrush = New-Object System.Drawing.SolidBrush ($btnBgColor)
        $gfx.FillRectangle($btnBrush, $cx + 20, $cardY + 390, $cardW - 40, 56)
        $btnFont = New-Object System.Drawing.Font ("Segoe UI", 14, [System.Drawing.FontStyle]::Bold)
        $btnText = if ($HighlightProd -eq $c.Id) { "✓ Added to Cart!" } else { "Add to Cart" }
        $gfx.DrawString($btnText, $btnFont, $whiteBrush, $cx + 150, $cardY + 404)
    }

    # 6. Living Mascot Companion in Bottom Right
    $mascotCenterX = $fx + $fw - 140
    $mascotCenterY = $sy + $fh - 160
    $mascotRadius = 55

    # Speech Bubble Above Mascot
    if ($BubbleText) {
        $bubW = 380
        $bubH = 140
        $bubX = $mascotCenterX - $bubW + 30
        $bubY = $mascotCenterY - $bubH - 50

        $bubBg = if ($MascotState -eq "crying") { [System.Drawing.Color]::FromArgb(240, 30, 20, 15) } else { [System.Drawing.Color]::FromArgb(240, 15, 23, 42) }
        $bubBorder = if ($MascotState -eq "crying") { [System.Drawing.Color]::FromArgb(245, 158, 11) } else { [System.Drawing.Color]::FromArgb(99, 102, 241) }
        
        $bubBrush = New-Object System.Drawing.SolidBrush ($bubBg)
        $gfx.FillRectangle($bubBrush, $bubX, $bubY, $bubW, $bubH)
        $bubPen = New-Object System.Drawing.Pen ($bubBorder), 2
        $gfx.DrawRectangle($bubPen, $bubX, $bubY, $bubW, $bubH)

        $bubFont = New-Object System.Drawing.Font ("Segoe UI", 12, [System.Drawing.FontStyle]::Bold)
        $bubTextBrush = if ($MascotState -eq "crying") { $goldBrush } else { $whiteBrush }
        $rectF = New-Object System.Drawing.RectangleF ($bubX + 15), ($bubY + 12), ($bubW - 30), 65
        $gfx.DrawString($BubbleText, $bubFont, $bubTextBrush, $rectF)

        # Shipping Progress Track & Fill
        $trackY = $bubY + 85
        $trackBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(30, 41, 59))
        $gfx.FillRectangle($trackBrush, $bubX + 15, $trackY, $bubW - 30, 10)
        
        $fillW = [Math]::Floor(($bubW - 30) * ($MeterPct / 100.0))
        if ($fillW -gt 0) {
            $fillBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(16, 185, 129))
            $gfx.FillRectangle($fillBrush, $bubX + 15, $trackY, $fillW, 10)
        }

        # Milestone labels below meter
        $mFont = New-Object System.Drawing.Font ("Segoe UI", 9, [System.Drawing.FontStyle]::Regular)
        $gfx.DrawString('$50 Free Ship', $mFont, $textMuted, $bubX + 15, $trackY + 14)
        $gfx.DrawString('$80 Gift', $mFont, $textMuted, $bubX + 150, $trackY + 14)
        $gfx.DrawString('$120 VIP', $mFont, $textMuted, $bubX + 290, $trackY + 14)
    }

    # Mascot Orb Body
    $mascotBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(99, 102, 241))
    $gfx.FillEllipse($mascotBrush, $mascotCenterX - $mascotRadius, $mascotCenterY - $mascotRadius, $mascotRadius * 2, $mascotRadius * 2)

    # Mascot Eyes & Emotional State
    $eyeBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)
    $pupilBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(15, 23, 42))

    if ($MascotState -eq "crying") {
        # Big tearful sad eyes looking up at cursor
        $gfx.FillEllipse($eyeBrush, $mascotCenterX - 35, $mascotCenterY - 25, 26, 32)
        $gfx.FillEllipse($eyeBrush, $mascotCenterX + 10, $mascotCenterY - 25, 26, 32)
        # Pupils looking up
        $gfx.FillEllipse($pupilBrush, $mascotCenterX - 30, $mascotCenterY - 22, 16, 18)
        $gfx.FillEllipse($pupilBrush, $mascotCenterX + 15, $mascotCenterY - 22, 16, 18)

        # Big sparkling tears streaming down
        $tearBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(56, 189, 248))
        $gfx.FillEllipse($tearBrush, $mascotCenterX - 30, $mascotCenterY + 12, 10, 16)
        $gfx.FillEllipse($tearBrush, $mascotCenterX + 20, $mascotCenterY + 12, 10, 16)

        # Sad mouth
        $mouthPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::White), 3
        $gfx.DrawArc($mouthPen, $mascotCenterX - 15, $mascotCenterY + 15, 30, 20, 180, 180)
    }
    elseif ($MascotState -eq "happy") {
        # Starry joyful eyes
        $gfx.FillEllipse($eyeBrush, $mascotCenterX - 35, $mascotCenterY - 20, 26, 26)
        $gfx.FillEllipse($eyeBrush, $mascotCenterX + 10, $mascotCenterY - 20, 26, 26)
        $gfx.FillEllipse($pupilBrush, $mascotCenterX - 30, $mascotCenterY - 16, 14, 14)
        $gfx.FillEllipse($pupilBrush, $mascotCenterX + 15, $mascotCenterY - 16, 14, 14)

        # Happy open smile
        $mouthBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(239, 68, 68))
        $gfx.FillPie($mouthBrush, $mascotCenterX - 18, $mascotCenterY + 5, 36, 28, 0, 180)
    }
    else {
        # Idle / watching eyes looking toward cursor
        $dx = if ($CursorX -gt 0) { [Math]::Min(8, [Math]::Max(-8, ($CursorX - $mascotCenterX) / 80)) } else { -4 }
        $dy = if ($CursorY -gt 0) { [Math]::Min(6, [Math]::Max(-6, ($CursorY - $mascotCenterY) / 80)) } else { -2 }

        $gfx.FillEllipse($eyeBrush, $mascotCenterX - 32, $mascotCenterY - 18, 22, 22)
        $gfx.FillEllipse($eyeBrush, $mascotCenterX + 10, $mascotCenterY - 18, 22, 22)
        $gfx.FillEllipse($pupilBrush, $mascotCenterX - 28 + $dx, $mascotCenterY - 14 + $dy, 12, 12)
        $gfx.FillEllipse($pupilBrush, $mascotCenterX + 14 + $dx, $mascotCenterY - 14 + $dy, 12, 12)

        # Gentle cute mouth
        $mouthPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::White), 2
        $gfx.DrawArc($mouthPen, $mascotCenterX - 10, $mascotCenterY + 12, 20, 12, 0, 180)
    }

    # 7. Confetti Particles
    if ($ShowConfetti) {
        $colors = @(
            [System.Drawing.Color]::FromArgb(251, 191, 36),
            [System.Drawing.Color]::FromArgb(52, 211, 153),
            [System.Drawing.Color]::FromArgb(96, 165, 250),
            [System.Drawing.Color]::FromArgb(244, 114, 182),
            [System.Drawing.Color]::FromArgb(167, 139, 250)
        )
        $rnd = New-Object System.Random 42
        for ($k = 0; $k -lt 60; $k++) {
            $px = $rnd.Next($fx + 300, $fx + $fw - 100)
            $py = $rnd.Next($sy + 50, $sy + $fh - 100)
            $cCol = $colors[$rnd.Next(0, $colors.Count)]
            $cBrush = New-Object System.Drawing.SolidBrush ($cCol)
            $cSize = $rnd.Next(8, 18)
            $gfx.FillEllipse($cBrush, $px, $py, $cSize, $cSize)
        }
    }

    # 8. Apple Floating Glassmorphic Metric Callout
    if ($KpiValue) {
        $kpiW = 340
        $kpiH = 110
        $kpiX = $fx + 60
        $kpiY = $sy + 120

        $kpiBg = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(230, 15, 23, 42))
        $gfx.FillRectangle($kpiBg, $kpiX, $kpiY, $kpiW, $kpiH)
        $kpiBorder = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(56, 189, 248)), 2
        $gfx.DrawRectangle($kpiBorder, $kpiX, $kpiY, $kpiW, $kpiH)

        $valFont = New-Object System.Drawing.Font ("Segoe UI", 28, [System.Drawing.FontStyle]::Bold)
        $lblFont = New-Object System.Drawing.Font ("Segoe UI", 11, [System.Drawing.FontStyle]::Regular)
        $gfx.DrawString($KpiValue, $valFont, $cyanBrush, $kpiX + 20, $kpiY + 12)
        $gfx.DrawString($KpiLabel, $lblFont, $whiteBrush, $kpiX + 20, $kpiY + 65)
    }

    # 9. macOS Virtual Cursor
    if ($CursorX -gt 0 -and $CursorY -gt 0) {
        $cursorPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::Black), 2
        $cursorBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)
        $points = @(
            (New-Object System.Drawing.Point ($CursorX), ($CursorY)),
            (New-Object System.Drawing.Point ($CursorX), ($CursorY + 26)),
            (New-Object System.Drawing.Point ($CursorX + 7), ($CursorY + 19)),
            (New-Object System.Drawing.Point ($CursorX + 15), ($CursorY + 29)),
            (New-Object System.Drawing.Point ($CursorX + 20), ($CursorY + 26)),
            (New-Object System.Drawing.Point ($CursorX + 12), ($CursorY + 16)),
            (New-Object System.Drawing.Point ($CursorX + 22), ($CursorY + 16))
        )
        $gfx.FillPolygon($cursorBrush, $points)
        $gfx.DrawPolygon($cursorPen, $points)
    }

    $outFilePath = Join-Path $TEMP $Filename
    $bmp.Save($outFilePath, [System.Drawing.Imaging.ImageFormat]::Png)
    $gfx.Dispose()
    $bmp.Dispose()
    Write-Host "✓ Rendered $Filename"
}

Write-Host "======================================================"
Write-Host "🎨 Generating 8 HD Storefront Video Keyframes (1080p)..."
Write-Host "======================================================"

# Act 1: The Cold Storefront (Empty Cart, Shopper Enters)
New-StoreScene -Filename "scene_01.png" `
    -ActTitle "ACT I: THE LIVING PRESENCE" `
    -ActSubtitle "E-commerce stores are cold grids of pixels. Until your store has a living soul." `
    -CartItems 0 -CartTotal 0.00 -MeterPct 0 `
    -BubbleText "Hey there! I am your store companion 🎉 Add $50 for Free Shipping!" `
    -MascotState "idle" -CursorX 300 -CursorY 250 -ShowConfetti $false `
    -KpiValue "" -KpiLabel "" -HighlightProd 0

# Act 2: Shopper Browses & Clicks Hoodie ($48)
New-StoreScene -Filename "scene_02.png" `
    -ActTitle "ACT II: ORGANIC ENGAGEMENT" `
    -ActSubtitle "The mascot's gaze follows customer velocity. Adding an item triggers positive reinforcement." `
    -CartItems 1 -CartTotal 48.00 -MeterPct 40 `
    -BubbleText "Nice pick! Add $2.00 more to unlock Free Shipping 🚚" `
    -MascotState "happy" -CursorX 550 -CursorY 670 -ShowConfetti $false `
    -KpiValue "+18.4%" -KpiLabel "Instant Micro-Engagement Lift" -HighlightProd 1

# Act 3: Shopper Clicks Akira Cable ($36) -> Reaches $84
New-StoreScene -Filename "scene_03.png" `
    -ActTitle "ACT III: SUBCONSCIOUS MOMENTUM" `
    -ActSubtitle "Cascading milestone rewards turn single-item browsers into multi-item buyers." `
    -CartItems 2 -CartTotal 84.00 -MeterPct 70 `
    -BubbleText "🎉 FREE SHIPPING UNLOCKED! Add $36 for Mystery Gift 🎁" `
    -MascotState "happy" -CursorX 1090 -CursorY 670 -ShowConfetti $false `
    -KpiValue "" -KpiLabel "" -HighlightProd 2

# Act 4: The Milestone Celebration (Confetti Explosion)
New-StoreScene -Filename "scene_04.png" `
    -ActTitle "ACT IV: EMOTIONAL DELIGHT" `
    -ActSubtitle "Rewarding shoppers when they hit milestone goals drives spontaneous average order value." `
    -CartItems 2 -CartTotal 84.00 -MeterPct 70 `
    -BubbleText "🎉 FREE SHIPPING UNLOCKED! Add $36 for Mystery Gift 🎁" `
    -MascotState "happy" -CursorX 1100 -CursorY 400 -ShowConfetti $true `
    -KpiValue "+25.8%" -KpiLabel "Average Order Value (AOV) Lift" -HighlightProd 0

# Act 5: THE CLIMAX - EXIT INTENT (Cursor heads to top-right [X] close button)
New-StoreScene -Filename "scene_05.png" `
    -ActTitle "ACT V: THE ABANDONMENT THREAT" `
    -ActSubtitle "70% of shoppers leave. Watch what happens when the cursor heads to close the tab." `
    -CartItems 2 -CartTotal 84.00 -MeterPct 70 `
    -BubbleText "🥺 Wait! Don't leave empty-handed! Take 10% OFF with code SAVE10!" `
    -MascotState "crying" -CursorX 1750 -CursorY 145 -ShowConfetti $false `
    -KpiValue "" -KpiLabel "" -HighlightProd 0

# Act 6: HEARTBROKEN RECOVERY (Mascot Crying Tears, Amber Offer)
New-StoreScene -Filename "scene_06.png" `
    -ActTitle "ACT VI: EMPATHY, NOT COERCION" `
    -ActSubtitle "No aggressive full-screen popups. A heartfelt emotional pause saves the cart." `
    -CartItems 2 -CartTotal 84.00 -MeterPct 70 `
    -BubbleText "🥺 Wait! Don't leave empty-handed! Take 10% OFF with code SAVE10!" `
    -MascotState "crying" -CursorX 1450 -CursorY 720 -ShowConfetti $false `
    -KpiValue "28%" -KpiLabel "Cart Abandonments Saved on Exit" -HighlightProd 0

# Act 7: Cart Saved! Discount Applied & Checkout Completed
New-StoreScene -Filename "scene_07.png" `
    -ActTitle "ACT VII: CONVERSION COMPLETED" `
    -ActSubtitle "A lost cart recovered in seconds. Communicating with your customer... without communicating." `
    -CartItems 2 -CartTotal 75.60 -MeterPct 70 `
    -BubbleText "💖 Code SAVE10 Applied! Saved $8.40! Completing checkout..." `
    -MascotState "happy" -CursorX 1480 -CursorY 750 -ShowConfetti $true `
    -KpiValue "+31.0%" -KpiLabel "Storefront Conversion Rate Lift" -HighlightProd 0

function New-AppleEndingScene {
    param([string]$Filename)
    $bmp = New-Object System.Drawing.Bitmap $W, $H
    $gfx = [System.Drawing.Graphics]::FromImage($bmp)
    $gfx.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $gfx.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit

    $bgBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(5, 7, 13))
    $gfx.FillRectangle($bgBrush, 0, 0, $W, $H)

    # Glowing center avatar
    $centerBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(99, 102, 241))
    $gfx.FillEllipse($centerBrush, ($W/2 - 75), 200, 150, 150)
    # Eyes
    $eyeBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)
    $pupilBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(15, 23, 42))
    $gfx.FillEllipse($eyeBrush, ($W/2 - 45), 245, 30, 30)
    $gfx.FillEllipse($eyeBrush, ($W/2 + 15), 245, 30, 30)
    $gfx.FillEllipse($pupilBrush, ($W/2 - 37), 250, 16, 16)
    $gfx.FillEllipse($pupilBrush, ($W/2 + 23), 250, 16, 16)
    # Smile
    $mouthBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(239, 68, 68))
    $gfx.FillPie($mouthBrush, ($W/2 - 20), 280, 40, 30, 0, 180)

    $titleFont = New-Object System.Drawing.Font ("Segoe UI", 52, [System.Drawing.FontStyle]::Bold)
    $subFont = New-Object System.Drawing.Font ("Segoe UI", 24, [System.Drawing.FontStyle]::Regular)
    $statFont = New-Object System.Drawing.Font ("Segoe UI", 20, [System.Drawing.FontStyle]::Bold)
    $whiteBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)
    $cyanBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(56, 189, 248))
    $goldBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(245, 166, 35))

    $sf = New-Object System.Drawing.StringFormat
    $sf.Alignment = [System.Drawing.StringAlignment]::Center

    $gfx.DrawString("PULSEMASCOT", $titleFont, $whiteBrush, ($W/2), 390, $sf)
    $gfx.DrawString("Give your store a soul.", $subFont, $cyanBrush, ($W/2), 485, $sf)
    $gfx.DrawString("+31.0% Conversions   •   +25.8% AOV Lift   •   28% Abandoned Carts Saved", $statFont, $goldBrush, ($W/2), 570, $sf)

    # Shopify App Store Button
    $btnBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(0, 128, 96))
    $gfx.FillRectangle($btnBrush, ($W/2 - 340), 660, 680, 76)
    $btnFont = New-Object System.Drawing.Font ("Segoe UI", 20, [System.Drawing.FontStyle]::Bold)
    $gfx.DrawString("INSTALL FREE ON THE SHOPIFY APP STORE", $btnFont, $whiteBrush, ($W/2), 682, $sf)

    $outFilePath = Join-Path $TEMP $Filename
    $bmp.Save($outFilePath, [System.Drawing.Imaging.ImageFormat]::Png)
    $gfx.Dispose()
    $bmp.Dispose()
    Write-Host "✓ Rendered $Filename"
}

# Act 8: The Apple Manifesto Conclusion
New-AppleEndingScene -Filename "scene_08.png"

Write-Host "✓ All 8 HD Scene frames successfully rendered in $TEMP!"
